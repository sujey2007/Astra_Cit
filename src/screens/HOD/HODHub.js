import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

const { width } = Dimensions.get('window');

export default function HODHub({ navigation }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [handoverCount, setHandoverCount] = useState(0);
  const [damageCount, setDamageCount] = useState(0); 
  const currentUser = "Dr. Sujey (HOD)";
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
    ]).start();

    const requisitionsRef = collection(db, 'requisitions');
    
    const qPending = query(requisitionsRef, where("requestedBy", "==", currentUser), where("status", "==", "Pending"));
    const unsubPending = onSnapshot(qPending, (snapshot) => setPendingCount(snapshot.docs.length));

    const qHandover = query(requisitionsRef, where("requestedBy", "==", currentUser), where("status", "in", ["Dispensed", "Received by Stores"]));
    const unsubHandover = onSnapshot(qHandover, (snapshot) => setHandoverCount(snapshot.docs.length));

    const qDamage = query(collection(db, 'disposal_requests'), where("reportedBy", "==", currentUser), where("status", "==", "Reported"));
    const unsubDamage = onSnapshot(qDamage, (snapshot) => setDamageCount(snapshot.docs.length));

    return () => { unsubPending(); unsubHandover(); unsubDamage(); };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* BRANDED HEADER */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          {/* FIXED: Using local asset logo for mobile reliability */}
          <Image 
            source={require('../../../assets/logo.png')} 
            style={styles.citLogo} 
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerTitle}>ASTRA CIT</Text>
            <Text style={styles.headerSubtitle}>HOD Digital Portal</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.logoutBtn}>
          <Ionicons name="power" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.dashboardContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          
          {/* VISUAL ANALYTICS SECTION */}
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsTitle}>Department Overview</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{pendingCount}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: '#E2E8F0' }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#10B981' }]}>{handoverCount}</Text>
                <Text style={styles.statLabel}>Ready</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: '#E2E8F0' }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: '#EF4444' }]}>{damageCount}</Text>
                <Text style={styles.statLabel}>Damaged</Text>
              </View>
            </View>
            
            <View style={styles.graphContainer}>
              <View style={styles.graphHeader}>
                <Text style={styles.graphText}>Monthly Resource Utilization</Text>
                <Text style={styles.graphPercent}>68%</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: '68%' }]} />
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Main Operations</Text>

          <View style={styles.grid}>
            <TouchableOpacity 
              style={styles.featureCard} 
              onPress={() => navigation.navigate('Requisition')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="duplicate-outline" size={28} color="#4338CA" />
              </View>
              <Text style={styles.cardTitle}>New Requisition</Text>
              <Text style={styles.cardDesc}>Raise new material indent for labs/dept.</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.featureCard} 
              onPress={() => navigation.navigate('LiveTracker')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="pulse" size={28} color="#16A34A" />
                {pendingCount > 0 && (
                  <View style={styles.badge}><Text style={styles.badgeText}>{pendingCount}</Text></View>
                )}
              </View>
              <Text style={styles.cardTitle}>Live Tracking</Text>
              <Text style={styles.cardDesc}>Track real-time approval status.</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.featureCard} 
              onPress={() => navigation.navigate('AssetHandover')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="share-social-outline" size={28} color="#EA580C" />
                {handoverCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: '#EA580C' }]}><Text style={styles.badgeText}>{handoverCount}</Text></View>
                )}
              </View>
              <Text style={styles.cardTitle}>Asset Handover</Text>
              <Text style={styles.cardDesc}>Allocate dispensed items to classrooms.</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.featureCard} 
              onPress={() => navigation.navigate('ReportDamage')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="alert-circle-outline" size={28} color="#EF4444" />
              </View>
              <Text style={[styles.cardTitle, { color: '#991B1B' }]}>Report Damage</Text>
              <Text style={styles.cardDesc}>File report for damaged lab equipment.</Text>
            </TouchableOpacity>
          </View>

          {/* ADDED COPYRIGHT FOOTER */}
          <View style={styles.footerContainer}>
              <Text style={styles.tagline}>Intelligent Resource & Ledger Management</Text>
              <Text style={styles.copyrightText}>
                  © 2026 AstraCIT • Developed by <Text style={{fontWeight: '900', color: '#2563EB'}}>CodeTitans</Text>
              </Text>
              <Text style={styles.rightsText}>All Rights Reserved</Text>
          </View>

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#F1F5F9' 
  },
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  citLogo: { width: 45, height: 45, marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  
  dashboardContent: { padding: 20 },
  analyticsCard: { 
    backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 25,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 5
  },
  analyticsTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 15, letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 20 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 4, fontWeight: '600' },
  statDivider: { width: 1, height: 30 },
  
  graphContainer: { borderTopWidth: 1, borderColor: '#F1F5F9', paddingTop: 15 },
  graphHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  graphText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  graphPercent: { fontSize: 12, color: '#2563EB', fontWeight: '800' },
  progressBarBg: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 4 },

  sectionTitle: { fontSize: 12, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 15, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featureCard: {
    width: '48%', backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#F1F5F9', elevation: 2
  },
  iconBox: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  cardDesc: { fontSize: 11, color: '#64748B', marginTop: 5, lineHeight: 16 },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 20, padding: 4, alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  // FOOTER STYLES
  footerContainer: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  tagline: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 5,
    textTransform: 'uppercase'
  },
  copyrightText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600'
  },
  rightsText: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500'
  }
});