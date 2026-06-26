import 'react-native-gesture-handler'; // MUST be first
import './src/utilities/notifeeBackgroundHandler';
import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, DeviceEventEmitter, Image, Linking, TouchableOpacity, View } from 'react-native';

import notifee, { AndroidImportance, AndroidStyle, EventType } from '@notifee/react-native';
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
import UserNotifications from './src/screens/UserNotifications';
import BookingRequestScreen from './src/screens/BookingRequestScreen';
import DelayRequestScreen from './src/screens/DelayRequestScreen';
import { Text, TextInput } from 'react-native';

/* ---------- NAV REF ---------- */
// export const navigationRef = React.createRef();
// const isNavigationReady = React.createRef();
import { createNavigationContainerRef } from '@react-navigation/native';
import { communication } from './src/services/communication';
import VersionCheck from 'react-native-version-check';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// if (!Text.defaultProps) Text.defaultProps = {};
// Text.defaultProps.maxFontSizeMultiplier = 1.2;
// Text.defaultProps.style = { fontFamily: 'Roboto-Regular' };

// if (!TextInput.defaultProps) TextInput.defaultProps = {};
// TextInput.defaultProps.maxFontSizeMultiplier = 1.2;
// TextInput.defaultProps.style = { fontFamily: 'Roboto-Regular' };





const TextRender = Text.render;
Text.render = function (...args) {
  const origin = TextRender.call(this, ...args);
  return React.cloneElement(origin, {
    allowFontScaling: false,
  });
};

const TextInputRender = TextInput.render;
TextInput.render = function (...args) {
  const origin = TextInputRender.call(this, ...args);
  return React.cloneElement(origin, {
    allowFontScaling: false,
  });
};


//  useEffect(() => {
//     checkForceUpdate();
//   }, []);

//   const checkForceUpdate = async () => {
//     try {
//       const latestVersion = await VersionCheck.getLatestVersion();
//       const currentVersion = VersionCheck.getCurrentVersion();

//       console.log("Current:", currentVersion);
//       console.log("Latest:", latestVersion);
//       if (!latestVersion) {
//         setForceUpdate(false);
//         return;
//       }

//       const isUpdateNeeded =
//         currentVersion.localeCompare(latestVersion, undefined, { numeric: true }) === -1;

//       if (isUpdateNeeded) {
//         const url = await VersionCheck.getStoreUrl();
//         setStoreUrl(url);
//         setForceUpdate(true);
//       }
//     } catch (err) {
//       console.log("Update check error:", err);
//       setForceUpdate(false);
//     } finally {
//       setCheckingUpdate(false);
//     }
//   };

export const navigationRef = createNavigationContainerRef();

/* ---------- Roboto font ---------- */

// Text.defaultProps = Text.defaultProps || {};
// Text.defaultProps.style = { fontFamily: 'Roboto-Regular' };

// TextInput.defaultProps = TextInput.defaultProps || {};
// TextInput.defaultProps.style = { fontFamily: 'Roboto-Regular' };

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
    // marginBottom: 10,

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

    return (
      <Ionicons
        name={icons[route.name]}
        size={28}
        color={color}
      />
    );
  },
});


/* ---------- USER TABS ---------- */
function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) =>
        tabOptions({
          route,
          insets,
        })
      }
    >
      <Tab.Screen
        name="Salon Naai"
        component={NaaiDashboard}
      />

      <Tab.Screen
        name="Booked Salon"
        component={ServicesScreen}
      />

      <Tab.Screen
        name="Products"
        component={UserProduct}
      />

      <Tab.Screen
        name="Account"
        component={AccountScreen}
      />
    </Tab.Navigator>
  );
}

/* ---------- SALON TABS ---------- */
function SalonTabs() {
  const insets = useSafeAreaInsets();
  return (
    // <Tab.Navigator screenOptions={tabOptions}>
    <Tab.Navigator
      screenOptions={({ route }) =>
        tabOptions({
          route,
          insets,
        })
      }
    >
      <Tab.Screen name="Queue" component={SalonDashboard}

      />
      <Tab.Screen name="Queue History" component={SalonBookingHistory}
      />
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
      <Stack.Screen name="UserNotifications" component={UserNotifications} />
      <Stack.Screen name="BookingRequestScreen" component={BookingRequestScreen} />
      <Stack.Screen name="DelayRequestScreen" component={DelayRequestScreen} />

    </Stack.Navigator>
  );
}

const safeNavigate = (name, params) => {
  console.log(`🚀 Navigating to ${name} with params:`, params);
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
  const [checkingUpdate, setCheckingUpdate] = useState(true);
  const [forceUpdate, setForceUpdate] = useState(false);
  const [storeUrl, setStoreUrl] = useState('');



  useEffect(() => {
    checkForceUpdate();
  }, []);

  const checkForceUpdate = async () => {
    try {
      const latestVersion = await VersionCheck.getLatestVersion();
      const currentVersion = VersionCheck.getCurrentVersion();

      console.log("Current:", currentVersion);
      console.log("Latest:", latestVersion);
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

    notifee.createChannel({
      id: 'booking',
      name: 'Default Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'buzzer_old',
    });

    requestNotificationPermission();
    initTTS();

    const unsubscribeMsg = messaging().onMessage(async msg => {
      console.log("Full message 👉", msg);
      console.log("Notification data 👉", msg.data);
      await notifee.displayNotification({
        title: msg.notification?.title ||
          msg.data?.title ||
          'Notification',
        body: msg.notification?.body ||
          msg.data?.body ||
          '',
        android: {
          channelId: msg.data?.type === "BOOKING_REQUEST" ? 'booking' : 'default_channel',
          // color: '#E1B378',
          // style: {
          //   type: AndroidStyle.BIGTEXT,
          //   text: msg.notification?.body
          // },
          style: {
            type: AndroidStyle.BIGTEXT,
            text: msg.notification?.body || msg.data?.body || ''
          },
          smallIcon: 'ic_notification',

          // ongoing: false,
          ongoing: msg.data?.type === "BOOKING_REQUEST" ? true : false,
          // autoCancel: msg.data?.type === "BOOKING_REQUEST" ? true : false,
          // autoCancel: true,
          timeoutAfter: msg.data?.type === "BOOKING_REQUEST" ? 70000 : undefined,
          actions:
            msg.data?.type === "BOOKING_REQUEST"
              ? [
                {
                  title: '✅ Accept',
                  pressAction: {
                    id: 'ACCEPT_BOOKING',
                  },
                },
                {
                  title: '⏳ Delay',
                  pressAction: {
                    id: 'DELAY_BOOKING',
                    launchActivity: 'default',
                  },
                },
                {
                  title: '❌ Reject',
                  pressAction: {
                    id: 'REJECT_BOOKING',
                  },
                },

              ] : [],
        },
        data: msg.data,
      });
    });

    const unsubscribeNotifee = notifee.onForegroundEvent(
      async ({ type, detail }) => {

        const { notification, pressAction } = detail;
        const data = notification?.data;

        console.log("Type 👉", type);
        console.log("Action 👉", pressAction?.id);

        /* ---------------- ACTION BUTTON CLICK ---------------- */
        if (type === EventType.ACTION_PRESS) {

          const bookingRequestId = data?.bookingRequestId;

          // 👉 ACCEPT
          if (pressAction?.id === 'ACCEPT_BOOKING') {
            await communication.bookingRequestOwnerAction(
              bookingRequestId,
              { action: "ACCEPT" }
            );

            await notifee.cancelNotification(notification.id);
            return;
          }

          // 👉 REJECT
          if (pressAction?.id === 'REJECT_BOOKING') {
            await communication.bookingRequestOwnerAction(
              bookingRequestId,
              { action: "REJECT" }
            );

            await notifee.cancelNotification(notification.id);
            return;
          }

          // 👉 DELAY
          if (pressAction?.id === 'DELAY_BOOKING') {
            safeNavigate("BookingRequestScreen", {
              bookingRequestId: data?.bookingRequestId,
              openDelayModal: true,   // 👈 important
            });
            return;
          }
        }

        /* ---------------- NORMAL NOTIFICATION CLICK ---------------- */
        if (type !== EventType.PRESS) return;

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

  // useEffect(() => {
  //   async function handleInitialNotifee() {
  //     const initialNotification = await notifee.getInitialNotification();

  //     if (!initialNotification) return;

  //     const { pressAction, notification } = initialNotification;
  //     const data = notification?.data;

  //     console.log("Initial Action 👉", pressAction?.id);

  //     // ✅ DELAY BUTTON
  //     if (pressAction?.id === 'DELAY_BOOKING') {
  //       safeNavigate("BookingRequestScreen", {
  //         bookingRequestId: data?.bookingRequestId,
  //         openDelayModal: true,
  //       });
  //       return;
  //     }

  //     // ✅ ACCEPT
  //     if (pressAction?.id === 'ACCEPT_BOOKING') {
  //       await communication.bookingRequestOwnerAction(
  //         data?.bookingRequestId,
  //         { action: "ACCEPT" }
  //       );
  //       return;
  //     }

  //     // ✅ REJECT
  //     if (pressAction?.id === 'REJECT_BOOKING') {
  //       await communication.bookingRequestOwnerAction(
  //         data?.bookingRequestId,
  //         { action: "REJECT" }
  //       );
  //       return;
  //     }
  //   }

  //   handleInitialNotifee();
  // }, []);


  useEffect(() => {

    const handlePendingNavigation = async () => {

      const pending = await AsyncStorage.getItem('PENDING_NAVIGATION');

      if (!pending) return;

      const parsed = JSON.parse(pending);

      setTimeout(() => {

        if (navigationRef.isReady()) {
          navigationRef.navigate(parsed.screen, parsed.params);
        }

      }, 1500);

      await AsyncStorage.removeItem('PENDING_NAVIGATION');
    };

    handlePendingNavigation();

  }, []);

  /* ---------- FCM ---------- */
  useEffect(() => {
    const initFCM = async () => {
      try {
        // Request notification permission
        const authStatus = await messaging().requestPermission();

        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        console.log('Permission Status:', authStatus);

        if (!enabled) {
          console.log('❌ Notification permission denied');
          return;
        }

        // Important for Android
        await messaging().registerDeviceForRemoteMessages();

        // Enable auto init
        await messaging().setAutoInitEnabled(true);

        // Get FCM token
        const token = await messaging().getToken();

        console.log('🔥 FCM TOKEN:', token);

        if (token) {
          await AsyncStorage.setItem('FCM_TOKEN', token);
        } else {
          console.log('❌ FCM token is empty');
        }

      } catch (error) {
        console.log('❌ FCM INIT ERROR:', error);
      }
    };

    // Initialize FCM
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
  useEffect(() => {
    const handleInitialNotification = async () => {
      const initial = await notifee.getInitialNotification();

      // Check if the notification exists and the ID matches
      if (initial && initial.pressAction?.id === 'DELAY_BOOKING') {
        const checkNavReady = setInterval(() => {
          if (navigationRef.isReady()) {
            // FIX: Pass the specific ID and the flag to open the modal
            safeNavigate('BookingRequestScreen', {
              bookingRequestId: initial.notification.data?.bookingRequestId,
              openDelayModal: true
            });
            clearInterval(checkNavReady);
          }
        }, 100);
      }
    };

    handleInitialNotification();

    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'DELAY_BOOKING') {
        // FIX: Ensure parameters match what BookingRequestScreen expects
        safeNavigate('BookingRequestScreen', {
          bookingRequestId: detail.notification.data?.bookingRequestId,
          openDelayModal: true
        });
      }
    });

    return () => unsubscribe();
  }, []);


  if (loading) return null;


  if (checkingUpdate) {
    return null; // ⏳ wait for version check
  }

  if (forceUpdate) {
    return (

      <SafeAreaView style={{
        flex: 1,
        backgroundColor: '#0F0F0F',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20
      }}>

        {/* App Icon / Illustration */}
        <View style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: '#1C1C1C',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 25,
          shadowColor: '#E8B97E',
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 6
        }}>
          <Image
            source={require('./src/assets/my_naai.png')}
            style={{
              width: 60,
              height: 60,
              resizeMode: 'contain'
            }}
          />
        </View>

        {/* Title */}
        <Text style={{
          fontSize: 24,
          fontWeight: '700',
          color: '#FFFFFF',
          marginBottom: 10
        }}>
          Update Required
        </Text>

        {/* Subtitle */}
        <Text style={{
          textAlign: 'center',
          color: '#B0B0B0',
          fontSize: 16,
          lineHeight: 22,
          marginBottom: 30
        }}>
          A new version of MyNaai is available.
          Please update the app to continue.
        </Text>

        {/* Update Button */}
        <TouchableOpacity
          onPress={() => Linking.openURL(storeUrl)}
          activeOpacity={0.8}
          style={{
            width: '100%',
            backgroundColor: '#E8B97E',
            paddingVertical: 14,
            borderRadius: 10,
            alignItems: 'center',
            shadowColor: '#E8B97E',
            shadowOpacity: 0.4,
            shadowRadius: 10,
            elevation: 5
          }}
        >
          <Text style={{
            color: '#000',
            fontSize: 16,
            fontWeight: '600'
          }}>
            Update Now
          </Text>
        </TouchableOpacity>

        {/* Optional note */}
        <Text style={{
          marginTop: 20,
          fontSize: 13,
          color: '#666',
          textAlign: 'center'
        }}>
          This update is mandatory to continue using the app.
        </Text>

      </SafeAreaView>
    );
  }

  return (
    <NotificationProvider userId={userId}>
      <SafeAreaProvider>
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
      </SafeAreaProvider>
    </NotificationProvider>
  );
}
