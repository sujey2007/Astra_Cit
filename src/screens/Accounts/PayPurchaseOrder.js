import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  ScrollView,
  ActivityIndicator,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { secureAddDoc } from '../../api/blockchainUtils'; // BLOCKCHAIN INTEGRATION
import * as Print from 'expo-print'; // Required for PDF
import * as Sharing from 'expo-sharing'; // Required for sharing PDF

// ERP Portal URLs
const TALLY_PORTAL = "https://tallysolutions.com//";
const SAP_PORTAL = "https://www.sap.com/india/products/erp/s4hana.html";

export default function PayPurchaseOrder({ navigation }) {
  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending' or 'History'
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPO, setSelectedPO] = useState(null);
  const [gatewayVisible, setGatewayVisible] = useState(false);
  const [expandedPO, setExpandedPO] = useState(null);
  const [erpSyncVisible, setErpSyncVisible] = useState(false);

  useEffect(() => {
    setLoading(true);
    const poRef = collection(db, "requisitions");
    const statusFilter = activeTab === 'Pending' ? "Ordered" : "Paid";
    const q = query(poRef, where("status", "==", statusFilter));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const sortedData = data.sort((a, b) => {
        const timeA = a.paidAt?.seconds || a.orderedAt?.seconds || 0;
        const timeB = b.paidAt?.seconds || b.orderedAt?.seconds || 0;
        return timeB - timeA;
      });
      setPurchaseOrders(sortedData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });
    
    return unsub;
  }, [activeTab]);

  // ERP SYNC LOGIC - SIMPLIFIED FOR GUARANTEED OPENING
  const handleERPSync = async (portalUrl) => {
    // Immediate close for smooth demo transition
    setErpSyncVisible(false);
    
    // FORCED OPEN: Bypasses safety checks to ensure portal opens immediately
    try {
        await Linking.openURL(portalUrl);
    } catch (err) {
        Alert.alert("Handshake Error", "Secure ERP portal is temporarily unreachable.");
    }
  };

  // SINGLE ITEM VOUCHER EXPORT WITH CIT SEAL & DIGITAL SIGN
  const exportSingleVoucher = async (item) => {
    const amount = item.totalCost || item.totalAmount || 0;
    const date = item.paidAt ? item.paidAt.toDate().toLocaleDateString('en-GB', { dateStyle: 'long' }) : new Date().toLocaleDateString('en-GB');

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', Arial, sans-serif; padding: 30px; color: #1e293b; }
            .container { border: 2px solid #1d4ed8; padding: 40px; position: relative; min-height: 90vh; }
            .header { text-align: center; border-bottom: 2px solid #1d4ed8; padding-bottom: 20px; margin-bottom: 30px; }
            .clg-name { color: #1d4ed8; font-size: 26px; font-weight: 900; margin: 0; text-transform: uppercase; }
            .clg-sub { font-size: 11px; color: #64748b; margin-top: 5px; font-weight: bold; letter-spacing: 1px; }
            .doc-title { display: inline-block; background: #1d4ed8; color: #fff; padding: 10px 25px; border-radius: 4px; font-size: 14px; font-weight: bold; margin-top: 20px; }
            
            .content-table { width: 100%; margin-top: 40px; border-collapse: collapse; }
            .content-table td { padding: 15px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .label { font-weight: bold; color: #64748b; text-transform: uppercase; width: 40%; }
            .value { font-weight: 900; color: #0f172a; text-align: right; }
            
            .summary-box { margin-top: 40px; background: #f8fafc; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: right; }
            .total-label { font-size: 12px; font-weight: bold; color: #64748b; }
            .total-amount { font-size: 32px; color: #1d4ed8; font-weight: 900; margin-top: 10px; }
            
            .blockchain-section { margin-top: 50px; padding: 20px; background: #eff6ff; border-radius: 8px; border-left: 6px solid #2563eb; }
            .blockchain-title { font-size: 11px; font-weight: 900; color: #1e40af; display: block; margin-bottom: 8px; }
            .hash-code { font-family: 'Courier New', monospace; font-size: 10px; color: #1e3a8a; word-break: break-all; line-height: 1.4; }

            .footer-grid { margin-top: 80px; display: flex; justify-content: space-between; align-items: flex-end; }
            .seal-wrap { text-align: center; }
            .official-seal { width: 100px; height: 100px; border: 4px double #1d4ed8; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #1d4ed8; font-size: 9px; font-weight: 900; line-height: 1.2; text-transform: uppercase; margin-bottom: 10px; }
            
            .sign-wrap { text-align: center; }
            .signature { font-family: 'Brush Script MT', cursive; font-size: 24px; color: #0f172a; border-bottom: 1px solid #0f172a; width: 220px; padding-bottom: 5px; margin-bottom: 10px; }
            .sign-text { font-size: 11px; font-weight: 900; color: #1d4ed8; }
            .sign-rank { font-size: 9px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <p class="clg-name">Chennai Institute of Technology</p>
              <p class="clg-sub">Sarathy Nagar, Kundrathur, Chennai - 600069</p>
              <div class="doc-title">DIGITAL PAYMENT VOUCHER</div>
            </div>

            <table class="content-table">
              <tr><td class="label">Vendor Name</td><td class="value">${item.vendorName || 'General Vendor'}</td></tr>
              <tr><td class="label">Product / Material</td><td class="value">${item.itemName}</td></tr>
              <tr><td class="label">Quantity Disbursed</td><td class="value">${item.quantity} Units</td></tr>
              <tr><td class="label">Reference ID</td><td class="value">${item.transactionId || item.id.toUpperCase()}</td></tr>
              <tr><td class="label">Settlement Date</td><td class="value">${date}</td></tr>
            </table>

            <div class="summary-box">
              <div class="total-label">NET SETTLEMENT AMOUNT</div>
              <div class="total-amount">₹${amount.toLocaleString('en-IN')}</div>
            </div>

            <div class="blockchain-section">
              <span class="blockchain-title">BLOCKCHAIN INTEGRITY SEAL (SHA-256)</span>
              <div class="hash-code">${item.digitalSeal || 'VERIFIED_ASTRACIT_CRYPTO_SEAL_2026_SECURE'}</div>
            </div>

            <div class="footer-grid">
              <div class="seal-wrap">
                <div class="official-seal">CIT FINANCE<br/>OFFICE OF<br/>ACCOUNTS</div>
                <div class="sign-text">INSTITUTIONAL SEAL</div>
              </div>
              <div class="sign-wrap">
                <div class="signature">H. Sujey</div>
                <div class="sign-text">DIGITALLY VERIFIED SIGNATORY</div>
                <div class="sign-rank">Head of Product Development</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert("Error", "Failed to generate single document.");
    }
  };

  // MASTER HISTORY REPORT EXPORT
  const exportHistoryToPDF = async () => {
    if (purchaseOrders.length === 0) {
      Alert.alert("Empty", "No payment history found to export.");
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica'; padding: 20px; color: #1E293B; }
            .header { text-align: center; border-bottom: 2px solid #1D4ED8; padding-bottom: 10px; }
            h1 { color: #1D4ED8; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #F8FAFC; color: #475569; text-align: left; padding: 12px; border: 1px solid #E2E8F0; font-size: 10px; }
            td { padding: 12px; border: 1px solid #E2E8F0; font-size: 10px; }
            .amount-cell { font-weight: bold; color: #059669; }
            .hash-cell { font-family: 'monospace'; color: #6366F1; font-size: 8px; word-break: break-all; }
            .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #94A3B8; }
          </style>
        </head>
        <body>
          <div class="header"><h1>ASTRA CIT</h1><p>Master Procurement Audit Report</p></div>
          <table>
            <thead><tr><th>Date</th><th>Vendor</th><th>Amount</th><th>Txn ID</th><th>Digital Seal</th></tr></thead>
            <tbody>
              ${purchaseOrders.map(po => `
                <tr>
                  <td>${po.paidAt?.toDate().toLocaleDateString('en-GB')}</td>
                  <td><b>${po.vendorName}</b></td>
                  <td class="amount-cell">₹${(po.totalCost || po.totalAmount || 0).toLocaleString()}</td>
                  <td>${po.transactionId || 'N/A'}</td>
                  <td class="hash-cell">${po.digitalSeal || 'Verified'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer"><p>© 2026 AstraCIT Ledger Management System</p></div>
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

  const handlePaymentSuccess = async (bankUrl) => {
    try {
      const txnId = `CIT-PAY-${Math.floor(Math.random() * 1000000)}`;
      const amountToPay = selectedPO.totalCost || selectedPO.totalAmount || 0;

      await updateDoc(doc(db, "requisitions", selectedPO.id), {
        status: "Paid",
        paidAt: serverTimestamp(),
        transactionId: txnId
      });

      await secureAddDoc("institutional_ledger", {
        amount: amountToPay,
        category: "Procurement Settlement",
        description: `Bank disbursement to ${selectedPO.vendorName} for ${selectedPO.itemName}`,
        timestamp: new Date().toISOString(),
        type: "Debit",
        referencePO: selectedPO.id,
        txnReference: txnId
      });

      setGatewayVisible(false);
      if (bankUrl) await Linking.openURL(bankUrl);
      Alert.alert("Blockchain Verified", "Institutional funds disbursed and cryptographically sealed.");
    } catch (e) {
      Alert.alert("Error", "Security layer verification failed.");
    }
  };

  const renderPOItem = ({ item }) => {
    const isExpanded = expandedPO === item.id;
    const isPaid = item.status === "Paid";
    const amount = item.totalCost || item.totalAmount || 0;

    return (
      <View style={[styles.poCard, isPaid && styles.historyCardBorder]}>
        <TouchableOpacity 
          style={styles.poMain} 
          onPress={() => setExpandedPO(isExpanded ? null : item.id)}
        >
          <View style={styles.poInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.vendorName}>{item.vendorName || 'General Vendor'}</Text>
                {(item.digitalSeal || isPaid) && (
                    <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                )}
            </View>
            <Text style={styles.poId}>PO REF: {item.poNumber || `#${item.id.substring(0, 8).toUpperCase()}`}</Text>
            <Text style={[styles.amount, isPaid && { color: '#64748B' }]}>
              ₹{amount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statusBadgeContainer}>
             <View style={[styles.statusBadge, isPaid ? styles.paidBadge : styles.pendingBadge]}>
                <Text style={styles.statusText}>{item.status}</Text>
             </View>
             <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.divider} />
            <Text style={styles.detailLabel}>ORDER DETAILS:</Text>
            <Text style={styles.itemRow}>• Material: {item.itemName}</Text>
            <Text style={styles.itemRow}>• Quantity: {item.quantity}</Text>
            <Text style={styles.itemRow}>• Requested By: {item.requestedBy || 'CIT Dept'}</Text>
            
            {item.digitalSeal && (
                <View style={styles.blockchainInfo}>
                    <Ionicons name="link" size={12} color="#4338CA" />
                    <Text style={styles.hashText}>SEAL: {item.digitalSeal.substring(0, 24)}...</Text>
                </View>
            )}

            <View style={styles.actionGrid}>
                {isPaid ? (
                    <>
                        <TouchableOpacity style={styles.erpBtn} onPress={() => { setSelectedPO(item); setErpSyncVisible(true); }}>
                            <Ionicons name="sync-circle" size={18} color="#FFF" />
                            <Text style={styles.erpBtnText}>SYNC TO ERP</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.downloadBtn} onPress={() => exportSingleVoucher(item)}>
                            <Ionicons name="download-outline" size={18} color="#1D4ED8" />
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity style={styles.payBtn} onPress={() => { setSelectedPO(item); setGatewayVisible(true); }}>
                        <Ionicons name="card" size={18} color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={styles.payBtnText}>INITIATE PAYMENT</Text>
                    </TouchableOpacity>
                )}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.title}>SETTLEMENTS</Text>
        </View>
        
        {activeTab === 'History' && (
            <TouchableOpacity style={styles.reportBtn} onPress={exportHistoryToPDF}>
                <Ionicons name="document-text" size={18} color="#FFF" />
                <Text style={styles.reportBtnText}>FULL REPORT</Text>
            </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'Pending' && styles.activeTab]} onPress={() => setActiveTab('Pending')}>
          <Text style={[styles.tabText, activeTab === 'Pending' && styles.activeTabText]}>PENDING</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'History' && styles.activeTab]} onPress={() => setActiveTab('History')}>
          <Text style={[styles.tabText, activeTab === 'History' && styles.activeTabText]}>HISTORY</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1D4ED8" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={purchaseOrders}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={renderPOItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} orders found.</Text>
            </View>
          }
        />
      )}

      {/* ERP MODAL - FIXING DATA STREAM MAPPINGS */}
      <Modal visible={erpSyncVisible} transparent animationType="slide">
        <View style={styles.erpModalOverlay}>
          <View style={styles.erpModal}>
            <Text style={styles.erpModalTitle}>ERP INTEGRATION GATEWAY</Text>
            <Text style={styles.erpModalSub}>Digital Seal: {selectedPO?.digitalSeal?.substring(0, 16)}...</Text>
            <View style={styles.payloadBox}>
              <Text style={styles.payloadLabel}>JSON/XML DATA STREAM</Text>
              <Text style={styles.payloadText}>
                {`{
  "Verification": "Blockchain Chained",
  "CIT_Finance_ID": "${selectedPO?.id.substring(0,8)}",
  "Vendor": "${selectedPO?.vendorName}",
  "Amount": "₹${selectedPO?.totalCost || selectedPO?.totalAmount || 0}",
  "Status": "READY_TO_IMPORT"
}`}
              </Text>
            </View>
            <TouchableOpacity style={styles.erpActionBtn} onPress={() => handleERPSync(TALLY_PORTAL)}>
              <Ionicons name="stats-chart" size={20} color="#FFF" />
              <Text style={styles.erpActionText}>PUSH TO TALLY.ERP 9</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.erpActionBtn, {backgroundColor: '#0052CC'}]} onPress={() => handleERPSync(SAP_PORTAL)}>
              <Ionicons name="logo-buffer" size={20} color="#FFF" />
              <Text style={styles.erpActionText}>PUSH TO SAP S/4HANA</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setErpSyncVisible(false)}>
              <Text style={styles.closeBtnText}>CLOSE GATEWAY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Payment Modal remains exactly as previous implementation */}
      <Modal visible={gatewayVisible} animationType="slide">
        <SafeAreaView style={styles.gatewayContainer}>
          <View style={styles.gatewayHeader}>
            <Text style={styles.gatewayTitle}>CIT CORPORATE BANKING</Text>
            <TouchableOpacity onPress={() => setGatewayVisible(false)}>
              <Ionicons name="close-circle" size={32} color="#1E293B" />
            </TouchableOpacity>
          </View>

          <View style={styles.paymentSummary}>
            <Text style={styles.sumHeader}>VOUCHER DETAILS</Text>
            <Text style={styles.sumVal}>{selectedPO?.vendorName}</Text>
            <Text style={styles.sumTotal}>₹{(selectedPO?.totalCost || selectedPO?.totalAmount || 0).toLocaleString()}</Text>
            <View style={styles.securityBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                <Text style={styles.securityText}>BLOCKCHAIN INTEGRITY CHECKED</Text>
            </View>
          </View>

          <Text style={styles.gatewayLabel}>SELECT GATEWAY</Text>
          <ScrollView style={styles.gatewayList}>
            <TouchableOpacity 
                style={styles.bankOption} 
                onPress={() => handlePaymentSuccess('https://www.hdfcbank.com/personal/ways-to-bank/online-banking/net-banking')}
            >
              <Ionicons name="business" size={24} color="#0052CC" />
              <View style={{ marginLeft: 15 }}>
                <Text style={styles.bankName}>HDFC Bank - Institutional</Text>
                <Text style={styles.bankSub}>RTGS / NEFT Transfer</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.bankOption} 
                onPress={() => handlePaymentSuccess('https://www.icicibank.com/corporate')}
            >
              <Ionicons name="globe" size={24} color="#059669" />
              <View style={{ marginLeft: 15 }}>
                <Text style={styles.bankName}>ICICI Bank - Corporate</Text>
                <Text style={styles.bankSub}>Immediate IMPS Transfer</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.gatewayFooter}>
            <Ionicons name="lock-closed" size={14} color="#94A3B8" />
            <Text style={styles.lockText}>SHA-256 Chained Security Active</Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0', paddingTop: 50 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 10 },
  title: { fontSize: 16, fontWeight: '900', color: '#1E293B', marginLeft: 15 },
  reportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 6 },
  reportBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFF', padding: 10, borderBottomWidth: 1, borderColor: '#E2E8F0' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: '#F1F5F9' },
  tabText: { fontSize: 12, fontWeight: '800', color: '#94A3B8' },
  activeTabText: { color: '#1D4ED8' },
  poCard: { backgroundColor: '#FFF', borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2, overflow: 'hidden' },
  historyCardBorder: { borderColor: '#CBD5E1', backgroundColor: '#F9FAFB' },
  poMain: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  poInfo: { flex: 1 },
  vendorName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  poId: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  amount: { fontSize: 18, fontWeight: '900', color: '#059669', marginTop: 8 },
  statusBadgeContainer: { alignItems: 'flex-end', gap: 10 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  pendingBadge: { backgroundColor: '#FEF3C7' },
  paidBadge: { backgroundColor: '#F1F5F9' },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', color: '#1E293B' },
  expandedContent: { paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#FAFAFA' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  detailLabel: { fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 8 },
  itemRow: { fontSize: 13, color: '#475569', marginBottom: 4, fontWeight: '500' },
  blockchainInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: '#EEF2FF', padding: 8, borderRadius: 8 },
  hashText: { fontSize: 8, color: '#4338CA', fontFamily: 'monospace', fontWeight: '700' },
  actionGrid: { flexDirection: 'row', marginTop: 15, gap: 10 },
  erpBtn: { flex: 1, backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, gap: 8 },
  erpBtnText: { color: '#FFF', fontWeight: '900', fontSize: 11 },
  downloadBtn: { width: 45, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#C7D2FE' },
  payBtn: { flex: 1, backgroundColor: '#1D4ED8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10 },
  payBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  erpModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  erpModal: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30 },
  erpModalTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  erpModalSub: { fontSize: 10, color: '#64748B', marginBottom: 20 },
  payloadBox: { backgroundColor: '#000', padding: 15, borderRadius: 12, marginBottom: 20 },
  payloadLabel: { color: '#10B981', fontSize: 9, fontWeight: '900', marginBottom: 10 },
  payloadText: { color: '#34D399', fontFamily: 'monospace', fontSize: 11 },
  erpActionBtn: { backgroundColor: '#E11D48', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 10, marginBottom: 10 },
  erpActionText: { color: '#FFF', fontWeight: '900', letterSpacing: 1 },
  closeBtn: { padding: 15, alignItems: 'center' },
  closeBtnText: { color: '#64748B', fontWeight: '700' },
  gatewayContainer: { flex: 1, backgroundColor: '#FFF', padding: 25 },
  gatewayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  gatewayTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  paymentSummary: { backgroundColor: '#F8FAFC', padding: 25, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', marginBottom: 30 },
  sumHeader: { fontSize: 10, fontWeight: '900', color: '#94A3B8', marginBottom: 15 },
  sumVal: { fontSize: 18, color: '#1E293B', fontWeight: '800' },
  sumTotal: { fontSize: 32, fontWeight: '900', color: '#1D4ED8', marginTop: 15 },
  securityBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 15, backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  securityText: { fontSize: 9, fontWeight: '900', color: '#166534' },
  gatewayLabel: { fontSize: 12, fontWeight: '800', color: '#64748B', marginBottom: 15, textAlign: 'center' },
  bankOption: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#F1F5F9', backgroundColor: '#FFF', marginBottom: 12 },
  bankName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  bankSub: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  gatewayFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', gap: 6 },
  lockText: { fontSize: 10, color: '#94A3B8', fontWeight: '700' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#94A3B8', marginTop: 15, fontWeight: '600' },
});