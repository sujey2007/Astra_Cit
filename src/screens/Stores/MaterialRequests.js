import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function MaterialRequests({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'requisitions'), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setRequests(fetched);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (id, newStatus, message) => {
    try {
      await updateDoc(doc(db, 'requisitions', id), { status: newStatus, updatedAt: serverTimestamp() });
      Alert.alert("Success", message);
    } catch (error) { Alert.alert("Error", "Update failed."); }
  };

  const renderItem = ({ item }) => {
    const isPending = item.status === "Pending";
    const statusTheme = item.status === "Dispensed" ? { bg: '#DCFCE7', text: '#15803D' } : 
                        item.status === "Forwarded to Purchase" ? { bg: '#FFEDD5', text: '#C2410C' } : 
                        { bg: '#DBEAFE', text: '#1D4ED8' };

    return (
      <View style={styles.reqCard}>
        <View style={styles.reqHeader}>
          <View>
            <Text style={styles.itemName}>{item.itemName}</Text>
            <Text style={styles.reqSub}>{item.department} • {item.requestedBy}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
            <Text style={[styles.statusText, { color: statusTheme.text }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.qtyText}>Request Quantity: <Text style={{fontWeight:'700'}}>{item.quantity}</Text></Text>

        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.btnGreen]} onPress={() => handleStatusUpdate(item.id, 'Dispensed', 'Inventory updated.')}>
              <Text style={styles.btnLabel}>DISPENSE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.btnAmber]} onPress={() => handleStatusUpdate(item.id, 'Forwarded to Purchase', 'Sent to Procurement.')}>
              <Text style={styles.btnLabel}>RAISE PR</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={24} color="#1E293B" /></TouchableOpacity>
        <Text style={styles.headerTitle}>MATERIAL REQUESTS</Text>
        <View style={{ width: 24 }} />
      </View>
      {isLoading ? <ActivityIndicator size="large" color="#2563EB" style={{marginTop: 50}} /> : (
        <FlatList data={requests} keyExtractor={item => item.id} renderItem={renderItem} contentContainerStyle={{ padding: 20 }} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  reqCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  itemName: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  reqSub: { color: '#64748B', fontSize: 13 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '800' },
  qtyText: { fontSize: 14, color: '#475569', marginBottom: 20 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 0.48, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnGreen: { backgroundColor: '#059669' },
  btnAmber: { backgroundColor: '#D97706' },
  btnLabel: { color: '#FFF', fontWeight: '800' }
});