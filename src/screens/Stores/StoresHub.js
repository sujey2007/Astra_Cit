import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';

export default function StoresHub({ navigation }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [criticalItems, setCriticalItems] = useState([]);
  const [disposalCount, setDisposalCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const LOW_STOCK_THRESHOLD = 20;

  useEffect(() => {
    // Sync Material Request Badge Count
    const qReq = query(collection(db, 'requisitions'), where("status", "==", "Pending"));
    const unsubReq = onSnapshot(qReq, (snapshot) => {
      setPendingCount(snapshot.docs.length);
    });

    // Sync Live Inventory & Detect Low Stock
    const unsubInv = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      const allItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const lowStock = allItems.filter(item => (item.stockCount || 0) < LOW_STOCK_THRESHOLD);
      setCriticalItems(lowStock);
    });

    // Sync Damage Report Badge Count
    const qDisposal = query(collection(db, 'disposal_requests'), where("status", "==", "Reported"));
    const unsubDisposal = onSnapshot(qDisposal, (snapshot) => {
      setDisposalCount(snapshot.docs.length);
    });

    return () => { unsubReq(); unsubInv(); unsubDisposal(); };
  }, []);

  // FIXED REORDER LOGIC: Matches Procurement Hub Filters
  const handleReorder = async (item) => {
    setIsProcessing(true);
    try {
      await addDoc(collection(db, 'requisitions'), {
        itemName: item.itemName,
        quantity: 50, // Standard reorder quantity
        requestedBy: "Stores System (Auto-Alert)",
        department: "General Stores",
        status: "PR Raised", // Matches Procurement Hub status filter
        createdAt: serverTimestamp(),
        isUrgent: true
      });
      Alert.alert("Success", `${item.itemName} has been forwarded to the Purchase Department.`);
    } catch (error) {
      console.error("Firebase Error:", error);
      Alert.alert("Error", "Failed to send reorder request. Check Firestore permissions.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* BRANDED HEADER WITH LOGO */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Image 
            source={{ uri: 'https://images.shiksha.com/mediadata/images/1583389585phpP9W1tB_m.jpg' }} 
            style={styles.citLogo} 
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerTitle}>ASTRA STORES</Text>
            <Text style={styles.headerSubtitle}>CIT Inventory Control</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#64748B" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.dashboardContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.welcomeText}>Welcome, Stores Officer</Text>
        <Text style={styles.dateText}>{new Date().toLocaleDateString('en-GB', { dateStyle: 'full' })}</Text>

        {/* CRITICAL STOCK DEPLETION BAR */}
        {criticalItems.length > 0 && (
          <View style={styles.dangerZone}>
            <View style={styles.dangerHeader}>
              <Ionicons name="alert-circle" size={22} color="#FFF" />
              <Text style={styles.dangerTitle}>CRITICAL STOCK DEPLETION</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.alertScroll}>
              {criticalItems.map((item) => (
                <View key={item.id} style={styles.dangerCard}>
                  <View style={styles.cardTop}>
                    <Text style={styles.dangerItemName} numberOfLines={1}>{item.itemName}</Text>
                    <View style={styles.stockBadge}>
                       <Text style={styles.stockValue}>{item.stockCount}</Text>
                    </View>
                  </View>
                  <Text style={styles.statusSub}>CRITICAL LEVEL</Text>
                  <TouchableOpacity 
                    style={styles.reorderBtn} 
                    onPress={() => handleReorder(item)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.reorderText}>REORDER NOW</Text>}
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
        
        <View style={styles.grid}>
          {/* 1. MATERIAL REQUESTS */}
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('MaterialRequests')}>
            <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="document-text" size={28} color="#4338CA" />
              {pendingCount > 0 && (
                <View style={styles.badgeCount}><Text style={styles.badgeCountText}>{pendingCount}</Text></View>
              )}
            </View>
            <Text style={styles.cardTitle}>Material Requests</Text>
            <Text style={styles.cardDesc}>Review and process incoming department requisitions.</Text>
          </TouchableOpacity>

          {/* 2. LIVE INVENTORY */}
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('LiveInventory')}>
            <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="cube" size={28} color="#15803D" />
            </View>
            <Text style={styles.cardTitle}>Live Inventory</Text>
            <Text style={styles.cardDesc}>Monitor real-time stock levels and asset distribution.</Text>
          </TouchableOpacity>

          {/* 3. RAISE PR (MANUAL PURCHASE REQUEST) */}
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('ManualPurchaseRequest')}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="cart" size={28} color="#EA580C" />
            </View>
            <Text style={styles.cardTitle}>Raise PR</Text>
            <Text style={styles.cardDesc}>Manually request new stock procurement from vendors.</Text>
          </TouchableOpacity>

          {/* 4. RECEIVE STOCK */}
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('ReceiveStock')}>
            <View style={[styles.iconBox, { backgroundColor: '#Fef9c3' }]}>
              <Ionicons name="qr-code" size={28} color="#a16207" />
            </View>
            <Text style={styles.cardTitle}>Receive Stock</Text>
            <Text style={styles.cardDesc}>Inward materials from vendors using QR/Barcode scanning.</Text>
          </TouchableOpacity>

          {/* 5. ALLOCATION HISTORY */}
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('AllocationHistory')}>
            <View style={[styles.iconBox, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="list-outline" size={28} color="#334155" />
            </View>
            <Text style={styles.cardTitle}>Allocation History</Text>
            <Text style={styles.cardDesc}>Track assets distributed by HODs to CIT labs/COEs.</Text>
          </TouchableOpacity>

          {/* 6. DISPOSAL MANAGEMENT (DAMAGE REPORT) */}
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('DisposalManagement')}>
            <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="trash-outline" size={28} color="#EF4444" />
              {disposalCount > 0 && (
                <View style={styles.badgeCount}><Text style={styles.badgeCountText}>{disposalCount}</Text></View>
              )}
            </View>
            <Text style={styles.cardTitle}>Damage Report</Text>
            <Text style={styles.cardDesc}>Approve disposal or write-off for damaged CIT assets.</Text>
          </TouchableOpacity>

          {/* 7. RECEIPT HISTORY */}
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('ReceiptHistory')}>
            <View style={[styles.iconBox, { backgroundColor: '#FFEDD5' }]}>
              <Ionicons name="receipt-outline" size={28} color="#C2410C" />
            </View>
            <Text style={styles.cardTitle}>Receipt History</Text>
            <Text style={styles.cardDesc}>Review inward logs and captured digital bills.</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0', 
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  citLogo: { width: 40, height: 40, marginRight: 12 },
  headerTitle: { color: '#0F172A', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 10, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  logoutText: { color: '#64748B', fontSize: 12, fontWeight: '700', marginLeft: 4 },
  
  dashboardContent: { padding: 24 },
  welcomeText: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  dateText: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  
  dangerZone: { marginBottom: 30, backgroundColor: '#7F1D1D', borderRadius: 20, padding: 15, elevation: 8, shadowColor: '#B91C1C', shadowOpacity: 0.3, shadowRadius: 10 },
  dangerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  dangerTitle: { fontSize: 13, fontWeight: '900', color: '#FFF', letterSpacing: 1.5, marginLeft: 8 },
  alertScroll: { paddingBottom: 5 },
  dangerCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 16, width: 180, marginRight: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  dangerItemName: { fontSize: 15, fontWeight: '800', color: '#1E293B', flex: 1, marginRight: 8 },
  stockBadge: { backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#FEE2E2' },
  stockValue: { fontSize: 14, fontWeight: '900', color: '#B91C1C' },
  statusSub: { fontSize: 10, fontWeight: '700', color: '#EF4444', marginBottom: 12 },
  reorderBtn: { backgroundColor: '#B91C1C', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  reorderText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featureCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', elevation: 3 },
  iconBox: { width: 56, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  badgeCount: { position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 20, padding: 4, alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  badgeCountText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  cardTitle: { color: '#0F172A', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  cardDesc: { color: '#64748B', fontSize: 12, lineHeight: 18 },
});