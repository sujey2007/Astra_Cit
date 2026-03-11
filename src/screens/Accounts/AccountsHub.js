import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Dimensions,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit'; 
import { db } from '../../api/firebaseConfig';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

const screenWidth = Dimensions.get("window").width;

// Consistent Branding Colors for Login & Hub adaptive design
const COLORS = {
  primary: '#1D4ED8',
  secondary: '#10B981',
  accent: '#F59E0B',
  grid: 'rgba(226, 232, 240, 0.6)',
  label: '#64748B'
};

export default function AccountsHub({ navigation }) {
  const [pendingPayments, setPendingPayments] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [chartData, setChartData] = useState({
    labels: ["Jan", "Feb", "Mar"],
    datasets: [{ 
      data: [145, 198, 0] 
    }]
  });

  useEffect(() => {
    // 1. Sync Pending Wages
    const qWages = query(collection(db, "construction_attendance"), where("paymentStatus", "==", "Pending"));
    const unsubWages = onSnapshot(qWages, (snap) => setPendingPayments(snap.docs.length));

    // 2. Sync Institutional Ledger with Real-time Totalization
    const qLedger = collection(db, "institutional_ledger");
    const unsubLedger = onSnapshot(qLedger, (snap) => {
      const docs = snap.docs.map(doc => doc.data());
      
      const liveTotal = docs.reduce((acc, data) => acc + (parseFloat(data.amount) || 0), 0);
      const approxInventoryValue = 330000; 
      setTotalExpenses(liveTotal + approxInventoryValue);

      // Filtering specific March 2026 data for the Adaptive Graph
      const marchSpend = docs.filter(data => {
        const date = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
        return date && date.getMonth() === 2 && date.getFullYear() === 2026;
      }).reduce((acc, data) => acc + (parseFloat(data.amount) || 0), 0);

      const marchTotalK = Math.max(0, (marchSpend + 210000) / 1000); 
      
      setChartData({
        labels: ["Jan", "Feb", "Mar"],
        datasets: [{ 
          data: [145, 198, marchTotalK]
        }]
      });
      setLoading(false);
    }, (error) => {
      console.error("Ledger Sync Error:", error);
      setLoading(false);
    });

    return () => {
      unsubWages();
      unsubLedger();
    };
  }, []);

  // Shared Adaptive Chart Configuration (Can be exported to Login screen)
  const chartConfig = {
    backgroundColor: "#FFFFFF",
    backgroundGradientFrom: "#FFFFFF",
    backgroundGradientTo: "#FFFFFF",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(29, 78, 216, ${opacity})`,
    labelColor: (opacity = 1) => COLORS.label,
    style: { borderRadius: 16 },
    propsForBackgroundLines: {
      strokeDasharray: "", // solid lines for cleaner professional look
      stroke: COLORS.grid
    },
    barPercentage: 0.55,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Image 
            source={require('../../../assets/logo.png')} 
            style={styles.citLogo} 
            resizeMode="contain"
          />
          <View>
            <Text style={styles.title}>ACCOUNTS HUB</Text>
            <Text style={styles.subtitle}>Institutional Finance Ledger</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.replace('Login')}>
          <Ionicons name="power" size={20} color="#D32F2F" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* FINANCIAL SUMMARY BAR */}
        <View style={styles.overviewBar}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>₹{(totalExpenses / 100000).toFixed(1)}L</Text>
            <Text style={styles.statLabel}>INST. VALUE</Text>
          </View>
          <View style={[styles.statBox, styles.borderLeft]}>
            <Text style={[styles.statValue, { color: '#EA580C' }]}>{pendingPayments}</Text>
            <Text style={styles.statLabel}>PENDING WAGES</Text>
          </View>
          <View style={[styles.statBox, styles.borderLeft]}>
            <Text style={[styles.statValue, { color: '#059669' }]}>92%</Text>
            <Text style={styles.statLabel}>BUDGET HEALTH</Text>
          </View>
        </View>

        {/* ADAPTIVE MONTHLY SPENDING CHART */}
        <Text style={styles.sectionLabel}>Institutional Spending Growth (in ₹k)</Text>
        <View style={styles.chartWrapper}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <BarChart
              data={chartData}
              width={screenWidth - 64} 
              height={220}
              fromZero
              yAxisLabel="₹"
              yAxisSuffix="k"
              chartConfig={chartConfig}
              verticalLabelRotation={0}
              showValuesOnTopOfBars
              style={styles.chart}
            />
          )}
        </View>

        <Text style={styles.sectionLabel}>FINANCIAL OPERATIONS</Text>
        
        <View style={styles.grid}>
          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('PayrollApproval')}>
            <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="people" size={32} color="#166534" />
            </View>
            <Text style={styles.cardTitle}>Payroll</Text>
            <Text style={styles.cardSub}>Approve site wages</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('PayPurchaseOrder')}>
            <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="card" size={32} color="#1E40AF" />
            </View>
            <Text style={styles.cardTitle}>Settlements</Text>
            <Text style={styles.cardSub}>Secure PO Gateway</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('BudgetTracker')}>
            <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="analytics" size={32} color="#92400E" />
            </View>
            <Text style={styles.cardTitle}>Budgets</Text>
            <Text style={styles.cardSub}>Dept allocations</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => navigation.navigate('TransactionLedger')}>
            <View style={[styles.iconBox, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="receipt" size={32} color="#475569" />
            </View>
            <Text style={styles.cardTitle}>Ledger</Text>
            <Text style={styles.cardSub}>Full audit trail</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerContainer}>
            <Text style={styles.tagline}>Intelligent Resource & Ledger Management</Text>
            <Text style={styles.copyrightText}>
                © 2026 AstraCIT • Developed by <Text style={{fontWeight: '900', color: COLORS.primary}}>CodeTitans</Text>
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
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20,
    paddingBottom: 20, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderColor: '#E2E8F0', 
    elevation: 4,
    paddingTop: 50 
  },
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  citLogo: { width: 35, height: 35, marginRight: 10 },
  title: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 10, color: '#64748B', fontWeight: '700' },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  overviewBar: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 25, elevation: 3, borderWidth: 1, borderColor: '#F1F5F9' },
  statBox: { flex: 1, alignItems: 'center' },
  borderLeft: { borderLeftWidth: 1, borderColor: '#F1F5F9' },
  statValue: { fontSize: 20, fontWeight: '900', color: '#1D4ED8' },
  statLabel: { fontSize: 8, fontWeight: '800', color: '#94A3B8', marginTop: 4, letterSpacing: 1 },
  chartWrapper: { 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 24, 
    marginBottom: 25, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    elevation: 2, 
    alignItems: 'center'
  },
  chart: { borderRadius: 16, marginTop: 5 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 15, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  featureCard: { width: '48%', backgroundColor: '#FFF', padding: 20, borderRadius: 24, elevation: 4, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9', minHeight: 180 },
  iconBox: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  cardSub: { fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: '500' },
  footerContainer: { marginTop: 30, marginBottom: 20, alignItems: 'center' },
  tagline: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 5, textTransform: 'uppercase' },
  copyrightText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  rightsText: { fontSize: 9, color: '#94A3B8', marginTop: 2, fontWeight: '500' }
});