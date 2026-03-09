import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

export default function ProcurementHub({ navigation }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedToday, setApprovedToday] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    // 1. Listen for Pending Requests (PR Raised)
    const qPending = query(collection(db, 'requisitions'), where("status", "==", "PR Raised"));
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      setPendingCount(snapshot.docs.length);
    });

    // 2. Listen for Total Purchase Orders (Ordered)
    const qTotal = query(collection(db, 'requisitions'), where("status", "==", "Ordered"));
    const unsubTotal = onSnapshot(qTotal, (snapshot) => {
      setTotalOrders(snapshot.docs.length);

      // 3. Filter for Orders Approved Today
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const todayCount = snapshot.docs.filter(doc => {
        const data = doc.data();
        if (!data.orderedAt) return false;
        return data.orderedAt.toDate() >= startOfDay;
      }).length;
      
      setApprovedToday(todayCount);
    });

    return () => { unsubPending(); unsubTotal(); };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          {/* UPDATED: Using local asset for mobile reliability */}
          <Image 
            source={require('../../../assets/logo.png')} 
            style={styles.citLogo} 
            resizeMode="contain"
          />
          <View>
            <Text style={styles.title}>PROCUREMENT HUB</Text>
            <Text style={styles.subtitle}>AstraCIT Purchase Dept</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.replace('Login')}>
          <Ionicons name="power" size={20} color="#D32F2F" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* LIVE OVERVIEW BAR */}
        <View style={styles.overviewBar}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{pendingCount}</Text>
            <Text style={styles.statLabel}>PENDING</Text>
          </View>
          <View style={[styles.statBox, styles.borderLeft]}>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{approvedToday}</Text>
            <Text style={styles.statLabel}>APPROVED TDY</Text>
          </View>
          <View style={[styles.statBox, styles.borderLeft]}>
            <Text style={[styles.statValue, { color: '#0052CC' }]}>{totalOrders}</Text>
            <Text style={styles.statLabel}>TOTAL POs</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>PURCHASE MANAGEMENT</Text>
        
        <View style={styles.grid}>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('ViewPurchaseRequests')}>
            <View style={[styles.iconBox, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="document-text" size={32} color="#D97706" />
              {pendingCount > 0 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{pendingCount}</Text></View>
              )}
            </View>
            <Text style={styles.cardTitle}>New Requests</Text>
            <Text style={styles.cardSub}>Process HOD/Store PRs</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('PurchaseOrderHistory')}>
            <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="receipt" size={32} color="#16A34A" />
            </View>
            <Text style={styles.cardTitle}>Order History</Text>
            <Text style={styles.cardSub}>View fulfilled PO work</Text>
          </TouchableOpacity>
        </View>

        {/* ADDED COPYRIGHT FOOTER */}
        <View style={styles.footerContainer}>
            <Text style={styles.tagline}>Intelligent Resource & Ledger Management</Text>
            <Text style={styles.copyrightText}>
                © 2026 AstraCIT • Developed by <Text style={{fontWeight: '900', color: '#D97706'}}>CodeTitans</Text>
            </Text>
            <Text style={styles.rightsText}>All Rights Reserved</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF', 
    borderBottomWidth: 1, borderColor: '#E2E8F0', elevation: 4 
  },
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 12 },
  citLogo: { width: 38, height: 38, marginRight: 10 },
  title: { fontSize: 16, fontWeight: '900', color: '#0F172A', letterSpacing: 0.5 },
  subtitle: { fontSize: 10, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  logoutText: { color: '#D32F2F', fontSize: 12, fontWeight: '800', marginLeft: 6 },
  
  overviewBar: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 25, elevation: 3, borderWidth: 1, borderColor: '#F1F5F9' },
  statBox: { flex: 1, alignItems: 'center' },
  borderLeft: { borderLeftWidth: 1, borderColor: '#F1F5F9' },
  statValue: { fontSize: 24, fontWeight: '900', color: '#D97706' },
  statLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', marginTop: 4, letterSpacing: 1 },

  content: { padding: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 20, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  featureCard: { width: '48%', backgroundColor: '#FFF', padding: 20, borderRadius: 24, elevation: 4, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  iconBox: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', borderRadius: 12, minWidth: 22, height: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  cardSub: { fontSize: 11, color: '#64748B', marginTop: 4 },

  // FOOTER STYLES
  footerContainer: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center',
  },
  tagline: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 5,
    textTransform: 'uppercase'
  },
  copyrightText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600'
  },
  rightsText: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500'
  }
});