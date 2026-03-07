import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ReportDamage({ navigation }) {
  const [allocatedAssets, setAllocatedAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [issueDescription, setIssueDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const currentUser = "Dr. Sujey (HOD)";

  useEffect(() => {
    // Fetch only items that were already allocated to this HOD's dept
    const q = query(collection(db, 'requisitions'), where("requestedBy", "==", currentUser), where("status", "==", "Allocated"));
    return onSnapshot(q, (snapshot) => {
      setAllocatedAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const handleSubmitReport = async () => {
    if (!selectedAsset || !issueDescription) {
      return Alert.alert("Required", "Please select an asset and describe the issue.");
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'disposal_requests'), {
        assetName: selectedAsset.itemName,
        requisitionId: selectedAsset.id,
        issue: issueDescription,
        reportedBy: currentUser,
        status: "Reported",
        timestamp: serverTimestamp()
      });
      Alert.alert("Report Filed", "Stores department has been notified of the damage/loss.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", "Failed to file report.");
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
        <Text style={styles.headerTitle}>REPORT DAMAGE / LOSS</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.label}>1. SELECT ASSET INVOLVED</Text>
        <View style={styles.listContainer}>
          {allocatedAssets.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.itemCard, selectedAsset?.id === item.id && styles.activeCard]}
              onPress={() => setSelectedAsset(item)}
            >
              <Text style={[styles.itemName, selectedAsset?.id === item.id && {color:'#FFF'}]}>{item.itemName}</Text>
              <Text style={[styles.itemLoc, selectedAsset?.id === item.id && {color:'#DBEAFE'}]}>At: {item.assignedTo}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedAsset && (
          <View style={styles.form}>
            <Text style={styles.label}>2. DESCRIBE CONDITION</Text>
            <TextInput 
              style={styles.input}
              placeholder="Describe damage or loss details (e.g. Broken screen, Power surge)"
              multiline
              numberOfLines={4}
              value={issueDescription}
              onChangeText={setIssueDescription}
            />
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitReport} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>FILE OFFICIAL REPORT</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  label: { fontSize: 11, fontWeight: '900', color: '#64748B', marginBottom: 15, letterSpacing: 1 },
  listContainer: { marginBottom: 20 },
  itemCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  activeCard: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  itemName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  itemLoc: { fontSize: 12, color: '#64748B', marginTop: 4 },
  form: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, elevation: 5 },
  input: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 15, fontSize: 14, textAlignVertical: 'top', minHeight: 120, borderWidth: 1, borderColor: '#E2E8F0' },
  submitBtn: { backgroundColor: '#EF4444', marginTop: 20, padding: 18, borderRadius: 12, alignItems: 'center' },
  submitText: { color: '#FFF', fontWeight: '800', letterSpacing: 1 }
});