import 'react-native-gesture-handler'; // Required for smooth navigation
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

// 1. Auth & Admin Module
import LoginScreen from './src/screens/Auth/LoginScreen';
import AdminHub from './src/screens/Admin/AdminHub';
import RegisterUser from './src/screens/Admin/RegisterUser'; 
import UserManagement from './src/screens/Admin/UserManagement'; 
import GlobalTransactions from './src/screens/Admin/GlobalTransactions'; 
import SystemAnalytics from './src/screens/Admin/SystemAnalytics'; // NEW: Real-time Bar Charts

// 2. HOD Portal Screens
import HODHub from './src/screens/HOD/HODHub'; 
import Requisition from './src/screens/HOD/Requisition'; 
import LiveTracker from './src/screens/HOD/LiveTracker'; 
import AssetHandover from './src/screens/HOD/AssetHandover'; 
import ReportDamage from './src/screens/HOD/ReportDamage'; 

// 3. Stores Department Screens
import StoresHub from './src/screens/Stores/StoresHub';
import MaterialRequests from './src/screens/Stores/MaterialRequests';
import LiveInventory from './src/screens/Stores/LiveInventory';
import ReceiveStock from './src/screens/Stores/ReceiveStock';
import AllocationHistory from './src/screens/Stores/AllocationHistory';
import DisposalManagement from './src/screens/Stores/DisposalManagement'; 
import ReceiptHistory from './src/screens/Stores/ReceiptHistory'; 

// 4. Other Departmental Hubs
import ProcurementHub from './src/screens/Procurement/ProcurementHub';
import ConstructionHub from './src/screens/Construction/SupervisorHub'; 
import AuditorHub from './src/screens/Auditor/AuditorHub';
import ExecutiveHub from './src/screens/Executive/ExecutiveHub';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" /> 
      
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Auth Entrance */}
        <Stack.Screen name="Login" component={LoginScreen} />
        
        {/* Admin Module - System & User Control */}
        <Stack.Screen name="AdminHub" component={AdminHub} />
        <Stack.Screen name="RegisterUser" component={RegisterUser} />
        <Stack.Screen name="UserManagement" component={UserManagement} />
        <Stack.Screen name="GlobalTransactions" component={GlobalTransactions} />
        <Stack.Screen name="SystemAnalytics" component={SystemAnalytics} />
        
        {/* HOD Module - Dr. Sujey (CSE) */}
        <Stack.Screen name="HODHub" component={HODHub} />
        <Stack.Screen name="Requisition" component={Requisition} />
        <Stack.Screen name="LiveTracker" component={LiveTracker} />
        <Stack.Screen name="AssetHandover" component={AssetHandover} />
        <Stack.Screen name="ReportDamage" component={ReportDamage} />
        
        {/* Stores Module - ASTRA STORES */}
        <Stack.Screen name="StoresHub" component={StoresHub} />
        <Stack.Screen name="MaterialRequests" component={MaterialRequests} />
        <Stack.Screen name="LiveInventory" component={LiveInventory} />
        <Stack.Screen name="ReceiveStock" component={ReceiveStock} />
        <Stack.Screen name="AllocationHistory" component={AllocationHistory} />
        <Stack.Screen name="DisposalManagement" component={DisposalManagement} />
        <Stack.Screen name="ReceiptHistory" component={ReceiptHistory} />
        
        {/* Core Departmental Hubs */}
        <Stack.Screen name="ProcurementHub" component={ProcurementHub} />
        <Stack.Screen name="ConstructionHub" component={ConstructionHub} />
        <Stack.Screen name="AuditorHub" component={AuditorHub} />
        <Stack.Screen name="ExecutiveHub" component={ExecutiveHub} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}