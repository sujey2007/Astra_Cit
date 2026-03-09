import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Dimensions, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity 
} from 'react-native';
import { BarChart } from 'react-native-chart-kit'; 
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';

const screenWidth = Dimensions.get("window").width;

// Premium Branding Colors for CIT Departments
const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899'];

export default function SystemAnalytics({ navigation }) {
  // CRITICAL: Colors must be in the initial state to prevent 'map' crash
  const [data, setData] = useState({
    labels: ["HOD", "Stores", "Purchase", "Admin"],
    datasets: [{ 
      data: [0, 0, 0, 0],
      colors: [
        (opacity = 1) => COLORS[0],
        (opacity = 1) => COLORS[1],
        (opacity = 1) => COLORS[2],
        (opacity = 1) => COLORS[3],
      ]
    }]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribes = [];
    const counts = [0, 0, 0, 0]; 

    const syncState = (c) => {
      setData({
        labels: ["HOD", "Stores", "Purchase", "Admin"],
        datasets: [{ 
          data: [...c],
          colors: [
            (opacity = 1) => COLORS[0],
            (opacity = 1) => COLORS[1],
            (opacity = 1) => COLORS[2],
            (opacity = 1) => COLORS[3],
          ]
        }]
      });
      setLoading(false);
    };

    // Real-time Listeners
    unsubscribes.push(onSnapshot(collection(db, 'requisitions'), (s) => {
      counts[0] = s.size;
      syncState(counts);
    }));
    unsubscribes.push(onSnapshot(collection(db, 'inventory'), (s) => {
      counts[1] = s.size;
      syncState(counts);
    }));
    unsubscribes.push(onSnapshot(collection(db, 'inward_history'), (s) => {
      counts[2] = s.size;
      syncState(counts);
    }));
    unsubscribes.push(onSnapshot(collection(db, 'users'), (s) => {
      counts[3] = s.size;
      syncState(counts);
    }));

    return () => unsubscribes.forEach(un => un());
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SYSTEM ANALYTICS</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Real-Time Usage</Text>
        <Text style={styles.subtitle}>Activity tracking across CIT departments</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.chartWrapper}>
            <BarChart
              data={data}
              width={screenWidth - 70} // ADJUSTED: Added padding for mobile responsiveness
              height={220} // ADJUSTED: Slightly reduced height for better proportions
              fromZero
              flatColor={true}
              withCustomBarColorFromData={true} 
              chartConfig={{
                backgroundGradientFrom: "#FFF",
                backgroundGradientTo: "#FFF",
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                barPercentage: 0.6, // ADJUSTED: Narrower bars for cleaner look
                decimalPlaces: 0,
              }}
              style={styles.chart}
            />
          </View>
        )}

        <View style={styles.statsGrid}>
          {data.labels.map((label, index) => (
            <View key={label} style={[styles.statCard, { borderLeftColor: COLORS[index] }]}>
              <Text style={styles.statLabel}>{label}</Text>
              <Text style={[styles.statValue, { color: COLORS[index] }]}>
                {data.datasets[0].data[index]}
              </Text>
              <Text style={styles.statSub}>Total Logs</Text>
            </View>
          ))}
        </View>

        {/* ADDED COPYRIGHT FOOTER */}
        <View style={styles.footerContainer}>
            <Text style={styles.tagline}>Intelligent Resource & Ledger Management</Text>
            <Text style={styles.copyrightText}>
                © 2026 AstraCIT • Developed by <Text style={{fontWeight: '900', color: '#6366F1'}}>CodeTitans</Text>
            </Text>
            <Text style={styles.rightsText}>All Rights Reserved</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0', paddingTop: 50 },
  backBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 12, marginRight: 15 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A', letterSpacing: 1 },
  content: { padding: 20 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  subtitle: { fontSize: 13, color: '#64748B', marginBottom: 25 },
  chartWrapper: { backgroundColor: '#FFF', borderRadius: 24, padding: 15, elevation: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  chart: { borderRadius: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 25 },
  statCard: { width: '48%', backgroundColor: '#FFF', padding: 20, borderRadius: 20, marginBottom: 15, elevation: 4, borderLeftWidth: 6 },
  statLabel: { fontSize: 10, fontWeight: '900', color: '#64748B', textTransform: 'uppercase' },
  statValue: { fontSize: 32, fontWeight: '900', marginTop: 5 },
  statSub: { fontSize: 10, color: '#94A3B8', fontWeight: '700' },
  
  // FOOTER STYLES
  footerContainer: {
    marginTop: 30,
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