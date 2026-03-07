import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Database Imports
import { db } from '../../api/firebaseConfig';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function StoresHub({ navigation }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const reqCollection = collection(db, 'requisitions');
    const unsubscribe = onSnapshot(reqCollection, (snapshot) => {
      const fetchedRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      fetchedRequests.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
      setRequests(fetchedRequests);
      setIsLoading(false);
    }, (error) => {
      console.error("Sync Error: ", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDispense = async (id) => {
    try {
      const reqRef = doc(db, 'requisitions', id);
      await updateDoc(reqRef, { status: 'Dispensed', updatedAt: serverTimestamp() });
      Alert.alert("Success", "Inventory updated successfully.");
    } catch (error) {
      Alert.alert("Error", "Could not update database.");
    }
  };

  const handleRaisePR = async (id) => {
    try {
      const reqRef = doc(db, 'requisitions', id);
      await updateDoc(reqRef, { status: 'Forwarded to Purchase', updatedAt: serverTimestamp() });
      Alert.alert("PR Raised", "Request sent to Procurement.");
    } catch (error) {
      Alert.alert("Error", "Forwarding failed.");
    }
  };

  // --- RENDER COMPONENTS ---

  const renderDashboard = () => (
    <ScrollView contentContainerStyle={styles.dashboardContent}>
      <Text style={styles.welcomeText}>Welcome, Stores Officer</Text>
      <Text style={styles.dateText}>{new Date().toLocaleDateString('en-GB', { dateStyle: 'full' })}</Text>
      
      <View style={styles.grid}>
        {/* FEATURE CARD: REQUISITIONS */}
        <TouchableOpacity 
          style={styles.featureCard} 
          onPress={() => setActiveView('requisitions')}
        >
          <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
            <Ionicons name="document-text" size={28} color="#4338CA" />
            {requests.filter(r => r.status === 'Pending').length > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{requests.filter(r => r.status === 'Pending').length}</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardTitle}>Material Requests</Text>
          <Text style={styles.cardDesc}>Review and process incoming department requisitions.</Text>
        </TouchableOpacity>

        {/* FEATURE CARD: LIVE INVENTORY */}
        <TouchableOpacity style={styles.featureCard} disabled>
          <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="cube" size={28} color="#15803D" />
          </View>
          <Text style={styles.cardTitle}>Live Inventory</Text>
          <Text style={styles.cardDesc}>Monitor real-time stock levels and asset distribution.</Text>
        </TouchableOpacity>

        {/* FEATURE CARD: RECEIVE STOCK */}
        <TouchableOpacity style={styles.featureCard} disabled>
          <View style={[styles.iconBox, { backgroundColor: '#Fef9c3' }]}>
            <Ionicons name="qr-code" size={28} color="#a16207" />
          </View>
          <Text style={styles.cardTitle}>Receive Stock</Text>
          <Text style={styles.cardDesc}>Inward materials from vendors using QR/Barcode scanning.</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderRequestItem = ({ item }) => {
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

        <View style={styles.reqBody}>
          <Text style={styles.qtyText}>Request Quantity: <Text style={styles.boldText}>{item.quantity}</Text></Text>
        </View>

        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.btnGreen]} onPress={() => handleDispense(item.id)}>
              <Text style={styles.btnLabel}>DISPENSE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.btnAmber]} onPress={() => handleRaisePR(item.id)}>
              <Text style={styles.btnLabel}>RAISE PR</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* PROFESSIONAL HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {activeView !== 'dashboard' && (
            <TouchableOpacity onPress={() => setActiveView('dashboard')} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#1E293B" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>ASTRA STORES</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#64748B" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {activeView === 'dashboard' ? renderDashboard() : (
        <View style={{ flex: 1 }}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={requests}
              keyExtractor={(item) => item.id}
              renderItem={renderRequestItem}
              contentContainerStyle={{ padding: 20 }}
              ListEmptyComponent={<Text style={styles.emptyText}>No active requisitions found.</Text>}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  // Header
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, 
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 12 },
  headerTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center' },
  logoutText: { color: '#64748B', fontSize: 14, fontWeight: '600', marginLeft: 4 },

  // Dashboard
  dashboardContent: { padding: 24 },
  welcomeText: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  dateText: { fontSize: 14, color: '#64748B', marginBottom: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  
  featureCard: {
    width: '48%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#E2E8F0', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05
  },
  iconBox: { width: 56, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  badgeCount: { position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 20, padding: 4, alignItems: 'center' },
  badgeCountText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  cardTitle: { color: '#0F172A', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  cardDesc: { color: '#64748B', fontSize: 12, lineHeight: 18 },

  // Requisition List
  reqCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  itemName: { color: '#0F172A', fontSize: 17, fontWeight: '700' },
  reqSub: { color: '#64748B', fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  reqBody: { marginBottom: 20 },
  qtyText: { color: '#475569', fontSize: 14 },
  boldText: { fontWeight: '700', color: '#0F172A' },
  
  // Actions
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 0.48, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnGreen: { backgroundColor: '#059669' },
  btnAmber: { backgroundColor: '#D97706' },
  btnLabel: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  emptyText: { color: '#94A3B8', textAlign: 'center', marginTop: 50, fontSize: 15 }
});