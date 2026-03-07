import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

export default function LiveTracker({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = "Dr. Sujey (HOD)";

  useEffect(() => {
    const q = query(collection(db, 'requisitions'), where("requestedBy", "==", currentUser));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setRequests(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }) => {
    const statusTheme = item.status === "Dispensed" ? { bg: '#DCFCE7', text: '#15803D' } : 
                        item.status === "Forwarded to Purchase" ? { bg: '#FFEDD5', text: '#C2410C' } : 
                        { bg: '#DBEAFE', text: '#1D4ED8' };
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.itemName}>{item.itemName}</Text>
            <Text style={styles.deptSub}>{item.department}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusTheme.bg }]}>
            <Text style={[styles.badgeText, { color: statusTheme.text }]}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.info}>Qty: <Text style={styles.bold}>{item.quantity}</Text></Text>
          <Text style={styles.info}>Priority: <Text style={[styles.bold, item.priority === 'Critical' && {color: '#EF4444'}]}>{item.priority}</Text></Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>LIVE STATUS TRACKER</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color="#2563EB" size="large" />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text style={styles.empty}>No requests found.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  itemName: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  deptSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between' },
  info: { fontSize: 13, color: '#475569' },
  bold: { fontWeight: '700', color: '#0F172A' },
  empty: { textAlign: 'center', marginTop: 50, color: '#94A3B8', fontSize: 15 }
});