import React, { useState } from 'react';
import {
View,
Text,
TextInput,
TouchableOpacity,
StyleSheet,
KeyboardAvoidingView,
Platform,
ActivityIndicator,
StatusBar,
ScrollView,
Image,
Dimensions,
Alert,
Modal
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

// Database Imports
import { db } from '../../api/firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

const ROLES = [
{ id: "Stores", label: "Stores Department" },
{ id: "HOD", label: "Department HOD" },
{ id: "Procurement", label: "Purchase Officer" },
{ id: "Construction", label: "Construction Manager" },
{ id: "Auditor", label: "Internal Auditor" },
{ id: "Executive", label: "Executive Board" },
{ id: "Accounts", label: "Accounts Department" },
{ id: "Admin", label: "System Admin" }
];

export default function LoginScreen({ navigation }) {

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [selectedRole, setSelectedRole] = useState(null);
const [isDropdownVisible, setIsDropdownVisible] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [errorMessage, setErrorMessage] = useState("");

// Forgot Password States
const [forgotModal, setForgotModal] = useState(false);
const [forgotUsername, setForgotUsername] = useState("");
const [isSending, setIsSending] = useState(false);

const handleLogin = async () => {

if (!selectedRole) {
setErrorMessage("Please select your designation.");
return;
}

if (!email || !password) {
setErrorMessage("Enter your username and password.");
return;
}

// MOCK LOGIN
if (email.toLowerCase().trim() === "sujey" && password === "24680") {
setIsLoading(true);
setTimeout(() => {
setIsLoading(false);
navigation.replace(`${selectedRole}Hub`);
}, 500);
return;
}

setIsLoading(true);
setErrorMessage("");

try {

const userRef = doc(db, "users", email.toLowerCase().trim());
const userSnap = await getDoc(userRef);

if (!userSnap.exists() || userSnap.data().password !== password) {
setErrorMessage("Invalid credentials.");
setIsLoading(false);
return;
}

if (userSnap.data().role !== selectedRole) {
setErrorMessage(`No ${selectedRole} permissions.`);
setIsLoading(false);
return;
}

navigation.replace(`${userSnap.data().role}Hub`);

} catch (error) {

setIsLoading(false);
setErrorMessage("Connection failed.");

}

};

// UPDATED: Functional Forgot Password Logic
const handleForgotPasswordRequest = async () => {
    if (!forgotUsername) {
        Alert.alert("Input Required", "Please enter your username.");
        return;
    }

    setIsSending(true);
    try {
        // 1. Verify if user exists in 'users' collection
        const userRef = doc(db, "users", forgotUsername.toLowerCase().trim());
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            Alert.alert("User Not Found", "This username is not registered in the system.");
            setIsSending(false);
            return;
        }

        // 2. Create a request for the Admin
        await setDoc(doc(db, "password_requests", forgotUsername.toLowerCase().trim()), {
            username: forgotUsername.toLowerCase().trim(),
            role: userSnap.data().role,
            status: "Pending",
            requestedAt: serverTimestamp()
        });

        Alert.alert(
            "Request Sent", 
            "The System Admin has been notified. Please contact them for your new login credentials.",
            [{ text: "OK", onPress: () => setForgotModal(false) }]
        );
        setForgotUsername("");
    } catch (error) {
        Alert.alert("Error", "Could not send request. Please check your connection.");
    } finally {
        setIsSending(false);
    }
};

return (

<View style={styles.container}>

<StatusBar barStyle="light-content"/>

{/* GRADIENT HEADER */}
<LinearGradient
colors={['#2563EB','#1E40AF','#1E3A8A']}
style={styles.topSection}
>

<View style={styles.logoWrapper}>

<Image
source={require('../../../assets/logo.png')}
style={styles.citLogo}
resizeMode="contain"
/>

<Text style={styles.astraText}>
ASTRA<Text style={{fontWeight:'300'}}>CIT</Text>
</Text>

</View>

<View style={styles.waveContainer}>
<Svg height="100" width={width} viewBox={`0 0 ${width} 100`}>

<Path
fill="#FFFFFF"
d={`M0,50 C${width/4},100 ${width*3/4},0 ${width},50 L${width},100 L0,100 Z`}
/>

</Svg>
</View>

</LinearGradient>

<KeyboardAvoidingView
behavior={Platform.OS === "ios" ? "padding" : "height"}
style={styles.formSection}
>

<ScrollView
showsVerticalScrollIndicator={false}
contentContainerStyle={{paddingTop:20}}
>

<View style={styles.card}>

<Text style={styles.welcomeText}>
Welcome <Text style={{fontWeight:'300'}}>back!</Text>
</Text>

{/* ROLE SELECTOR - FIXED WITH MODAL FOR FULL SCROLLING */}

<View style={styles.inputGroup}>

<Text style={styles.label}>DESIGNATION</Text>

<TouchableOpacity
style={styles.dropdown}
onPress={()=>setIsDropdownVisible(true)}
>

<Text style={[styles.dropdownText,!selectedRole && {color:'#94A3B8'}]}>
{selectedRole ? ROLES.find(r=>r.id===selectedRole)?.label : "Select your role"}
</Text>

<Ionicons
name="chevron-down"
size={20}
color="#2563EB"
/>

</TouchableOpacity>

{/* DESIGNATION MODAL PICKER */}
<Modal
    visible={isDropdownVisible}
    transparent={true}
    animationType="fade"
>
    <View style={styles.modalOverlay}>
        <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Designation</Text>
                <TouchableOpacity onPress={() => setIsDropdownVisible(false)}>
                    <Ionicons name="close-circle" size={24} color="#64748B" />
                </TouchableOpacity>
            </View>
            
            <ScrollView style={{maxHeight: height * 0.5}}>
                {ROLES.map((role) => (
                    <TouchableOpacity
                        key={role.id}
                        style={[
                            styles.roleItem,
                            selectedRole === role.id && { backgroundColor: '#EFF6FF' }
                        ]}
                        onPress={() => {
                            setSelectedRole(role.id);
                            setIsDropdownVisible(false);
                        }}
                    >
                        <Text style={[
                            styles.roleItemText,
                            selectedRole === role.id && { color: '#2563EB' }
                        ]}>
                            {role.label}
                        </Text>
                        {selectedRole === role.id && (
                            <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    </View>
</Modal>

</View>

{/* USERNAME */}

<View style={styles.inputGroup}>

<Text style={styles.label}>USERNAME</Text>

<View style={styles.inputWrapper}>

<TextInput
style={styles.input}
placeholder="Enter username"
placeholderTextColor="#94A3B8"
autoCapitalize="none"
value={email}
onChangeText={setEmail}
/>

<Ionicons name="person-outline" size={18} color="#2563EB"/>

</View>

</View>

{/* PASSWORD */}

<View style={styles.inputGroup}>

<Text style={styles.label}>PASSWORD</Text>

<View style={styles.inputWrapper}>

<TextInput
style={styles.input}
placeholder="••••••••"
placeholderTextColor="#94A3B8"
secureTextEntry={!showPassword}
value={password}
onChangeText={setPassword}
/>

<TouchableOpacity
onPress={()=>setShowPassword(!showPassword)}
>

<Ionicons
name={showPassword ? "eye-off-outline":"eye-outline"}
size={20}
color="#2563EB"
/>

</TouchableOpacity>

</View>

</View>

{errorMessage!=="" && (
<Text style={styles.errorText}>{errorMessage}</Text>
)}

{/* LOGIN BUTTON */}

<TouchableOpacity
style={styles.loginBtn}
onPress={handleLogin}
disabled={isLoading}
>

{isLoading
?
<ActivityIndicator color="#FFF"/>
:
<Text style={styles.loginBtnText}>LOGIN</Text>
}

</TouchableOpacity>

<TouchableOpacity 
    style={styles.forgotBtn}
    onPress={() => setForgotModal(true)}
>

<Text style={styles.forgotText}>
Forgot password?
</Text>

</TouchableOpacity>

</View>

{/* COPYRIGHT SECTION */}
<View style={styles.footerContainer}>
    <Text style={styles.tagline}>Intelligent Resource & Ledger Management</Text>
    <Text style={styles.copyrightText}>
        © 2026 AstraCIT • Developed by <Text style={{fontWeight: '900', color: '#1E40AF'}}>CodeTitans</Text>
    </Text>
    <Text style={styles.rightsText}>All Rights Reserved</Text>
</View>

</ScrollView>

</KeyboardAvoidingView>

{/* FORGOT PASSWORD MODAL */}
<Modal
    visible={forgotModal}
    transparent={true}
    animationType="fade"
>
    <View style={styles.modalOverlay}>
        <View style={styles.forgotCard}>
            <Text style={styles.modalHeader}>Password Recovery</Text>
            <Text style={styles.modalSub}>Enter your username to notify the System Admin for a password reset.</Text>
            
            <View style={styles.modalInputWrapper}>
                <TextInput
                    style={styles.modalInput}
                    placeholder="Enter Username"
                    placeholderTextColor="#94A3B8"
                    value={forgotUsername}
                    onChangeText={setForgotUsername}
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.modalActions}>
                <TouchableOpacity 
                    style={styles.cancelBtn} 
                    onPress={() => setForgotModal(false)}
                >
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.submitBtn} 
                    onPress={handleForgotPasswordRequest}
                    disabled={isSending}
                >
                    {isSending ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.submitText}>Send Request</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    </View>
</Modal>

</View>

);

}

const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:'#FFFFFF'
},

topSection:{
height:'35%',
justifyContent:'center',
alignItems:'center'
},

logoWrapper:{
alignItems:'center',
zIndex:10,
marginTop:-20
},

citLogo:{
width:80,
height:80,
marginBottom:10
},

astraText:{
fontSize:28,
color:'#FFF',
fontWeight:'900',
letterSpacing:2
},

waveContainer:{
position:'absolute',
bottom:0,
width:'100%'
},

formSection:{
flex:1,
paddingHorizontal:35
},

card:{
backgroundColor:"#FFF",
borderRadius:25,
padding:25,
shadowColor:"#000",
shadowOpacity:0.1,
shadowRadius:20,
elevation:10
},

welcomeText:{
fontSize:32,
fontWeight:'800',
color:'#1E293B',
marginBottom:30,
textAlign:'center'
},

inputGroup:{
marginBottom:20
},

label:{
fontSize:10,
fontWeight:'900',
color:'#64748B',
letterSpacing:1.5,
marginBottom:8
},

dropdown:{
flexDirection:'row',
justifyContent:'space-between',
alignItems:'center',
backgroundColor:'#F8FAFC',
padding:16,
borderRadius:30,
borderWidth:1,
borderColor:'#E2E8F0'
},

dropdownText:{
fontSize:14,
fontWeight:'600',
color:'#1E293B'
},

inputWrapper:{
flexDirection:'row',
alignItems:'center',
backgroundColor:'#F8FAFC',
paddingHorizontal:20,
borderRadius:30,
borderWidth:1,
borderColor:'#E2E8F0'
},

input:{
flex:1,
height:55,
fontSize:14,
fontWeight:'600',
color:'#1E293B'
},

errorText:{
color:'#EF4444',
textAlign:'center',
marginBottom:15,
fontWeight:'700'
},

loginBtn:{
backgroundColor:"#2563EB",
paddingVertical:16,
borderRadius:30,
alignItems:"center",
marginTop:10,
shadowColor:"#2563EB",
shadowOpacity:0.4,
shadowRadius:10,
elevation:6
},

loginBtnText:{
color:"#FFF",
fontWeight:"900",
fontSize:15,
letterSpacing:1
},

forgotBtn:{
marginTop:25,
alignItems:'center'
},

forgotText:{
color:'#64748B',
fontSize:12,
fontWeight:'700'
},

footerContainer: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center',
},

tagline: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase'
},

copyrightText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600'
},

rightsText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500'
},

// MODAL & PICKER STYLES
modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
},

pickerContainer: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingVertical: 20,
    maxHeight: '70%',
    elevation: 20
},

pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
},

pickerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B'
},

roleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC'
},

roleItemText: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '600'
},

// FORGOT PASSWORD MODAL SPECIFIC
forgotCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 25,
    elevation: 10
},

modalHeader: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 10
},

modalSub: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 20
},

modalInputWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    paddingHorizontal: 15
},

modalInput: {
    height: 50,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600'
},

modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center'
},

cancelBtn: {
    marginRight: 20
},

cancelText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700'
},

submitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12
},

submitText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800'
}

});