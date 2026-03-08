import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function ConstructionInventory({ navigation }) {
  const [inventory, setInventory] = useState([]);

  // MOCK DATA FOR CONSTRUCTION ASSETS
  const mockConstructionData = [
    { id: 'm1', itemName: 'Cement (OPC)', quantity: 450, unit: 'Bags', lastStockUpdate: '08/03/2026', category: 'Construction' },
    { id: 'm2', itemName: 'Vitrified Tiles', quantity: 120, unit: 'Boxes', lastStockUpdate: '07/03/2026', category: 'Construction' },
    { id: 'm3', itemName: 'Red Bricks', quantity: 5000, unit: 'Units', lastStockUpdate: '05/03/2026', category: 'Construction' },
    { id: 'm4', itemName: 'M-Sand', quantity: 12, unit: 'Units', lastStockUpdate: '08/03/2026', category: 'Construction' },
    { id: 'm5', itemName: 'Steel Rods (12mm)', quantity: 8, unit: 'Tons', lastStockUpdate: '04/03/2026', category: 'Construction' },
    { id: 'm6', itemName: 'Paint (White Emulsion)', quantity: 25, unit: 'Buckets', lastStockUpdate: '06/03/2026', category: 'Construction' },
  ];

  useEffect(() => {
    // Sync with Live Central Inventory
    const q = query(collection(db, "inventory"), where("category", "==", "Construction"));
    const unsub = onSnapshot(q, (snapshot) => {
      const firestoreData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Combine Mock Data with Live Firestore Data for full demo visibility
      setInventory([...mockConstructionData, ...firestoreData]);
    });
    
    return unsub;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>SITE INVENTORY</Text>
      </View>

      <FlatList
        data={inventory}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.invCard}>
            <View style={styles.invInfo}>
              <Text style={styles.itemName}>{item.itemName}</Text>
              <Text style={styles.itemSub}>Last delivery: {item.lastStockUpdate || 'N/A'}</Text>
            </View>
            
            {/* LOW STOCK ALERT LOGIC */}
            <View style={[
              styles.stockBadge, 
              (item.quantity < 15) && styles.lowStock // Highlight if items like Steel/Sand are low
            ]}>
              <Text style={[
                styles.stockText,
                (item.quantity < 15) && { color: '#B91C1C' }
              ]}>
                {item.quantity} {item.unit}
              </Text>
            </View>
          </View>
        )}
        ListHeaderComponent={
          <Text style={styles.listLabel}>CURRENT SITE ASSETS</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderColor: '#E2E8F0',
    elevation: 2
  },
  backBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 10 },
  title: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginLeft: 15 },
  listLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', marginBottom: 15, letterSpacing: 1 },
  invCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 12, 
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  invInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  itemSub: { fontSize: 11, color: '#94A3B8', marginTop: 4, fontWeight: '600' },
  stockBadge: { 
    backgroundColor: '#F1F5F9', 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    borderRadius: 12,
    minWidth: 90,
    alignItems: 'center'
  },
  lowStock: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  stockText: { fontWeight: '900', color: '#1E293B', fontSize: 13 }
});