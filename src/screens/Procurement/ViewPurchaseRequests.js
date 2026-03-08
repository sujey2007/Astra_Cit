import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator, 
  Alert, 
  Modal, 
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function ViewPurchaseRequests({ navigation }) {
  const [purchaseReqs, setPurchaseReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [vendorName, setVendorName] = useState('');
  const [vendorMobile, setVendorMobile] = useState('');
  const [totalCost, setTotalCost] = useState('');

  useEffect(() => {
    const q = query(collection(db, "requisitions"), where("status", "==", "PR Raised"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPurchaseReqs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const openOrderModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleConfirmOrder = async () => {
    if (!vendorName || !vendorMobile || !totalCost) {
      Alert.alert("Missing Info", "Please fill in all vendor and cost details.");
      return;
    }

    try {
      const docRef = doc(db, "requisitions", selectedItem.id);
      
      const orderData = {
        ...selectedItem,
        status: "Ordered",
        orderedAt: serverTimestamp(),
        poNumber: `PO-CIT-${Math.floor(1000 + Math.random() * 9000)}`,
        vendorName: vendorName.trim(),
        vendorMobile: vendorMobile.trim(),
        totalCost: totalCost.trim()
      };

      // Update Firestore
      await updateDoc(docRef, {
        status: "Ordered",
        orderedAt: serverTimestamp(),
        poNumber: orderData.poNumber,
        vendorName: orderData.vendorName,
        vendorMobile: orderData.vendorMobile,
        totalCost: orderData.totalCost
      });

      // Reset and Navigate
      setModalVisible(false);
      setVendorName('');
      setVendorMobile('');
      setTotalCost('');
      
      navigation.navigate('PurchaseOrderView', { orderData });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to process order. Check your connection.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>PENDING REQUESTS</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#D97706" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={purchaseReqs}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.itemName}</Text>
                <Text style={styles.itemMeta}>Dept: {item.department} | Qty: {item.quantity}</Text>
              </View>
              <TouchableOpacity style={styles.orderBtn} onPress={() => openOrderModal(item)}>
                <Text style={styles.orderText}>PLACE ORDER</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* VENDOR DETAILS MODAL - Works on Android & iOS */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Fulfillment</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Vendor / Company Name</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Dell Technologies"
              value={vendorName}
              onChangeText={setVendorName}
            />

            <Text style={styles.label}>Vendor Mobile No.</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. +91 9876543210"
              keyboardType="phone-pad"
              value={vendorMobile}
              onChangeText={setVendorMobile}
            />

            <Text style={styles.label}>Total Cost (Rupees)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. 45000"
              keyboardType="numeric"
              value={totalCost}
              onChangeText={setTotalCost}
            />

            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmOrder}>
              <Text style={styles.confirmText}>GENERATE PURCHASE ORDER</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  title: { fontSize: 18, fontWeight: '900', marginLeft: 15, color: '#0F172A' },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 12, elevation: 2 },
  itemName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  itemMeta: { fontSize: 12, color: '#64748B', marginTop: 4 },
  orderBtn: { backgroundColor: '#10B981', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10 },
  orderText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  label: { fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#F1F5F9', padding: 15, borderRadius: 12, fontSize: 16, color: '#1E293B' },
  confirmBtn: { backgroundColor: '#0052CC', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30 },
  confirmText: { color: '#FFF', fontWeight: '900', letterSpacing: 1 }
});