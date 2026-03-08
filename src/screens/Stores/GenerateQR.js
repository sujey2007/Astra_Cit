import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function GenerateQR({ navigation }) {
  const [assetId, setAssetId] = useState('');
  const [roomName, setRoomName] = useState(''); // NEW: Classroom/Lab Name
  const [assetType, setAssetType] = useState('Lab'); // Classroom, Lab, or Machine
  const [items, setItems] = useState([{ name: '', qty: '' }]); // Dynamic item list
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedId, setGeneratedId] = useState('');

  const NETLIFY_URL = "https://citaudit.netlify.app/index.html";

  // Logic to add a new empty row for items
  const addItemRow = () => {
    setItems([...items, { name: '', qty: '' }]);
  };

  // Update specific item in the list
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const fileAndGenerate = async () => {
    if (!assetId || (assetType !== 'Machine' && !roomName) || items[0].name === '') {
      Alert.alert("Error", "Please fill in the Identifier, Name, and at least one item.");
      return;
    }

    setLoading(true);
    try {
      // 1. Save the detailed asset list to Firestore
      const docRef = await addDoc(collection(db, "verified_assets"), {
        identifier: assetId,
        roomName: roomName, // Storing the Lab/Classroom Name
        type: assetType,
        items: items,
        timestamp: serverTimestamp(),
        filedBy: "Stores Dept"
      });

      setGeneratedId(docRef.id);
      setShowQR(true);
      setLoading(false);
      Alert.alert("Success", "Asset details filed. QR Tag ready.");
    } catch (e) {
      console.error(e);
      setLoading(false);
      Alert.alert("Error", "Could not file asset details.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>ASSET FILING & QR</Text>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>ASSET CATEGORY</Text>
        <View style={styles.typeSelector}>
          {['Classroom', 'Lab', 'Machine'].map(type => (
            <TouchableOpacity 
              key={type} 
              style={[styles.typeBtn, assetType === type && styles.activeType]}
              onPress={() => {setAssetType(type); setShowQR(false);}}
            >
              <Text style={[styles.typeText, assetType === type && styles.activeTypeText]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{assetType.toUpperCase()} IDENTIFIER (e.g. {assetType === 'Machine' ? 'CNC-01' : 'Block A-101'})</Text>
        <TextInput 
          style={styles.input}
          placeholder="Enter ID..."
          value={assetId}
          onChangeText={(txt) => {setAssetId(txt); setShowQR(false);}}
        />

        {/* NEW QUESTION: Classroom/Lab Name */}
        {assetType !== 'Machine' && (
          <>
            <Text style={styles.label}>{assetType.toUpperCase()} NAME (e.g. Physics Lab, Turing Hall)</Text>
            <TextInput 
              style={styles.input}
              placeholder={`Enter ${assetType} Name...`}
              value={roomName}
              onChangeText={setRoomName}
            />
          </>
        )}

        <Text style={styles.label}>ITEMS PRESENT AT THIS LOCATION</Text>
        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <TextInput 
              style={[styles.input, { flex: 2, marginBottom: 0 }]}
              placeholder="Item Name (e.g. Projector)"
              value={item.name}
              onChangeText={(txt) => updateItem(index, 'name', txt)}
            />
            <TextInput 
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Qty"
              keyboardType="numeric"
              value={item.qty}
              onChangeText={(txt) => updateItem(index, 'qty', txt)}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={addItemRow}>
          <Ionicons name="add-circle" size={20} color="#6366F1" />
          <Text style={styles.addBtnText}>ADD ANOTHER ITEM</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.genBtn} onPress={fileAndGenerate} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.genBtnText}>FILE ASSET & GENERATE QR</Text>}
        </TouchableOpacity>

        {showQR && (
          <View style={styles.qrWrapper}>
            <QRCode
              value={`${NETLIFY_URL}?id=${generatedId}&type=${assetType}`}
              size={180}
            />
            <Text style={styles.qrHint}>ID: {generatedId}</Text>
            <Text style={styles.qrHint}>Scan to verify on citaudit.netlify.app</Text>
            
            <TouchableOpacity style={styles.printBtn} onPress={() => Alert.alert("Success", "Sent to CIT Network Printer")}>
              <Ionicons name="print" size={20} color="#FFF" />
              <Text style={styles.printText}>PRINT TAG</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0', gap: 15 },
  backBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 10 },
  title: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  form: { padding: 20 },
  label: { fontSize: 10, fontWeight: '800', color: '#94A3B8', marginBottom: 10, marginTop: 10 },
  typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', backgroundColor: '#FFF' },
  activeType: { backgroundColor: '#1E293B', borderColor: '#1E293B' },
  typeText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  activeTypeText: { color: '#FFF' },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', fontSize: 14, marginBottom: 15 },
  itemRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 25, alignSelf: 'flex-start' },
  addBtnText: { color: '#6366F1', fontWeight: '800', fontSize: 12 },
  genBtn: { backgroundColor: '#6366F1', padding: 18, borderRadius: 15, alignItems: 'center', elevation: 2 },
  genBtnText: { color: '#FFF', fontWeight: '900', letterSpacing: 0.5 },
  qrWrapper: { alignItems: 'center', marginTop: 30, padding: 25, backgroundColor: '#FFF', borderRadius: 24, elevation: 5, borderWidth: 1, borderColor: '#E2E8F0' },
  qrHint: { marginTop: 10, fontSize: 11, color: '#94A3B8', fontWeight: '700' },
  printBtn: { flexDirection: 'row', backgroundColor: '#1E293B', padding: 12, borderRadius: 10, marginTop: 20, gap: 10, alignItems: 'center', paddingHorizontal: 20 },
  printText: { color: '#FFF', fontWeight: '800' }
});