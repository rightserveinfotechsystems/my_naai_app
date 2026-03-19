// NaaiRequest.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { communication } from '../services/communication';
import { CITY_OPTIONS, SALON_OPTIONS } from '../utilities/citiesRequestArray';
import RNPickerSelect from 'react-native-picker-select';
import Geolocation from 'react-native-geolocation-service';
import Geocoder from 'react-native-geocoding';

Geocoder.init("AIzaSyCz32prVTCy8x0xtd2mB2Q8rTYmvbqi8Tw");

const BG_IMAGE = require('../assets/salon_page_bg.jpg');

const SalonInfoForRegister = ({ navigation, route }) => {

  const phoneNumber = route?.params?.phoneNumber || '';
  const tempToken = route?.params?.tempToken || '';
  const userData = route?.params?.userData || {};
  const [naaiName, setNaaiName] = useState('');
  const [salonName, setSalonName] = useState('');
  const [mobile, setMobile] = useState(phoneNumber);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [genderType, setGenderType] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [agentCode, setAgentCode] = useState('');
  const [loading, setLoading] = useState(false);

  /* ---------------- VALIDATION ---------------- */


  const getCurrentLocation = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {

        Geolocation.getCurrentPosition(
          async (position) => {

            const { latitude, longitude } = position.coords;

            setLatitude(latitude);
            setLongitude(longitude);
            console.log("LAT:", latitude);
            console.log("LNG:", longitude);

            const response = await Geocoder.from(latitude, longitude);

            const address = response.results[0].formatted_address;

            setAddress(address);

          },
          (error) => {
            console.log(error);
            Alert.alert("Error", "Unable to fetch location");
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          }
        );

      }

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const validate = () => {
    if (!naaiName.trim()) {
      Alert.alert('Validation', 'Please enter Naai name');
      return false;
    }
    if (!salonName.trim()) {
      Alert.alert('Validation', 'Please enter Salon name');
      return false;
    }
    if (mobile.length !== 10) {
      Alert.alert('Validation', 'Enter valid 10-digit mobile number');
      return false;
    }
    if (!address.trim()) {
      Alert.alert('Validation', 'Please enter address');
      return false;
    }
    if (!city) {
      Alert.alert('Validation', 'Please select a city');
      return false;
    }


    return true;
  };

  /* ---------------- SUBMIT ---------------- */

  // const handleSignup = () => {


 const handleSignup = () => {
  if (!validate()) return;

  const payload = {
    ownerName: naaiName,
    phoneNumber: mobile,
    salonName: salonName,
    addressLine1: address,
    city: city,
    agentCode: agentCode,
    genderType: genderType,
    latitude: latitude,
    longitude: longitude,
    tempToken: tempToken,
  };

  console.log("NAVIGATING WITH:", payload);

  navigation.navigate("SubscriptionsPlan", {
    userData: payload,
  });
};


  return (
    <ImageBackground source={BG_IMAGE} style={styles.bg}>
      <View style={styles.overlay}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* 🔙 Back */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
          >
            <Text style={styles.title}>Register as a Salon Owner</Text>

            <View style={styles.inputBox}>
              <TextInput
                placeholder="Salon Owner Name"
                placeholderTextColor="#999"
                value={naaiName}
                onChangeText={setNaaiName}
                style={styles.input}
              />
            </View>

            <View style={styles.inputBox}>
              <TextInput
                placeholder="Salon Name"
                placeholderTextColor="#999"
                value={salonName}
                onChangeText={setSalonName}
                style={styles.input}
              />
            </View>

            <View style={styles.inputBox}>
              <View style={styles.phoneContainer}>
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  value={mobile}
                  editable={false}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.inputBox}>
              <TextInput
                placeholder="Fetching location..."
                placeholderTextColor="#999"
                value={address}
                editable={false}
                style={styles.input}
              />
            </View>
            <View style={styles.inputBox}>
              <RNPickerSelect
                placeholder={{ label: 'Select City', value: null }}
                value={city}
                onValueChange={setCity}
                items={CITY_OPTIONS}
                style={{
                  inputAndroid: styles.pickerInput,
                  inputIOS: styles.pickerInput,
                  placeholder: { color: '#999' },
                }}
                useNativeAndroidPickerStyle={false}
              />
            </View>
            {/* <View style={styles.inputBox}>
              <TextInput
                placeholder="City"
                placeholderTextColor="#999"
                value={city}
                onChangeText={setCity}
                style={styles.input}
              />
            </View> */}
            <View style={styles.inputBox}>
              <TextInput
                placeholder="Agent Code"
                placeholderTextColor="#999"
                value={agentCode}
                onChangeText={setAgentCode}
                style={styles.input}
                maxLength={10}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.inputBox}>
              <RNPickerSelect
                placeholder={{ label: 'Select Salon Type', value: null }}
                value={genderType}
                onValueChange={setGenderType}
                items={SALON_OPTIONS}
                style={{
                  inputAndroid: styles.pickerInput,
                  inputIOS: styles.pickerInput,
                  placeholder: { color: '#999' },
                }}
                useNativeAndroidPickerStyle={false}
              />
            </View>
            <TouchableOpacity
              style={styles.signupBtn}
              // onPress={() => navigation.navigate("SalonRegisterOtpScreen")}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.signupText}>Continue</Text>
              )}
            </TouchableOpacity>

            {/* <Text style={styles.terms}>
              By continuing you agree to our{'\n'}
              Terms & Conditions
            </Text> */}

            <Text style={styles.footer}>
              Already registered?{' '}
              <Text
                style={styles.link}
                onPress={() => navigation.navigate('NaaiLogin')}
              >
                Sign In
              </Text>
            </Text>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

export default SalonInfoForRegister;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  bg: { flex: 1 },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },

  header: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
  },

  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 30,
  },

  inputBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 54,
    justifyContent: 'center',
    marginBottom: 18,
  },

  input: {
    color: '#fff',
    fontSize: 15,
  },

  signupBtn: {
    backgroundColor: '#E8B97E',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },

  signupText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },

  terms: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },

  footer: {
    color: '#aaa',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 24,
    fontWeight: '500',
  },

  link: {
    color: '#E8B97E',
    fontWeight: '600',
  },
  pickerInput: {
    color: '#fff',          // 👈 IMPORTANT
    fontSize: 15,
    height: 50,
    paddingVertical: 12,
  },

  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  countryCode: {
    color: '#fff',
    fontSize: 15,
    marginRight: 8,
    fontWeight: '600',
  },

  phoneInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },


});
