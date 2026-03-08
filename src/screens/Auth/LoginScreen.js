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
Dimensions
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

// Database Imports
import { db } from '../../api/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

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
source={{uri:'https://images.shiksha.com/mediadata/images/1583389585phpP9W1tB_m.jpg'}}
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

{/* ROLE SELECTOR */}

<View style={[styles.inputGroup,{zIndex:1000}]}>

<Text style={styles.label}>DESIGNATION</Text>

<TouchableOpacity
style={styles.dropdown}
onPress={()=>setIsDropdownVisible(!isDropdownVisible)}
>

<Text style={[styles.dropdownText,!selectedRole && {color:'#94A3B8'}]}>
{selectedRole ? ROLES.find(r=>r.id===selectedRole)?.label : "Select your role"}
</Text>

<Ionicons
name={isDropdownVisible ? "chevron-up":"chevron-down"}
size={20}
color="#2563EB"
/>

</TouchableOpacity>

{isDropdownVisible && (

<View style={styles.dropdownListContainer}>

<ScrollView
nestedScrollEnabled={true}
style={styles.dropdownScrollView}
>

{ROLES.map(role=>(
<TouchableOpacity
key={role.id}
style={styles.roleItem}
onPress={()=>{

setSelectedRole(role.id);
setIsDropdownVisible(false);

}}
>

<Text style={styles.roleItemText}>
{role.label}
</Text>

</TouchableOpacity>
))}

</ScrollView>

</View>

)}

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

<TouchableOpacity style={styles.forgotBtn}>

<Text style={styles.forgotText}>
Forgot password?
</Text>

</TouchableOpacity>

</View>

</ScrollView>

</KeyboardAvoidingView>

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

dropdownListContainer:{
position:'absolute',
top:85,
left:0,
right:0,
backgroundColor:'#FFF',
borderRadius:15,
elevation:10,
zIndex:2000,
borderWidth:1,
borderColor:'#F1F5F9',
maxHeight:180,
overflow:'hidden'
},

dropdownScrollView:{
flexGrow:0
},

roleItem:{
padding:15,
borderBottomWidth:1,
borderBottomColor:'#F8FAFC'
},

roleItemText:{
fontSize:13,
color:'#475569',
fontWeight:'600'
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
}

});
