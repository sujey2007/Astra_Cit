import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export default function UserManagement({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
  }, []);

  const handleChangePassword = (username) => {
    Alert.prompt(
      "Reset Password",
      `Enter new password for ${username}`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Update", 
          onPress: async (newPass) => {
            if (newPass) {
              await updateDoc(doc(db, 'users', username), { password: newPass });
              Alert.alert("Success", "Password updated!");
            }
          } 
        }
      ],
      "plain-text"
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userIcon}>
        <Ionicons name="person-circle" size={40} color="#6366F1" />
      </View>
      <View style={{ flex: 1, marginLeft: 15 }}>
        <Text style={styles.userName}>{item.username}</Text>
        <Text style={styles.userRole}>{item.role}</Text>
      </View>
      <TouchableOpacity onPress={() => handleChangePassword(item.id)} style={styles.actionBtn}>
        <Ionicons name="key" size={20} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#1E293B" /></TouchableOpacity>
        <Text style={styles.title}>USER DIRECTORY</Text>
      </View>
      {loading ? <ActivityIndicator size="large" color="#6366F1" style={{marginTop: 50}} /> : (
        <FlatList 
          data={users} 
          renderItem={renderItem} 
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  title: { fontSize: 16, fontWeight: '800', marginLeft: 15, color: '#0F172A' },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 16, marginBottom: 12, elevation: 2 },
  userName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  userRole: { fontSize: 12, color: '#64748B', marginTop: 2 },
  actionBtn: { backgroundColor: '#6366F1', padding: 10, borderRadius: 10 }
});