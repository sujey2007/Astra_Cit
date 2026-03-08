import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Modal, 
  TextInput, 
  Alert,
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  increment 
} from 'firebase/firestore';

export default function ConsumptionLog({ navigation }) {
  const [logs, setLogs] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form State for Manual Entry
  const [selectedItem, setSelectedItem] = useState(null);
  const [manualMaterialName, setManualMaterialName] = useState(''); // NEW: Manual type option
  const [usageQty, setUsageQty] = useState('');
  const [workDesc, setWorkDesc] = useState('');

  // MOCK DATA FOR CONSUMPTION HISTORY
  const mockLogs = [
    {
      id: 'mock1',
      timestamp: { toDate: () => new Date('2026-03-08T10:00:00') },
      description: '2nd Floor Slab Concrete Casting',
      materialConsumed: '85 Bags Cement (OPC)',
      type: 'Progress'
    },
    {
      id: 'mock2',
      timestamp: { toDate: () => new Date('2026-03-07T14:30:00') },
      description: 'Block B Brickwork (Internal Walls)',
      materialConsumed: '1200 Red Bricks',
      type: 'Progress'
    }
  ];

  useEffect(() => {
    // 1. Fetch Inventory for selection
    const qInv = query(collection(db, "inventory"), where("category", "==", "Construction"));
    const unsubInv = onSnapshot(qInv, (snap) => {
      setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 2. Fetch Logs with CLIENT-SIDE SORTING to bypass Indexing Error
    const qLogs = query(collection(db, "construction_logs"), where("type", "==", "Progress"));
    
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const firestoreData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Combine with Mock Data and Sort Locally
      const combinedAndSorted = [...firestoreData, ...mockLogs].sort((a, b) => {
        const timeA = a.timestamp?.seconds || a.timestamp?.toDate()?.getTime() || 0;
        const timeB = b.timestamp?.seconds || b.timestamp?.toDate()?.getTime() || 0;
        return timeB - timeA; // Descending order
      });

      setLogs(combinedAndSorted);
      setLoading(false);
    });

    return () => { unsubInv(); unsubLogs(); };
  }, []);

  const handleLogUsage = async () => {
    // Check if either a material is selected OR manually typed
    const finalMaterialName = selectedItem ? selectedItem.itemName : manualMaterialName;
    
    if (!finalMaterialName || !usageQty || !workDesc) {
      Alert.alert("Error", "Please provide material name, quantity, and description");
      return;
    }

    try {
      // 1. Log entry to construction_logs
      await addDoc(collection(db, "construction_logs"), {
        type: "Progress",
        description: workDesc,
        materialConsumed: `${usageQty} ${selectedItem?.unit || 'Units'} ${finalMaterialName}`,
        timestamp: serverTimestamp(),
      });

      // 2. Update site inventory stock ONLY if an item was selected from the list
      if (selectedItem) {
        const itemRef = doc(db, "inventory", selectedItem.id);
        await updateDoc(itemRef, {
          quantity: increment(-parseInt(usageQty)),
          lastStockUpdate: new Date().toLocaleDateString()
        });
      }

      Alert.alert("Success", "Consumption logged successfully.");
      setModalVisible(false);
      setSelectedItem(null); setManualMaterialName(''); setUsageQty(''); setWorkDesc('');
    } catch (e) {
      Alert.alert("Error", "Failed to log usage.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>CONSUMPTION HUB</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle" size={30} color="#15803D" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{marginTop: 50}} color="#15803D" size="large" />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.logCard}>
              <View style={styles.logHeader}>
                <Text style={styles.date}>
                  {item.timestamp?.toDate().toLocaleDateString('en-GB', { 
                    day: '2-digit', month: 'short', year: 'numeric' 
                  })}
                </Text>
                <View style={styles.tag}><Text style={styles.tagText}>CONSUMED</Text></View>
              </View>
              <Text style={styles.desc}>{item.description}</Text>
              <View style={styles.materialRow}>
                <Ionicons name="cube" size={14} color="#15803D" />
                <Text style={styles.materialText}>Used: {item.materialConsumed}</Text>
              </View>
            </View>
          )}
          ListHeaderComponent={<Text style={styles.listLabel}>USAGE HISTORY</Text>}
        />
      )}

      {/* MANUAL ENTRY MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Material Usage</Text>
            
            <Text style={styles.label}>Select from Inventory OR Type below</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
              <TouchableOpacity 
                style={[styles.pickerItem, !selectedItem && styles.selectedPicker]}
                onPress={() => setSelectedItem(null)}
              >
                <Text style={[styles.pickerText, !selectedItem && styles.selectedPickerText]}>Manual Entry</Text>
              </TouchableOpacity>
              {inventory.map(item => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.pickerItem, selectedItem?.id === item.id && styles.selectedPicker]}
                  onPress={() => setSelectedItem(item)}
                >
                  <Text style={[styles.pickerText, selectedItem?.id === item.id && styles.selectedPickerText]}>
                    {item.itemName} ({item.quantity})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {!selectedItem && (
              <TextInput 
                style={styles.input} 
                placeholder="Material Name (e.g. Teak Wood)" 
                value={manualMaterialName}
                onChangeText={setManualMaterialName}
              />
            )}

            <TextInput 
              style={styles.input} 
              placeholder="Quantity Consumed" 
              keyboardType="numeric"
              value={usageQty}
              onChangeText={setUsageQty}
            />
            <TextInput 
              style={[styles.input, { height: 80 }]} 
              placeholder="Work Description (e.g. Wall Plastering)" 
              multiline
              value={workDesc}
              onChangeText={setWorkDesc}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogUsage} style={styles.confirmBtn}>
                <Text style={styles.confirmText}>Update Stock</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  backBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 10 },
  title: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  listLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', marginBottom: 15, letterSpacing: 1 },
  logCard: { backgroundColor: '#FFF', padding: 18, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  date: { fontSize: 13, fontWeight: '800', color: '#64748B' },
  tag: { backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 10, fontWeight: '900', color: '#15803D' },
  desc: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  materialRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  materialText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 10 },
  pickerScroll: { marginBottom: 20 },
  pickerItem: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F1F5F9', marginRight: 10 },
  selectedPicker: { backgroundColor: '#15803D' },
  pickerText: { fontWeight: '700', color: '#64748B' },
  selectedPickerText: { color: '#FFF' },
  input: { backgroundColor: '#F8FAFC', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 15 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cancelBtn: { flex: 1, padding: 18, alignItems: 'center' },
  confirmBtn: { flex: 2, backgroundColor: '#15803D', padding: 18, borderRadius: 15, alignItems: 'center' },
  cancelText: { fontWeight: '800', color: '#64748B' },
  confirmText: { fontWeight: '900', color: '#FFF' }
});