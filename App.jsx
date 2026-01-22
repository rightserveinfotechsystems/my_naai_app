import 'react-native-gesture-handler'; // MUST be first

import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, DeviceEventEmitter } from 'react-native';

import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { enableScreens } from 'react-native-screens';
enableScreens();

import Ionicons from 'react-native-vector-icons/Ionicons';

/* ---------- CONTEXT / UTILS ---------- */
import { NotificationProvider } from './src/components/NotificationContext';
import { requestNotificationPermission } from './src/utilities/notificationPermission';
import { initTTS } from './src/utilities/tts';

/* ---------- AUTH SCREENS ---------- */
import SplashLogoScreen from './src/screens/SplashLogoScreen';
import SplashScreen from './src/screens/SplashScreen';
import UserLogin from './src/components/UserLogin';
import UserSignup from './src/components/UserSignup';
import OtpScreen from './src/components/OtpScreen';
import NaaiLogin from './src/components/NaaiLogin';
import NaaiRequest from './src/components/NaaiRequest';
import SalonOtpScreen from './src/components/SalonOtpScreen';

/* ---------- USER SCREENS ---------- */
import NaaiDashboard from './src/screens/NaaiDashboard';
import ServicesScreen from './src/screens/ServicesScreen';
import AccountScreen from './src/screens/AccountScreen';
import UserProduct from './src/screens/UserProduct';
import SalonDetailScreen from './src/screens/SalonDetailScreen';
import BookingSchedule from './src/screens/BookingSchedule';
import FAQScreen from './src/pages/FAQScreen';
import TermsScreen from './src/pages/TermsScreen';
import AboutScreen from './src/pages/AboutScreen';

/* ---------- SALON SCREENS ---------- */
import SalonDashboard from './src/screens/SalonDashboard';
import SalonBookingHistory from './src/screens/SalonBookingHistory';
import SalonProduct from './src/screens/SalonProduct';
import SalonAccountScreen from './src/screens/SalonAccountScreen';
import AddOfflineCustomer from './src/components/AddOfflineCustomer';
import SalonNotifications from './src/screens/SalonNotifications';

/* ---------- NAV REFS ---------- */
export const navigationRef = React.createRef();

/* ---------- NAV ---------- */
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* ---------- THEME ---------- */
const COLORS = {
  primary: '#0F0F0F',
  accent: '#E1B378',
  inactive: '#9E9E9E',
};

/* ---------- TAB OPTIONS ---------- */
const tabOptions = ({ route }) => ({
  headerShown: false,
  tabBarStyle: {
    backgroundColor: COLORS.primary,
    height: 70,
    borderTopWidth: 0,
  },
  tabBarActiveTintColor: COLORS.accent,
  tabBarInactiveTintColor: COLORS.inactive,
  tabBarLabelStyle: {
    fontSize: 13,
    marginBottom: 6,
  },
  tabBarIcon: ({ color }) => {
    const icons = {
      'Salon Naai': 'list-circle',
      'Booked Salon': 'cut',
      'Products': 'storefront-outline',
      'Queue': 'list-circle',
      'Queue History': 'cut',
      'Product': 'storefront-outline',
      'Account': 'person',
    };
    return <Ionicons name={icons[route.name]} size={22} color={color} />;
  },
});

/* ---------- USER TABS ---------- */
function MainTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Salon Naai" component={NaaiDashboard} />
      <Tab.Screen name="Booked Salon" component={ServicesScreen} />
      <Tab.Screen name="Products" component={UserProduct} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

/* ---------- SALON TABS ---------- */
function SalonTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Queue" component={SalonDashboard} />
      <Tab.Screen name="Queue History" component={SalonBookingHistory} />
      <Tab.Screen name="Product" component={SalonProduct} />
      <Tab.Screen name="Account" component={SalonAccountScreen} />
    </Tab.Navigator>
  );
}

/* ---------- AUTH STACK ---------- */
function AuthStack({ onLoginSuccess }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SplashLogo" component={SplashLogoScreen} />
      <Stack.Screen name="SplashScreen" component={SplashScreen} />
      <Stack.Screen name="UserLogin">
        {props => <UserLogin {...props} onLoginSuccess={onLoginSuccess} />}
      </Stack.Screen>
      <Stack.Screen name="UserSignup" component={UserSignup} />
      <Stack.Screen name="OtpScreen">
        {props => <OtpScreen {...props} onLoginSuccess={onLoginSuccess} />}
      </Stack.Screen>
      <Stack.Screen name="NaaiLogin" component={NaaiLogin} />
      <Stack.Screen name="NaaiRequest" component={NaaiRequest} />
      <Stack.Screen name="SalonOtpScreen" component={SalonOtpScreen} />
    </Stack.Navigator>
  );
}

/* ---------- APP STACK ---------- */
function AppStack({ userType }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userType === 'USER' ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Salon" component={SalonTabs} />
      )}
      <Stack.Screen name="SalonDetail" component={SalonDetailScreen} />
      <Stack.Screen name="BookingSchedule" component={BookingSchedule} />
      <Stack.Screen name="FAQScreen" component={FAQScreen} />
      <Stack.Screen name="TermsScreen" component={TermsScreen} />
      <Stack.Screen name="AboutScreen" component={AboutScreen} />
      <Stack.Screen name="AddOfflineCustomer" component={AddOfflineCustomer} />
      <Stack.Screen name="SalonNotifications" component={SalonNotifications} />
    </Stack.Navigator>
  );
}

/* ---------- ROOT APP ---------- */
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null);
  const [userId, setUserId] = useState('');

  /* ---------- AUTH CHECK ---------- */
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const data = await AsyncStorage.getItem('mynaaiUser');
        const type = await AsyncStorage.getItem('userType');

        if (data && type) {
          const parsed = JSON.parse(data);
          if (!isMounted) return;
          setUserId(parsed?.userId || parsed?.salon?.salonId || '');
          setUserType(type);
          setIsLoggedIn(true);
        } else {
          if (!isMounted) return;
          setUserId('');
          setUserType(null);
          setIsLoggedIn(false);
        }
      } catch (e) {
        if (!isMounted) return;
        setUserId('');
        setUserType(null);
        setIsLoggedIn(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkAuth();

    const appStateSub = AppState.addEventListener('change', state => {
      if (state === 'active') checkAuth();
    });

    const authSub = DeviceEventEmitter.addListener('AUTH_CHANGED', checkAuth);

    return () => {
      isMounted = false;
      appStateSub.remove();
      authSub.remove();
    };
  }, []);

  /* ---------- NOTIFICATIONS ---------- */
  useEffect(() => {
    notifee.createChannel({
      id: 'default_channel',
      name: 'Default Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'buzzer',
    });

    requestNotificationPermission();
    initTTS();

    messaging().onMessage(async msg => {
      await notifee.displayNotification({
        title: msg.notification?.title,
        body: msg.notification?.body,
        android: { channelId: 'default_channel' },
        data: msg.data,
      });
    });

    notifee.onForegroundEvent(({ type }) => {
      if (type === EventType.PRESS) {
        navigationRef.current?.navigate('Salon');
      }
    });
  }, []);

  if (loading) return null;

  return (
    <NotificationProvider userId={userId}>
      <NavigationContainer ref={navigationRef}>
        {isLoggedIn ? (
          <AppStack userType={userType} />
        ) : (
          <AuthStack onLoginSuccess={() => setIsLoggedIn(true)} />
        )}
      </NavigationContainer>
    </NotificationProvider>
  );
}
