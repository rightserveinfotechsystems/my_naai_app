import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'The Professional\nSpecialists near you',
    desc: 'Find experienced barbers & salons around your location.',
    image: require('../assets/naai/naai3.jpg'),
  },
  {
    id: '2',
    title: 'Find nearby Salons &\nbook services',
    desc: 'Book haircut, beard, spa and more instantly.',
    image: require('../assets/naai/naai2.jpeg'),
  },
  {
    id: '3',
    title: 'Location Permission Access',
    desc: 'We use your location to find nearby salons and provide accurate service availability, even when the app is not in use.',
    image: require('../assets/naai/naai1.jpg'),
  },
];




const SplashScreen = ({ navigation }) => {
  const flatListRef = useRef(null);
  const [index, setIndex] = useState(0);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    navigation.replace('UserSignup');
  };
  const goNext = () => {
    if (index < SLIDES.length - 1) {
      flatListRef.current.scrollToIndex({ index: index + 1 });
    } else {
      completeOnboarding();
    }
  };

  const skipIntro = () => {
    completeOnboarding();
  };




  useEffect(() => {
    const checkFlow = async () => {
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      const userType = await AsyncStorage.getItem('userType');

      // 1️⃣ First install → onboarding
      if (!hasSeenOnboarding) {
        return; // Stay on onboarding
      }

      // 2️⃣ Already logged in → dashboard
      if (isLoggedIn === 'true') {
        navigation.reset({
          index: 0,
          routes: [{ name: userType === 'USER' ? 'Main' : 'Salon' }],
        });
      }
      // 3️⃣ Not logged in → login
      else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'UserSignup' }],
        });
      }
    };

    checkFlow();
  }, []);


  const renderItem = ({ item }) => (
    <ImageBackground source={item.image} style={styles.slide}>
      <View style={styles.overlay} />

      <SafeAreaView style={styles.content}>
        {/* Skip Button */}
        <TouchableOpacity style={styles.skipBtn} onPress={skipIntro}>
          <Text allowFontScaling={false}style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Text */}
        <View style={styles.textBox}>
          <Text allowFontScaling={false}style={styles.title}>{item.title}</Text>
          <Text allowFontScaling={false}style={styles.desc}>{item.desc}</Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        onScroll={e => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(i);
        }}
      />

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { opacity: index === i ? 1 : 0.3 },
            ]}
          />
        ))}
      </View>

      {/* Next Button */}
      <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
        <Ionicons name="arrow-forward" size={22} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  slide: {
    width,
    height,
    justifyContent: 'flex-end',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.70)',
  },

  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },

  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  skipText: {
    color: '#E1B378',
    fontSize: 14,
    fontWeight: '600',
  },

  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: 40,
  },

  textBox: {
    marginBottom: 140,
  },

  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
  },

  desc: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 12,
    lineHeight: 20,
  },

  dotsContainer: {
    position: 'absolute',
    bottom: 90,
    left: 30,
    flexDirection: 'row',
  },

  dot: {
    width: 16,
    height: 4,
    backgroundColor: '#E1B378',
    borderRadius: 10,
    marginRight: 8,
  },

  nextBtn: {
    position: 'absolute',
    bottom: 40,
    right: 30,
    backgroundColor: '#E1B378',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
});
