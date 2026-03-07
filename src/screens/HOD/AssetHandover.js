import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, onSnapshot, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// CIT SPECIFIC LOCATIONS
const CIT_LOCATIONS = {
  COE: [
    "KUKA Industrial Robotics COE",
    "BMW Next-Gen Mobility COE",
    "Samsung AR/VR COE",
    "NVIDIA AI & Deep Learning COE",
    "Virtusa Full Stack COE",
    "Accurate Metrology COE",
    "Cisco Networking Academy",
    "TESSOLV Semiconductors COE",
    "AR&VR COE",
    "MOBILE APP DEVELOPMENT COE",
    "FINTECH COE",
    "PEGA COE",
    "CLOUD COMPUTING COE"
  ],
  LABS: [
    "Cloud Computing Lab",
    "Data Structures Lab",
    "Embedded Systems Lab",
    "Operating Systems Lab",
    "Communication Systems Lab",
    "Manufacturing Process Lab",
    "Structural Engineering Lab",
    "Fluid Mechanics Lab"
  ],
  CLASSROOMS: [
    "CSE Block - L101 to L105",
    "IT Block - L201 to L205",
    "Mechanical Block - M101 to M110",
    "EEE/ECE Block - E301 to E310",
    "AI&DS Smart Classroom S1",
    "Biomedical Lab B1",
    "Civil Seminar Hall",
    "First Year S&H Block - A101"
  ]
};

export default function AssetHandover({ navigation }) {
  const [availableAssets, setAvailableAssets] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [assignedTo, setAssignedTo] = useState("");
  const [activeCategory, setActiveCategory] = useState('COE'); // 'COE' | 'LABS' | 'CLASSROOMS'
  const [isLoading, setIsLoading] = useState(true);

  const currentUser = "Dr. Sujey (HOD)";

  useEffect(() => {
    const q = query(
      collection(db, 'requisitions'),
      where("requestedBy", "==", currentUser),
      where("status", "in", ["Dispensed", "Received by Stores"])
    );
    return onSnapshot(q, (snapshot) => {
      setAvailableAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    });
  }, []);

  const handleHandover = async () => {
    if (!assignedTo) return Alert.alert("Required", "Please select a specific location for allocation.");
    try {
      await updateDoc(doc(db, 'requisitions', selectedItem.id), {
        status: "Allocated",
        assignedTo: assignedTo,
        allocatedAt: serverTimestamp()
      });
      Alert.alert("Success", "Asset officially allocated to " + assignedTo);
      setSelectedItem(null);
      setAssignedTo("");
    } catch (e) { Alert.alert("Error", "Handover failed."); }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ASSET HANDOVER</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.label}>1. SELECT RECEIVED ASSET</Text>
          <View style={styles.listContainer}>
            {availableAssets.length > 0 ? (
              availableAssets.map((item) => (
                <TouchableOpacity 
                  key={item.id}
                  style={[styles.itemCard, selectedItem?.id === item.id && styles.activeItem]}
                  onPress={() => setSelectedItem(item)}
                >
                  <Ionicons name="cube" size={20} color={selectedItem?.id === item.id ? "#FFF" : "#2563EB"} />
                  <View style={{marginLeft: 12, flex: 1}}>
                    <Text style={[styles.itemName, selectedItem?.id === item.id && { color: '#FFF' }]}>{item.itemName}</Text>
                    <Text style={[styles.itemSub, selectedItem?.id === item.id && { color: '#DBEAFE' }]}>Qty: {item.quantity}</Text>
                  </View>
                  {selectedItem?.id === item.id && <Ionicons name="checkmark-circle" size={22} color="#FFF" />}
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No assets pending handover.</Text>
            )}
          </View>

          {selectedItem && (
            <View style={styles.formCard}>
              <Text style={styles.label}>2. ALLOCATE TO FACILITY</Text>
              
              {/* CATEGORY TABS FOR EASY SELECTION */}
              <View style={styles.tabBar}>
                {['COE', 'LABS', 'CLASSROOMS'].map((cat) => (
                  <TouchableOpacity 
                    key={cat} 
                    onPress={() => setActiveCategory(cat)}
                    style={[styles.tab, activeCategory === cat && styles.activeTab]}
                  >
                    <Text style={[styles.tabText, activeCategory === cat && styles.activeTabText]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* LOCATION GRID SELECTION */}
              <View style={styles.locationGrid}>
                {CIT_LOCATIONS[activeCategory].map((loc) => (
                  <TouchableOpacity 
                    key={loc} 
                    style={[styles.locChip, assignedTo === loc && styles.activeLocChip]}
                    onPress={() => setAssignedTo(loc)}
                  >
                    <Text style={[styles.locChipText, assignedTo === loc && styles.activeLocChipText]}>{loc}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleHandover}>
                <Text style={styles.submitText}>COMPLETE ALLOCATION</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#E2E8F0', elevation: 2 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  label: { fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' },
  listContainer: { marginBottom: 20 },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0', elevation: 1 },
  activeItem: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  itemName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  itemSub: { fontSize: 12, color: '#64748B' },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 10, fontStyle: 'italic' },
  
  formCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  
  tabBar: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, marginBottom: 15 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#FFF', elevation: 2 },
  tabText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  activeTabText: { color: '#2563EB' },

  locationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  locChip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  activeLocChip: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  locChipText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  activeLocChipText: { color: '#2563EB', fontWeight: '700' },

  submitBtn: { backgroundColor: '#2563EB', padding: 18, borderRadius: 14, alignItems: 'center', shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  submitText: { color: 'white', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 }
});