import 'react-native-gesture-handler'; // MUST be first
import './src/utilities/notifeeBackgroundHandler';
import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, DeviceEventEmitter, Image, Linking, TouchableOpacity, View, Text, TextInput } from 'react-native';

import notifee, { AndroidImportance, AndroidStyle, AndroidCategory, EventType } from '@notifee/react-native';
import { 
  getMessaging, 
  requestPermission, 
  registerDeviceForRemoteMessages, 
  setAutoInitEnabled, 
  getToken, 
  onTokenRefresh, 
  AuthorizationStatus,
  onMessage
} from '@react-native-firebase/messaging';

import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { enableScreens } from 'react-native-screens';
enableScreens();

import Ionicons from 'react-native-vector-icons/Ionicons';
import VersionCheck from 'react-native-version-check';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

/* ---------- CONTEXT / UTILS ---------- */
import { NotificationProvider } from './src/components/NotificationContext';
import { requestNotificationPermission } from './src/utilities/notificationPermission';
import { initTTS } from './src/utilities/tts';
import { communication } from './src/services/communication';

/* ---------- AUTH SCREENS ---------- */
import SplashLogoScreen from './src/screens/SplashLogoScreen';
import SplashScreen from './src/screens/SplashScreen';
import UserLogin from './src/components/UserLogin';
import UserSignup from './src/components/UserSignup';
import OtpScreen from './src/components/OtpScreen';
import NaaiLogin from './src/components/NaaiLogin';
import NaaiRequest from './src/components/NaaiRequest';
import SalonOtpScreen from './src/components/SalonOtpScreen';
import SalonInfoForRegister from './src/components/SalonInfoForRegister';
import SalonBusinessInfo from './src/components/SalonBusinessInfo';
import SalonRegisterOtpScreen from './src/components/SalonRegisterOtpScreen';
import SubscriptionsPlan from './src/screens/SubscriptionsPlan';
import RenewalSubscriptionsPlan from './src/screens/RenewalSubscriptionsPlan';

/* ---------- USER SCREENS ---------- */
import NaaiDashboard from './src/screens/NaaiDashboard';
import ServicesScreen from './src/screens/ServicesScreen';
import AccountScreen from './src/screens/AccountScreen';
import UserProduct from './src/screens/UserProduct';
import SalonDetailScreen from './src/screens/SalonDetailScreen';
import SalonServicesScreen from './src/screens/SalonServicesScreen';
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
import UserNotifications from './src/screens/UserNotifications';
import BookingRequestScreen from './src/screens/BookingRequestScreen';
import DelayRequestScreen from './src/screens/DelayRequestScreen';
import EditSalonProfileScreen from './src/screens/EditSalonProfileScreen';

export const navigationRef = createNavigationContainerRef();

const TextRender = Text.render;
Text.render = function (...args) {
  const origin = TextRender.call(this, ...args);
  return React.cloneElement(origin, { allowFontScaling: false });
};

const TextInputRender = TextInput.render;
TextInput.render = function (...args) {
  const origin = TextInputRender.call(this, ...args);
  return React.cloneElement(origin, { allowFontScaling: false });
};

/* ---------- NAV ---------- */
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const COLORS = {
  primary: '#0F0F0F',
  accent: '#E1B378',
  inactive: '#9E9E9E',
};

const tabOptions = ({ route, insets }) => ({
  headerShown: false,
  tabBarShowLabel: false,
  tabBarActiveTintColor: COLORS.accent,
  tabBarInactiveTintColor: COLORS.inactive,
  tabBarStyle: {
    backgroundColor: COLORS.primary,
    borderTopWidth: 0,
    position: 'absolute',
    elevation: 10,
    height: 50 + Math.max(insets.bottom, 5),
    paddingBottom: Math.max(insets.bottom, 5),
    paddingTop: 4,
  },
  tabBarLabelStyle: {
    fontSize: 13,
    marginBottom: 2,
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

    return <Ionicons name={icons[route.name]} size={28} color={color} />;
  },
});

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator screenOptions={({ route }) => tabOptions({ route, insets })}>
      <Tab.Screen name="Salon Naai" component={NaaiDashboard} />
      <Tab.Screen name="Booked Salon" component={ServicesScreen} />
      <Tab.Screen name="Products" component={UserProduct} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

function SalonTabs({ isNewSalon = false }) {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      initialRouteName={isNewSalon ? "Account" : "Queue"}
      screenOptions={({ route }) => tabOptions({ route, insets })}
    >
      <Tab.Screen name="Queue" component={SalonDashboard} />
      <Tab.Screen name="Queue History" component={SalonBookingHistory} />
      <Tab.Screen name="Product" component={SalonProduct} />
      <Tab.Screen name="Account" component={SalonAccountScreen} />
    </Tab.Navigator>
  );
}

/* 🎯 UPDATED AUTH STACK (Set initialRouteName to SplashLogo) */
function AuthStack({ onLoginSuccess }) {
  return (
    <Stack.Navigator initialRouteName="SplashLogo" screenOptions={{
      headerShown: false, animation: 'slide_from_right',
      contentStyle: { backgroundColor: '#0F0F0F' },
    }}>
      <Stack.Screen name="SplashLogo" component={SplashLogoScreen} />
      <Stack.Screen name="SplashScreen" component={SplashScreen} />
      <Stack.Screen name="UserSignup">
        {props => <UserSignup {...props} onLoginSuccess={onLoginSuccess} />}
      </Stack.Screen>
      <Stack.Screen name="UserLogin">
        {props => <UserLogin {...props} onLoginSuccess={onLoginSuccess} />}
      </Stack.Screen>
      <Stack.Screen name="OtpScreen">
        {props => <OtpScreen {...props} onLoginSuccess={onLoginSuccess} />}
      </Stack.Screen>
      <Stack.Screen name="NaaiLogin" component={NaaiLogin} />
      <Stack.Screen name="NaaiRequest" component={NaaiRequest} />
      <Stack.Screen name="SalonOtpScreen" component={SalonOtpScreen} />
      <Stack.Screen name="SalonInfoForRegister" component={SalonInfoForRegister} />
      <Stack.Screen name="SalonBusinessInfo" component={SalonBusinessInfo} />
      <Stack.Screen name="SalonRegisterOtpScreen" component={SalonRegisterOtpScreen} />
      <Stack.Screen name="SubscriptionsPlan">
        {props => <SubscriptionsPlan {...props} onLoginSuccess={onLoginSuccess} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function AppStack({ userType, isNewSalon }) {
  if (!userType) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userType === 'USER' ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Salon">
          {() => <SalonTabs isNewSalon={isNewSalon} />}
        </Stack.Screen>
      )}
      <Stack.Screen name="SalonDetail" component={SalonDetailScreen} />
      <Stack.Screen name="SalonServicesScreen" component={SalonServicesScreen} />
      <Stack.Screen name="BookingSchedule" component={BookingSchedule} />
      <Stack.Screen name="FAQScreen" component={FAQScreen} />
      <Stack.Screen name="TermsScreen" component={TermsScreen} />
      <Stack.Screen name="AboutScreen" component={AboutScreen} />
      <Stack.Screen name="SubscriptionsPlan" component={SubscriptionsPlan} />
      <Stack.Screen name="RenewalSubscriptionsPlan" component={RenewalSubscriptionsPlan} />
      <Stack.Screen name="AddOfflineCustomer" component={AddOfflineCustomer} />
      <Stack.Screen name="SalonNotifications" component={SalonNotifications} />
      <Stack.Screen name="UserNotifications" component={UserNotifications} />
      <Stack.Screen name="BookingRequestScreen" component={BookingRequestScreen} />
      <Stack.Screen name="DelayRequestScreen" component={DelayRequestScreen} />
      <Stack.Screen name="EditSalonProfile" component={EditSalonProfileScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

/* 🎯 STRICT ROUTE NAVIGATOR WITH IMMEDIATE NOTIFICATION CONSUMPTION */
const executeRouteNavigation = (screenName, params, notificationIdToCancel = null) => {
  let attempts = 0;
  const pollInterval = setInterval(async () => {
    attempts++;
    if (navigationRef.isReady()) {
      clearInterval(pollInterval);
      console.log(`🚀 Navigating to: ${screenName}`);
      navigationRef.navigate(screenName, params);

      if (notificationIdToCancel) {
        try {
          await notifee.cancelNotification(notificationIdToCancel);
          await notifee.cancelDisplayedNotification(notificationIdToCancel);
        } catch (e) {
          console.log('Error canceling notification:', e);
        }
      }
    } else if (attempts > 50) {
      clearInterval(pollInterval);
    }
  }, 100);
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null);
  const [userId, setUserId] = useState('');
  const [checkingUpdate, setCheckingUpdate] = useState(true);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [storeUrl, setStoreUrl] = useState('');
  const [isNewSalon, setIsNewSalon] = useState(false);

  const userTypeRef = useRef(null);
  useEffect(() => {
    userTypeRef.current = userType;
  }, [userType]);

  useEffect(() => {
    checkForceUpdate();
  }, []);

  const checkForceUpdate = async () => {
    try {
      const latestVersion = await VersionCheck.getLatestVersion();
      const currentVersion = VersionCheck.getCurrentVersion();

      if (!latestVersion) {
        setForceUpdate(false);
        return;
      }

      const isUpdateNeeded =
        currentVersion.localeCompare(latestVersion, undefined, { numeric: true }) === -1;

      if (isUpdateNeeded) {
        const url = await VersionCheck.getStoreUrl();
        setStoreUrl(url);
        setForceUpdate(true);
      }
    } catch (err) {
      console.log("Update check error:", err);
      setForceUpdate(false);
    } finally {
      setCheckingUpdate(false);
    }
  };

  /* ---------- AUTH CHECK ---------- */
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const data = await AsyncStorage.getItem('mynaaiUser');
        const type = await AsyncStorage.getItem('userType');
        const newSalon = await AsyncStorage.getItem('isNewSalon');

        setIsNewSalon(newSalon === 'true');
        if (data && type) {
          const parsed = JSON.parse(data);
          if (!isMounted) return;
          const activeUserId = parsed?.userId || parsed?.salon?.salonId || parsed?.id || '';
          
          userTypeRef.current = type;
          setUserId(activeUserId);
          setUserType(type);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          setUserType(null);
          setUserId('');
          userTypeRef.current = null;
        }
      } catch {
        setIsLoggedIn(false);
        setUserType(null);
        setUserId('');
        userTypeRef.current = null;
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkAuth();

    const appStateSub = AppState.addEventListener('change', s => {
      if (s === 'active') checkAuth();
    });

    const authSub = DeviceEventEmitter.addListener('AUTH_CHANGED', checkAuth);

    return () => {
      isMounted = false;
      appStateSub.remove();
      authSub.remove();
    };
  }, []);

  /* ---------- ROUTER RESOLVER ---------- */
  const processNotificationRoute = async (data, notificationId = null) => {
    if (!data) return;

    const type = data.type;
    let currentUserType = userTypeRef.current;

    if (!currentUserType) {
      currentUserType = await AsyncStorage.getItem('userType');
    }

    console.log("Processing Notification Route 👉 Type:", type, "| UserType:", currentUserType);

    if (type === "DELAY_TIME_PROPOSAL" && currentUserType === "USER") {
      executeRouteNavigation("DelayRequestScreen", {
        bookingRequestId: data.bookingRequestId,
        delayMinutes: data.delayMinutes,
        proposedTime: data.proposedTime,
      }, notificationId);
      return;
    }

    if (type === "BOOKING_CONFIRMED" && currentUserType === "USER") {
      executeRouteNavigation("Booked Salon", {}, notificationId);
      return;
    }

    if (type === "BOOKING_REJECTED" && currentUserType === "USER") {
      executeRouteNavigation("Booked Salon", {}, notificationId);
      return;
    }

    if (type === "BOOKING_REQUEST" && currentUserType === "SALON") {
      executeRouteNavigation("BookingRequestScreen", {
        bookingRequestId: data.bookingRequestId,
      }, notificationId);
      return;
    }

    if (type === "DELAY_RESPONSE") {
      return;
    }

    if (currentUserType === "SALON") {
      executeRouteNavigation("Salon", {}, notificationId); 
    } else if (currentUserType === "USER") {
      executeRouteNavigation("Main", {}, notificationId);  
    }
  };

  /* ---------- NOTIFICATIONS LISTENERS ---------- */
  useEffect(() => {
    notifee.createChannel({
      id: 'default_channel',
      name: 'Default Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'buzzer',
      vibration: true,
    });

    notifee.createChannel({
      id: 'booking',
      name: 'Booking Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'buzzer_old',
      vibration: true,
    });

    requestNotificationPermission();
    initTTS();

    const messaging = getMessaging();

    // 1. Foreground messaging listener
    const unsubscribeMsg = onMessage(messaging, async msg => {
      const DURATION_MS = 60000;
      const isBookingRequest = msg.data?.type === "BOOKING_REQUEST";

      await notifee.displayNotification({
        title: msg.notification?.title || msg.data?.title || 'Notification',
        body: msg.notification?.body || msg.data?.body || '',
        android: {
          channelId: isBookingRequest ? 'booking' : 'default_channel',
          importance: AndroidImportance.HIGH,
          category: AndroidCategory.ALARM,
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
          style: {
            type: AndroidStyle.BIGTEXT,
            text: msg.notification?.body || msg.data?.body || ''
          },
          smallIcon: 'ic_notification',
          ongoing: isBookingRequest,
          autoCancel: false,
          timeoutAfter: isBookingRequest ? 70000 : undefined,
          ...(isBookingRequest && {
            showChronometer: true,
            chronometerDirection: 'down',
            timestamp: Date.now() + DURATION_MS,
          }),
          actions: isBookingRequest
            ? [
                { title: '✅ Accept', pressAction: { id: 'ACCEPT_BOOKING' } },
                { title: '⏳ Delay', pressAction: { id: 'DELAY_BOOKING', launchActivity: 'default' } },
                { title: '❌ Reject', pressAction: { id: 'REJECT_BOOKING' } },
              ]
            : [],
        },
        data: msg.data,
      });
    });

    // 2. Notifee interaction listener (Foreground & Recent App Taps)
    const unsubscribeNotifee = notifee.onForegroundEvent(
      async ({ type, detail }) => {
        const { notification, pressAction } = detail;
        const data = notification?.data;

        /* 🎯 BANNER BODY TAP */
        if (type === EventType.PRESS || pressAction?.id === 'default') {
          await processNotificationRoute(data, notification?.id);
          return;
        }

        /* 🎯 ACTION BUTTON PRESS */
        if (type === EventType.ACTION_PRESS) {
          const bookingRequestId = data?.bookingRequestId;

          if (pressAction?.id === 'ACCEPT_BOOKING') {
            await communication.bookingRequestOwnerAction(bookingRequestId, { action: "ACCEPT" });
            if (notification?.id) await notifee.cancelNotification(notification.id);
            return;
          }

          if (pressAction?.id === 'REJECT_BOOKING') {
            await communication.bookingRequestOwnerAction(bookingRequestId, { action: "REJECT" });
            if (notification?.id) await notifee.cancelNotification(notification.id);
            return;
          }

          if (pressAction?.id === 'DELAY_BOOKING') {
            executeRouteNavigation("BookingRequestScreen", {
              bookingRequestId: data?.bookingRequestId,
              openDelayModal: true,
            }, notification?.id);
            return;
          }
        }
      }
    );

    return () => {
      unsubscribeMsg();
      unsubscribeNotifee();
    };
  }, []);

  /* ---------- FCM INIT ---------- */
  useEffect(() => {
    const messagingInstance = getMessaging();

    const initFCM = async () => {
      try {
        const authStatus = await requestPermission(messagingInstance);
        const enabled =
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL;

        if (!enabled) return;

        await registerDeviceForRemoteMessages(messagingInstance);
        await setAutoInitEnabled(messagingInstance, true);

        let token = null;
        for (let i = 0; i < 3; i++) {
          try {
            token = await getToken(messagingInstance);
            if (token) break;
          } catch (e) {
            await new Promise(res => setTimeout(res, 2000));
          }
        }

        if (token) {
          await AsyncStorage.setItem('FCM_TOKEN', token);
        }
      } catch (error) {
        console.log('❌ FCM INIT ERROR:', error?.message);
      }
    };

    initFCM();

    const unsubscribe = onTokenRefresh(messagingInstance, async (token) => {
      if (token) {
        await AsyncStorage.setItem('FCM_TOKEN', token);
      }
    });

    return unsubscribe;
  }, []);

  /* 🎯 ROUTE READY HOOK ---------- */
  const onNavigationReady = async () => {
    try {
      const initial = await notifee.getInitialNotification();

      if (initial && initial.notification) {
        const data = initial.notification.data;
        const pressId = initial.pressAction?.id;
        const notifId = initial.notification.id || data?.bookingRequestId;

        const storageKey = `PROCESSED_INITIAL_NOTIF_${notifId}`;
        const isProcessed = await AsyncStorage.getItem(storageKey);

        if (isProcessed === 'true') {
          console.log('⚡ Cold-start notification already consumed. Skipping re-route on reload.');
          return;
        }

        await AsyncStorage.setItem(storageKey, 'true');

        if (notifId) {
          await notifee.cancelNotification(notifId);
          await notifee.cancelDisplayedNotification(notifId);
        }

        console.log('🔥 Cold Start Notification Consumed & Intent Cleared!');

        if (pressId === 'DELAY_BOOKING') {
          executeRouteNavigation('BookingRequestScreen', {
            bookingRequestId: data?.bookingRequestId,
            openDelayModal: true
          }, notifId);
        } else {
          await processNotificationRoute(data, notifId);
        }
      }
    } catch (err) {
      console.log("Cold start route check error:", err);
    }
  };

  if (loading || checkingUpdate) return null;

  if (forceUpdate) {
    return (
      <SafeAreaView style={{
        flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20
      }}>
        <View style={{
          width: 100, height: 100, borderRadius: 50, backgroundColor: '#1C1C1C', justifyContent: 'center', alignItems: 'center', marginBottom: 25
        }}>
          <Image source={require('./src/assets/my_naai.png')} style={{ width: 60, height: 60, resizeMode: 'contain' }} />
        </View>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF', marginBottom: 10 }}>Update Required</Text>
        <Text style={{ textAlign: 'center', color: '#B0B0B0', fontSize: 16, lineHeight: 22, marginBottom: 30 }}>
          A new version of MyNaai is available. Please update the app to continue.
        </Text>
        <TouchableOpacity
          onPress={() => Linking.openURL(storeUrl)}
          style={{ width: '100%', backgroundColor: '#E8B97E', paddingVertical: 14, borderRadius: 10, alignItems: 'center' }}
        >
          <Text style={{ color: '#000', fontSize: 16, fontWeight: '600' }}>Update Now</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <NotificationProvider userId={userId} userType={userType}>
      <SafeAreaProvider>
        <NavigationContainer 
          key={isLoggedIn ? 'app' : 'auth'} 
          ref={navigationRef}
          onReady={onNavigationReady}
        >
          {isLoggedIn ? (
            <AppStack userType={userType} isNewSalon={isNewSalon} />
          ) : (
            <AuthStack onLoginSuccess={type => { setUserType(type); setIsLoggedIn(true); }} />
          )}
        </NavigationContainer>
      </SafeAreaProvider>
    </NotificationProvider>
  );
}