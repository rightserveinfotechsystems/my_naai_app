import 'react-native-gesture-handler'; // MUST be first
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationProvider } from './src/components/NotificationContext';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { enableScreens } from 'react-native-screens';
enableScreens();

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
