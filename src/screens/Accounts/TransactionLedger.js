import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export default function TransactionLedger({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper function to handle both Firebase Timestamps and Mock Data Dates safely
  const safeToDate = (timestamp) => {
    if (!timestamp) return new Date();
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    // Handle cases where timestamp might be a JS Date or a numeric value
    return new Date(timestamp.seconds * 1000 || timestamp);
  };

  // MOCK DATA FOR INITIAL VIEW (Will be merged with live data)
  const mockTransactions = [
    { id: 'm1', type: 'Debit', category: 'Payroll', description: 'Construction Labor Wages', amount: 4800, timestamp: { toDate: () => new Date('2026-03-08T10:00:00') } },
    { id: 'm2', type: 'Debit', category: 'Procurement', description: 'UltraTech Cement Settlement', amount: 85000, timestamp: { toDate: () => new Date('2026-03-07T14:30:00') } },
  ];

  useEffect(() => {
    // Sync with the Institutional Ledger for real-time history updates
    const q = query(collection(db, "institutional_ledger"), orderBy("timestamp", "desc"));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const liveData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Combine Mock and Live data, then sort locally to prevent indexing delays
      const combined = [...liveData, ...mockTransactions].sort((a, b) => {
        const timeA = safeToDate(a.timestamp).getTime();
        const timeB = safeToDate(b.timestamp).getTime();
        return timeB - timeA;
      });

      setTransactions(combined);
      setLoading(false);
    }, (error) => {
      console.error("Ledger Sync Error:", error);
      // Fallback to mock data if there is an internet/Firestore connection error
      setTransactions(mockTransactions);
      setLoading(false);
    });

    return unsub;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>INSTITUTIONAL LEDGER</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color="#1D4ED8" size="large" />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[
              styles.ledgerRow, 
              item.type === 'Credit' ? styles.creditBorder : styles.debitBorder
            ]}>
              <View style={styles.iconBox}>
                <Ionicons 
                  name={item.category === 'Payroll' ? "people" : "cart"} 
                  size={20} 
                  color="#1E293B" 
                />
              </View>
              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.recipient} numberOfLines={1}>
                  {item.description || item.vendor || 'Unknown Entry'}
                </Text>
                <Text style={styles.date}>
                  {safeToDate(item.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} • {item.category}
                </Text>
              </View>
              <Text style={[
                styles.amount, 
                item.type === 'Credit' ? styles.creditText : styles.debitText
              ]}>
                {item.type === 'Credit' ? '+' : '-'}₹{item.amount?.toLocaleString()}
              </Text>
            </View>
          )}
          ListHeaderComponent={
            <Text style={styles.listLabel}>CHRONOLOGICAL TRANSACTIONS</Text>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No financial records found in the ledger.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderColor: '#E2E8F0',
    elevation: 2 
  },
  backBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 10 },
  title: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginLeft: 15 },
  listLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', marginBottom: 15, letterSpacing: 1 },
  ledgerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    padding: 15, 
    borderRadius: 16, 
    marginBottom: 10, 
    borderLeftWidth: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  debitBorder: { borderLeftColor: '#EF4444' },
  creditBorder: { borderLeftColor: '#10B981' },
  iconBox: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    backgroundColor: '#F1F5F9', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  recipient: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  date: { fontSize: 11, color: '#94A3B8', marginTop: 3, fontWeight: '600' },
  amount: { fontSize: 15, fontWeight: '900' },
  debitText: { color: '#EF4444' },
  creditText: { color: '#10B981' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#94A3B8', fontWeight: '700' }
});