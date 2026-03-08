import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, onSnapshot, query } from 'firebase/firestore';

export default function BudgetTracker({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [departmentBudgets, setDepartmentBudgets] = useState([
    { dept: 'Construction', allocated: 500000, spent: 0, color: '#1D4ED8' },
    { dept: 'General Stores', allocated: 200000, spent: 0, color: '#10B981' },
    { dept: 'Electrical', allocated: 150000, spent: 0, color: '#F59E0B' },
  ]);

  useEffect(() => {
    // Sync with the Institutional Ledger for real-time spend updates
    const q = query(collection(db, "institutional_ledger"));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const liveTransactions = snapshot.docs.map(doc => doc.data());
      
      // Calculate real-time spend per department
      setDepartmentBudgets(prevBudgets => 
        prevBudgets.map(budget => {
          const totalSpent = liveTransactions
            .filter(tx => tx.department === budget.dept || tx.category?.includes(budget.dept))
            .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
          
          return { ...budget, spent: totalSpent };
        })
      );
      setLoading(false);
    }, (error) => {
      console.error("Budget Sync Error:", error);
      setLoading(false);
    });

    return unsub;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>BUDGET ANALYTICS</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1D4ED8" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {departmentBudgets.map((item, index) => {
            // Logic to calculate progress based on live 'spent' data
            const progress = (item.spent / item.allocated) * 100;
            const displayProgress = progress > 100 ? 100 : progress;

            return (
              <View key={index} style={styles.budgetCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.deptName}>{item.dept}</Text>
                  <Text style={[
                    styles.percent, 
                    progress > 90 && { color: '#EF4444' } // Red alert if over 90%
                  ]}>
                    {progress.toFixed(1)}% Used
                  </Text>
                </View>
                
                {/* Real-time Progress Bar */}
                <View style={styles.progressBg}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${displayProgress}%`, 
                        backgroundColor: progress > 100 ? '#EF4444' : item.color 
                      }
                    ]} 
                  />
                </View>

                <View style={styles.statsRow}>
                  <View>
                    <Text style={styles.statLabel}>Spent</Text>
                    <Text style={styles.spentVal}>₹{item.spent.toLocaleString()}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.statLabel}>Allocated Limit</Text>
                    <Text style={styles.limitVal}>₹{item.allocated.toLocaleString()}</Text>
                  </View>
                </View>

                {progress > 100 && (
                  <View style={styles.alertBox}>
                    <Ionicons name="warning" size={16} color="#B91C1C" />
                    <Text style={styles.alertText}>BUDGET EXCEEDED</Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderColor: '#E2E8F0',
    elevation: 2
  },
  backBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 10 },
  title: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginLeft: 15 },
  budgetCard: { 
    backgroundColor: '#FFF', 
    padding: 22, 
    borderRadius: 24, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    elevation: 3 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
  deptName: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  percent: { fontSize: 13, fontWeight: '800', color: '#64748B' },
  progressBg: { height: 12, backgroundColor: '#F1F5F9', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  statLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  spentVal: { color: '#1E293B', fontWeight: '900', fontSize: 16, marginTop: 2 },
  limitVal: { color: '#64748B', fontWeight: '700', fontSize: 15, marginTop: 2 },
  alertBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FEF2F2', 
    padding: 8, 
    borderRadius: 8, 
    marginTop: 15,
    gap: 6
  },
  alertText: { color: '#B91C1C', fontSize: 11, fontWeight: '900' }
});