import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';

export default function PayrollApproval({ navigation }) {
  const [activeTab, setActiveTab] = useState('Pending');
  const [allLogs, setAllLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const WAGE_PER_DAY = 500; // Institutional Rate: Rs. 500 per day worked

  // MOCK VENDORS DATA (From previous sessions)
  const mockVendors = [
    { id: 'm1', vendorName: 'UltraTech Cement Services', manager: 'Ramesh K.', daysWorked: 12, paymentStatus: 'Pending', timestamp: { toDate: () => new Date() } },
    { id: 'm2', vendorName: 'Suresh Masonry Works', manager: 'Sujey H.', daysWorked: 8, paymentStatus: 'Pending', timestamp: { toDate: () => new Date() } },
    { id: 'm3', vendorName: 'Ankit Material Handling', manager: 'Sanjay S.', daysWorked: 15, paymentStatus: 'Approved', timestamp: { toDate: () => new Date() } },
  ];

  useEffect(() => {
    setLoading(true);
    
    // 1. Fetch live data from Firestore
    const q = query(
      collection(db, "construction_attendance"), 
      where("paymentStatus", "==", activeTab === 'Pending' ? "Pending" : "Approved")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const liveData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // 2. Filter mock data based on the active tab status
      const currentMockData = mockVendors.filter(v => v.paymentStatus === (activeTab === 'Pending' ? "Pending" : "Approved"));

      // 3. Combine and Sort (Bypassing index build delays)
      const combined = [...liveData, ...currentMockData].sort((a, b) => {
        const timeA = a.timestamp?.seconds || a.timestamp?.toDate()?.getTime() || 0;
        const timeB = b.timestamp?.seconds || b.timestamp?.toDate()?.getTime() || 0;
        return timeB - timeA;
      });

      setAllLogs(combined);
      setFilteredLogs(combined);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Payroll Error:", error);
      // Fallback to mock data only if Firebase fails or is empty
      setAllLogs(mockVendors.filter(v => v.paymentStatus === (activeTab === 'Pending' ? "Pending" : "Approved")));
      setLoading(false);
    });

    return unsub;
  }, [activeTab]);

  // VENDOR SEARCH LOGIC
  useEffect(() => {
    const filtered = allLogs.filter(log => 
      log.vendorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.manager?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredLogs(filtered);
  }, [searchQuery, allLogs]);

  const approveVendorWage = async (log) => {
    const totalDays = parseInt(log.daysWorked || 1);
    const finalWage = totalDays * WAGE_PER_DAY;

    // Guard for mock data (cannot update Firestore for mock IDs)
    if (log.id.startsWith('m')) {
      Alert.alert("Mock Data", `Simulating approval for ${log.vendorName}. Institutional Payout: ₹${finalWage}`);
      return;
    }

    try {
      // 1. Mark as Approved in the construction database
      await updateDoc(doc(db, "construction_attendance", log.id), {
        paymentStatus: "Approved",
        approvedAt: serverTimestamp(),
        finalDisbursement: finalWage
      });

      // 2. Generate institutional ledger entry for audit
      await addDoc(collection(db, "institutional_ledger"), {
        amount: finalWage,
        category: "Vendor Payroll",
        description: `Wage settlement for ${log.vendorName} (${totalDays} days)`,
        timestamp: serverTimestamp(),
        type: "Debit"
      });

      Alert.alert("Payroll Approved", `₹${finalWage} has been authorized for ${log.vendorName}.`);
    } catch (e) {
      Alert.alert("Error", "Could not authorize payroll at this time.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>VENDOR PAYROLL</Text>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#94A3B8" />
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search Vendor Name..." 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* TABS */}
      <View style={styles.tabBar}>
        {['Pending', 'Approved'].map(tab => (
          <TouchableOpacity 
            key={tab} 
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} color="#1D4ED8" size="large" />
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => {
            const days = parseInt(item.daysWorked || 1);
            const total = days * WAGE_PER_DAY;
            return (
              <View style={styles.payrollCard}>
                <View style={styles.cardInfo}>
                  <Text style={styles.vendorName}>{item.vendorName}</Text>
                  <Text style={styles.subInfo}>Manager: {item.manager}</Text>
                  <Text style={styles.date}>{item.timestamp?.toDate().toLocaleDateString()}</Text>
                </View>
                
                <View style={styles.wageSection}>
                  <Text style={styles.daysText}>{days} Days Worked</Text>
                  <Text style={styles.totalText}>₹{total.toLocaleString()}</Text>
                  
                  {activeTab === 'Pending' && (
                    <TouchableOpacity style={styles.approveBtn} onPress={() => approveVendorWage(item)}>
                      <Text style={styles.btnText}>RELEASE</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No {activeTab.toLowerCase()} payroll entries.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  backBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 10 },
  title: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginLeft: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 20, marginBottom: 10, paddingHorizontal: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', height: 50 },
  searchInput: { flex: 1, marginLeft: 10, fontWeight: '600' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 10 },
  tab: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
  activeTab: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  tabText: { fontSize: 11, fontWeight: '800', color: '#94A3B8' },
  activeTabText: { color: '#FFF' },
  payrollCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 20, borderRadius: 20, marginBottom: 15, elevation: 3, borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' },
  cardInfo: { flex: 1 },
  vendorName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  subInfo: { fontSize: 11, color: '#64748B', marginTop: 4 },
  date: { fontSize: 10, color: '#94A3B8', marginTop: 2, fontWeight: '700' },
  wageSection: { alignItems: 'flex-end' },
  daysText: { fontSize: 11, color: '#64748B', fontWeight: '800' },
  totalText: { fontSize: 20, fontWeight: '900', color: '#059669', marginVertical: 5 },
  approveBtn: { backgroundColor: '#1D4ED8', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  btnText: { color: '#FFF', fontWeight: '900', fontSize: 11 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#94A3B8', fontWeight: '700' }
});