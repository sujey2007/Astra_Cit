import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

// Database Imports
import { db } from '../../api/firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDocs, query, where } from 'firebase/firestore';

const { width } = Dimensions.get('window');

// CIT SPECIFIC DEPARTMENTS
const CIT_DEPARTMENTS = [
  "Computer Science & Engineering (CSE)",
  "Information Technology (IT)",
  "Artificial Intelligence & Data Science (AI&DS)",
  "Artificial Intelligence & Machine Learning (AI&ML)",
  "Computer Science & Business Systems (CSBS)",
  "Cyber Security",
  "Electronics & Communication (ECE)",
  "Electrical & Electronics (EEE)",
  "Mechanical Engineering",
  "Mechatronics Engineering",
  "Civil Engineering",
  "Biomedical Engineering",
  "Science & Humanities",
  "Construction & Maintenance",
  "Transport Department",
  "Hostel & Mess Administration",
  "Central Library",
  "Placement & Training Cell",
  "Center of Excellence (COE)"
];

export default function ReceiveStock({ navigation }) {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [department, setDepartment] = useState("");
  const [targetLocation, setTargetLocation] = useState("");
  
  // Dropdown State
  const [isDeptDropdownVisible, setIsDeptDropdownVisible] = useState(false);
  
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState('scan'); // 'scan' or 'capture'
  const [capturedImage, setCapturedImage] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const cameraRef = useRef(null);

  // Verification Logic: Updates Live Inventory with Department & Lab info
  const handleVerify = async () => {
    if (!productName || !quantity || !department || !targetLocation) {
      Alert.alert("Required Fields", "Please enter the Product Name, Quantity, Department, and Target Location.");
      return;
    }

    setIsVerifying(true);
    try {
      const inventoryRef = collection(db, 'inventory');
      const q = query(inventoryRef, where("itemName", "==", productName.trim()));
      const querySnapshot = await getDocs(q);

      const entryData = {
        itemName: productName.trim(),
        stockCount: parseInt(quantity),
        category: department.trim(),
        targetDepartment: department.trim(),
        targetLocation: targetLocation.trim(),
        lastUpdated: serverTimestamp(),
        lastInvoice: invoiceNumber || "Captured Bill",
        billImage: capturedImage
      };

      if (!querySnapshot.empty) {
        const itemDoc = querySnapshot.docs[0];
        const newCount = parseInt(itemDoc.data().stockCount) + parseInt(quantity);
        await updateDoc(doc(db, 'inventory', itemDoc.id), {
          ...entryData,
          stockCount: newCount
        });
      } else {
        await addDoc(inventoryRef, {
          ...entryData,
          createdAt: serverTimestamp()
        });
      }

      Alert.alert("Stock Received", `${productName} has been allocated for ${targetLocation} (${department}).`);
      
      // Reset Form
      setInvoiceNumber("");
      setProductName("");
      setQuantity("");
      setDepartment("");
      setTargetLocation("");
      setCapturedImage(null);
    } catch (error) {
      Alert.alert("Database Error", "Failed to update inventory.");
    } finally {
      setIsVerifying(false);
    }
  };

  const openCamera = async (mode) => {
    setCameraMode(mode);
    if (!permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert("Permission Denied", "Camera access is required.");
        return;
      }
    }
    setShowCamera(true);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setCapturedImage(photo.uri);
        setShowCamera(false);
        Alert.alert("Bill Captured", "Please fill in the allocation details below.");
      } catch (e) {
        Alert.alert("Error", "Failed to capture image.");
      }
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView 
          ref={cameraRef}
          style={StyleSheet.absoluteFill} 
          onBarcodeScanned={cameraMode === 'scan' ? ({ data }) => {
            setInvoiceNumber(data);
            setShowCamera(false);
            Alert.alert("Scan Successful", `Invoice/PO: ${data}`);
          } : undefined}
        />
        
        <View style={styles.cameraOverlay}>
          <TouchableOpacity style={styles.closeCamera} onPress={() => setShowCamera(false)}>
            <Ionicons name="close-circle" size={44} color="white" />
          </TouchableOpacity>

          {cameraMode === 'capture' && (
            <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
          )}

          <Text style={styles.cameraHint}>
            {cameraMode === 'scan' ? "Align QR code within frame" : "Center the physical bill in the frame"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RECEIVE STOCK</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.mainLabel}>SELECT INWARDING METHOD</Text>
        
        <View style={styles.grid}>
          <TouchableOpacity style={styles.methodCard} activeOpacity={0.7} onPress={() => openCamera('scan')}>
            <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="scan-circle" size={32} color="#4338CA" />
            </View>
            <Text style={styles.cardTitle}>Instant Scan</Text>
            <Text style={styles.cardDesc}>Auto-detect PO/Invoice via QR.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.methodCard} activeOpacity={0.7} onPress={() => openCamera('capture')}>
            <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="camera" size={30} color="#16A34A" />
            </View>
            <Text style={styles.cardTitle}>Snap Bill</Text>
            <Text style={styles.cardDesc}>Upload photo proof of receipt.</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.manualSection}>
          <Text style={styles.sectionLabel}>INWARDING & ALLOCATION DETAILS</Text>
          
          {capturedImage && (
            <View style={styles.previewContainer}>
              <Image source={{ uri: capturedImage }} style={styles.billPreview} />
              <TouchableOpacity style={styles.removeImage} onPress={() => setCapturedImage(null)}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
              <Text style={styles.previewLabel}>Bill Captured Successfully</Text>
            </View>
          )}

          {/* INVOICE NUMBER */}
          <View style={styles.inputWrapper}>
            <Ionicons name="barcode-outline" size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput 
              style={styles.input}
              placeholder="Invoice / PO Number"
              placeholderTextColor="#94A3B8"
              value={invoiceNumber}
              onChangeText={setInvoiceNumber}
            />
          </View>

          {/* PRODUCT NAME */}
          <View style={styles.inputWrapper}>
            <Ionicons name="cube-outline" size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput 
              style={styles.input}
              placeholder="Product Name (Required)"
              placeholderTextColor="#94A3B8"
              value={productName}
              onChangeText={setProductName}
            />
          </View>

          {/* QUANTITY */}
          <View style={styles.inputWrapper}>
            <Ionicons name="calculator-outline" size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput 
              style={styles.input}
              placeholder="Quantity Received"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />
          </View>

          {/* DEPARTMENT DROPDOWN */}
          <View style={[styles.inputGroup, { zIndex: 2000 }]}>
            <TouchableOpacity 
              style={styles.inputWrapper} 
              onPress={() => setIsDeptDropdownVisible(!isDeptDropdownVisible)}
            >
              <Ionicons name="business-outline" size={20} color="#64748B" style={styles.inputIcon} />
              <Text style={[styles.dropdownValue, !department && { color: "#94A3B8" }]}>
                {department || "Select Department"}
              </Text>
              <Ionicons name={isDeptDropdownVisible ? "chevron-up" : "chevron-down"} size={18} color="#2563EB" />
            </TouchableOpacity>

            {isDeptDropdownVisible && (
              <View style={styles.dropdownListContainer}>
                <ScrollView nestedScrollEnabled={true} style={styles.dropdownScrollView}>
                  {CIT_DEPARTMENTS.map((dept) => (
                    <TouchableOpacity 
                      key={dept} 
                      style={styles.deptItem}
                      onPress={() => {
                        setDepartment(dept);
                        setIsDeptDropdownVisible(false);
                      }}
                    >
                      <Text style={styles.deptItemText}>{dept}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* LAB / CLASSROOM */}
          <View style={styles.inputWrapper}>
            <Ionicons name="location-outline" size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput 
              style={styles.input}
              placeholder="Target Lab / Classroom"
              placeholderTextColor="#94A3B8"
              value={targetLocation}
              onChangeText={setTargetLocation}
            />
          </View>

          <TouchableOpacity 
            style={[styles.verifyBtn, (!productName || !quantity || !department || !targetLocation) && styles.btnDisabled]} 
            onPress={handleVerify}
            disabled={isVerifying || !productName || !quantity || !department || !targetLocation}
          >
            {isVerifying ? <ActivityIndicator color="white" /> : <Text style={styles.verifyText}>VERIFY & UPDATE INVENTORY</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={20} color="#2563EB" />
          <Text style={styles.infoText}>
            Updating inventory ensures <Text style={{fontWeight:'700'}}>Live Tracker</Text> accuracy for Department HODs.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  cameraContainer: { flex: 1, backgroundColor: 'black' },
  cameraOverlay: { flex: 1, justifyContent: 'space-between', padding: 40, alignItems: 'center' },
  closeCamera: { alignSelf: 'flex-end', marginTop: 20 },
  captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  captureInner: { width: 66, height: 66, borderRadius: 33, backgroundColor: 'white' },
  cameraHint: { color: 'white', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, fontSize: 12, marginBottom: 20, textAlign: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', letterSpacing: 0.5 },
  scrollContent: { padding: 24 },
  mainLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 20 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  methodCard: { width: (width - 68) / 2, backgroundColor: '#FFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', elevation: 3 },
  iconBox: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  cardDesc: { fontSize: 11, color: '#64748B', marginTop: 5, lineHeight: 16 },
  manualSection: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: '#64748B', marginBottom: 15, textAlign: 'center' },
  previewContainer: { alignItems: 'center', marginBottom: 20 },
  billPreview: { width: '100%', height: 150, borderRadius: 12, backgroundColor: '#F1F5F9' },
  removeImage: { position: 'absolute', top: -10, right: -10, backgroundColor: 'white', borderRadius: 12 },
  previewLabel: { fontSize: 11, color: '#16A34A', fontWeight: '700', marginTop: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 15, height: 55, marginBottom: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1E293B' },
  
  // Dropdown specific styles
  inputGroup: { position: 'relative' },
  dropdownValue: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1E293B' },
  dropdownListContainer: { 
    position: 'absolute', top: 60, left: 0, right: 0, backgroundColor: '#FFF', 
    borderRadius: 12, elevation: 15, zIndex: 3000, borderWidth: 1, borderColor: '#F1F5F9', maxHeight: 200, overflow: 'hidden' 
  },
  dropdownScrollView: { flexGrow: 0 },
  deptItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  deptItemText: { fontSize: 13, color: '#475569', fontWeight: '600' },

  verifyBtn: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnDisabled: { backgroundColor: '#94A3B8' },
  verifyText: { color: '#FFF', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  infoBox: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingHorizontal: 10, paddingBottom: 20 },
  infoText: { flex: 1, fontSize: 12, color: '#475569', marginLeft: 10, lineHeight: 18 }
});