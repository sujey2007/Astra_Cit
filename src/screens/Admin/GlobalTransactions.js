import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SafeAreaView, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function GlobalTransactions({ navigation }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Setup Listeners for all major activity collections
    const requisitionsRef = collection(db, 'requisitions');
    const inwardRef = collection(db, 'inward_history'); // Created in ReceiveStock
    const disposalRef = collection(db, 'disposal_requests'); // Created in ReportDamage

    const unsubscribes = [];

    const fetchAllLogs = () => {
      const allData = [];

      // Helper to handle snapshots
      const processSnapshot = (snapshot, type) => {
        const typeLogs = snapshot.docs.map(doc => ({
          id: doc.id,
          logType: type,
          ...doc.data()
        }));
        
        // Merge and Sort by timestamp
        setLogs(prev => {
          const combined = [...prev.filter(l => l.logType !== type), ...typeLogs];
          return combined.sort((a, b) => {
            const timeA = a.createdAt?.seconds || a.receivedAt?.seconds || a.timestamp?.seconds || 0;
            const timeB = b.createdAt?.seconds || b.receivedAt?.seconds || b.timestamp?.seconds || 0;
            return timeB - timeA;
          });
        });
      };

      unsubscribes.push(onSnapshot(requisitionsRef, (s) => processSnapshot(s, 'REQUISITION')));
      unsubscribes.push(onSnapshot(inwardRef, (s) => processSnapshot(s, 'INWARD')));
      unsubscribes.push(onSnapshot(disposalRef, (s) => processSnapshot(s, 'DISPOSAL')));
      
      setLoading(false);
    };

    fetchAllLogs();
    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const getLogConfig = (type) => {
    switch(type) {
      case 'INWARD': return { color: '#10B981', icon: 'download-outline' }; // Green
      case 'DISPOSAL': return { color: '#EF4444', icon: 'trash-outline' }; // Red
      case 'REQUISITION': return { color: '#3B82F6', icon: 'document-text-outline' }; // Blue
      default: return { color: '#64748B', icon: 'sync-outline' };
    }
  };

  const renderItem = ({ item }) => {
    const config = getLogConfig(item.logType);
    const date = item.createdAt || item.receivedAt || item.timestamp;
    
    return (
      <View style={styles.logCard}>
        <View style={styles.logSideMarker} />
        <View style={styles.logContent}>
          <View style={styles.logHeader}>
            <View style={styles.typeContainer}>
              <Ionicons name={config.icon} size={14} color={config.color} />
              <Text style={[styles.typeLabel, { color: config.color }]}>{item.logType}</Text>
            </View>
            <Text style={styles.logDate}>
              {date?.toDate().toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
            </Text>
          </View>

          <Text style={styles.logTitle}>{item.itemName || item.assetName}</Text>
          
          <View style={styles.metaRow}>
            <Text style={styles.logUser}>By: {item.requestedBy || item.reportedBy || 'System'}</Text>
            <View style={styles.dot} />
            <Text style={styles.logStatus}>{item.status}</Text>
          </View>

          {item.issue && (
            <Text style={styles.issueText} numberOfLines={1}>Issue: {item.issue}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={{ marginLeft: 15 }}>
          <Text style={styles.headerTitle}>GLOBAL AUDIT LOGS</Text>
          <Text style={styles.headerSubtitle}>CIT Cross-Department Activity</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0F172A" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={logs}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No activity logged yet.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  headerSubtitle: { fontSize: 11, color: '#64748B', fontWeight: '700' },
  
  logCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    marginBottom: 12, 
    flexDirection: 'row', 
    overflow: 'hidden',
    elevation: 2
  },
  logSideMarker: { width: 5, backgroundColor: '#0F172A' },
  logContent: { flex: 1, padding: 15 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  typeContainer: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  typeLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  logDate: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  
  logTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  logUser: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  logStatus: { fontSize: 12, color: '#0F172A', fontWeight: '700' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#CBD5E1', marginHorizontal: 8 },
  
  issueText: { fontSize: 11, color: '#EF4444', marginTop: 8, fontStyle: 'italic' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#94A3B8' }
});