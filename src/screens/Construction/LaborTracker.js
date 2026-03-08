import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// INSTITUTIONAL WAGE CONSTANTS
const DAILY_WAGE_SKILLED = 900;
const DAILY_WAGE_UNSKILLED = 550;

export default function LaborTracker({ navigation }) {
  const [laborList, setLaborList] = useState([
    { id: 1, name: 'Ramesh K.', type: 'Skilled', work: 'Masonry - Block A', status: 'Present' },
    { id: 2, name: 'Suresh M.', type: 'Skilled', work: 'Electrical - Wiring', status: 'Present' },
    { id: 3, name: 'Ankit P.', type: 'Unskilled', work: 'Material Handling', status: 'Present' },
    { id: 4, name: 'Manoj S.', type: 'Unskilled', work: 'Site Clearing', status: 'Present' },
  ]);

  // NEW: State for Add Labor Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Skilled');
  const [newWork, setNewWork] = useState('');

  const addNewLabor = () => {
    if (!newName || !newWork) {
      Alert.alert("Error", "Please fill in all labor details.");
      return;
    }
    const newEntry = {
      id: Date.now(),
      name: newName,
      type: newType,
      work: newWork,
      status: 'Present'
    };
    setLaborList([...laborList, newEntry]);
    setNewName('');
    setNewWork('');
    setModalVisible(false);
  };

  const setStatus = (id, newStatus) => {
    setLaborList(prev => prev.map(l => (l.id === id ? { ...l, status: newStatus } : l)));
  };

  const handleLogAttendance = async () => {
    const calculateCost = () => {
      return laborList.reduce((total, worker) => {
        const rate = worker.type === 'Skilled' ? DAILY_WAGE_SKILLED : DAILY_WAGE_UNSKILLED;
        if (worker.status === 'Present') return total + rate;
        if (worker.status === 'Half-Day') return total + (rate / 2);
        return total;
      }, 0);
    };

    const estimatedCost = calculateCost();

    try {
      await addDoc(collection(db, "construction_attendance"), {
        detailedLogs: laborList,
        summary: {
          present: laborList.filter(l => l.status === 'Present').length,
          halfDay: laborList.filter(l => l.status === 'Half-Day').length,
          leave: laborList.filter(l => l.status === 'Leave').length,
        },
        estimatedDailyWage: estimatedCost,
        timestamp: serverTimestamp(),
        manager: "H. Sujey"
      });
      
      Alert.alert("Success", `Log saved. Estimated Wage: ₹${estimatedCost}`);
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", "Failed to sync with the CIT database.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ATTENDANCE LOGGER</Text>
        
        {/* NEW: Add Labor Button */}
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Ionicons name="person-add-outline" size={24} color="#10B981" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {laborList.map((labor) => (
          <View key={labor.id} style={styles.card}>
            <View style={styles.infoSection}>
              <Text style={styles.name}>{labor.name}</Text>
              <Text style={styles.sub}>{labor.type} • {labor.work}</Text>
            </View>
            <View style={styles.statusRow}>
              {['Present', 'Half-Day', 'Leave'].map((s) => (
                <TouchableOpacity 
                  key={s}
                  onPress={() => setStatus(labor.id, s)}
                  style={[
                    styles.miniBtn, 
                    labor.status === s && (s === 'Present' ? styles.presentActive : s === 'Half-Day' ? styles.halfActive : styles.leaveActive)
                  ]}
                >
                  <Text style={[styles.btnText, labor.status === s && styles.activeText]}>{s[0]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* NEW: Add Labor Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Labor</Text>
            
            <TextInput style={styles.input} placeholder="Labor Name" value={newName} onChangeText={setNewName} />
            <TextInput style={styles.input} placeholder="Work Assignment" value={newWork} onChangeText={setNewWork} />
            
            <View style={styles.typeRow}>
              {['Skilled', 'Unskilled'].map(t => (
                <TouchableOpacity 
                  key={t} 
                  onPress={() => setNewType(t)}
                  style={[styles.typeBtn, newType === t && styles.activeTypeBtn]}
                >
                  <Text style={[styles.typeBtnText, newType === t && styles.activeText]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addNewLabor} style={styles.confirmBtn}>
                <Text style={styles.confirmText}>Add Labor</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleLogAttendance}>
          <Text style={styles.submitText}>SAVE DAILY LOG</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  addBtn: { padding: 5 },
  content: { padding: 20 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 },
  infoSection: { flex: 1 },
  name: { fontSize: 15, fontWeight: '800' },
  sub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  statusRow: { flexDirection: 'row', gap: 8 },
  miniBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  btnText: { fontSize: 12, fontWeight: '900', color: '#64748B' },
  activeText: { color: '#FFF' },
  presentActive: { backgroundColor: '#10B981' },
  halfActive: { backgroundColor: '#F59E0B' },
  leaveActive: { backgroundColor: '#EF4444' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 25 },
  modalTitle: { fontSize: 18, fontWeight: '900', marginBottom: 20 },
  input: { backgroundColor: '#F1F5F9', padding: 15, borderRadius: 12, marginBottom: 15 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center' },
  activeTypeBtn: { backgroundColor: '#1E293B' },
  typeBtnText: { fontWeight: '700', color: '#64748B' },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' },
  confirmBtn: { flex: 2, backgroundColor: '#10B981', padding: 15, borderRadius: 12, alignItems: 'center' },
  confirmText: { color: '#FFF', fontWeight: '900' },
  footer: { padding: 20, backgroundColor: '#FFF', borderTopWidth: 1 },
  submitBtn: { backgroundColor: '#1D4ED8', padding: 18, borderRadius: 15, alignItems: 'center' },
  submitText: { color: '#FFF', fontWeight: '900' }
});