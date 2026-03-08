import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ManualPurchaseRequest({ navigation }) {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!itemName || !quantity) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "requisitions"), {
        itemName,
        quantity: parseInt(quantity),
        requestedBy: "Stores Officer (Manual PR)",
        department: "General Stores",
        status: "PR Raised",
        createdAt: serverTimestamp(),
        isUrgent: false
      });
      Alert.alert("Success", "Purchase request has been sent to the procurement hub.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to raise PR.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>RAISE PURCHASE REQUEST</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Item Name</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. RJ45 Connectors" 
          value={itemName} 
          onChangeText={setItemName}
        />

        <Text style={styles.label}>Quantity Required</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. 500" 
          keyboardType="numeric"
          value={quantity} 
          onChangeText={setQuantity}
        />

        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleSubmit} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>SEND TO PROCUREMENT</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  backBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 12 },
  title: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginLeft: 15 },
  form: { padding: 25 },
  label: { fontSize: 13, fontWeight: '800', color: '#64748B', marginBottom: 10, letterSpacing: 0.5 },
  input: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 25, fontSize: 16 },
  submitBtn: { backgroundColor: '#EA580C', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#FFF', fontWeight: '900', letterSpacing: 1 }
});