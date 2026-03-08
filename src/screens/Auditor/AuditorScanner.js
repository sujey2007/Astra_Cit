import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  ScrollView, // FIXED: Added missing import
  ActivityIndicator
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export default function AuditorScanner({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [resultType, setResultType] = useState(''); 
  const [modalVisible, setModalVisible] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    setFetching(true);
    try {
      // Expecting QR data like: {"type": "Room", "id": "Physics Lab"} 
      // or {"type": "Material", "id": "DOC_ID"}
      const parsedData = JSON.parse(data); 
      
      if (parsedData.type === 'Room') {
        const q = query(collection(db, "inventory"), where("location", "==", parsedData.id));
        const snap = await getDocs(q);
        const roomItems = snap.docs.map(d => d.data());
        setResultData(roomItems);
        setResultType('Room');
      } else if (parsedData.type === 'Material') {
        // Fetch purchase/vendor details from inward_history
        const docSnap = await getDoc(doc(db, "inward_history", parsedData.id));
        if (docSnap.exists()) {
          setResultData(docSnap.data());
          setResultType('Material');
        } else {
          throw new Error("Asset not found in database");
        }
      }
      setModalVisible(true);
    } catch (e) {
      Alert.alert("Scan Failed", "This QR code is invalid or the asset is not registered.");
      setScanned(false);
    } finally {
      setFetching(false);
    }
  };

  if (hasPermission === null) return <View style={styles.center}><Text>Requesting camera permission...</Text></View>;
  if (hasPermission === false) return <View style={styles.center}><Text>No access to camera</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.overlay}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={30} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.scanTarget} />
        <Text style={styles.scanText}>Align Room or Material QR Code</Text>
        {fetching && <ActivityIndicator color="#FFF" style={{marginTop: 20}} />}
      </View>

      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AUDIT VERIFICATION</Text>
            <TouchableOpacity onPress={() => {setModalVisible(false); setScanned(false);}}>
              <Ionicons name="close-circle" size={30} color="#1E293B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 20 }}>
            {resultType === 'Material' ? (
              <View style={styles.resultCard}>
                <Text style={styles.label}>ITEM NAME</Text>
                <Text style={styles.val}>{resultData?.itemName}</Text>
                
                <Text style={styles.label}>VENDOR DETAILS</Text>
                <Text style={styles.val}>{resultData?.vendorName || 'N/A'}</Text>
                
                <Text style={styles.label}>DELIVERY DATE</Text>
                <Text style={styles.val}>
                  {resultData?.timestamp?.toDate().toLocaleDateString() || 'N/A'}
                </Text>
                
                <Text style={styles.label}>PURCHASE COST</Text>
                <Text style={styles.costText}>
                  ₹{parseFloat(resultData?.totalCost || 0).toLocaleString()}
                </Text>
              </View>
            ) : (
              <View>
                <Text style={styles.label}>ROOM INVENTORY LIST</Text>
                {resultData && resultData.length > 0 ? resultData.map((item, idx) => (
                  <View key={idx} style={styles.roomItem}>
                    <Text style={styles.itemTitle}>{item.itemName}</Text>
                    <Text style={styles.itemQty}>{item.quantity} {item.unit}</Text>
                  </View>
                )) : <Text style={styles.emptyText}>No materials found in this location.</Text>}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanTarget: { width: 250, height: 250, borderWidth: 2, borderColor: '#6366F1', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  scanText: { color: '#FFF', marginTop: 20, fontWeight: '700', fontSize: 16 },
  closeBtn: { position: 'absolute', top: 50, zIndex: 10, left: 20 },
  modalContent: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF' },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  resultCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, elevation: 3, borderWidth: 1, borderColor: '#E2E8F0' },
  label: { fontSize: 10, color: '#94A3B8', fontWeight: '800', marginTop: 15, textTransform: 'uppercase' },
  val: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 4 },
  costText: { fontSize: 24, fontWeight: '900', color: '#10B981', marginTop: 5 },
  roomItem: { padding: 15, backgroundColor: '#FFF', borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  itemTitle: { fontWeight: '800', color: '#1E293B' },
  itemQty: { color: '#6366F1', fontWeight: '700' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#94A3B8', fontWeight: '700' }
});