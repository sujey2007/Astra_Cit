import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ConstructionRequisition({ navigation }) {
  const [material, setMaterial] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Bags'); // Default for cement
  const [location, setLocation] = useState('');

  const handleRequest = async () => {
    if (!material || !quantity || !location) {
      Alert.alert("Missing Info", "Please fill in material name, quantity, and site location.");
      return;
    }

    try {
      await addDoc(collection(db, "requisitions"), {
        itemName: material,
        quantity: `${quantity} ${unit}`,
        siteLocation: location,
        requestedBy: "Construction Supervisor",
        department: "Construction",
        status: "Pending", // Sent to Stores Hub
        createdAt: serverTimestamp(),
        isUrgent: false
      });

      Alert.alert("Request Sent", "Your material requisition has been forwarded to CIT Stores.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to send request.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SITE MATERIAL REQUEST</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#0052CC" />
          <Text style={styles.infoText}>This request goes to the Central Stores for immediate dispatch to your site.</Text>
        </View>

        <Text style={styles.label}>Material Name</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g., M-Sand, Steel Rods (12mm)" 
          value={material}
          onChangeText={setMaterial}
        />

        <View style={styles.row}>
          <View style={{ flex: 2, marginRight: 10 }}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput 
              style={styles.input} 
              placeholder="0" 
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Unit</Text>
            <View style={styles.unitPicker}>
              {['Bags', 'Tons', 'CFT'].map((u) => (
                <TouchableOpacity key={u} onPress={() => setUnit(u)} style={[styles.unitBtn, unit === u && styles.activeUnit]}>
                  <Text style={[styles.unitBtnText, unit === u && styles.activeUnitText]}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.label}>Site Location / Block</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g., New Hostel Block A - North Wing" 
          value={location}
          onChangeText={setLocation}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleRequest}>
          <Ionicons name="send" size={20} color="#FFF" />
          <Text style={styles.submitBtnText}>SEND REQUISITION</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  backBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 10 },
  headerTitle: { fontSize: 15, fontWeight: '900', color: '#1E293B', marginLeft: 15, letterSpacing: 0.5 },
  content: { padding: 20 },
  infoCard: { flexDirection: 'row', backgroundColor: '#EFF6FF', padding: 15, borderRadius: 12, marginBottom: 25, alignItems: 'center' },
  infoText: { flex: 1, marginLeft: 10, fontSize: 12, color: '#0052CC', fontWeight: '600' },
  label: { fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20, fontSize: 16 },
  row: { flexDirection: 'row', marginBottom: 20 },
  unitPicker: { flexDirection: 'column', gap: 5 },
  unitBtn: { backgroundColor: '#F1F5F9', padding: 8, borderRadius: 8, alignItems: 'center' },
  activeUnit: { backgroundColor: '#1E293B' },
  unitBtnText: { fontSize: 10, fontWeight: '800', color: '#64748B' },
  activeUnitText: { color: '#FFF' },
  submitBtn: { backgroundColor: '#EA580C', flexDirection: 'row', padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10, elevation: 4 },
  submitBtnText: { color: '#FFF', fontWeight: '900', fontSize: 15, marginLeft: 10, letterSpacing: 1 }
});