import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AdminHub({ navigation }) {
  const handleLogout = () => navigation.replace('Login');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* BRANDED HEADER */}
        <View style={styles.header}>
          <View style={styles.brandContainer}>
             <Image 
                source={{ uri: 'https://images.shiksha.com/mediadata/images/1583389585phpP9W1tB_m.jpg' }} 
                style={styles.citLogo} 
                resizeMode="contain"
             />
             <View>
                <Text style={styles.headerTitle}>SYSTEM ADMIN</Text>
                <Text style={styles.headerSubtitle}>User & System Management</Text>
             </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="power" size={20} color="#D32F2F" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.dashboardContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Administrative Controls</Text>
          
          <View style={styles.gridContainer}>
            {/* FEATURE 1: REGISTER OFFICER */}
            <TouchableOpacity 
              style={styles.featureCard} 
              onPress={() => navigation.navigate('RegisterUser')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="person-add" size={28} color="#0052CC" />
              </View>
              <Text style={styles.cardTitle}>Register Officer</Text>
              <Text style={styles.cardSubtitle}>Create new access accounts</Text>
            </TouchableOpacity>

            {/* FEATURE 2: USER DIRECTORY */}
            <TouchableOpacity 
              style={styles.featureCard} 
              onPress={() => navigation.navigate('UserManagement')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="key-outline" size={28} color="#16A34A" />
              </View>
              <Text style={styles.cardTitle}>User Directory</Text>
              <Text style={styles.cardSubtitle}>Manage & Reset Passwords</Text>
            </TouchableOpacity>

            {/* FEATURE 3: SYSTEM AUDIT TRAIL */}
            <TouchableOpacity 
              style={styles.featureCard} 
              onPress={() => navigation.navigate('GlobalTransactions')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="shield-checkmark" size={28} color="#EA580C" />
              </View>
              <Text style={styles.cardTitle}>System Audit</Text>
              <Text style={styles.cardSubtitle}>Track all Inward & Disposal logs</Text>
            </TouchableOpacity>

            {/* FEATURE 4: REAL-TIME ANALYTICS */}
            <TouchableOpacity 
              style={styles.featureCard} 
              onPress={() => navigation.navigate('SystemAnalytics')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="analytics-outline" size={28} color="#6366F1" />
              </View>
              <Text style={styles.cardTitle}>Analytics</Text>
              <Text style={styles.cardSubtitle}>Real-time department usage</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', elevation: 4
  },
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  citLogo: { width: 40, height: 40, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 10, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  dashboardContent: { padding: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 20, textTransform: 'uppercase' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featureCard: {
    width: '48%', backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#F1F5F9', elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10
  },
  iconContainer: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  cardSubtitle: { fontSize: 11, color: '#64748B', marginTop: 4, lineHeight: 16 }
});