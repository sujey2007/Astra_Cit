import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SafeAreaView, 
  ActivityIndicator, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';

// CIT SPECIFIC MOCK DATA
const CIT_MOCK_INVENTORY = [
  // COE Assets
  { id: 'm1', itemName: 'KUKA KR-6 Robotic Arm', category: 'COE - ROBOTICS', stockCount: 2, isSecure: false },
  { id: 'm2', itemName: 'NVIDIA RTX A6000 GPU', category: 'COE - AI & DEEP LEARNING', stockCount: 8, isSecure: false },
  { id: 'm3', itemName: 'Tesla Model 3 Drivetrain Kit', category: 'COE - NEXT GEN MOBILITY', stockCount: 1, isSecure: false },
  
  // Auditoriums
  { id: 'm4', itemName: 'Line Array Speaker System', category: 'PARTHASARTHY AUDITORIUM', stockCount: 4, isSecure: false },
  { id: 'm5', itemName: 'Wireless UHF Microphones', category: 'KAVERI AUDITORIUM', stockCount: 12, isSecure: false },
  { id: 'm6', itemName: '4K Laser Projector', category: 'AUDITORIUM FACILITIES', stockCount: 2, isSecure: false },
  
  // Classrooms & Labs
  { id: 'm7', itemName: 'Dell OptiPlex Desktop', category: 'COMPUTER LABS', stockCount: 120, isSecure: false },
  { id: 'm8', itemName: 'Cisco 2900 Series Router', category: 'CLASSROOM - NETWORKING', stockCount: 15, isSecure: false },

  // Transport
  { id: 'm9', itemName: 'Buses', category: 'TRANSPORT DEPARTMENT', stockCount: 100, isSecure: false },
  
  // Mess
  { id: 'm12', itemName: 'Basmati Rice (25kg Bags)', category: 'HOSTEL & MESS ADMINISTRATION', stockCount: 45, isSecure: false },
  { id: 'm13', itemName: 'Refined Sunflower Oil (15L)', category: 'HOSTEL & MESS ADMINISTRATION', stockCount: 20, isSecure: false },
  { id: 'm14', itemName: 'Mixed Seasonal Vegetables', category: 'HOSTEL & MESS ADMINISTRATION', stockCount: 150, isSecure: false },
  { id: 'm15', itemName: 'Aavin Milk Packs (500ml)', category: 'HOSTEL & MESS ADMINISTRATION', stockCount: 200, isSecure: false },

  // Stores
  { id: 'm10', itemName: 'A4 Copier Paper Bundles', category: 'MAIN STORE ROOM', stockCount: 450, isSecure: false },
  { id: 'm11', itemName: 'Standard Ceiling Fans', category: 'MAIN STORE ROOM', stockCount: 25, isSecure: false }
];

export default function LiveInventory({ navigation }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      const firestoreData = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // DEEP FIELD DISCOVERY: Checks all possible name keys used in blockchainUtils or standard addDoc
        const discoveredName = data.itemName || data.productName || data.item || data.description?.split(":")[1]?.trim() || "Unnamed Asset";
        const discoveredCategory = data.category || data.targetDepartment || data.dept || "General";
        const discoveredCount = data.stockCount || data.quantity || 0;

        return { 
          id: doc.id, 
          itemName: discoveredName, 
          category: discoveredCategory,
          stockCount: discoveredCount,
          digitalSeal: data.digitalSeal || null, 
          ...data 
        };
      });
      
      // Merge Mock Data with Live Firestore Data
      setInventory([...CIT_MOCK_INVENTORY, ...firestoreData]);
      setLoading(false);
    }, (error) => {
      console.error("Inventory Sync Error:", error);
      setInventory(CIT_MOCK_INVENTORY);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }) => {
    // Dynamic icon based on category
    let iconName = "cube-outline";
    const categoryUpper = item.category?.toUpperCase() || "";
    if (categoryUpper.includes("AUDITORIUM")) iconName = "mic-outline";
    if (categoryUpper.includes("COE")) iconName = "hardware-chip-outline";
    if (categoryUpper.includes("STORE")) iconName = "archive-outline";
    if (categoryUpper.includes("MESS") || categoryUpper.includes("HOSTEL")) iconName = "restaurant-outline";

    return (
      <View style={styles.stockCard}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={22} color="#2563EB" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.stockName} numberOfLines={1}>{item.itemName}</Text>
            {/* EVIDENCE OF BLOCKCHAIN: Small shield for sealed items */}
            {item.digitalSeal && (
               <Ionicons name="shield-checkmark" size={14} color="#10B981" style={{ marginLeft: 6 }} />
            )}
          </View>
          <View style={styles.categoryBadge}>
             <Text style={styles.stockSub} numberOfLines={1}>{item.category}</Text>
          </View>
        </View>
        <View style={styles.qtyContainer}>
          <Text style={styles.qtyValue}>{item.stockCount}</Text>
          <Text style={styles.qtyLabel}>Units</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>LIVE INVENTORY</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 50 }} />
      ) : (
        <FlatList 
          data={inventory} 
          keyExtractor={item => item.id} 
          renderItem={renderItem} 
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
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
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', letterSpacing: 0.5 },
  stockCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    elevation: 2 
  },
  iconContainer: { 
    width: 42, 
    height: 42, 
    backgroundColor: '#EFF6FF', 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15 
  },
  stockName: { fontSize: 15, fontWeight: '700', color: '#1E293B', flexShrink: 1 },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 5
  },
  stockSub: { fontSize: 10, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' },
  qtyContainer: { alignItems: 'center', minWidth: 60, marginLeft: 10 },
  qtyValue: { fontSize: 18, fontWeight: '900', color: '#2563EB' },
  qtyLabel: { fontSize: 9, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }
});