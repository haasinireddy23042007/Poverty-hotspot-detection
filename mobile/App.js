import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import DistrictDetailScreen from './src/screens/DistrictDetailScreen';
import LandingScreen from './src/screens/LandingScreen';
import SignupScreen from './src/screens/SignupScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import NotificationScreen from './src/screens/NotificationScreen';

import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { User, Menu, Bell, LogOut, Power } from 'lucide-react-native';
import { TouchableOpacity, Text } from 'react-native';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  const { logout, ngoProfile } = useAuth();
  
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#162846', marginBottom: 10 }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{ngoProfile?.ngo_name || 'Active NGO'}</Text>
        <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{ngoProfile?.district || 'Telangana Region'}</Text>
      </View>
      
      <DrawerItemList {...props} />
      
      <View style={{ marginTop: 'auto', borderTopWidth: 1, borderTopColor: '#162846', paddingBottom: 20 }}>
        <DrawerItem
          label="Logout"
          labelStyle={{ color: '#ef4444', fontWeight: 'bold' }}
          icon={({ size }) => <LogOut color="#ef4444" size={size} />}
          onPress={() => {
            props.navigation.closeDrawer();
            logout();
          }}
        />
      </View>
    </DrawerContentScrollView>
  );
}

function DrawerNavigator() {
  const { logout, currentUser } = useAuth();
  
  return (
    <Drawer.Navigator 
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
      headerStyle: { backgroundColor: '#162846' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
      drawerStyle: { backgroundColor: '#0a1628', width: 280 },
      drawerActiveTintColor: '#f97316',
      drawerInactiveTintColor: '#94a3b8',
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={{ marginLeft: 15 }}>
          <Menu color="#fff" size={24} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={{ marginRight: 15 }}>
            <View style={{ position: 'relative' }}>
              <Bell color="#fff" size={24} />
              <View style={{ 
                position: 'absolute', 
                right: -2, 
                top: -2, 
                backgroundColor: '#ef4444', 
                borderRadius: 6, 
                width: 12, 
                height: 12, 
                borderWidth: 2, 
                borderColor: '#162846' 
              }} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f97316', justifyContent: 'center', alignItems: 'center' }}>
              <User color="#fff" size={18} />
            </View>
          </TouchableOpacity>
        </View>
      ),
    })}>
      <Drawer.Screen name="Dashboard" component={DashboardScreen} options={{ 
        title: 'NGO Dashboard',
        drawerIcon: ({ color, size }) => <Bell color={color} size={size} />
      }} />
      <Drawer.Screen name="My Monitor" component={DashboardScreen} options={{ 
        title: 'My Districts',
        drawerIcon: ({ color, size }) => <User color={color} size={size} />
      }} />
    </Drawer.Navigator>
  );
}

function RootNavigator() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a1628', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ 
      headerStyle: { backgroundColor: '#162846' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
      headerBackTitleVisible: false
    }}>
      {currentUser ? (
        <>
          <Stack.Screen name="Main" component={DrawerNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="DistrictDetail" component={DistrictDetailScreen} options={{ title: 'District Overview' }} />
          <Stack.Screen name="Notifications" component={NotificationScreen} options={{ title: 'Alerts & Notifications' }} />
          <Stack.Screen name="Profile" component={DashboardScreen} options={{ title: 'NGO Profile' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Landing" component={LandingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
