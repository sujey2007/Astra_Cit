import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SafeAreaView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image, 
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

export default function ReceiptHistory({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);

  useEffect(() => {
    // UPDATED: Pointing to your actual collection name from the screenshot
    const inventoryRef = collection(db, 'inventory');

    const unsubscribe = onSnapshot(inventoryRef, (snapshot) => {
      if (snapshot.empty) {
        console.log("No documents found in 'inventory' collection.");
        setHistory([]);
      } else {
        const rawData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // MANUAL SORT using 'createdAt' from your database screenshot
        const sortedData = rawData.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setHistory(sortedData);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore Sync Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <View style={styles.itemInfo}>
          {/* Mapping to 'itemName' and 'lastInvoice' from your DB */}
          <Text style={styles.itemName}>{item.itemName || 'Unnamed Item'}</Text>
          <Text style={styles.invoiceNum}>Inv: {item.lastInvoice || 'No Invoice'}</Text>
        </View>
        <View style={styles.qtyBadge}>
          {/* Mapping to 'stockCount' from your DB */}
          <Text style={styles.qtyText}>+{item.stockCount || 0}</Text>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Ionicons name="business" size={14} color="#64748B" />
          {/* Mapping to 'targetDepartment' from your DB */}
          <Text style={styles.detailText}>{item.targetDepartment || 'General'}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="location" size={14} color="#64748B" />
          {/* Mapping to 'targetLocation' from your DB */}
          <Text style={styles.detailText}>{item.targetLocation || 'Store'}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.timestamp}>
          {/* Mapping to 'createdAt' Timestamp from your DB */}
          {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : 'No Timestamp'}
        </Text>
        
        {/* Mapping to 'billImage' from your DB */}
        {item.billImage && (
          <TouchableOpacity 
            style={styles.viewBillBtn} 
            onPress={() => setSelectedBill(item.billImage)}
          >
            <Ionicons name="image-outline" size={16} color="#2563EB" />
            <Text style={styles.viewBillText}>BILL VIEW</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>RECEIPT LOGS</Text>
          <Text style={styles.headerSubtitle}>CIT Central Database</Text>
        </View>
        <Image 
          source={{ uri: 'https://images.shiksha.com/mediadata/images/1583389585phpP9W1tB_m.jpg' }} 
          style={styles.logo} 
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Connecting to CIT Cloud...</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cloud-offline-outline" size={80} color="#CBD5E1" />
              <Text style={styles.emptyText}>No records found in 'inventory'.</Text>
              <Text style={styles.debugHint}>Syncing with: {db._databaseId.projectId}</Text>
            </View>
          }
        />
      )}

      <Modal visible={!!selectedBill} transparent animationType="slide">
        <View style={styles.modal}>
          <TouchableOpacity style={styles.close} onPress={() => setSelectedBill(null)}>
            <Ionicons name="close-circle" size={40} color="white" />
          </TouchableOpacity>
          <Image source={{ uri: selectedBill }} style={styles.fullImage} resizeMode="contain" />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  headerSubtitle: { fontSize: 10, color: '#64748B', fontWeight: 'bold' },
  logo: { width: 35, height: 35, marginLeft: 'auto' },
  list: { padding: 15 },
  historyCard: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  invoiceNum: { fontSize: 11, color: '#64748B' },
  qtyBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  qtyText: { color: '#15803D', fontWeight: 'bold' },
  detailsGrid: { flexDirection: 'row', gap: 15, marginBottom: 10 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailText: { fontSize: 11, color: '#64748B' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  timestamp: { fontSize: 10, color: '#94A3B8' },
  viewBillBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EFF6FF', padding: 8, borderRadius: 8 },
  viewBillText: { fontSize: 10, color: '#2563EB', fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748B' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 20, fontSize: 15, fontWeight: 'bold', color: '#64748B' },
  debugHint: { marginTop: 5, fontSize: 12, color: '#94A3B8' },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center' },
  close: { position: 'absolute', top: 50, right: 30, zIndex: 10 },
  fullImage: { width: '100%', height: '80%' }
});