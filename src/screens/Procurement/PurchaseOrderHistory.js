import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function PurchaseOrderHistory({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Specifically filter for "Ordered" status items
    const q = query(collection(db, "requisitions"), where("status", "==", "Ordered"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#1E293B" /></TouchableOpacity>
        <Text style={styles.title}>ORDER HISTORY</Text>
      </View>
      {loading ? <ActivityIndicator size="large" color="#0052CC" style={{ marginTop: 50 }} /> : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.orderCard}
              onPress={() => navigation.navigate('PurchaseOrderView', { orderData: item })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.poNumber}>{item.poNumber || 'N/A'}</Text>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
              </View>
              <Text style={styles.itemName}>{item.itemName}</Text>
              <Text style={styles.metaText}>Dept: {item.department} | Qty: {item.quantity}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  title: { fontSize: 16, fontWeight: '900', marginLeft: 15, color: '#0F172A' },
  orderCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  poNumber: { fontSize: 14, fontWeight: '800', color: '#0052CC' },
  itemName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  metaText: { fontSize: 12, color: '#64748B', marginTop: 5 }
});