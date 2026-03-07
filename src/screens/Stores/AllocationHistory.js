import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function AllocationHistory({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'distribution_history'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.itemName}>{item.itemName}</Text>
        <Text style={styles.qtyLabel}>Qty: {item.quantity}</Text>
      </View>
      
      <View style={styles.detailRow}>
        <Ionicons name="person-circle-outline" size={16} color="#64748B" />
        <Text style={styles.detailText}>Allocated by: <Text style={styles.boldText}>{item.sourceHOD}</Text></Text>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="business-outline" size={16} color="#64748B" />
        <Text style={styles.detailText}>Dept: {item.sourceDepartment}</Text>
      </View>

      <View style={styles.destinationBox}>
        <Ionicons name="location" size={14} color="#2563EB" />
        <Text style={styles.destinationText}>{item.destination}</Text>
      </View>

      <Text style={styles.timeText}>{item.timestamp?.toDate().toLocaleString()}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ALLOCATION HISTORY</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No allocation records found.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  historyCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  itemName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  qtyLabel: { fontSize: 14, fontWeight: '800', color: '#2563EB' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  detailText: { fontSize: 13, color: '#64748B', marginLeft: 8 },
  boldText: { color: '#0F172A', fontWeight: '700' },
  destinationBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  destinationText: { fontSize: 12, color: '#2563EB', fontWeight: '700', marginLeft: 4 },
  timeText: { fontSize: 10, color: '#94A3B8', marginTop: 12, textAlign: 'right' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#94A3B8' }
});