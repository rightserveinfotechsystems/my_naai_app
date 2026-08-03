// NaaiLogin
import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { communication } from '../services/communication';


const BG_IMAGE = require('../assets/new_background.jpeg');

const NaaiLogin = ({ navigation }) => {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  // const [otpSent, setOtpSent] = useState(false);


  const validate = () => {
    if (mobile.length !== 10) {
      Alert.alert('Invalid number', 'Please enter a valid 10-digit mobile number');
      return false;
    }
    return true;
  };


  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = { phoneNumber: mobile };
      console.log("payload", payload)

      const res = await communication.SalonLogin(payload);
      console.log("res", res)
      if (res?.status === 'SUCCESS') {
        console.log("res?.otp", res?.otp);

        navigation.navigate('SalonOtpScreen', { mobile });

      } else {
        Alert.alert('Error', res?.message || 'Failed to send OTP');
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


  return (
   <ImageBackground source={BG_IMAGE} style={styles.bg}>
      <View style={styles.overlay}>

        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
          >
            {/* Title */}

            <Text allowFontScaling={false}style={styles.title}>Welcome Salon Partner</Text>
            <Text allowFontScaling={false}style={styles.subtitle}>Login as Salon Owner</Text>

            {/* Phone Input */}
            <View style={styles.inputBox}>
              <View style={styles.phoneContainer}>
                <Text allowFontScaling={false}style={styles.countryCode}>+91</Text>

                <TextInput allowFontScaling={false}
                  placeholder="Mobile Number"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={mobile}
                  onChangeText={setMobile}
                  style={styles.input}
                />
              </View>
            </View>
            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text allowFontScaling={false}style={styles.loginText}>Continue with OTP</Text>
              )}
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <Text allowFontScaling={false}style={styles.footerText}>
               
                <Text allowFontScaling={false}
                  style={styles.signup}
                  onPress={() => navigation.navigate('UserLogin')}
                >
                  Login as a Customer
                </Text>
              </Text>
            </View>

          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

export default NaaiLogin;

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },

  header: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 6,
  },

  subtitle: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 30,
  }, 
  loginBtn: {
    backgroundColor: '#E8B97E',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },

  loginText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },

  footer: {
    marginTop: 30,
    alignItems: 'center',
  },

  footerText: {
    color: '#aaa',
    fontSize: 15,
    fontWeight: '500',
  },

  signup: {
    color: '#E8B97E',
    fontWeight: '600',
    fontSize: 14,
  },

  phoneInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
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
