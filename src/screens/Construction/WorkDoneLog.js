import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function WorkDoneLog({ navigation }) {
  const [workDesc, setWorkDesc] = useState('');
  const [cementUsed, setCementUsed] = useState('');

  const handleReport = async () => {
    try {
      // 1. Log the work progress for audit readiness
      await addDoc(collection(db, "construction_logs"), {
        type: "Progress",
        description: workDesc,
        materialConsumed: `${cementUsed} bags`,
        timestamp: serverTimestamp()
      });

      // 2. AUTOMATED REORDER TRIGGER
      // If consumption is high (e.g., > 10 bags in a day), trigger a PR to Stores
      if (parseInt(cementUsed) > 10) {
        await addDoc(collection(db, "requisitions"), {
          itemName: "Cement (OPC)",
          quantity: 50,
          requestedBy: "Construction System (High Consumption Alert)",
          department: "Construction",
          status: "PR Raised",
          createdAt: serverTimestamp(),
          isUrgent: true
        });
        Alert.alert("Auto-Reorder", "High consumption detected. A purchase request has been automatically sent to Stores.");
      }

      Alert.alert("Success", "Daily work log submitted.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to submit log.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#1E293B" /></TouchableOpacity>
        <Text style={styles.headerTitle}>DAILY PROGRESS LOG</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Work Description (Area/Task)</Text>
        <TextInput 
          style={[styles.input, { height: 100 }]} 
          multiline 
          placeholder="e.g. 2nd Floor Slab Reinforcement"
          value={workDesc}
          onChangeText={setWorkDesc}
        />

        <Text style={styles.label}>Materials Consumed (Cement Bags)</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={cementUsed} onChangeText={setCementUsed} placeholder="0" />

        <TouchableOpacity style={styles.submitBtn} onPress={handleReport}>
          <Text style={styles.submitText}>SUBMIT LOG</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
// ... (Styles similar to LaborTracker for consistency)