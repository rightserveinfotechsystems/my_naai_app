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
import DateTimePicker from '@react-native-community/datetimepicker';
import messaging from '@react-native-firebase/messaging';

Geocoder.init("AIzaSyCz32prVTCy8x0xtd2mB2Q8rTYmvbqi8Tw");

const BG_IMAGE = require('../assets/salon_page_bg.jpg');

const SalonInfoForRegister = ({ navigation, route }) => {

  const phoneNumber = route?.params?.phoneNumber || '';
  const tempToken = route?.params?.tempToken || '';
  const userData = route?.params?.userData || {};
  const [naaiName, setNaaiName] = useState('');
  const [salonName, setSalonName] = useState('');
  const [mobile, setMobile] = useState(phoneNumber);
  // const [address, setAddress] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [city, setCity] = useState('');
  const [genderType, setGenderType] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [agentCode, setAgentCode] = useState('');
  const getDefaultOpeningTime = () => {
    const date = new Date();
    date.setHours(9, 0, 0); // 9:00 AM
    return date;
  };

  const getDefaultClosingTime = () => {
    const date = new Date();
    date.setHours(22, 0, 0); // 10:00 PM
    return date;
  };

  const [openingTime, setOpeningTime] = useState(getDefaultOpeningTime());
  const [closingTime, setClosingTime] = useState(getDefaultClosingTime());
  const [showOpenPicker, setShowOpenPicker] = useState(false);
  const [showClosePicker, setShowClosePicker] = useState(false);
  const [deviceToken, setDeviceToken] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ---------------- VALIDATION ---------------- */

  const formatDisplayTime = (date) => {
    if (!date) return "";

    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours === 0 ? 12 : hours;

    return `${hours}:${minutes} ${ampm}`;
  };

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

            // const address = response.results[0].formatted_address;

            // setAddress(address);

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
    // if (!address.trim()) {
    //   Alert.alert('Validation', 'Please enter address');
    //   return false;
    // }
    if (!manualAddress.trim()) {
      Alert.alert('Validation', 'Please enter manual address');
      return false;
    }
    // if (!city) {
    //   Alert.alert('Validation', 'Please select a city');
    //   return false;
    // }
    // if (closingTime <= openingTime) {
    //   Alert.alert("Validation", "Closing time must be after opening time");
    //   return false;
    // }


    return true;
  };

  /* ---------------- SUBMIT ---------------- */

  // const handleSignup = () => {


  // const handleSignup = () => {
  //   if (!validate()) return;

  //   const payload = {
  //     ownerName: naaiName,
  //     phoneNumber: mobile,
  //     salonName: salonName,
  //     addressLine1: address,
  //     city: city,
  //     agentCode: agentCode,
  //     genderType: genderType,
  //     latitude: latitude,
  //     longitude: longitude,
  //     tempToken: tempToken,
  //     businessHours: [
  //       {
  //         openingTime: formatTime(openingTime),
  //         closingTime: formatTime(closingTime),
  //         breakStartTime: null,
  //         breakEndTime: null,
  //       },
  //     ],
  //   };

  //   console.log("NAVIGATING WITH:", payload);

  //   navigation.navigate("SubscriptionsPlan", {
  //     userData: payload,
  //   });
  // };
  const handleNext = async () => {
    if (!naaiName.trim()) {
      Alert.alert('Validation', 'Please enter Salon Owner name');
      return;
    }
    if (!salonName.trim()) {
      Alert.alert('Validation', 'Please enter Salon name');
      return;
    }
    if (!manualAddress.trim()) {
      Alert.alert('Validation', 'Please enter Address');
      return;
    }
    // if (!city) {
    //   Alert.alert('Validation', 'Please select a city');
    //   return;
    // }
    //  const deviceToken = await getDeviceToken();

    if (!deviceToken) {
      Alert.alert("Please wait", "Getting device token...");
      return;
    }
    const token = await messaging().getToken();

    const step1Data = {
      ownerName: naaiName,
      phoneNumber: mobile,
      salonName: salonName,
      addressLine1: manualAddress,
      // addressLine2: address,
      // city: city,
      latitude,
      longitude,
      tempToken,
      // deviceToken: messaging().getToken(),
      deviceToken: token,
    };
    console.log("step1Data", step1Data);

    navigation.navigate("SalonBusinessInfo", {
      step1Data,
    });
  };

  useEffect(() => {
    const getDeviceToken = async () => {
      try {
        const token = await messaging().getToken();
        console.log('FCM DEVICE TOKEN salon registration:', token);
        setDeviceToken(token);
      } catch (e) {
        console.log('FCM token error', e);
      }
    };

    getDeviceToken();
  }, []);
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


            {/* <View style={[styles.inputBox, { height: 100, alignItems: 'flex-start' }]}>
              <TextInput
                placeholder="Fetching location..."
                placeholderTextColor="#999"
                value={address}
                editable={false}
                multiline={true}
                numberOfLines={4}
                style={[styles.input, { textAlignVertical: 'top' }]}
              />
            </View> */}
            <View style={[styles.inputBox, { height: 100, alignItems: 'flex-start' }]}>
              <TextInput
                placeholder="Enter Address"
                placeholderTextColor="#999"
                value={manualAddress}
                // editable={false}
                onChangeText={setManualAddress}
                multiline={true}
                numberOfLines={4}
                style={[styles.input, { textAlignVertical: 'top' }]}
              />
            </View>
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
              <TextInput
                placeholder="City"
                placeholderTextColor="#999"
                value={city}
                onChangeText={setCity}
                style={styles.input}
              />
            </View> */}
            {/* <View style={styles.inputBox}>
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
            <View style={styles.inputBox}>
              <TouchableOpacity onPress={() => setShowOpenPicker(true)}>
                <Text style={{ color: '#fff' }}>
                  {formatDisplayTime(openingTime)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputBox}>
              <TouchableOpacity onPress={() => setShowClosePicker(true)}>
                <Text style={{ color: '#fff' }}>
                  {formatDisplayTime(closingTime)}
                </Text>
              </TouchableOpacity>
            </View> */}
            <TouchableOpacity
              style={styles.signupBtn}
              // onPress={() => navigation.navigate("SalonRegisterOtpScreen")}
              onPress={handleNext}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.signupText}>Next</Text>
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
      {showOpenPicker && (
        <DateTimePicker
          value={openingTime || new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={(event, selectedDate) => {
            setShowOpenPicker(false);
            if (selectedDate) setOpeningTime(selectedDate);
          }}
        />
      )}

      {showClosePicker && (
        <DateTimePicker
          value={closingTime || new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={(event, selectedDate) => {
            setShowClosePicker(false);
            if (selectedDate) setClosingTime(selectedDate);
          }}
        />
      )}
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
  textAreaBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 120,
    marginBottom: 18,
  },

  textAreaInput: {
    color: '#fff',
    fontSize: 15,
    textAlignVertical: 'top',
  }


});
