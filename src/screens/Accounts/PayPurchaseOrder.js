import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  ScrollView,
  ActivityIndicator
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

export default function PayPurchaseOrder({ navigation }) {
  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending' or 'History'
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPO, setSelectedPO] = useState(null);
  const [gatewayVisible, setGatewayVisible] = useState(false);
  const [expandedPO, setExpandedPO] = useState(null);

  useEffect(() => {
    setLoading(true);
    // Pointing to 'requisitions' collection where Purchase Officers place orders
    const poRef = collection(db, "requisitions");
    
    // Map tab to the correct status in the database
    const statusFilter = activeTab === 'Pending' ? "Ordered" : "Paid";
    const q = query(poRef, where("status", "==", statusFilter));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // CLIENT-SIDE SORTING: Bypasses the Indexing Error
      const sortedData = data.sort((a, b) => {
        const timeA = a.orderedAt?.seconds || a.timestamp?.seconds || 0;
        const timeB = b.orderedAt?.seconds || b.timestamp?.seconds || 0;
        return timeB - timeA;
      });

      setPurchaseOrders(sortedData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });
    
    return unsub;
  }, [activeTab]);

  const handlePaymentSuccess = async () => {
    try {
      // 1. Update status in the 'requisitions' collection
      await updateDoc(doc(db, "requisitions", selectedPO.id), {
        status: "Paid",
        paidAt: serverTimestamp(),
        transactionId: `CIT-PAY-${Math.floor(Math.random() * 1000000)}`
      });

      // 2. Log to Institutional Ledger for audit trail
      await addDoc(collection(db, "institutional_ledger"), {
        amount: selectedPO.totalCost || selectedPO.totalAmount || 0,
        category: "Procurement Settlement",
        description: `Bank disbursement to ${selectedPO.vendorName}`,
        timestamp: serverTimestamp(),
        type: "Debit",
        referencePO: selectedPO.id
      });

      setGatewayVisible(false);
      Alert.alert("Success", "Institutional funds successfully disbursed.");
    } catch (e) {
      Alert.alert("Error", "Gateway verification failed.");
    }
  };

  const renderPOItem = ({ item }) => {
    const isExpanded = expandedPO === item.id;
    const isPaid = item.status === "Paid";
    const amount = item.totalCost || item.totalAmount || 0;

    return (
      <View style={[styles.poCard, isPaid && styles.historyCardBorder]}>
        <TouchableOpacity 
          style={styles.poMain} 
          onPress={() => setExpandedPO(isExpanded ? null : item.id)}
        >
          <View style={styles.poInfo}>
            <Text style={styles.vendorName}>{item.vendorName || 'General Vendor'}</Text>
            <Text style={styles.poId}>PO REF: {item.poNumber || `#${item.id.substring(0, 8).toUpperCase()}`}</Text>
            <Text style={[styles.amount, isPaid && { color: '#64748B' }]}>
              ₹{amount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statusBadgeContainer}>
             <View style={[styles.statusBadge, isPaid ? styles.paidBadge : styles.pendingBadge]}>
                <Text style={styles.statusText}>{item.status}</Text>
             </View>
             <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.divider} />
            <Text style={styles.detailLabel}>ORDER DETAILS:</Text>
            <Text style={styles.itemRow}>• Material: {item.itemName}</Text>
            <Text style={styles.itemRow}>• Quantity: {item.quantity}</Text>
            <Text style={styles.itemRow}>• Requested By: {item.requestedBy || 'CIT Dept'}</Text>
            
            {!isPaid ? (
              <TouchableOpacity 
                style={styles.payBtn} 
                onPress={() => { setSelectedPO(item); setGatewayVisible(true); }}
              >
                <Ionicons name="card" size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.payBtnText}>INITIATE PAYMENT</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.historyDetail}>
                <Text style={styles.historyText}>Paid on: {item.paidAt?.toDate().toLocaleDateString()}</Text>
                <Text style={styles.historyText}>Txn ID: {item.transactionId}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>PROCUREMENT SETTLEMENTS</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Pending' && styles.activeTab]} 
          onPress={() => setActiveTab('Pending')}
        >
          <Text style={[styles.tabText, activeTab === 'Pending' && styles.activeTabText]}>PENDING</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'History' && styles.activeTab]} 
          onPress={() => setActiveTab('History')}
        >
          <Text style={[styles.tabText, activeTab === 'History' && styles.activeTabText]}>HISTORY</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1D4ED8" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={purchaseOrders}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={renderPOItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} orders found.</Text>
            </View>
          }
        />
      )}

      <Modal visible={gatewayVisible} animationType="slide">
        <SafeAreaView style={styles.gatewayContainer}>
          <View style={styles.gatewayHeader}>
            <Text style={styles.gatewayTitle}>CIT CORPORATE BANKING</Text>
            <TouchableOpacity onPress={() => setGatewayVisible(false)}>
              <Ionicons name="close-circle" size={32} color="#1E293B" />
            </TouchableOpacity>
          </View>

          <View style={styles.paymentSummary}>
            <Text style={styles.sumHeader}>VOUCHER DETAILS</Text>
            <Text style={styles.sumVal}>{selectedPO?.vendorName}</Text>
            <Text style={styles.sumTotal}>₹{(selectedPO?.totalCost || selectedPO?.totalAmount || 0).toLocaleString()}</Text>
          </View>

          <Text style={styles.gatewayLabel}>SELECT GATEWAY</Text>
          <ScrollView style={styles.gatewayList}>
            <TouchableOpacity style={styles.bankOption} onPress={handlePaymentSuccess}>
              <Ionicons name="business" size={24} color="#0052CC" />
              <View style={{ marginLeft: 15 }}>
                <Text style={styles.bankName}>HDFC Bank - Institutional</Text>
                <Text style={styles.bankSub}>RTGS / NEFT Transfer</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bankOption} onPress={handlePaymentSuccess}>
              <Ionicons name="globe" size={24} color="#059669" />
              <View style={{ marginLeft: 15 }}>
                <Text style={styles.bankName}>ICICI Bank - Corporate</Text>
                <Text style={styles.bankSub}>Immediate IMPS Transfer</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.gatewayFooter}>
            <Ionicons name="lock-closed" size={14} color="#94A3B8" />
            <Text style={styles.lockText}>256-bit Secure Gateway</Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  backBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 10 },
  title: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginLeft: 15 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFF', padding: 10, borderBottomWidth: 1, borderColor: '#E2E8F0' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: '#F1F5F9' },
  tabText: { fontSize: 12, fontWeight: '800', color: '#94A3B8' },
  activeTabText: { color: '#1D4ED8' },
  poCard: { backgroundColor: '#FFF', borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2, overflow: 'hidden' },
  historyCardBorder: { borderColor: '#CBD5E1', backgroundColor: '#F9FAFB' },
  poMain: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  poInfo: { flex: 1 },
  vendorName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  poId: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  amount: { fontSize: 18, fontWeight: '900', color: '#059669', marginTop: 8 },
  statusBadgeContainer: { alignItems: 'flex-end', gap: 10 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  pendingBadge: { backgroundColor: '#FEF3C7' },
  paidBadge: { backgroundColor: '#F1F5F9' },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', color: '#1E293B' },
  expandedContent: { paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#FAFAFA' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  detailLabel: { fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 8 },
  itemRow: { fontSize: 13, color: '#475569', marginBottom: 4, fontWeight: '500' },
  payBtn: { backgroundColor: '#1D4ED8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, marginTop: 15 },
  payBtnText: { color: '#FFF', fontWeight: '900', fontSize: 13 },
  historyDetail: { marginTop: 15, gap: 5 },
  historyText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#94A3B8', marginTop: 15, fontWeight: '600' },
  gatewayContainer: { flex: 1, backgroundColor: '#FFF', padding: 25 },
  gatewayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  gatewayTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  paymentSummary: { backgroundColor: '#F8FAFC', padding: 25, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', marginBottom: 30 },
  sumHeader: { fontSize: 10, fontWeight: '900', color: '#94A3B8', marginBottom: 15 },
  sumVal: { fontSize: 18, color: '#1E293B', fontWeight: '800' },
  sumTotal: { fontSize: 32, fontWeight: '900', color: '#1D4ED8', marginTop: 15 },
  gatewayLabel: { fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 15, textAlign: 'center' },
  bankOption: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#FFF', marginBottom: 12 },
  bankName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  bankSub: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  gatewayFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', gap: 6 },
  lockText: { fontSize: 10, color: '#94A3B8', fontWeight: '700' }
});