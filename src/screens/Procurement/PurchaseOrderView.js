import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Share, 
  ScrollView, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function PurchaseOrderView({ route, navigation }) {
  const { orderData } = route.params;
  
  const poNumber = orderData.poNumber || `PO-CIT-${Math.floor(1000 + Math.random() * 9000)}`;
  const date = orderData.orderedAt 
    ? new Date(orderData.orderedAt.seconds * 1000).toLocaleDateString() 
    : new Date().toLocaleDateString();

  const htmlContent = `
    <html>
      <body style="font-family: 'Helvetica', sans-serif; padding: 40px; color: #1E293B;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h1 style="color: #0F172A; margin: 0;">PURCHASE ORDER</h1>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 12px; color: #64748B;">DOCUMENT NO.</p>
            <p style="margin: 0; font-weight: bold; font-size: 18px;">${poNumber}</p>
          </div>
        </div>
        
        <hr style="border: 0; border-top: 2px solid #E2E8F0; margin: 20px 0;"/>

        <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
          <div style="width: 45%;">
            <p style="font-size: 10px; font-weight: 900; color: #94A3B8; margin-bottom: 5px;">BILL TO</p>
            <p style="margin: 0;"><strong>Chennai Institute of Technology</strong></p>
            <p style="margin: 2px 0; font-size: 12px;">Sarathy Nagar, Kundrathur</p>
            <p style="margin: 2px 0; font-size: 12px;">Chennai - 600069</p>
          </div>
          <div style="width: 45%; text-align: right;">
            <p style="font-size: 10px; font-weight: 900; color: #94A3B8; margin-bottom: 5px;">VENDOR</p>
            <p style="margin: 0;"><strong>${orderData.vendorName || 'N/A'}</strong></p>
            <p style="margin: 2px 0; font-size: 12px;">Contact: ${orderData.vendorMobile || 'N/A'}</p>
            <p style="margin: 2px 0; font-size: 12px;">Date: ${date}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
          <thead>
            <tr style="background-color: #F8FAFC;">
              <th style="padding: 12px; border: 1px solid #E2E8F0; text-align: left;">DESCRIPTION</th>
              <th style="padding: 12px; border: 1px solid #E2E8F0; text-align: center; width: 80px;">QTY</th>
              <th style="padding: 12px; border: 1px solid #E2E8F0; text-align: right; width: 150px;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 12px; border: 1px solid #E2E8F0;">
                <strong>${orderData.itemName}</strong><br/>
                <span style="font-size: 11px; color: #64748B;">Dept: ${orderData.department}</span>
              </td>
              <td style="padding: 12px; border: 1px solid #E2E8F0; text-align: center;">${orderData.quantity}</td>
              <td style="padding: 12px; border: 1px solid #E2E8F0; text-align: right; font-weight: bold;">₹${orderData.totalCost || '0'}</td>
            </tr>
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; margin-top: 60px;">
          <div style="border: 3px double #0052CC; padding: 15px; border-radius: 10px; transform: rotate(-5deg); text-align: center; width: 200px; color: #0052CC; background-color: rgba(0, 82, 204, 0.05);">
            <p style="margin: 0; font-size: 14px; font-weight: 900;">CIT PROCUREMENT</p>
            <p style="margin: 5px 0; font-size: 10px; font-weight: bold; border-top: 1px solid #0052CC; padding-top: 5px;">OFFICIALLY APPROVED</p>
            <p style="margin: 0; font-size: 9px;">Digital Stamp • AstraCIT</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const handleDownloadPDF = async () => {
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert("Error", "Failed to generate official PDF.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>OFFICIAL PURCHASE ORDER</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleDownloadPDF} style={styles.pdfBtn}>
            <Ionicons name="print-outline" size={22} color="#10B981" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Share.share({ message: `AstraCIT PO: ${poNumber}` })} style={styles.shareBtn}>
            <Ionicons name="share-social" size={22} color="#0052CC" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.poCard}>
          <View style={styles.topSection}>
            <View style={styles.brandBox}><Text style={styles.citText}>CIT</Text></View>
            <View style={styles.poMeta}>
                <Text style={styles.poLabel}>OFFICIAL PO NUMBER</Text>
                <Text style={styles.poNumber}>{poNumber}</Text>
                <Text style={styles.dateText}>Issued on: {date}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* PRESERVED BILLING ADDRESS */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>BILLING TO</Text>
            <Text style={styles.orgName}>Chennai Institute of Technology</Text>
            <Text style={styles.address}>Sarathy Nagar, Kundrathur, Chennai - 600069</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>VENDOR INFORMATION</Text>
            <Text style={styles.orgName}>{orderData.vendorName || 'N/A'}</Text>
            <Text style={styles.address}>Contact: {orderData.vendorMobile || 'N/A'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SPECIFICATIONS</Text>
            <View style={styles.itemRow}>
                <View>
                    <Text style={styles.itemName}>{orderData.itemName}</Text>
                    <Text style={styles.deptName}>Department: {orderData.department}</Text>
                </View>
                <View style={styles.qtyBadge}><Text style={styles.qtyText}>x{orderData.quantity}</Text></View>
            </View>
          </View>

          <View style={styles.costBox}>
              <Text style={styles.costLabel}>TOTAL PAYABLE</Text>
              <Text style={styles.costValue}>₹{orderData.totalCost || '0'}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.navigate('ProcurementHub')}>
            <Text style={styles.doneBtnText}>CLOSE DOCUMENT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  headerActions: { flexDirection: 'row', gap: 10 },
  backBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 10 },
  pdfBtn: { padding: 8, backgroundColor: '#ECFDF5', borderRadius: 10 },
  shareBtn: { padding: 8, backgroundColor: '#EFF6FF', borderRadius: 10 },
  headerTitle: { fontSize: 11, fontWeight: '900', color: '#64748B', letterSpacing: 1.5 },
  scrollContent: { padding: 20 },
  poCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 25, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  topSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  brandBox: { width: 50, height: 50, backgroundColor: '#0F172A', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  citText: { color: '#FFF', fontWeight: '900', fontSize: 18 },
  poMeta: { alignItems: 'flex-end' },
  poLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
  poNumber: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  dateText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },
  section: { marginBottom: 25 },
  sectionLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1, marginBottom: 10 },
  orgName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  address: { fontSize: 13, color: '#64748B', marginTop: 4 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 15, borderRadius: 15 },
  itemName: { fontSize: 18, fontWeight: '900', color: '#0052CC' },
  deptName: { fontSize: 12, color: '#64748B' },
  qtyBadge: { backgroundColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  qtyText: { color: '#FFF', fontWeight: '900' },
  costBox: { backgroundColor: '#F0F9FF', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#BAE6FD', marginTop: 10 },
  costLabel: { fontSize: 10, color: '#0369A1', fontWeight: '800' },
  costValue: { fontSize: 24, fontWeight: '900', color: '#0C4A6E', marginTop: 4 },
  footer: { padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#E2E8F0' },
  doneBtn: { backgroundColor: '#0F172A', padding: 18, borderRadius: 16, alignItems: 'center' },
  doneBtnText: { color: '#FFF', fontWeight: '900', fontSize: 14 }
});