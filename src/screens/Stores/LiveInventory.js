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
  { id: 'm1', itemName: 'KUKA KR-6 Robotic Arm', category: 'COE - Robotics', stockCount: 2 },
  { id: 'm2', itemName: 'NVIDIA RTX A6000 GPU', category: 'COE - AI & Deep Learning', stockCount: 8 },
  { id: 'm3', itemName: 'Tesla Model 3 Drivetrain Kit', category: 'COE - Next Gen Mobility', stockCount: 1 },
  
  // Auditoriums (Parthasarthy & Kaveri)
  { id: 'm4', itemName: 'Line Array Speaker System', category: 'Parthasarthy Auditorium', stockCount: 4 },
  { id: 'm5', itemName: 'Wireless UHF Microphones', category: 'Kaveri Auditorium', stockCount: 12 },
  { id: 'm6', itemName: '4K Laser Projector', category: 'Auditorium Facilities', stockCount: 2 },
  
  // Classrooms & Labs
  { id: 'm7', itemName: 'Dell OptiPlex Desktop', category: 'Computer Labs', stockCount: 120 },
  { id: 'm8', itemName: 'Cisco 2900 Series Router', category: 'Classroom - Networking', stockCount: 15 },

  // Transport & Misc
  { id: 'm9', itemName: 'Buses', category: 'Transport Department', stockCount: 100 },
  
  // HOSTEL & MESS ADMINISTRATION (NEW MOCK DATA)
  { id: 'm12', itemName: 'Basmati Rice (25kg Bags)', category: 'Hostel & Mess Administration', stockCount: 45 },
  { id: 'm13', itemName: 'Refined Sunflower Oil (15L)', category: 'Hostel & Mess Administration', stockCount: 20 },
  { id: 'm14', itemName: 'Mixed Seasonal Vegetables', category: 'Hostel & Mess Administration', stockCount: 150 },
  { id: 'm15', itemName: 'Aavin Milk Packs (500ml)', category: 'Hostel & Mess Administration', stockCount: 200 },

  // Main Store Room
  { id: 'm10', itemName: 'A4 Copier Paper Bundles', category: 'Main Store Room', stockCount: 450 },
  { id: 'm11', itemName: 'Standard Ceiling Fans', category: 'Main Store Room', stockCount: 25 }
];

export default function LiveInventory({ navigation }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      const firestoreData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      // Merge Mock Data with Live Firestore Data for a "Full" look
      setInventory([...CIT_MOCK_INVENTORY, ...firestoreData]);
      setLoading(false);
    }, (error) => {
      console.error("Inventory Sync Error:", error);
      // Fallback to only mock data if offline
      setInventory(CIT_MOCK_INVENTORY);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }) => {
    // Dynamic icon based on category
    let iconName = "cube-outline";
    if (item.category?.includes("Auditorium")) iconName = "mic-outline";
    if (item.category?.includes("COE")) iconName = "hardware-chip-outline";
    if (item.category?.includes("Store")) iconName = "archive-outline";
    if (item.category?.includes("Mess")) iconName = "restaurant-outline"; // New Mess Icon

    return (
      <View style={styles.stockCard}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={22} color="#2563EB" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.stockName}>{item.itemName}</Text>
          <View style={styles.categoryBadge}>
             <Text style={styles.stockSub}>{item.category}</Text>
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
    padding: 20, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderColor: '#E2E8F0',
    elevation: 2
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
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
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
  stockName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 5
  },
  stockSub: { fontSize: 10, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' },
  qtyContainer: { alignItems: 'center', minWidth: 50 },
  qtyValue: { fontSize: 18, fontWeight: '900', color: '#2563EB' },
  qtyLabel: { fontSize: 9, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }
});