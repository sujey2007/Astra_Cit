import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

export default function SupervisorHub({ navigation }) {
  const [activeLabor, setActiveLabor] = useState(0);
  const [pendingReqs, setPendingReqs] = useState(0);

  useEffect(() => {
    // 1. Fetch Today's Active Labor Count (Present + Half-Day)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const qLabor = query(
      collection(db, "construction_attendance"), 
      where("timestamp", ">=", startOfDay)
    );
    
    const unsubLabor = onSnapshot(qLabor, (snapshot) => {
      if (!snapshot.empty) {
        // Aggregate totals from today's latest log
        const latest = snapshot.docs[0].data();
        setActiveLabor(latest.summary.present + latest.summary.halfDay);
      } else {
        setActiveLabor(0);
      }
    });

    // 2. Fetch Pending Material Requests for Construction
    const qReqs = query(
      collection(db, "requisitions"), 
      where("department", "==", "Construction"), 
      where("status", "==", "Pending")
    );
    
    const unsubReqs = onSnapshot(qReqs, (snapshot) => {
      setPendingReqs(snapshot.docs.length);
    });

    return () => { unsubLabor(); unsubReqs(); };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* BRANDED HEADER WITH LOGO AND LOGOUT */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          {/* UPDATED: Using local asset for mobile reliability */}
          <Image 
            source={require('../../../assets/logo.png')} 
            style={styles.citLogo} 
            resizeMode="contain"
          />
          <View>
            <Text style={styles.title}>CONSTRUCTION HUB</Text>
            <Text style={styles.subtitle}>Site Infrastructure Management</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.replace('Login')}>
          <Ionicons name="power" size={20} color="#D32F2F" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* LIVE OVERVIEW BAR: Metrics for Daily Operations */}
        <View style={styles.overviewBar}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{activeLabor}</Text>
            <Text style={styles.statLabel}>ACTIVE LABOR</Text>
          </View>
          <View style={[styles.statBox, styles.borderLeft]}>
            <Text style={[styles.statValue, { color: '#EA580C' }]}>{pendingReqs}</Text>
            <Text style={styles.statLabel}>PENDING REQS</Text>
          </View>
          <View style={[styles.statBox, styles.borderLeft]}>
            <Text style={[styles.statValue, { color: '#0052CC' }]}>85%</Text>
            <Text style={styles.statLabel}>SITE HEALTH</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>SITE OPERATIONS</Text>
        
        <View style={styles.grid}>
          {/* Card 1: Manpower Tracking */}
          <TouchableOpacity 
            style={styles.featureCard} 
            onPress={() => navigation.navigate('LaborTracker')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="people" size={32} color="#1D4ED8" />
            </View>
            <Text style={styles.cardTitle}>Manpower</Text>
            <Text style={styles.cardSub}>Daily labor attendance</Text>
          </TouchableOpacity>

          {/* Card 2: Work Logs */}
          <TouchableOpacity 
            style={styles.featureCard} 
            onPress={() => navigation.navigate('WorkDoneLog')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="construct" size={32} color="#15803D" />
            </View>
            <Text style={styles.cardTitle}>Work Logs</Text>
            <Text style={styles.cardSub}>Report site progress</Text>
          </TouchableOpacity>

          {/* Card 3: PERSONALIZED MATERIAL REQUISITION */}
          <TouchableOpacity 
            style={styles.featureCard} 
            onPress={() => navigation.navigate('ConstructionRequisition')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="cart" size={32} color="#EA580C" />
            </View>
            <Text style={styles.cardTitle}>Request Materials</Text>
            <Text style={styles.cardSub}>Specialized site orders</Text>
          </TouchableOpacity>

          {/* Card 4: ATTENDANCE HISTORY */}
          <TouchableOpacity 
            style={styles.featureCard} 
            onPress={() => navigation.navigate('AttendanceHistory')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="time" size={32} color="#475569" />
            </View>
            <Text style={styles.cardTitle}>Attendance History</Text>
            <Text style={styles.cardSub}>Review past manpower logs</Text>
          </TouchableOpacity>

          {/* Card 5: CONSUMPTION LOG (NEW) */}
          <TouchableOpacity 
            style={styles.featureCard} 
            onPress={() => navigation.navigate('ConsumptionLog')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="analytics" size={32} color="#BE185D" />
            </View>
            <Text style={styles.cardTitle}>Usage Log</Text>
            <Text style={styles.cardSub}>Material consumption history</Text>
          </TouchableOpacity>

          {/* Card 6: SITE STOCK (NEW) */}
          <TouchableOpacity 
            style={styles.featureCard} 
            onPress={() => navigation.navigate('ConstructionInventory')}
          >
            <View style={[styles.iconBox, { backgroundColor: '#F0F9FF' }]}>
              <Ionicons name="layers" size={32} color="#0369A1" />
            </View>
            <Text style={styles.cardTitle}>Site Stock</Text>
            <Text style={styles.cardSub}>Available site assets</Text>
          </TouchableOpacity>
        </View>

        {/* ADDED COPYRIGHT FOOTER */}
        <View style={styles.footerContainer}>
            <Text style={styles.tagline}>Intelligent Resource & Ledger Management</Text>
            <Text style={styles.copyrightText}>
                © 2026 AstraCIT • Developed by <Text style={{fontWeight: '900', color: '#1D4ED8'}}>CodeTitans</Text>
            </Text>
            <Text style={styles.rightsText}>All Rights Reserved</Text>
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
    justifyContent: 'space-between', 
    padding: 20, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderColor: '#E2E8F0', 
    elevation: 4 
  },
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  citLogo: { width: 35, height: 35, marginRight: 10 },
  title: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 10, color: '#64748B', fontWeight: '700' },
  logoutBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#FEF2F2', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  content: { padding: 20 },
  
  overviewBar: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 25, 
    elevation: 3, 
    borderWidth: 1, 
    borderColor: '#F1F5F9' 
  },
  statBox: { flex: 1, alignItems: 'center' },
  borderLeft: { borderLeftWidth: 1, borderColor: '#F1F5F9' },
  statValue: { fontSize: 24, fontWeight: '900', color: '#1D4ED8' },
  statLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', marginTop: 4, letterSpacing: 1 },

  sectionLabel: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#94A3B8', 
    letterSpacing: 1, 
    marginBottom: 20, 
    textTransform: 'uppercase' 
  },
  grid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    flexWrap: 'wrap' 
  },
  featureCard: { 
    width: '48%', 
    backgroundColor: '#FFF', 
    padding: 20, 
    borderRadius: 24, 
    elevation: 4, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#F1F5F9',
    minHeight: 180 
  },
  iconBox: { 
    width: 56, height: 56, borderRadius: 16, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 15 
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  cardSub: { fontSize: 11, color: '#64748B', marginTop: 4 },

  // FOOTER STYLES
  footerContainer: {
    marginTop: 30,
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