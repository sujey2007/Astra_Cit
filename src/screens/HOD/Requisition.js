import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const DEPARTMENTS = [
  "Computer Science & Engineering (CSE)",
  "Information Technology (IT)",
  "Artificial Intelligence & Data Science (AI&DS)",
  "Artificial Intelligence & Machine Learning (AI&ML)",
  "Computer Science & Business Systems (CSBS)",
  "Cyber Security",
  "Electronics & Communication (ECE)",
  "Electrical & Electronics (EEE)",
  "Mechanical Engineering",
  "Mechatronics Engineering",
  "Civil Engineering",
  "Biomedical Engineering",
  "Science & Humanities",
  "Construction & Maintenance",
  "Transport Department",
  "Hostel & Mess Administration",
  "Central Library",
  "Placement & Training Cell",
  "Center of Excellence (COE)"
];

export default function Requisition({ navigation }) {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purpose, setPurpose] = useState(""); // Preserved essential field
  const [priority, setPriority] = useState("Normal"); // Preserved essential field
  const [selectedDept, setSelectedDept] = useState("");
  const [isDeptVisible, setIsDeptVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUser = "Dr. Sujey (HOD)";

  const handleSubmit = async () => {
    if (!itemName || !quantity || !selectedDept || !purpose) {
      Alert.alert("Missing Information", "Please fill out all fields including the purpose.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'requisitions'), {
        itemName,
        quantity: parseInt(quantity, 10),
        purpose,
        priority,
        department: selectedDept,
        requestedBy: currentUser,
        status: "Pending",
        createdAt: serverTimestamp(),
      });
      Alert.alert("Success", "Material request submitted successfully.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NEW MATERIAL REQUEST</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={styles.formCard}>
            <Text style={styles.label}>DEPARTMENT *</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setIsDeptVisible(!isDeptVisible)}>
              <Text style={{ color: selectedDept ? '#0F172A' : '#94A3B8' }}>{selectedDept || "Select Department"}</Text>
              <Ionicons name="chevron-down" size={20} color="#64748B" />
            </TouchableOpacity>
            {isDeptVisible && DEPARTMENTS.map(d => (
              <TouchableOpacity key={d} style={styles.dropItem} onPress={() => { setSelectedDept(d); setIsDeptVisible(false); }}>
                <Text>{d}</Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.label}>ITEM DESCRIPTION *</Text>
            <TextInput style={styles.input} value={itemName} onChangeText={setItemName} placeholder="e.g. Arduino Boards" />
            
            <Text style={styles.label}>QUANTITY *</Text>
            <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="e.g. 10" />

            {/* Essential Question: Purpose */}
            <Text style={styles.label}>PURPOSE / JUSTIFICATION *</Text>
            <TextInput 
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
              value={purpose} 
              onChangeText={setPurpose} 
              multiline 
              placeholder="Why is this material required?" 
            />

            {/* Essential Question: Priority */}
            <Text style={styles.label}>URGENCY LEVEL</Text>
            <View style={styles.priorityRow}>
              {['Normal', 'High', 'Critical'].map((level) => (
                <TouchableOpacity 
                  key={level}
                  style={[styles.chip, priority === level && styles.chipActive]}
                  onPress={() => setPriority(level)}
                >
                  <Text style={[styles.chipText, priority === level && styles.chipTextActive]}>{level}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>SUBMIT TO STORES</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  formCard: { backgroundColor: 'white', padding: 20, borderRadius: 16, elevation: 2 },
  label: { fontSize: 11, fontWeight: '800', color: '#64748B', marginTop: 15, marginBottom: 5, letterSpacing: 0.5 },
  input: { backgroundColor: '#F1F5F9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', color: '#0F172A' },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F1F5F9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  dropItem: { padding: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderColor: '#F1F5F9' },
  priorityRow: { flexDirection: 'row', justifyContent: 'space-between' },
  chip: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginHorizontal: 4 },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  chipTextActive: { color: 'white' },
  submitBtn: { backgroundColor: '#2563EB', padding: 16, borderRadius: 12, marginTop: 30, alignItems: 'center' },
  submitText: { color: 'white', fontWeight: '800', letterSpacing: 1 }
});