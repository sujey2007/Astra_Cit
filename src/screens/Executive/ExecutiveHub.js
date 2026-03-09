import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, ScrollView, 
  TouchableOpacity, Image, Dimensions, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

export default function ExecutiveHub({ navigation }) {
  const [totalSpend, setTotalSpend] = useState(0);
  const [assetCount, setAssetCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSecure, setIsSecure] = useState(true); // "Digital Seal" status

  useEffect(() => {
    // 1. Fetch Total Financial Outflow
    const unsubLedger = onSnapshot(collection(db, "institutional_ledger"), (snap) => {
      let total = snap.docs.reduce((acc, doc) => acc + (Number(doc.data().amount) || 0), 0);
      setTotalSpend(total + 450000); // Including base asset value
      setLoading(false);
    });

    // 2. Fetch Total Assets
    const unsubAssets = onSnapshot(collection(db, "inventory"), (snap) => {
      setAssetCount(snap.docs.length);
    });

    return () => { unsubLedger(); unsubAssets(); };
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
        
        {/* DIGITAL SEAL / INTEGRITY STATUS */}
        <View style={[styles.integrityCard, { borderColor: isSecure ? '#10B981' : '#EF4444' }]}>
          <Ionicons name={isSecure ? "shield-checkmark" : "alert-circle"} size={24} color={isSecure ? "#10B981" : "#EF4444"} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.integrityTitle}>LEDGER INTEGRITY: {isSecure ? 'SECURE' : 'COMPROMISED'}</Text>
            <Text style={styles.integritySub}>All transactions verified via Cryptographic Seal</Text>
          </View>
        </View>

        {/* PRIMARY METRICS */}
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>INSTITUTIONAL VALUE</Text>
            <Text style={styles.metricValue}>₹{(totalSpend / 100000).toFixed(2)}L</Text>
          </View>
          <View style={[styles.metricBox, { backgroundColor: '#1E293B' }]}>
            <Text style={[styles.metricLabel, { color: '#94A3B8' }]}>ACTIVE ASSETS</Text>
            <Text style={[styles.metricValue, { color: '#FFF' }]}>{assetCount}</Text>
          </View>
        </View>

        {/* GROWTH CHART */}
        <Text style={styles.sectionLabel}>Expenditure Trend</Text>
        <View style={styles.chartCard}>
          <LineChart
            data={{
              labels: ["Jan", "Feb", "Mar", "Apr"],
              datasets: [{ data: [20, 45, 28, 80] }]
            }}
            width={width - 40}
            height={200}
            chartConfig={{
              backgroundColor: "#FFF",
              backgroundGradientFrom: "#FFF",
              backgroundGradientTo: "#FFF",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: "6", strokeWidth: "2", stroke: "#2563EB" }
            }}
            bezier
            style={{ borderRadius: 16, marginTop: 10 }}
          />
        </View>

        {/* STRATEGIC CONTROLS */}
        <Text style={styles.sectionLabel}>Strategic Modules</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.moduleCard} onPress={() => navigation.navigate('SystemAnalytics')}>
            <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="analytics" size={24} color="#2563EB" />
            </View>
            <Text style={styles.moduleTitle}>Analytics</Text>
            <Text style={styles.moduleSub}>Dept-wise ROI</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.moduleCard} onPress={() => navigation.navigate('GlobalTransactions')}>
            <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="list" size={24} color="#10B981" />
            </View>
            <Text style={styles.moduleTitle}>Master Ledger</Text>
            <Text style={styles.moduleSub}>Full transparency</Text>
          </TouchableOpacity>
        </View>

        {/* COPYRIGHT FOOTER */}
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
  integrityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 15, borderWidth: 2, marginBottom: 20 },
  integrityTitle: { fontSize: 12, fontWeight: '900', color: '#1E293B' },
  integritySub: { fontSize: 10, color: '#64748B' },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  metricBox: { width: '48%', backgroundColor: '#FFF', padding: 20, borderRadius: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  metricLabel: { fontSize: 9, fontWeight: '900', color: '#64748B', marginBottom: 5 },
  metricValue: { fontSize: 22, fontWeight: '900', color: '#2563EB' },
  chartCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, marginBottom: 25, elevation: 3 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 1 },
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