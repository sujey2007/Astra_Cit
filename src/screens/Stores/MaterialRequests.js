import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { secureAddDoc } from '../../api/blockchainUtils'; // BLOCKCHAIN INTEGRATION

export default function MaterialRequests({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'requisitions'), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sorting by most recent
      fetched.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      
      setRequests(fetched);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (item, newStatus, alertMsg) => {
    try {
      // 1. Update Firestore status
      // We use "PR Raised" to ensure it shows up in the Procurement/Purchase hub screens
      const finalStatus = newStatus === 'Forwarded to Purchase' ? 'PR Raised' : newStatus;
      
      await updateDoc(doc(db, 'requisitions', item.id), { 
        status: finalStatus, 
        updatedAt: serverTimestamp() 
      });

      // 2. BLOCKCHAIN VERIFICATION LOG
      // Logs the stores officer's action to the immutable ledger
      await secureAddDoc("institutional_ledger", {
        amount: 0, // No financial movement yet
        category: "Material Requisition",
        description: `STORES ACTION: ${finalStatus} for ${item.itemName} (Qty: ${item.quantity})`,
        timestamp: new Date().toISOString(),
        type: "Log",
        referencePO: item.id,
        performer: "Stores Officer"
      });

      Alert.alert("Blockchain Signed", alertMsg);
    } catch (error) { 
      Alert.alert("Error", "Action could not be verified on Blockchain."); 
    }
  };

  const renderItem = ({ item }) => {
    const isPending = item.status === "Pending";
    
    // Status UI Mapping
    const statusTheme = item.status === "Dispensed" ? { bg: '#DCFCE7', text: '#15803D' } : 
                        item.status === "PR Raised" || item.status === "Forwarded to Purchase" ? { bg: '#FFEDD5', text: '#C2410C' } : 
                        { bg: '#DBEAFE', text: '#1D4ED8' };

    return (
      <View style={styles.reqCard}>
        <View style={styles.reqHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{item.itemName || "Unnamed Asset"}</Text>
            <Text style={styles.reqSub}>{item.department || 'General'} • {item.requestedBy || 'Anonymous'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusTheme.bg }]}>
            <Text style={[styles.statusText, { color: statusTheme.text }]}>{item.status}</Text>
          </View>
        </View>
        
        <Text style={styles.qtyText}>Request Quantity: <Text style={{fontWeight:'700'}}>{item.quantity}</Text></Text>

        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.btnGreen]} 
              onPress={() => handleStatusUpdate(item, 'Dispensed', 'Material dispensed and ledger updated.')}
            >
              <Ionicons name="checkmark-circle" size={16} color="#FFF" style={{marginRight: 5}} />
              <Text style={styles.btnLabel}>DISPENSE</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, styles.btnAmber]} 
              onPress={() => handleStatusUpdate(item, 'Forwarded to Purchase', 'Sent to Procurement Department.')}
            >
              <Ionicons name="arrow-forward-circle" size={16} color="#FFF" style={{marginRight: 5}} />
              <Text style={styles.btnLabel}>RAISE PR</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.digitalSeal && (
            <View style={styles.blockchainFooter}>
                <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                <Text style={styles.hashText}>VERIFIED BY CODE-TITANS LEDGER</Text>
            </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MATERIAL REQUESTS</Text>
        <View style={{ width: 40 }} />
      </View>
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{marginTop: 50}} />
      ) : (
        <FlatList 
          data={requests} 
          keyExtractor={item => item.id} 
          renderItem={renderItem} 
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={60} color="#CBD5E1" />
                <Text style={styles.emptyText}>No material requests found.</Text>
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
    paddingHorizontal: 20,
    paddingBottom: 20, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderColor: '#E2E8F0',
    paddingTop: 50
  },
  backBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 10 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  reqCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  itemName: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  reqSub: { color: '#64748B', fontSize: 13, marginTop: 2, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  qtyText: { fontSize: 14, color: '#475569', marginBottom: 20, fontWeight: '500' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 0.48, paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  btnGreen: { backgroundColor: '#059669' },
  btnAmber: { backgroundColor: '#EA580C' },
  btnLabel: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  blockchainFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderColor: '#F1F5F9', gap: 5 },
  hashText: { fontSize: 9, color: '#10B981', fontWeight: '800', letterSpacing: 0.5 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#94A3B8', marginTop: 15, fontWeight: '600' }
});