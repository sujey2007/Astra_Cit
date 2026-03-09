import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, onSnapshot, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function PasswordRequests({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "password_requests"), where("status", "==", "Pending"));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleResetPassword = async () => {
    if (newPassword.length < 4) {
      Alert.alert("Error", "Password must be at least 4 characters.");
      return;
    }

    try {
      // 1. Update the actual user record
      const userRef = doc(db, "users", selectedUser.username);
      await updateDoc(userRef, { password: newPassword });

      // 2. Remove the request
      await deleteDoc(doc(db, "password_requests", selectedUser.id));

      Alert.alert("Success", `Password for ${selectedUser.username} has been reset.`);
      setModalVisible(false);
      setNewPassword("");
    } catch (e) {
      Alert.alert("Error", "Could not reset password.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Password Recovery List</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366F1" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          contentContainerStyle={{padding: 20}}
          renderItem={({item}) => (
            <View style={styles.requestCard}>
              <View style={styles.userInfo}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.roleText}>{item.role} Department</Text>
              </View>
              <TouchableOpacity 
                style={styles.resetBtn}
                onPress={() => {
                  setSelectedUser(item);
                  setModalVisible(true);
                }}
              >
                <Text style={styles.resetText}>RESET</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No pending reset requests.</Text>}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeader}>Set New Password</Text>
            <Text style={styles.modalSub}>User: {selectedUser?.username}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Enter New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleResetPassword} style={styles.confirmBtn}>
                <Text style={styles.confirmText}>Update Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 18, fontWeight: '800', marginLeft: 15, color: '#1E293B' },
  requestCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 15, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  username: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  roleText: { fontSize: 12, color: '#64748B', marginTop: 4 },
  resetBtn: { backgroundColor: '#6366F1', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  resetText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 50, color: '#94A3B8', fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 25 },
  modalHeader: { fontSize: 18, fontWeight: '900', marginBottom: 5 },
  modalSub: { marginBottom: 20, color: '#64748B' },
  input: { backgroundColor: '#F1F5F9', padding: 15, borderRadius: 12, marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  cancelBtn: { marginRight: 20 },
  confirmBtn: { backgroundColor: '#10B981', padding: 12, borderRadius: 10 },
  confirmText: { color: '#FFF', fontWeight: 'bold' }
});