import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Modal,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Database Import
import { db } from '../../api/firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const ROLES = [
  { id: "Procurement", label: "Purchase Officer" },
  { id: "HOD", label: "Department HOD" },
  { id: "Construction", label: "Site Supervisor" },
  { id: "Auditor", label: "Internal Auditor" },
  { id: "Executive", label: "Executive Board" }
];

export default function AdminHub({ navigation }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("Auditor");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleRegisterUser = async () => {
    if (!newUsername || !newPassword) {
      setMessage({ text: "Missing Username or Password", type: "error" });
      return;
    }

    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const userId = newUsername.toLowerCase().trim();
      
      // Set a 10-second timeout for the database call
      const dbPromise = setDoc(doc(db, "users", userId), {
        username: userId,
        password: newPassword,
        role: selectedRole,
        createdAt: serverTimestamp(),
        status: "Active"
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Connection Timeout")), 10000)
      );

      await Promise.race([dbPromise, timeoutPromise]);

      setMessage({ text: "Officer Registered Successfully!", type: "success" });
      setNewUsername("");
      setNewPassword("");
      
      setTimeout(() => {
        setIsModalVisible(false);
        setMessage({ text: "", type: "" });
      }, 1500);

    } catch (error) {
      console.error("Database Error:", error);
      setMessage({ 
        text: error.message === "Connection Timeout" 
          ? "Check your internet or Firebase Rules" 
          : "Database Error: " + error.message, 
        type: "error" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => navigation.replace('Login');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>SYSTEM ADMIN</Text>
            <Text style={styles.headerSubtitle}>User Management Portal</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#D32F2F" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* DASHBOARD CONTENT */}
        <ScrollView contentContainerStyle={styles.dashboardContent}>
          <Text style={styles.sectionTitle}>System Controls</Text>
          
          <View style={styles.gridContainer}>
            <TouchableOpacity 
              style={styles.featureCard} 
              onPress={() => setIsModalVisible(true)}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="person-add" size={28} color="#0052CC" />
              </View>
              <Text style={styles.cardTitle}>Register Officer</Text>
              <Text style={styles.cardSubtitle}>Direct Database Entry</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.featureCard, { opacity: 0.5 }]} disabled>
              <View style={[styles.iconContainer, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="shield-checkmark" size={28} color="#64748B" />
              </View>
              <Text style={styles.cardTitle}>Audit Logs</Text>
              <Text style={styles.cardSubtitle}>View system changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* REGISTRATION MODAL */}
        <Modal visible={isModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalWrapper}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>New Officer Details</Text>
                  <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                    <Ionicons name="close-circle" size={28} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.inputLabel}>ASSIGN DESIGNATION</Text>
                  <View style={styles.roleGrid}>
                    {ROLES.map(role => (
                      <TouchableOpacity
                        key={role.id}
                        style={[styles.roleChip, selectedRole === role.id && styles.roleChipActive]}
                        onPress={() => setSelectedRole(role.id)}
                      >
                        <Text style={[styles.roleText, selectedRole === role.id && styles.roleTextActive]}>
                          {role.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>USERNAME</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="person" size={18} color="#64748B" />
                      <TextInput
                        style={styles.input}
                        placeholder="username"
                        value={newUsername}
                        onChangeText={setNewUsername}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>PASSWORD</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed" size={18} color="#64748B" />
                      <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        secureTextEntry
                        value={newPassword}
                        onChangeText={setNewPassword}
                      />
                    </View>
                  </View>

                  {message.text !== "" && (
                    <View style={[styles.msgBox, message.type === "success" ? styles.msgSuccess : styles.msgError]}>
                      <Text style={[styles.msgText, message.type === "success" ? styles.txtSuccess : styles.txtError]}>
                        {message.text}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity style={styles.submitBtn} onPress={handleRegisterUser} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>CREATE ACCOUNT</Text>}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 24, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', elevation: 2
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 8, borderRadius: 8 },
  logoutText: { color: '#D32F2F', fontWeight: '700', marginLeft: 4 },
  dashboardContent: { padding: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 20 },
  gridContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  featureCard: {
    width: '48%', backgroundColor: '#FFF', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#F1F5F9', elevation: 4
  },
  iconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  cardSubtitle: { fontSize: 12, color: '#64748B', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', padding: 20 },
  modalWrapper: { width: '100%' },
  modalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 8, marginTop: 12 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  roleChip: { width: '48%', padding: 12, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10, alignItems: 'center' },
  roleChipActive: { backgroundColor: '#0052CC', borderColor: '#0052CC' },
  roleText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  roleTextActive: { color: '#FFF' },
  inputContainer: { marginBottom: 16 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12 },
  input: { flex: 1, padding: 14, color: '#0F172A' },
  submitBtn: { backgroundColor: '#0052CC', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#FFF', fontWeight: '800', letterSpacing: 1 },
  msgBox: { padding: 12, borderRadius: 8, marginBottom: 15 },
  msgSuccess: { backgroundColor: '#ECFDF5' },
  msgError: { backgroundColor: '#FEF2F2' },
  txtSuccess: { color: '#059669', fontWeight: '700' },
  txtError: { color: '#DC2626', fontWeight: '700' }
});