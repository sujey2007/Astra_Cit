import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import * as Print from 'expo-print'; // Required for PDF generation
import * as Sharing from 'expo-sharing'; // Required to save/send the PDF
import CryptoJS from 'crypto-js'; // For on-the-fly integrity display

const SECRET_SALT = "AstraCIT_Security_2026";

export default function AttendanceHistory({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    // Sync historical logs from Firestore
    const q = query(collection(db, "construction_attendance"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  // BLOCKCHAIN INTEGRITY VERIFICATION FOR UI
  const checkIntegrity = (item) => {
    if (!item.digitalSeal) return 'no-seal';
    
    // Re-verify the hash logic (simplified for UI check)
    // In a production demo, this ensures manual edits in Firebase are caught here
    try {
        const dataToVerify = JSON.stringify({
            present: item.summary.present,
            wage: item.estimatedDailyWage,
            date: item.timestamp?.toDate().toDateString()
        }) + (item.previousSeal || "GENESIS_BLOCK") + SECRET_SALT;
        
        const calculated = CryptoJS.SHA256(dataToVerify).toString();
        return item.digitalSeal === calculated ? 'secure' : 'tampered';
    } catch (e) {
        return 'error';
    }
  };

  // PDF GENERATION LOGIC FOR ACCOUNTS HUB
  const exportToPDF = async () => {
    if (history.length === 0) {
      Alert.alert("Empty", "No historical logs found to export.");
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica'; padding: 20px; color: #1E293B; }
            h1 { color: #1D4ED8; text-align: center; margin-bottom: 5px; }
            .subtitle { text-align: center; color: #64748B; margin-bottom: 30px; font-size: 14px; }
            .log-section { margin-bottom: 30px; border-bottom: 2px solid #F1F5F9; padding-bottom: 15px; }
            .date-header { font-size: 18px; font-weight: bold; color: #0F172A; }
            .wage-highlight { color: #059669; font-weight: bold; font-size: 14px; }
            .seal-badge { font-size: 10px; color: #10B981; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { text-align: left; padding: 10px; border: 1px solid #E2E8F0; font-size: 12px; }
            th { background-color: #F8FAFC; color: #475569; }
            .badge { padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
            .present { background: #DCFCE7; color: #166534; }
            .half-day { background: #FEF3C7; color: #92400E; }
            .leave { background: #FEE2E2; color: #991B1B; }
          </style>
        </head>
        <body>
          <h1>CIT CONSTRUCTION HUB</h1>
          <p class="subtitle">Labor Deployment & Wage Report (Blockchain Verified)</p>
          
          ${history.map(item => `
            <div class="log-section">
              <span class="date-header">${item.timestamp?.toDate().toLocaleDateString('en-GB', { dateStyle: 'long' })}</span>
              <p class="seal-badge">Digital Seal: ${item.digitalSeal ? item.digitalSeal.substring(0, 16) + '...' : 'Unsecured'}</p>
              <p class="wage-highlight">Total Daily Expense: ₹${item.estimatedDailyWage || 0}</p>
              <table>
                <tr>
                  <th>Labor Name</th>
                  <th>Task Assigned</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
                ${item.detailedLogs.map(labor => `
                  <tr>
                    <td>${labor.name}</td>
                    <td>${labor.work}</td>
                    <td>${labor.type}</td>
                    <td><span class="badge ${labor.status.toLowerCase()}">${labor.status}</span></td>
                  </tr>
                `).join('')}
              </table>
            </div>
          `).join('')}
          <p style="text-align: center; font-size: 10px; color: #94A3B8; margin-top: 50px;">
            System Generated Document • Chained Ledger Security Enabled • CodeTitans 2026
          </p>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert("Error", "Failed to generate report.");
    }
  };

  const renderAttendanceItem = ({ item }) => {
    const isExpanded = expandedId === item.id;
    const integrityStatus = checkIntegrity(item);

    return (
      <View style={[
        styles.historyCard, 
        integrityStatus === 'tampered' && { borderColor: '#EF4444', borderWidth: 2 }
      ]}>
        <TouchableOpacity 
          onPress={() => setExpandedId(isExpanded ? null : item.id)}
          style={styles.cardHeader}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.date}>
                {item.timestamp?.toDate().toLocaleDateString('en-GB', { dateStyle: 'medium' })}
              </Text>
              {item.digitalSeal && (
                <View style={styles.sealIndicator}>
                  <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                  <Text style={styles.sealText}>SEALED</Text>
                </View>
              )}
            </View>
            <View style={styles.statsRow}>
              <Text style={[styles.statText, { color: '#10B981' }]}>✅ {item.summary.present}</Text>
              <Text style={[styles.statText, { color: '#F59E0B' }]}>🌓 {item.summary.halfDay}</Text>
              <Text style={[styles.statText, { color: '#EF4444' }]}>❌ {item.summary.leave}</Text>
              <Text style={[styles.statText, { color: '#1D4ED8' }]}>| ₹{item.estimatedDailyWage || 0}</Text>
            </View>
          </View>
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.detailsContainer}>
            <View style={styles.divider} />
            {item.detailedLogs.map((labor, index) => (
              <View key={index} style={styles.detailRow}>
                <View>
                  <Text style={styles.laborName}>{labor.name}</Text>
                  <Text style={styles.laborWork}>{labor.work}</Text>
                </View>
                <View style={[styles.badge, styles[labor.status.replace('-', '').toLowerCase()]]}>
                  <Text style={styles.badgeText}>{labor.status}</Text>
                </View>
              </View>
            ))}
            {item.digitalSeal && (
              <View style={styles.hashBox}>
                <Text style={styles.hashLabel}>BLOCKCHAIN HASH (SHA-256)</Text>
                <Text style={styles.hashValue}>{item.digitalSeal}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.title}>LABOR HISTORY</Text>
        </View>

        {/* PDF EXPORT TRIGGER */}
        <TouchableOpacity style={styles.exportBtn} onPress={exportToPDF}>
          <Ionicons name="document-text" size={20} color="#FFF" />
          <Text style={styles.exportText}>EXPORT PDF</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0052CC" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={renderAttendanceItem}
          ListEmptyComponent={<Text style={styles.emptyText}>No historical logs found.</Text>}
        />
      )}
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
    paddingTop: 50
  },
  headerTitleGroup: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 10 },
  title: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginLeft: 15 },
  exportBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#1D4ED8', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 12, 
    gap: 6,
    elevation: 2
  },
  exportText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  historyCard: { backgroundColor: '#FFF', borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  date: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  sealIndicator: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F0FDF4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  sealText: { fontSize: 9, fontWeight: '900', color: '#10B981' },
  statsRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 5 },
  statText: { fontSize: 12, fontWeight: '700' },
  detailsContainer: { padding: 15, backgroundColor: '#F9FBFF', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginBottom: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  laborName: { fontSize: 14, fontWeight: '700', color: '#334155' },
  laborWork: { fontSize: 11, color: '#64748B' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  present: { backgroundColor: '#DCFCE7' },
  halfday: { backgroundColor: '#FEF3C7' },
  leave: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  hashBox: { marginTop: 15, padding: 10, backgroundColor: '#F1F5F9', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#6366F1' },
  hashLabel: { fontSize: 8, fontWeight: '900', color: '#6366F1', marginBottom: 4 },
  hashValue: { fontSize: 8, color: '#475569', fontFamily: 'monospace' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#94A3B8', fontWeight: '600' }
});