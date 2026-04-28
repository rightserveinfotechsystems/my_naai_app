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
// import Geocoder from 'react-native-geocoding';

// Geocoder.init("AIzaSyCz32prVTCy8x0xtd2mB2Q8rTYmvbqi8Tw");

const BG_IMAGE = require('../assets/salon_page_bg.jpg');

const NaaiRequest = ({ navigation }) => {
  const [naaiName, setNaaiName] = useState('');
  const [salonName, setSalonName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [agentCode, setAgentCode] = useState('');
  const [loading, setLoading] = useState(false);

  /* ---------------- VALIDATION ---------------- */


  // const getCurrentLocation = async () => {
  //   try {
  //     const granted = await PermissionsAndroid.request(
  //       PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  //     );

  //     if (granted === PermissionsAndroid.RESULTS.GRANTED) {

  //       Geolocation.getCurrentPosition(
  //         async (position) => {

  //           const { latitude, longitude } = position.coords;

  //           console.log("LAT:", latitude);
  //           console.log("LNG:", longitude);

  //           const response = await Geocoder.from(latitude, longitude);

  //           const address = response.results[0].formatted_address;

  //           setAddress(address);

  //         },
  //         (error) => {
  //           console.log(error);
  //           Alert.alert("Error", "Unable to fetch location");
  //         },
  //         {
  //           enableHighAccuracy: true,
  //           timeout: 15000,
  //           maximumAge: 10000,
  //         }
  //       );

  //     }

  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // useEffect(() => {
  //   getCurrentLocation();
  // }, []);

  const validate = () => {
    // if (!naaiName.trim()) {
    //   Alert.alert('Validation', 'Please enter Naai name');
    //   return false;
    // }
    // if (!salonName.trim()) {
    //   Alert.alert('Validation', 'Please enter Salon name');
    //   return false;
    // }
    if (mobile.length !== 10) {
      Alert.alert('Validation', 'Enter valid 10-digit mobile number');
      return false;
    }
    // if (!address.trim()) {
    //   Alert.alert('Validation', 'Please enter address');
    //   return false;
    // }
    // if (!city) {
    //   Alert.alert('Validation', 'Please select a city');
    //   return false;
    // }


    return true;
  };

  /* ---------------- SUBMIT ---------------- */

  // const handleSignup = () => {


  const handleSignup = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        // fullName: naaiName,
        phoneNumber: mobile,
        // salonName: salonName,
        // address: address,
        // city: city,
      }
      console.log("payload", payload);

      const res = await communication.salonOwnerLogin(payload);
      console.log("API RESPONSE:", res);
      if (res?.status === 'SUCCESS') {
        // Alert.alert("Sent OTP on registered mobile number successfully");
        navigation.navigate("SalonRegisterOtpScreen", {
          mobile: mobile,
        });
      } else {
        Alert.alert('Error', res?.message || 'Failed to send request to admin');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };


  // };

  /* ---------------- UI ---------------- */

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
            <Text allowFontScaling={false}style={styles.title}>Register as a Salon Owner</Text>

            {/* <View style={styles.inputBox}>
              <TextInput allowFontScaling={false}
                placeholder="Salon Owner Name"
                placeholderTextColor="#999"
                value={naaiName}
                onChangeText={setNaaiName}
                style={styles.input}
              />
            </View>

            <View style={styles.inputBox}>
              <TextInput allowFontScaling={false}
                placeholder="Salon Name"
                placeholderTextColor="#999"
                value={salonName}
                onChangeText={setSalonName}
                style={styles.input}
              />
            </View> */}

            <View style={styles.inputBox}>
              <View style={styles.phoneContainer}>
                <Text allowFontScaling={false}style={styles.countryCode}>+91</Text>
                <TextInput allowFontScaling={false}
                  placeholder="Phone Number"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={mobile}
                  onChangeText={setMobile}
                  style={styles.input}
                />
              </View>
            </View>

            {/* <View style={styles.inputBox}>
              <TextInput allowFontScaling={false}
                placeholder="Fetching location..."
                placeholderTextColor="#999"
                value={address}
                editable={false}
                style={styles.input}
              />
            </View> */}
            {/* <View style={styles.inputBox}>
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
            </View> */}
            {/* <View style={styles.inputBox}>
              <TextInput allowFontScaling={false}
                placeholder="City"
                placeholderTextColor="#999"
                value={city}
                onChangeText={setCity}
                style={styles.input}
              />
            </View> */}
            {/* <View style={styles.inputBox}>
              <TextInput allowFontScaling={false}
                placeholder="Agent Code"
                placeholderTextColor="#999"
                value={agentCode}
                onChangeText={setAgentCode}
                style={styles.input}
              />
            </View>
            <View style={styles.inputBox}>
              <RNPickerSelect
                placeholder={{ label: 'Select Salon Type', value: null }}
                value={city}
                onValueChange={setCity}
                items={SALON_OPTIONS}
                style={{
                  inputAndroid: styles.pickerInput,
                  inputIOS: styles.pickerInput,
                  placeholder: { color: '#999' },
                }}
                useNativeAndroidPickerStyle={false}
              />
            </View> */}
            <TouchableOpacity
              style={styles.signupBtn}
              // onPress={() => navigation.navigate("SalonRegisterOtpScreen")}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text allowFontScaling={false}style={styles.signupText}>Send OTP</Text>
              )}
            </TouchableOpacity>

            {/* <Text allowFontScaling={false}style={styles.terms}>
              By continuing you agree to our{'\n'}
              Terms & Conditions
            </Text> */}

            <Text allowFontScaling={false}style={styles.footer}>
              Already registered?{' '}
              <Text allowFontScaling={false}
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

export default NaaiRequest;

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
    fontSize: 25,
    fontWeight: '700',
    marginBottom: 30,
  },

  // inputBox: {
  //   backgroundColor: '#1E1E1E',
  //   borderRadius: 12,
  //   paddingHorizontal: 16,
  //   height: 54,
  //   justifyContent: 'center',
  //   marginBottom: 18,
  // },



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

  inputBox: {
  width: '100%',
  backgroundColor: '#1E1E1E',
  borderRadius: 12,
  paddingHorizontal: 16,
  height: 54,
  justifyContent: 'center',
  marginBottom: 20,
},

phoneContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  height: '100%',
},

countryCode: {
  marginRight: 8,
  color: '#fff',
},

input: {
  flex: 1,
  color: '#fff',
  paddingVertical: 10,
},


});
