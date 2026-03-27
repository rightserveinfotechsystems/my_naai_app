import 'react-native-gesture-handler'; // MUST be first

import React, { useEffect, useRef, useState } from 'react';
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
import BookingRequestScreen from './src/screens/BookingRequestScreen';
import DelayRequestScreen from './src/screens/DelayRequestScreen';
import { Text, TextInput } from 'react-native';

/* ---------- NAV REF ---------- */
// export const navigationRef = React.createRef();
// const isNavigationReady = React.createRef();
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

/* ---------- Roboto font ---------- */

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = { fontFamily: 'Roboto-Regular' };

TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.style = { fontFamily: 'Roboto-Regular' };

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
    <Stack.Navigator screenOptions={{
      headerShown: false, animation: 'slide_from_right',
      contentStyle: { backgroundColor: '#0F0F0F' },
    }}>
      <Stack.Screen name="SplashLogo" component={SplashLogoScreen} />
      <Stack.Screen name="SplashScreen" component={SplashScreen} />
      {/* <Stack.Screen name="UserLogin">
        {props => <UserLogin {...props} onLoginSuccess={onLoginSuccess} />}
      </Stack.Screen> */}
      <Stack.Screen name="UserSignup">
        {props => <UserSignup {...props} onLoginSuccess={onLoginSuccess} />}
      </Stack.Screen>
      {/* <Stack.Screen name="UserSignup" component={UserSignup} /> */}
      <Stack.Screen name="UserLogin" component={UserLogin} />
      <Stack.Screen name="OtpScreen">
        {props => <OtpScreen {...props} onLoginSuccess={onLoginSuccess} />}
      </Stack.Screen>
      <Stack.Screen name="NaaiLogin" component={NaaiLogin} />
      <Stack.Screen name="NaaiRequest" component={NaaiRequest} />
      <Stack.Screen name="SalonOtpScreen" component={SalonOtpScreen} />
      <Stack.Screen name="SalonInfoForRegister" component={SalonInfoForRegister} />
      <Stack.Screen name="SalonBusinessInfo" component={SalonBusinessInfo} />
      <Stack.Screen name="SalonRegisterOtpScreen" component={SalonRegisterOtpScreen} />
      {/* <Stack.Screen name="SubscriptionsPlan" component={SubscriptionsPlan} /> */}
      <Stack.Screen name="SubscriptionsPlan">
        {props => <SubscriptionsPlan {...props} onLoginSuccess={onLoginSuccess} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

/* ---------- APP STACK ---------- */
function AppStack({ userType }) {
  if (!userType) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userType === 'USER' ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Salon" component={SalonTabs} />
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
      <Stack.Screen name="BookingRequestScreen" component={BookingRequestScreen} />
      <Stack.Screen name="DelayRequestScreen" component={DelayRequestScreen} />

    </Stack.Navigator>
  );
}

const safeNavigate = (name, params) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    setTimeout(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate(name, params);
      }
    }, 500);
  }
};


/* ---------- ROOT APP ---------- */
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null);
  const [userId, setUserId] = useState('');

  const userTypeRef = useRef(null);
  useEffect(() => {
    userTypeRef.current = userType;
  }, [userType]);

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
          setIsLoggedIn(false);
          setUserType(null);
          setUserId('');
        }
      } catch {
        setIsLoggedIn(false);
        setUserType(null);
        setUserId('');
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

    const unsubscribeMsg = messaging().onMessage(async msg => {
      console.log("Full message 👉", msg);
      console.log("Notification data 👉", msg.data);
      await notifee.displayNotification({
        title: msg.notification?.title,
        body: msg.notification?.body,
        android: { channelId: 'default_channel' },
        data: msg.data,
      });
    });

    const unsubscribeNotifee = notifee.onForegroundEvent(
      ({ type, detail }) => {

        if (type !== EventType.PRESS) return;

        const data = detail.notification?.data;

        console.log("Pressed Data 👉", data);
        console.log("UserType 👉", userTypeRef.current);

        // 👉 USER - Delay Request
        if (
          data?.type === "DELAY_TIME_PROPOSAL" &&
          userTypeRef.current === "USER"
        ) {
          safeNavigate("DelayRequestScreen", {
            bookingRequestId: data?.bookingRequestId,
            delayMinutes: data?.delayMinutes,
            proposedTime: data?.proposedTime,
          });
          return;
        }


        // 👉 USER - Booking Confirmed
        if (
          data?.type === "BOOKING_CONFIRMED" &&
          userTypeRef.current === "USER"
        ) {
          safeNavigate("Booked Salon");
          return;
        }

        // 👉 USER - Booking Rejected
        if (
          data?.type === "BOOKING_REJECTED" &&
          userTypeRef.current === "USER"
        ) {
          safeNavigate("Booked Salon");
          return;
        }

        // 👉 SALON - Booking Request
        if (
          data?.type === "BOOKING_REQUEST" &&
          userTypeRef.current === "SALON"
        ) {
          safeNavigate("BookingRequestScreen", {
            bookingRequestId: data?.bookingRequestId,
          });
          return;
        }

        // 👉 DELAY_RESPONSE → DO NOTHING
        if (data?.type === "DELAY_RESPONSE") {
          console.log("Delay response received. No navigation.");
          return;
        }
      }
    );

    // When app is in background & user taps notification
    const unsubscribeOpened = messaging().onNotificationOpenedApp(
      remoteMessage => {

        const data = remoteMessage?.data;

        if (
          data?.type === "DELAY_TIME_PROPOSAL" &&
          userTypeRef.current === "USER"
        ) {
          safeNavigate("DelayRequestScreen", {
            bookingRequestId: data?.bookingRequestId,
            delayMinutes: data?.delayMinutes,
          });
        }
        // 👉 USER - Booking Confirmed
        if (
          data?.type === "BOOKING_CONFIRMED" &&
          userTypeRef.current === "USER"
        ) {
          safeNavigate("Booked Salon");
        }

        // 👉 USER - Booking Rejected
        if (
          data?.type === "BOOKING_REJECTED" &&
          userTypeRef.current === "USER"
        ) {
          safeNavigate("Booked Salon");
        }
        if (
          data?.type === "BOOKING_REQUEST" &&
          userTypeRef.current === "SALON"
        ) {
          safeNavigate("BookingRequestScreen", {
            bookingRequestId: data?.bookingRequestId,
          });
        }

        // DELAY_RESPONSE → do nothing
      }
    );


    // When app is completely closed & opened from notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        const data = remoteMessage?.data;

        if (!data) return;

        if (
          data?.type === "DELAY_TIME_PROPOSAL" &&
          userTypeRef.current === "USER"
        ) {
          safeNavigate("DelayRequestScreen", {
            bookingRequestId: data?.bookingRequestId,
            delayMinutes: data?.delayMinutes,
          });
        }


        if (
          data?.type === "BOOKING_CONFIRMED" &&
          userTypeRef.current === "USER"
        ) {
          safeNavigate("Booked Salon");
        }

        if (
          data?.type === "BOOKING_REJECTED" &&
          userTypeRef.current === "USER"
        ) {
          safeNavigate("Booked Salon");
        }
        if (
          data?.type === "BOOKING_REQUEST" &&
          userTypeRef.current === "SALON"
        ) {
          safeNavigate("BookingRequestScreen", {
            bookingRequestId: data?.bookingRequestId,
          });
        }

        // DELAY_RESPONSE → no navigation
      });




    return () => {
      unsubscribeMsg();
      unsubscribeNotifee();
      unsubscribeOpened();
    };

  }, []);

  /* ---------- FCM ---------- */
  useEffect(() => {
    const initFCM = async () => {
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          const token = await messaging().getToken();
          await AsyncStorage.setItem('FCM_TOKEN', token);

        }

      } catch { }
    };

    initFCM();

    const unsubscribe = messaging().onTokenRefresh(async token => {
      await AsyncStorage.setItem('FCM_TOKEN', token);
    });

    return unsubscribe;
  }, []);

  //  useEffect(() => {

  //   const unsubscribe = messaging().onMessage(async remoteMessage => {

  //     if (remoteMessage.data?.type === 'BOOKING_DELAY') {

  //       const { bookingId, newTime } = remoteMessage.data;

  //       Alert.alert(
  //         'Salon Delay',
  //         `Salon is busy. Can you come at ${formatTime(newTime)} instead?`,
  //         [
  //           {
  //             text: 'Cancel',
  //             onPress: () => sendDelayResponse(bookingId, false),
  //             style: 'cancel',
  //           },
  //           {
  //             text: 'Accept',
  //             onPress: () => sendDelayResponse(bookingId, true),
  //           },
  //         ]
  //       );
  //     }
  //   });

  //   return unsubscribe;

  // }, []);


  if (loading) return null;

  return (
    <NotificationProvider userId={userId}>
      <NavigationContainer
        key={isLoggedIn ? 'app' : 'auth'}
        ref={navigationRef}
      // onReady={() => {
      //   isNavigationReady.current = true;
      // }}
      >

        {isLoggedIn ? (
          <AppStack userType={userType} />
        ) : (
          <AuthStack
            onLoginSuccess={type => {
              setUserType(type);
              setIsLoggedIn(true);
            }}
          />
        )}
      </NavigationContainer>
    </NotificationProvider>
  );
}
