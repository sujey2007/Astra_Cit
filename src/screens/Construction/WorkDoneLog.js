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
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function WorkDoneLog({ navigation }) {
  const [workDesc, setWorkDesc] = useState('');
  const [cementUsed, setCementUsed] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReport = async () => {
    // Prevent empty submissions
    if (!workDesc.trim() || !cementUsed.trim()) {
      Alert.alert("Input Required", "Please fill in both work description and material count.");
      return;
    }

    setLoading(true);
    try {
      // 1. Safe Numeric Conversion
      const bagsCount = parseInt(cementUsed) || 0;

      // 2. Log the work progress
      await addDoc(collection(db, "construction_logs"), {
        type: "Progress",
        description: workDesc.trim(),
        materialConsumed: `${bagsCount} bags`,
        timestamp: serverTimestamp(),
        loggedBy: "Site Supervisor"
      });

      // 3. AUTOMATED REORDER TRIGGER
      // If consumption is high (> 10 bags), trigger a PR to Stores
      if (bagsCount > 10) {
        await addDoc(collection(db, "requisitions"), {
          itemName: "Cement (OPC)",
          quantity: 50,
          requestedBy: "Construction Auto-Alert",
          department: "Construction",
          status: "PR Raised",
          createdAt: serverTimestamp(),
          isUrgent: true
        });
        Alert.alert(
          "Success & Auto-Reorder", 
          "Work log submitted. High consumption detected: A purchase request has been automatically sent to Stores."
        );
      } else {
        Alert.alert("Success", "Daily work log submitted successfully.");
      }

      navigation.goBack();
    } catch (error) {
      console.error("Submission Error: ", error);
      Alert.alert("Error", "Could not submit log. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View>
            <Text style={styles.headerTitle}>PROGRESS LOG</Text>
            <Text style={styles.headerSubtitle}>Site Work Report</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
            <Text style={styles.label}>WORK DESCRIPTION (AREA/TASK)</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              multiline 
              numberOfLines={4}
              placeholder="e.g. 2nd Floor Slab Reinforcement completed"
              placeholderTextColor="#94A3B8"
              value={workDesc}
              onChangeText={setWorkDesc}
            />

            <Text style={styles.label}>MATERIALS CONSUMED (CEMENT BAGS)</Text>
            <View style={styles.inputWrapper}>
                <Ionicons name="cube-outline" size={20} color="#15803D" style={styles.inputIcon} />
                <TextInput 
                  style={styles.inputField} 
                  keyboardType="number-pad" 
                  value={cementUsed} 
                  onChangeText={setCementUsed} 
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                />
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
              onPress={handleReport}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                    <Text style={styles.submitText}>SUBMIT DAILY LOG</Text>
                </>
              )}
            </TouchableOpacity>
        </View>

        {/* Branding Tagline */}
        <View style={styles.footer}>
            <Text style={styles.footerText}>© 2026 AstraCIT • CodeTitans</Text>
        </View>
      </ScrollView>
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
    paddingTop: 50 
  },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 11, color: '#64748B', fontWeight: '600', textTransform: 'uppercase' },
  content: { padding: 20 },
  card: { 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 20, 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 10 
  },
  label: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: '#64748B', 
    marginBottom: 8, 
    letterSpacing: 1 
  },
  input: { 
    backgroundColor: '#F1F5F9', 
    borderRadius: 12, 
    padding: 15, 
    fontSize: 16, 
    color: '#1E293B', 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F1F5F9', 
    borderRadius: 12, 
    paddingHorizontal: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  inputIcon: { marginRight: 10 },
  inputField: { flex: 1, height: 50, fontSize: 16, color: '#1E293B', fontWeight: '600' },
  submitBtn: { 
    backgroundColor: '#15803D', 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16, 
    borderRadius: 15,
    gap: 10,
    elevation: 8,
    shadowColor: '#15803D',
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  submitText: { color: '#FFF', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
  footer: { marginTop: 30, alignItems: 'center' },
  footerText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' }
});