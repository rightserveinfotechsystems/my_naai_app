import React, { useEffect, useRef } from 'react';
import { View, Animated, StatusBar, Dimensions, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BootSplash from 'react-native-bootsplash';

const { width } = Dimensions.get('window');

const SplashLogoScreen = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate logo fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(async () => {
      BootSplash.hide({ fade: true });

      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
        const userType = await AsyncStorage.getItem('userType');

        if (!hasSeenOnboarding) {
          navigation.replace('SplashScreen');
        }
        else if (isLoggedIn === 'true') {
          if (userType === 'USER') {
            navigation.replace('Main');
          }
          else if (userType === 'SALON') {
            navigation.replace('Salon');
          }
          else {
            // safety fallback
            navigation.replace('UserLogin');
          }
        }
        else {
          navigation.replace('UserLogin');
        }

      } catch (error) {
        console.log('Splash navigation error:', error);
        navigation.replace('UserLogin');
      }
    }, 2500); // 2.5s splash

    return () => clearTimeout(timer);
  }, [fadeAnim, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0F0F0F" barStyle="light-content" />
      <Animated.Image
        source={require('../assets/my_naai.png')}
        style={[styles.logo, { opacity: fadeAnim }]}
        resizeMode="contain"
      />
    </View>
  );
};

export default SplashLogoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.5,
    height: width * 0.5,
  },
});
