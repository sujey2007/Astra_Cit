import 'react-native-gesture-handler'; // Required for smooth navigation
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

// 1. Import your custom Auth Screen
import LoginScreen from './src/screens/Auth/LoginScreen';

// 2. Import all the Officer Hubs (Dashboards)
import AdminHub from './src/screens/Admin/AdminHub';
import StoresHub from './src/screens/Stores/StoresHub';
import ProcurementHub from './src/screens/Procurement/ProcurementHub';
import ConstructionHub from './src/screens/Construction/SupervisorHub'; 
import AuditorHub from './src/screens/Auditor/AuditorHub';
import ExecutiveHub from './src/screens/Executive/ExecutiveHub';

// 3. Import HOD Portal Screens (Split Architecture)
import HODHub from './src/screens/HOD/HODHub'; // The Dashboard
import Requisition from './src/screens/HOD/Requisition'; // Submission Screen
import LiveTracker from './src/screens/HOD/LiveTracker'; // NEW: Status Tracking Screen
import AssetHandover from './src/screens/HOD/AssetHandover'; // Handover Screen

// Create the Stack Navigator
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      {/* Auto status bar adapts to the professional light theme */}
      <StatusBar style="auto" /> 
      
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Auth Entry Point */}
        <Stack.Screen name="Login" component={LoginScreen} />
        
        {/* Core Departmental Hubs */}
        <Stack.Screen name="AdminHub" component={AdminHub} />
        <Stack.Screen name="StoresHub" component={StoresHub} />
        <Stack.Screen name="ProcurementHub" component={ProcurementHub} />
        
        {/* HOD Portal & Sub-Screens */}
        <Stack.Screen name="HODHub" component={HODHub} />
        <Stack.Screen name="Requisition" component={Requisition} />
        <Stack.Screen name="LiveTracker" component={LiveTracker} />
        <Stack.Screen name="AssetHandover" component={AssetHandover} />
        
        {/* Placeholder Hubs */}
        <Stack.Screen name="ConstructionHub" component={ConstructionHub} />
        <Stack.Screen name="AuditorHub" component={AuditorHub} />
        <Stack.Screen name="ExecutiveHub" component={ExecutiveHub} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}