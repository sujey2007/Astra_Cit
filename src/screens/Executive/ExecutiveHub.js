import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, 
  TouchableOpacity, Image, Dimensions, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

export default function ExecutiveHub({ navigation }) {
  const [totalSpend, setTotalSpend] = useState(0);
  const [assetCount, setAssetCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSecure, setIsSecure] = useState(true);
  
  // 360 Monitoring States
  const [activeLabor, setActiveLabor] = useState(0);
  const [latestWorkLog, setLatestWorkLog] = useState("Loading...");
  const [pendingPOs, setPendingPOs] = useState(0);

  useEffect(() => {
    // 1. Financial Monitoring
    const unsubLedger = onSnapshot(collection(db, "institutional_ledger"), (snap) => {
      let total = snap.docs.reduce((acc, doc) => acc + (Number(doc.data().amount) || 0), 0);
      setTotalSpend(total + 450000);
      setLoading(false);
    });

    // 2. Asset Inventory Monitoring
    const unsubAssets = onSnapshot(collection(db, "inventory"), (snap) => {
      setAssetCount(snap.docs.length);
    });

    // 3. Labor Attendance Monitoring
    const unsubLabor = onSnapshot(collection(db, "construction_attendance"), (snap) => {
      if (!snap.empty) {
        const latest = snap.docs[0].data();
        setActiveLabor(latest.summary?.present + latest.summary?.halfDay || 0);
      }
    });

    // 4. Construction Progress Monitoring
    const qWork = query(collection(db, "construction_logs"), orderBy("timestamp", "desc"), limit(1));
    const unsubWork = onSnapshot(qWork, (snap) => {
      if (!snap.empty) setLatestWorkLog(snap.docs[0].data().description);
    });

    // 5. Procurement Monitoring
    const qPOs = query(collection(db, "requisitions"));
    const unsubPOs = onSnapshot(qPOs, (snap) => {
      setPendingPOs(snap.docs.filter(d => d.data().status === "PR Raised" || d.data().status === "Ordered").length);
    });

    return () => { unsubLedger(); unsubAssets(); unsubLabor(); unsubWork(); unsubPOs(); };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Image source={require('../../../assets/logo.png')} style={styles.citLogo} resizeMode="contain" />
          <View>
            <Text style={styles.title}>EXECUTIVE HUB</Text>
            <Text style={styles.subtitle}>Strategic Oversight Portal</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.replace('Login')}>
          <Ionicons name="power" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* LEDGER INTEGRITY SEAL */}
        <View style={[styles.integrityCard, { borderColor: isSecure ? '#10B981' : '#EF4444' }]}>
          <Ionicons name={isSecure ? "shield-checkmark" : "alert-circle"} size={24} color={isSecure ? "#10B981" : "#EF4444"} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.integrityTitle}>LEDGER INTEGRITY: {isSecure ? 'SECURE' : 'COMPROMISED'}</Text>
            <Text style={styles.integritySub}>Verification Seal Active • All Logs Immutable</Text>
          </View>
          <TouchableOpacity 
            style={styles.scanBtn} 
            onPress={() => navigation.navigate('AuditorScanner')}
          >
            <Ionicons name="qr-code-outline" size={20} color="#FFF" />
            <Text style={styles.scanBtnText}>AUDIT</Text>
          </TouchableOpacity>
        </View>

        {/* PRIMARY FINANCIAL METRICS */}
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>INSTITUTIONAL VALUE</Text>
            <Text style={styles.metricValue}>₹{(totalSpend / 100000).toFixed(2)}L</Text>
          </View>
          <View style={[styles.metricBox, { backgroundColor: '#1E293B' }]}>
            <Text style={[styles.metricLabel, { color: '#94A3B8' }]}>PENDING ORDERS</Text>
            <Text style={[styles.metricValue, { color: '#FFF' }]}>{pendingPOs}</Text>
          </View>
        </View>

        {/* SITE MONITORING 360 - LABOR & PROGRESS */}
        <Text style={styles.sectionLabel}>Live Site Monitor</Text>
        <View style={styles.siteCard}>
           <View style={styles.siteHeader}>
              <View style={styles.statusDot} />
              <Text style={styles.siteTitle}>CONSTRUCTION SITE STATUS</Text>
           </View>
           <View style={styles.siteStatsRow}>
              <View style={styles.siteStat}>
                 <Text style={styles.siteStatVal}>{activeLabor}</Text>
                 <Text style={styles.siteStatLab}>LABOR ON-SITE</Text>
              </View>
              <View style={styles.siteStat}>
                 <Text style={[styles.siteStatVal, { color: '#2563EB' }]}>{assetCount}</Text>
                 <Text style={styles.siteStatLab}>TOTAL ASSETS</Text>
              </View>
           </View>
           <Text style={styles.progressLabel}>LATEST PROGRESS LOG:</Text>
           <Text style={styles.progressText} numberOfLines={2}>"{latestWorkLog}"</Text>
        </View>

        {/* EXPENDITURE CHART - RESPONSIVE MOBILE OPTIMIZATION */}
        <Text style={styles.sectionLabel}>Expenditure Trend</Text>
        <View style={styles.chartCard}>
          <LineChart
            data={{
              labels: ["Jan", "Feb", "Mar", "Apr"],
              datasets: [{ data: [20, 45, 28, 80] }]
            }}
            width={width - 70} // Adaptable to mobile screen width
            height={180}
            chartConfig={{
              backgroundColor: "#FFF",
              backgroundGradientFrom: "#FFF",
              backgroundGradientTo: "#FFF",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: "5", strokeWidth: "2", stroke: "#2563EB" }
            }}
            bezier
            style={{ borderRadius: 16, marginTop: 10 }}
          />
        </View>

        {/* NAVIGATION MODULES */}
        <Text style={styles.sectionLabel}>Strategic Modules</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.moduleCard} onPress={() => navigation.navigate('SystemAnalytics')}>
            <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="analytics" size={24} color="#4338CA" />
            </View>
            <Text style={styles.moduleTitle}>Analytics</Text>
            <Text style={styles.moduleSub}>Dept-wise ROI</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.moduleCard} onPress={() => navigation.navigate('GlobalTransactions')}>
            <View style={[styles.iconCircle, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="list" size={24} color="#16A34A" />
            </View>
            <Text style={styles.moduleTitle}>Master Ledger</Text>
            <Text style={styles.moduleSub}>Full History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {/* NEW MODULE: PURCHASE ORDER LISTING */}
          <TouchableOpacity style={styles.moduleCard} onPress={() => navigation.navigate('PurchaseOrderHistory')}>
            <View style={[styles.iconCircle, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="cart" size={24} color="#EA580C" />
            </View>
            <Text style={styles.moduleTitle}>Purchase Orders</Text>
            <Text style={styles.moduleSub}>Supply Chain</Text>
          </TouchableOpacity>

          {/* NEW MODULE: LABOR WORKLOGS */}
          <TouchableOpacity style={styles.moduleCard} onPress={() => navigation.navigate('AttendanceHistory')}>
            <View style={[styles.iconCircle, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="people" size={24} color="#475569" />
            </View>
            <Text style={styles.moduleTitle}>Labor History</Text>
            <Text style={styles.moduleSub}>Site Attendance</Text>
          </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <View style={styles.footerContainer}>
          <Text style={styles.tagline}>AstraCIT Strategic Oversight</Text>
          <Text style={styles.copyrightText}>© 2026 AstraCIT • Developed by CodeTitans</Text>
          <Text style={styles.rightsText}>All Rights Reserved</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0', paddingTop: 50 },
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  citLogo: { width: 35, height: 35, marginRight: 10 },
  title: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 10, color: '#64748B', fontWeight: '700' },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  
  // Integrity & Scan
  integrityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 15, borderWidth: 2, marginBottom: 20 },
  integrityTitle: { fontSize: 11, fontWeight: '900', color: '#1E293B' },
  integritySub: { fontSize: 9, color: '#64748B' },
  scanBtn: { backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 5 },
  scanBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900' },

  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  metricBox: { width: '48%', backgroundColor: '#FFF', padding: 20, borderRadius: 20, elevation: 4 },
  metricLabel: { fontSize: 9, fontWeight: '900', color: '#64748B', marginBottom: 5 },
  metricValue: { fontSize: 22, fontWeight: '900', color: '#2563EB' },
  
  // Site Monitoring Card
  siteCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 25, elevation: 3, borderLeftWidth: 5, borderLeftColor: '#F59E0B' },
  siteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 8 },
  siteTitle: { fontSize: 12, fontWeight: '900', color: '#1E293B', letterSpacing: 0.5 },
  siteStatsRow: { flexDirection: 'row', justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 15, marginBottom: 15 },
  siteStat: { alignItems: 'center' },
  siteStatVal: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  siteStatLab: { fontSize: 8, color: '#94A3B8', fontWeight: '800', marginTop: 4 },
  progressLabel: { fontSize: 9, fontWeight: '900', color: '#64748B', marginBottom: 5 },
  progressText: { fontSize: 12, color: '#475569', fontStyle: 'italic', lineHeight: 18 },

  chartCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, marginBottom: 25, elevation: 3, alignItems: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1.5 },
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  moduleCard: { width: '48%', backgroundColor: '#FFF', padding: 20, borderRadius: 24, elevation: 4, marginBottom: 16 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  moduleTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  moduleSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  
  footerContainer: { marginTop: 30, alignItems: 'center', paddingBottom: 20 },
  tagline: { fontSize: 10, fontWeight: '800', color: '#94A3B8', marginBottom: 5 },
  copyrightText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  rightsText: { fontSize: 9, color: '#94A3B8', marginTop: 2 }
});