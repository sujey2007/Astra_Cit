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
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Database Imports
import { db } from '../../api/firebaseConfig';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp, query, where } from 'firebase/firestore';

export default function ProcurementHub({ navigation }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // REAL-TIME LISTENER: Fetch ONLY items that Stores Dept forwarded to Purchase, or are currently Ordered
  useEffect(() => {
    const prQuery = query(
      collection(db, 'requisitions'),
      where('status', 'in', ['Forwarded to Purchase', 'Ordered'])
    );
    
    const unsubscribe = onSnapshot(prQuery, (snapshot) => {
      const fetchedPRs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort newest PRs to the top
      fetchedPRs.sort((a, b) => b.updatedAt?.toMillis() - a.updatedAt?.toMillis());
      
      setPurchaseRequests(fetchedPRs);
      setIsLoading(false);
    }, (error) => {
      console.error("Sync Error: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ACTION: Purchase Officer approves budget and places order with vendor
  const handlePlaceOrder = async (id) => {
    try {
      const reqRef = doc(db, 'requisitions', id);
      await updateDoc(reqRef, { 
        status: 'Ordered', 
        updatedAt: serverTimestamp() 
      });
      Alert.alert("Order Placed", "Vendor has been notified.");
    } catch (error) {
      Alert.alert("Error", "Could not process order.");
    }
  };

  // ACTION: Delivery truck arrives, items are received and sent back to Stores
  const handleReceiveStock = async (id) => {
    try {
      const reqRef = doc(db, 'requisitions', id);
      await updateDoc(reqRef, { 
        status: 'Received by Stores', 
        updatedAt: serverTimestamp() 
      });
      Alert.alert("Stock Received", "Items are now available for the HOD to collect.");
    } catch (error) {
      Alert.alert("Error", "Could not update inventory.");
    }
  };

  // --- RENDER COMPONENTS ---

  const renderDashboard = () => (
    <ScrollView contentContainerStyle={styles.dashboardContent}>
      <Text style={styles.welcomeText}>Procurement Portal</Text>
      <Text style={styles.dateText}>Finance & Purchasing Dept.</Text>
      
      <View style={styles.grid}>
        {/* FEATURE CARD: PENDING PRs */}
        <TouchableOpacity 
          style={styles.featureCard} 
          onPress={() => setActiveView('prList')}
        >
          <View style={[styles.iconBox, { backgroundColor: '#FFEDD5' }]}>
            <Ionicons name="cart" size={28} color="#C2410C" />
            {purchaseRequests.filter(r => r.status === 'Forwarded to Purchase').length > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>
                  {purchaseRequests.filter(r => r.status === 'Forwarded to Purchase').length}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.cardTitle}>Purchase Requests</Text>
          <Text style={styles.cardDesc}>Review and process PRs raised by the Stores Dept.</Text>
        </TouchableOpacity>

        {/* FEATURE CARD: INVOICE OCR SCANNER */}
        <TouchableOpacity style={styles.featureCard} disabled>
          <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
            <Ionicons name="scan" size={28} color="#4338CA" />
          </View>
          <Text style={styles.cardTitle}>Scan Invoice (OCR)</Text>
          <Text style={styles.cardDesc}>Auto-extract vendor data from physical bills.</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderPRItem = ({ item }) => {
    const isNewPR = item.status === "Forwarded to Purchase";
    const statusTheme = isNewPR 
      ? { bg: '#FFEDD5', text: '#C2410C', label: 'NEEDS APPROVAL' } 
      : { bg: '#DBEAFE', text: '#1D4ED8', label: 'ORDER PLACED' };

    return (
      <View style={styles.prCard}>
        <View style={styles.prHeader}>
          <View>
            <Text style={styles.itemName}>{item.itemName}</Text>
            <Text style={styles.prSub}>For: {item.department}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
            <Text style={[styles.statusText, { color: statusTheme.text }]}>{statusTheme.label}</Text>
          </View>
        </View>

        <View style={styles.prBody}>
          <Text style={styles.qtyText}>Order Quantity: <Text style={styles.boldText}>{item.quantity}</Text></Text>
          <Text style={styles.qtyText}>Requested By: <Text style={styles.boldText}>{item.requestedBy}</Text></Text>
        </View>

        <View style={styles.actionRow}>
          {isNewPR ? (
            <TouchableOpacity style={[styles.actionBtn, styles.btnProcess]} onPress={() => handlePlaceOrder(item.id)}>
              <Text style={styles.btnLabel}>APPROVE & ORDER</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.actionBtn, styles.btnReceive]} onPress={() => handleReceiveStock(item.id)}>
              <Text style={styles.btnLabel}>MARK AS RECEIVED</Text>
            </TouchableOpacity>
          )}
        </View>
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
          <Text style={styles.headerTitle}>PURCHASING</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#64748B" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {activeView === 'dashboard' ? renderDashboard() : (
        <View style={{ flex: 1 }}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#C2410C" style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={purchaseRequests}
              keyExtractor={(item) => item.id}
              renderItem={renderPRItem}
              contentContainerStyle={{ padding: 20 }}
              ListEmptyComponent={<Text style={styles.emptyText}>No pending purchase requests.</Text>}
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
  dateText: { fontSize: 14, color: '#64748B', marginBottom: 30, fontWeight: '600' },
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

  // PR List
  prCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  prHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  itemName: { color: '#0F172A', fontSize: 17, fontWeight: '700', flex: 1, marginRight: 10 },
  prSub: { color: '#64748B', fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  prBody: { marginBottom: 20 },
  qtyText: { color: '#475569', fontSize: 14, marginBottom: 4 },
  boldText: { fontWeight: '700', color: '#0F172A' },
  
  // Actions
  actionRow: { flexDirection: 'row', justifyContent: 'center' },
  actionBtn: { width: '100%', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnProcess: { backgroundColor: '#059669' }, // Green for order
  btnReceive: { backgroundColor: '#2563EB' }, // Blue for receive
  btnLabel: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  emptyText: { color: '#94A3B8', textAlign: 'center', marginTop: 50, fontSize: 15 }
});