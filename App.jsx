import 'react-native-gesture-handler'; // MUST be first
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { enableScreens } from 'react-native-screens';
enableScreens();

import Ionicons from 'react-native-vector-icons/Ionicons';

// Screens
import NaaiDashboard from './src/screens/NaaiDashboard';
import ServicesScreen from './src/screens/ServicesScreen';
import AccountScreen from './src/screens/AccountScreen';
import SalonDetailScreen from './src/screens/SalonDetailScreen';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const navigationRef = React.createRef();

/* 🎨 Salon Theme Colors */
const COLORS = {
  primary: '#0F0F0F',   // Black
  accent: '#D4AF37',    // Gold
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
        name="Account"
        component={AccountScreen}
      />
    </Tab.Navigator>
  );
}

/* 🔷 Root App */
const App = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator>
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
  name="SalonDetail"
  component={SalonDetailScreen}
  // options={{ title: 'Salon Details' }}
          options={{ headerShown: false }}
/>

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
