import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SafeAreaView, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  updateDoc, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';

export default function DisposalManagement({ navigation }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for new damage reports from HODs like Dr. Sujey
    const q = query(collection(db, 'disposal_requests'), where("status", "==", "Reported"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleProcessDisposal = async (report) => {
    const { id, assetName, quantity } = report;
    
    Alert.alert(
      "Confirm Action",
      `How do you want to handle the ${assetName}?`,
      [
        {
          text: "Approve Scrap",
          style: "destructive",
          onPress: () => finalizeAction(report, "Scrapped", true)
        },
        {
          text: "Send for Repair",
          onPress: () => finalizeAction(report, "Sent for Repair", false)
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const finalizeAction = async (report, newStatus, shouldDeductStock) => {
    try {
      // 1. Update the Disposal Request status
      await updateDoc(doc(db, 'disposal_requests', report.id), {
        status: newStatus,
        processedAt: serverTimestamp(),
        processedBy: "Stores Officer"
      });

      // 2. If Scrapped, deduct from Live Inventory
      if (shouldDeductStock) {
        const invQuery = query(collection(db, 'inventory'), where("itemName", "==", report.assetName));
        const invSnap = await getDocs(invQuery);
        
        if (!invSnap.empty) {
          const invDoc = invSnap.docs[0];
          const currentStock = invDoc.data().stockCount || 0;
          const reportQty = report.quantity || 1; // Default to 1 if not specified

          await updateDoc(doc(db, 'inventory', invDoc.id), {
            stockCount: Math.max(0, currentStock - reportQty),
            lastUpdated: serverTimestamp()
          });
        }
      }

      Alert.alert("Success", `Asset officially marked as ${newStatus}. Inventory updated.`);
    } catch (e) {
      Alert.alert("Error", "Action failed. Check database connection.");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.reportCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.assetName}>{item.assetName}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.reportSub}>Reported by: {item.reportedBy}</Text>
      
      <View style={styles.issueBox}>
        <Text style={styles.issueText}>"{item.issue}"</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#EF4444' }]} 
          onPress={() => handleProcessDisposal(item)}
        >
          <Text style={styles.btnText}>APPROVE SCRAP</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#475569' }]} 
          onPress={() => finalizeAction(item, "Sent for Repair", false)}
        >
          <Text style={styles.btnText}>REPAIR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DISPOSAL MANAGEMENT</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#EF4444" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="checkmark-done-circle-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>All damage reports have been processed.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderColor: '#E2E8F0',
    elevation: 2 
  },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', letterSpacing: 0.5 },
  reportCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: '#FEE2E2', elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  assetName: { fontSize: 17, fontWeight: '800', color: '#1E293B', textTransform: 'uppercase' },
  statusBadge: { backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, color: '#EF4444', fontWeight: '900' },
  reportSub: { fontSize: 12, color: '#64748B', fontWeight: '600', marginBottom: 15 },
  issueBox: { backgroundColor: '#F8FAFC', padding: 15, borderRadius: 12, borderLeftWidth: 5, borderLeftColor: '#EF4444', marginBottom: 20 },
  issueText: { fontSize: 14, color: '#475569', fontStyle: 'italic', lineHeight: 20 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 0.48, paddingVertical: 14, borderRadius: 12, alignItems: 'center', elevation: 2 },
  btnText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  emptyBox: { alignItems: 'center', marginTop: 100 },
  emptyText: { textAlign: 'center', marginTop: 15, color: '#94A3B8', fontSize: 14, paddingHorizontal: 40 }
});