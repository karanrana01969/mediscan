import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import { COLORS, SIZES } from '../theme';
import { storageService } from '../services/storageService';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';

// Main Screens
import ProfilesScreen from '../screens/ProfilesScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ScannerScreen from '../screens/ScannerScreen';
import AddMedicationScreen from '../screens/AddMedicationScreen';
import SetScheduleScreen from '../screens/SetScheduleScreen';
import MedicationDetailScreen from '../screens/MedicationDetailScreen';
import MedicationsListScreen from '../screens/MedicationsListScreen';
import HistoryScreen from '../screens/HistoryScreen';

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Tab Icons ─────────────────────────────────────────────────────────
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Today: '💊',
    Medications: '📋',
    History: '📊',
    Profile: '👤',
  };
  return (
    <View style={styles.tabIcon}>
      <Text style={styles.tabEmoji}>{icons[label] ?? '•'}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

// ─── Bottom Tab Navigator ──────────────────────────────────────────────
function MainTabs({ route }: any) {
  const { profileId, profileName } = route.params ?? {};

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Today"
        component={DashboardScreen}
        initialParams={{ profileId, profileName }}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Today" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Medications"
        component={MedicationsListScreen}
        initialParams={{ profileId, profileName }}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Medications" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        initialParams={{ profileId, profileName }}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="History" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfilesScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Main App Stack ────────────────────────────────────────────────────
function AppNavigatorStack() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="MainTabs" component={MainTabs} />
      <AppStack.Screen name="Scanner" component={ScannerScreen} />
      <AppStack.Screen name="AddMedication" component={AddMedicationScreen} />
      <AppStack.Screen name="SetSchedule" component={SetScheduleScreen} />
      <AppStack.Screen name="MedicationDetail" component={MedicationDetailScreen} />
    </AppStack.Navigator>
  );
}

// ─── Auth Stack ────────────────────────────────────────────────────────
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

// ─── Root Navigator ────────────────────────────────────────────────────
export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    checkAuth();
    const subscription = DeviceEventEmitter.addListener('authStateChanged', checkAuth);
    return () => {
      subscription.remove();
    };
  }, []);

  const checkAuth = async () => {
    const token = await storageService.getToken();
    const profileId = await storageService.getProfileId();
    setIsAuthenticated(!!token);
    setHasProfile(!!profileId);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // If authenticated and has a profile, go straight to the app
  // otherwise show auth or profile selection
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  if (!hasProfile) {
    return (
      <AppStack.Navigator screenOptions={{ headerShown: false }}>
        <AppStack.Screen name="Profiles" component={ProfilesScreen} />
        <AppStack.Screen name="MainTabs" component={MainTabs} />
        <AppStack.Screen name="Scanner" component={ScannerScreen} />
        <AppStack.Screen name="AddMedication" component={AddMedicationScreen} />
        <AppStack.Screen name="SetSchedule" component={SetScheduleScreen} />
        <AppStack.Screen name="MedicationDetail" component={MedicationDetailScreen} />
      </AppStack.Navigator>
    );
  }

  return <AppNavigatorStack />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    height: 72,
    paddingBottom: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  tabEmoji: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
