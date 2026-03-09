import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  ScrollView, 
  ActivityIndicator
} from 'react-native';
// UPDATED: Using CameraView instead of BarCodeScanner
import { CameraView, useCameraPermissions } from 'expo-camera'; 
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export default function AuditorScanner({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [resultType, setResultType] = useState(''); 
  const [modalVisible, setModalVisible] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    (async () => {
      if (!permission || !permission.granted) {
        await requestPermission();
      }
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return; // Prevent double triggers
    setScanned(true);
    setFetching(true);
    try {
      const parsedData = JSON.parse(data); 
      
      if (parsedData.type === 'Room') {
        const q = query(collection(db, "inventory"), where("location", "==", parsedData.id));
        const snap = await getDocs(q);
        const roomItems = snap.docs.map(d => d.data());
        setResultData(roomItems);
        setResultType('Room');
      } else if (parsedData.type === 'Material') {
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

  if (!permission) return <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{marginBottom: 20}}>Camera access is required to scan assets.</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={{color: '#FFF', fontWeight: 'bold'}}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* UPDATED: CameraView replaces BarCodeScanner */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"], // Optimizes performance for QR only
        }}
      />
      
      <View style={styles.overlay}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={30} color="#FFF" />
        </TouchableOpacity>
        
        {/* Animated UI Target */}
        <View style={styles.scanTarget}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  scanTarget: { width: 250, height: 250, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#6366F1', borderWidth: 4 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 20 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 20 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 20 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 20 },
  scanText: { color: '#FFF', marginTop: 30, fontWeight: '700', fontSize: 16, textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 10 },
  closeBtn: { position: 'absolute', top: 50, zIndex: 10, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 5 },
  permissionBtn: { backgroundColor: '#6366F1', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 10 },
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