import 'react-native-gesture-handler';
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
import SystemAnalytics from './src/screens/Admin/SystemAnalytics'; 

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
import ManualPurchaseRequest from './src/screens/Stores/ManualPurchaseRequest';
import GenerateQR from './src/screens/Stores/GenerateQR'; 
import ViewAssetTags from './src/screens/Stores/ViewAssetTags'; // NEW: Added for QR Recovery

// 4. Procurement (Purchase) Module
import ProcurementHub from './src/screens/Procurement/ProcurementHub';
import ViewPurchaseRequests from './src/screens/Procurement/ViewPurchaseRequests'; 
import PurchaseOrderView from './src/screens/Procurement/PurchaseOrderView'; 
import PurchaseOrderHistory from './src/screens/Procurement/PurchaseOrderHistory';

// 5. Construction Department Screens
import ConstructionHub from './src/screens/Construction/SupervisorHub'; 
import LaborTracker from './src/screens/Construction/LaborTracker'; 
import WorkDoneLog from './src/screens/Construction/WorkDoneLog'; 
import ConstructionRequisition from './src/screens/Construction/ConstructionRequisition';
import AttendanceHistory from './src/screens/Construction/AttendanceHistory';
import ConsumptionLog from './src/screens/Construction/ConsumptionLog'; 
import ConstructionInventory from './src/screens/Construction/ConstructionInventory';

// 6. Accounts (Finance) Module
import AccountsHub from './src/screens/Accounts/AccountsHub';
import PayrollApproval from './src/screens/Accounts/PayrollApproval'; 
import VendorPayments from './src/screens/Accounts/VendorPayments'; 
import BudgetTracker from './src/screens/Accounts/BudgetTracker';
import TransactionLedger from './src/screens/Accounts/TransactionLedger';
import PayPurchaseOrder from './src/screens/Accounts/PayPurchaseOrder'; 

// 7. Auditor Module
import AuditorHub from './src/screens/Auditor/AuditorHub';
import AuditorScanner from './src/screens/Auditor/AuditorScanner';

// 8. Executive Module
import ExecutiveHub from './src/screens/Executive/ExecutiveHub';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" /> 
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* ENTRANCE */}
        <Stack.Screen name="Login" component={LoginScreen} />
        
        {/* ADMIN MODULE */}
        <Stack.Screen name="AdminHub" component={AdminHub} />
        <Stack.Screen name="RegisterUser" component={RegisterUser} />
        <Stack.Screen name="UserManagement" component={UserManagement} />
        <Stack.Screen name="GlobalTransactions" component={GlobalTransactions} />
        <Stack.Screen name="SystemAnalytics" component={SystemAnalytics} />
        
        {/* HOD MODULE */}
        <Stack.Screen name="HODHub" component={HODHub} />
        <Stack.Screen name="Requisition" component={Requisition} />
        <Stack.Screen name="LiveTracker" component={LiveTracker} />
        <Stack.Screen name="AssetHandover" component={AssetHandover} />
        <Stack.Screen name="ReportDamage" component={ReportDamage} />
        
        {/* STORES MODULE */}
        <Stack.Screen name="StoresHub" component={StoresHub} />
        <Stack.Screen name="MaterialRequests" component={MaterialRequests} />
        <Stack.Screen name="LiveInventory" component={LiveInventory} />
        <Stack.Screen name="ReceiveStock" component={ReceiveStock} />
        <Stack.Screen name="AllocationHistory" component={AllocationHistory} />
        <Stack.Screen name="DisposalManagement" component={DisposalManagement} />
        <Stack.Screen name="ReceiptHistory" component={ReceiptHistory} />
        <Stack.Screen name="ManualPurchaseRequest" component={ManualPurchaseRequest} />
        <Stack.Screen name="GenerateQR" component={GenerateQR} />
        <Stack.Screen name="ViewAssetTags" component={ViewAssetTags} />

        {/* PROCUREMENT (PURCHASE) MODULE */}
        <Stack.Screen name="ProcurementHub" component={ProcurementHub} />
        <Stack.Screen name="ViewPurchaseRequests" component={ViewPurchaseRequests} />
        <Stack.Screen name="PurchaseOrderView" component={PurchaseOrderView} />
        <Stack.Screen name="PurchaseOrderHistory" component={PurchaseOrderHistory} />
        
        {/* CONSTRUCTION MODULE */}
        <Stack.Screen name="ConstructionHub" component={ConstructionHub} />
        <Stack.Screen name="LaborTracker" component={LaborTracker} />
        <Stack.Screen name="WorkDoneLog" component={WorkDoneLog} />
        <Stack.Screen name="ConstructionRequisition" component={ConstructionRequisition} />
        <Stack.Screen name="AttendanceHistory" component={AttendanceHistory} />
        <Stack.Screen name="ConsumptionLog" component={ConsumptionLog} />
        <Stack.Screen name="ConstructionInventory" component={ConstructionInventory} />

        {/* ACCOUNTS MODULE */}
        <Stack.Screen name="AccountsHub" component={AccountsHub} />
        <Stack.Screen name="PayrollApproval" component={PayrollApproval} />
        <Stack.Screen name="VendorPayments" component={VendorPayments} />
        <Stack.Screen name="BudgetTracker" component={BudgetTracker} />
        <Stack.Screen name="TransactionLedger" component={TransactionLedger} />
        <Stack.Screen name="PayPurchaseOrder" component={PayPurchaseOrder} />

        {/* AUDIT MODULE */}
        <Stack.Screen name="AuditorHub" component={AuditorHub} />
        <Stack.Screen name="AuditorScanner" component={AuditorScanner} />

        {/* EXECUTIVE MODULE */}
        <Stack.Screen name="ExecutiveHub" component={ExecutiveHub} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}