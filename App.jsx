import 'react-native-gesture-handler'; // MUST be first
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { NotificationProvider } from './src/components/NotificationContext';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { enableScreens } from 'react-native-screens';
enableScreens();
import messaging from '@react-native-firebase/messaging';

import Ionicons from 'react-native-vector-icons/Ionicons';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import SplashLogoScreen from './src/screens/SplashLogoScreen';
import NaaiDashboard from './src/screens/NaaiDashboard';
import ServicesScreen from './src/screens/ServicesScreen';
import AccountScreen from './src/screens/AccountScreen';
import UserProduct from './src/screens/UserProduct';
import SalonDetailScreen from './src/screens/SalonDetailScreen';
import BookingSchedule from './src/screens/BookingSchedule';
import UserLogin from './src/components/UserLogin';
import UserSignup from './src/components/UserSignup';
import OtpScreen from './src/components/OtpScreen';
import SalonOtpScreen from './src/components/SalonOtpScreen';
import FAQScreen from './src/pages/FAQScreen';
import TermsScreen from './src/pages/TermsScreen';
import AboutScreen from './src/pages/AboutScreen';
import NaaiLogin from './src/components/NaaiLogin';
import NaaiRequest from './src/components/NaaiRequest';
import SalonDashboard from './src/screens/SalonDashboard';
import SalonBookingHistory from './src/screens/SalonBookingHistory';
import SalonProduct from './src/screens/SalonProduct';
import SalonAccountScreen from './src/screens/SalonAccountScreen';
import AddOfflineCustomer from './src/components/AddOfflineCustomer';
import SalonNotifications from './src/screens/SalonNotifications';

import { requestNotificationPermission } from './src/utilities/notificationPermission';
import { initTTS, speakNewBooking  } from './src/utilities/tts';
import { Alert, Linking } from 'react-native';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const navigationRef = React.createRef();

/* 🎨 Salon Theme Colors */
const COLORS = {
  primary: '#0F0F0F',   // Black
  accent: '#E1B378',    // Gold  E1B378 
  inactive: '#9E9E9E',  // Grey
  background: '#FFFFFF',
};

/* 🔻 Bottom Tabs */
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.primary,
          borderTopWidth: 0,
          height: 70,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarLabelStyle: {
          fontSize: 13,
          marginBottom: 6,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Salon Naai') {
            iconName = 'list-circle';
          } else if (route.name === 'Booked Salon') {
            iconName = 'cut';
          } else if (route.name === 'Products') {
            iconName = 'storefront-outline';
          } else if (route.name === 'Account') {
            iconName = 'person';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
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

function SalonTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.primary,
          borderTopWidth: 0,
          height: 70,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarLabelStyle: {
          fontSize: 13,
          marginBottom: 6,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Queue') {
            iconName = 'list-circle';
          } else if (route.name === 'Queue History') {
            iconName = 'cut';
          } else if (route.name === 'Product') {
            iconName = 'storefront-outline';
          } else if (route.name === 'Account') {
            iconName = 'person';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Queue"
        component={SalonDashboard}
      />

      <Tab.Screen
        name="Queue History"
        component={SalonBookingHistory}
      />
      <Tab.Screen
        name="Product"
        component={SalonProduct}
      />

      <Tab.Screen
        name="Account"
        component={SalonAccountScreen}
      />
    </Tab.Navigator>
  );
}

/* 🔷 Root App */

const App = () => {
  const [userId, setUserId] = useState("");
  const [loadingUserId, setLoadingUserId] = useState(true);

  // Create default channel for Android
  useEffect(() => {
    async function createChannel() {
      await notifee.createChannel({
        id: 'default_channel',
        name: 'Default Notifications',
        importance: AndroidImportance.HIGH,
        // sound: 'buzzer',
        vibrationPattern: [300, 200, 300, 200, 600, 400]
      });
    }
    createChannel();
  }, []);

  // Request permission + get token

  useEffect(() => {
  requestNotificationPermission();
}, []);

useEffect(() => {
  let unsubscribeTokenRefresh;

  const initFCM = async () => {
    try {
      // 🔔 Request permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        Alert.alert(
          'Enable Notifications',
          'Please enable notifications to receive updates.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      // ⏳ Small delay prevents SERVICE_NOT_AVAILABLE
      await new Promise(res => setTimeout(res, 1500));

      // 📲 Get token safely
      const token = await messaging().getToken();
      console.log('✅ Device token:', token);

      // ✅ SEND TO BACKEND HERE
      // await communication.saveFcmToken(token);

      // 🔁 Token refresh listener
      unsubscribeTokenRefresh = messaging().onTokenRefresh(newToken => {
        console.log('🔄 Refreshed token:', newToken);
        // await communication.saveFcmToken(newToken);
      });

    } catch (error) {
      console.log('❌ FCM init error:', error.message);
      // ❗ Never crash app
    }
  };

  initFCM();

  return () => {
    if (unsubscribeTokenRefresh) unsubscribeTokenRefresh();
  };
}, []);


  // Foreground notifications
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      speakNewBooking();
      console.log('Foreground notification:', remoteMessage);
      await notifee.displayNotification({
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        android: {
          channelId: 'default_channel',
          pressAction: { id: 'default' },
          //  sound: 'buzzer',
        },
        data: remoteMessage.data,
      });
    });
    return unsubscribe;
  }, []);

  // Killed / background notifications
  useEffect(() => {
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('App opened from notification (killed):', remoteMessage);
          // Navigate to a screen if included in data
          const screen = remoteMessage.data?.screen;
          if (screen) navigationRef.current?.navigate(screen);
        }
      });

    // Background handler (Android)
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background notification:', remoteMessage);
      // Optional: handle background notification data
    });
  }, []);

  useEffect(() => {
  initTTS();
}, []);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const userData = await AsyncStorage.getItem('mynaaiUser');
        console.log("userData for socket", userData);

        if (userData) {
          const parsed = JSON.parse(userData);
          // Try userId from user or salon object
          setUserId(parsed?.userId || parsed?.salon?.salonId || "");
        } else {
          setUserId("");
        }
      } catch {
        setUserId("");
      } finally {
        setLoadingUserId(false);
      }
    };
    fetchUserId();
  }, []);

  if (loadingUserId) return null; // or a splash/loading indicator




  return (
    <NotificationProvider userId={userId}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator initialRouteName="SplashLogo">
          {/* ...existing Stack.Screen components... */}
          <Stack.Screen
            name="SplashLogo"
            component={SplashLogoScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SplashScreen"
            component={SplashScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="UserLogin"
            component={UserLogin}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Salon"
            component={SalonTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SalonDetail"
            component={SalonDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="BookingSchedule"
            component={BookingSchedule}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="UserSignup"
            component={UserSignup}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="OtpScreen"
            component={OtpScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FAQScreen"
            component={FAQScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TermsScreen"
            component={TermsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AboutScreen"
            component={AboutScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NaaiLogin"
            component={NaaiLogin}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NaaiRequest"
            component={NaaiRequest}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SalonOtpScreen"
            component={SalonOtpScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddOfflineCustomer"
            component={AddOfflineCustomer}
          />
          <Stack.Screen
            name="SalonNotifications"
            component={SalonNotifications}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </NotificationProvider>
  );
};

export default App;
