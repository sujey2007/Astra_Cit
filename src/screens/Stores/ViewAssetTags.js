import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { db } from '../../api/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function ViewAssetTags({ navigation }) {
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const NETLIFY_URL = "https://citaudit.netlify.app/index.html";

  useEffect(() => {
    const q = query(collection(db, "verified_assets"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setAssets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const filteredAssets = assets.filter(a => 
    a.identifier?.toLowerCase().includes(search.toLowerCase()) || 
    a.roomName?.toLowerCase().includes(search.toLowerCase())
  );

  const handlePrint = () => {
    Alert.alert("Print Job Started", `Sending Asset Tag ${selectedAsset?.identifier} to CIT Network Printer.`);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.assetCard} 
      onPress={() => { setSelectedAsset(item); setModalVisible(true); }}
    >
      <View style={styles.cardInfo}>
        <Text style={styles.assetId}>{item.identifier}</Text>
        <Text style={styles.assetName}>{item.roomName || 'Direct Asset'}</Text>
        <Text style={styles.assetType}>{item.type} • {item.items?.length || 0} Items</Text>
      </View>
      <Ionicons name="qr-code-outline" size={24} color="#6366F1" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EXISTING ASSET TAGS</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94A3B8" />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search by ID or Room Name..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 50 }} />
      ) : (
        <FlatList 
          data={filteredAssets}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No filed assets found.</Text>}
        />
      )}

      {/* FIXED: CENTERED POP-UP MODAL */}
      <Modal 
        visible={modalVisible} 
        animationType="fade" 
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.popUpCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ASSET RECOVERY</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.qrSection}>
                    <Text style={styles.idText}>{selectedAsset?.identifier}</Text>
                    <Text style={styles.subText}>{selectedAsset?.roomName}</Text>
                    
                    <View style={styles.qrWrapper}>
                        <QRCode 
                            value={`${NETLIFY_URL}?id=${selectedAsset?.id}&type=${selectedAsset?.type}`}
                            size={180}
                        />
                    </View>
                    
                    {/* NEW: PRINT OPTION */}
                    <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
                        <Ionicons name="print" size={20} color="#FFF" />
                        <Text style={styles.printBtnText}>PRINT ASSET TAG</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                <View style={styles.inventorySection}>
                    <Text style={styles.sectionLabel}>FILED INVENTORY LIST</Text>
                    {selectedAsset?.items?.map((item, idx) => (
                        <View key={idx} style={styles.itemRow}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemQty}>{item.qty} Nos</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF', gap: 15, borderBottomWidth: 1, borderColor: '#E2E8F0' },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B', letterSpacing: 0.5 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 20, paddingHorizontal: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput: { flex: 1, paddingVertical: 12, marginLeft: 10, fontSize: 14, fontWeight: '600' },
  assetCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 18, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 },
  cardInfo: { flex: 1 },
  assetId: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  assetName: { fontSize: 13, color: '#64748B', fontWeight: '600', marginTop: 2 },
  assetType: { fontSize: 10, color: '#6366F1', fontWeight: '800', marginTop: 5, textTransform: 'uppercase' },
  
  // POP-UP STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  popUpCard: { backgroundColor: '#FFF', width: '100%', borderRadius: 28, padding: 25, maxHeight: '85%', elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderColor: '#F1F5F9', paddingBottom: 15 },
  modalTitle: { fontSize: 14, fontWeight: '900', color: '#1E293B', letterSpacing: 1 },
  qrSection: { alignItems: 'center' },
  idText: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  subText: { fontSize: 14, color: '#64748B', fontWeight: '600', marginBottom: 20 },
  qrWrapper: { padding: 15, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  printBtn: { flexDirection: 'row', backgroundColor: '#0F172A', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 12, alignItems: 'center', gap: 10 },
  printBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },
  inventorySection: { paddingBottom: 10 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', marginBottom: 15, letterSpacing: 0.5 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10 },
  itemName: { fontWeight: '700', color: '#334155', fontSize: 14 },
  itemQty: { fontWeight: '900', color: '#6366F1', fontSize: 14 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#94A3B8', fontWeight: '700' }
});