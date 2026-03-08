import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export default function VendorPayments({ navigation }) {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    // Fetch requisitions that are approved but not yet paid
    const q = query(collection(db, "requisitions"), where("status", "==", "Approved"));
    const unsub = onSnapshot(q, (snap) => {
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const processPayment = async (id) => {
    try {
      await updateDoc(doc(db, "requisitions", id), {
        status: "Paid",
        paidAt: new Date().toISOString()
      });
      Alert.alert("Success", "Vendor payment processed successfully.");
    } catch (e) {
      Alert.alert("Error", "Payment processing failed.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>VENDOR PAYMENTS</Text>
      </View>

      <FlatList
        data={payments}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <View style={styles.paymentCard}>
            <View style={styles.infoSection}>
              <Text style={styles.vendorName}>{item.itemName}</Text>
              <Text style={styles.subText}>Dept: {item.department} • Qty: {item.quantity}</Text>
              <Text style={styles.reqDate}>Req Date: {item.requestDate}</Text>
            </View>
            <TouchableOpacity style={styles.payBtn} onPress={() => processPayment(item.id)}>
              <Text style={styles.payBtnText}>SETTLE</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No pending vendor settlements.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  backBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 10 },
  title: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginLeft: 15 },
  paymentCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  infoSection: { flex: 1 },
  vendorName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  subText: { fontSize: 11, color: '#64748B', marginTop: 4 },
  reqDate: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  payBtn: { backgroundColor: '#0052CC', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10 },
  payBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#94A3B8', fontWeight: '600' }
});