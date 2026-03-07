import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const ROLES = [
  { id: "Admin", label: "System Admin" }, // Added Admin Role
  { id: "Procurement", label: "Purchase Officer" },
  { id: "HOD", label: "Department HOD" },
  { id: "Construction", label: "Site Supervisor" },
  { id: "Auditor", label: "Internal Auditor" },
  { id: "Executive", label: "Executive Board" },
  { id: "Stores", label: "Stores Officer" }
];

export default function RegisterUser({ navigation }) {
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("HOD");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!newUsername || !newPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    try {
      const userId = newUsername.toLowerCase().trim();
      
      await setDoc(doc(db, "users", userId), {
        username: userId,
        password: newPassword,
        role: selectedRole,
        createdAt: serverTimestamp(),
        status: "Active"
      });

      Alert.alert(
        "Success", 
        `${selectedRole} account created successfully.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (e) { 
      console.error(e);
      Alert.alert("Database Error", "Failed to create user account.");
    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>REGISTER NEW OFFICER</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{flex: 1}}
      >
        <ScrollView contentContainerStyle={{ padding: 25 }} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.label}>ASSIGN DESIGNATION</Text>
          <View style={styles.roleGrid}>
            {ROLES.map(role => (
              <TouchableOpacity 
                key={role.id} 
                style={[styles.roleChip, selectedRole === role.id && styles.activeChip]} 
                onPress={() => setSelectedRole(role.id)}
              >
                <Text style={[styles.roleText, selectedRole === role.id && {color: '#FFF'}]}>
                  {role.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>ACCOUNT USERNAME</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Username" 
              placeholderTextColor="#94A3B8"
              value={newUsername} 
              onChangeText={setNewUsername} 
              autoCapitalize="none" 
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>ACCOUNT PASSWORD</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Password" 
              placeholderTextColor="#94A3B8"
              secureTextEntry 
              value={newPassword} 
              onChangeText={setNewPassword} 
            />
          </View>

          <TouchableOpacity 
            style={styles.submitBtn} 
            onPress={handleRegister} 
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>CREATE CIT ACCOUNT</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
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
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 14, fontWeight: '900', marginLeft: 15, color: '#0F172A', letterSpacing: 0.5 },
  label: { fontSize: 11, fontWeight: '900', color: '#64748B', marginTop: 20, marginBottom: 8, letterSpacing: 1 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  roleChip: { 
    width: '48%', 
    padding: 14, 
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    marginBottom: 10, 
    alignItems: 'center',
    elevation: 1
  },
  activeChip: { backgroundColor: '#0052CC', borderColor: '#0052CC' },
  roleText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  inputSection: { marginBottom: 5 },
  input: { 
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    fontSize: 15, 
    color: '#1E293B',
    elevation: 1
  },
  submitBtn: { 
    backgroundColor: '#0052CC', 
    padding: 18, 
    borderRadius: 14, 
    marginTop: 40, 
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#0052CC',
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  submitText: { color: '#FFF', fontWeight: '800', letterSpacing: 1.5 }
});