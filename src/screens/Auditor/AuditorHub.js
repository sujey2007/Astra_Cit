import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import * as Print from 'expo-print'; // NEW: For PDF Generation
import * as Sharing from 'expo-sharing'; // NEW: For Sharing the file

export default function AuditorHub({ navigation }) {
  const [activeTab, setActiveTab] = useState('Finances'); 
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    let q;
    
    if (activeTab === 'Finances') {
      q = query(collection(db, "institutional_ledger"), orderBy("timestamp", "desc"));
    } else if (activeTab === 'Materials') {
      q = query(collection(db, "requisitions"), orderBy("orderedAt", "desc"));
    } else {
      q = query(collection(db, "construction_attendance"), orderBy("timestamp", "desc"));
    }

    const unsub = onSnapshot(q, (snap) => {
      setData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Audit Fetch Error:", err);
      setLoading(false);
    });

    return unsub;
  }, [activeTab]);

  // ACTUAL PDF GENERATION LOGIC
  const handleExport = async () => {
    if (data.length === 0) {
        Alert.alert("No Data", "There are no records to export in this category.");
        return;
    }

    setIsExporting(true);
    try {
      // Create HTML Table from Live Firestore Data
      const tableRows = data.map(item => `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">${item.vendor || item.itemName || 'N/A'}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${item.amount ? '₹' + item.amount : (item.status || 'Pending')}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${item.timestamp?.toDate().toLocaleDateString() || 'N/A'}</td>
          <td style="padding: 10px; border: 1px solid #ddd; font-size: 8px;">${item.id}</td>
        </tr>
      `).join('');

      const htmlContent = `
        <html>
          <body style="font-family: sans-serif; padding: 20px;">
            <h1 style="text-align: center; color: #0F172A;">CIT AUDIT REPORT</h1>
            <h3 style="text-align: center; color: #6366F1;">Category: ${activeTab}</h3>
            <p style="text-align: center;">Report Generated on: ${new Date().toLocaleString()}</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <thead>
                <tr style="background-color: #f1f5f9;">
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Entity/Item</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Value/Status</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Date</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Document ID</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
            <footer style="margin-top: 50px; text-align: center; font-size: 10px; color: #94A3B8;">
              Secured by AstraCIT Institutional Ledger
            </footer>
          </body>
        </html>
      `;

      // Generate PDF File
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      // Open Sharing Dialogue
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } else {
        // Fallback for Web
        await Print.printAsync({ html: htmlContent });
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Export Failed", "Could not generate PDF document.");
    } finally {
      setIsExporting(false);
    }
  };

  const renderAuditItem = ({ item }) => {
    if (activeTab === 'Finances') {
      return (
        <View style={styles.auditCard}>
          <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
          <View style={styles.cardContent}>
            <Text style={styles.vendorName}>{item.vendor || item.category}</Text>
            <Text style={styles.subText}>Txn ID: {item.id.substring(0,10)}</Text>
            <Text style={styles.date}>{item.timestamp?.toDate().toLocaleString()}</Text>
          </View>
          <Text style={styles.amount}>₹{item.amount?.toLocaleString()}</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.auditCard}>
        <View style={[styles.statusIndicator, { backgroundColor: item.status === 'Paid' || item.paymentStatus === 'Approved' ? '#10B981' : '#F59E0B' }]} />
        <View style={styles.cardContent}>
          <Text style={styles.vendorName}>{item.vendorName || item.itemName || 'Contractor'}</Text>
          <Text style={styles.subText}>{item.status || item.paymentStatus} • {item.requestedBy || item.manager}</Text>
        </View>
        <Ionicons name="shield-checkmark" size={20} color="#6366F1" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Image 
            source={{ uri: 'https://images.shiksha.com/mediadata/images/1583389585phpP9W1tB_m.jpg' }} 
            style={styles.citLogo} 
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerTitle}>AUDITOR HUB</Text>
            <Text style={styles.headerSubtitle}>CIT Integrity Control</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.reportBtn, isExporting && { opacity: 0.7 }]} 
              onPress={handleExport}
              disabled={isExporting}
            >
                {isExporting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="cloud-download" size={18} color="#FFF" />
                    <Text style={styles.reportBtnText}>EXPORT PDF</Text>
                  </>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.logoutBtn}>
                <Ionicons name="log-out-outline" size={24} color="#94A3B8" />
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        {['Finances', 'Materials', 'Labor'].map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.activeTab]} 
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summaryBar}>
        <Text style={styles.summaryLabel}>Verified Audit Logs:</Text>
        <Text style={styles.summaryCount}>{data.length}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          renderItem={renderAuditItem}
          ListEmptyComponent={<Text style={styles.emptyText}>No data logs found for verification.</Text>}
        />
      )}

      <TouchableOpacity 
        style={styles.scanFab} 
        onPress={() => navigation.navigate('AuditorScanner')}
      >
        <Ionicons name="qr-code-outline" size={26} color="#FFF" />
        <Text style={styles.scanFabText}>SCAN ASSET</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 18, 
    backgroundColor: '#0F172A',
    elevation: 5,
    paddingTop: Platform.OS === 'ios' ? 10 : 40
  },
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  citLogo: { width: 38, height: 38, marginRight: 12, borderRadius: 8 },
  headerTitle: { color: '#FFF', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 9, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoutBtn: { padding: 5, marginLeft: 5 },
  reportBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#6366F1', 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    borderRadius: 10, 
    gap: 6
  },
  reportBtnText: { color: '#FFF', fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFF', padding: 8, borderBottomWidth: 1, borderColor: '#E2E8F0' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: '#F1F5F9' },
  tabText: { fontSize: 12, fontWeight: '800', color: '#94A3B8' },
  activeTabText: { color: '#6366F1' },
  summaryBar: { flexDirection: 'row', padding: 16, backgroundColor: '#FFF', margin: 20, marginBottom: 0, borderRadius: 15, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E2E8F0' },
  summaryLabel: { fontSize: 13, color: '#64748B', fontWeight: '700' },
  summaryCount: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  auditCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 18, borderRadius: 20, marginBottom: 12, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
  statusIndicator: { width: 5, height: 45, borderRadius: 10, marginRight: 15 },
  cardContent: { flex: 1 },
  vendorName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  subText: { fontSize: 11, color: '#94A3B8', marginTop: 4, fontWeight: '600' },
  date: { fontSize: 10, color: '#6366F1', marginTop: 3, fontWeight: '700' },
  amount: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  emptyText: { textAlign: 'center', marginTop: 60, color: '#94A3B8', fontWeight: '700', fontSize: 14 },
  scanFab: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 35,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    gap: 12
  },
  scanFabText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1.2 }
});