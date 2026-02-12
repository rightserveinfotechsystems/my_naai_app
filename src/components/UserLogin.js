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
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { communication } from '../services/communication';

const BG_IMAGE = require('../assets/salon_page_bg.jpg');


const UserLogin = ({ navigation }) => {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [deviceToken, setDeviceToken] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const RESEND_TIME = 30;

  const [secondsLeft, setSecondsLeft] = useState(RESEND_TIME);
  const [canResend, setCanResend] = useState(false);


  /* ---------------- VALIDATIONS ---------------- */
  const validateMobile = () => {
    if (mobile.length !== 10) {
      Alert.alert('Invalid number', 'Please enter a valid 10-digit mobile number');
      return false;
    }
    return true;
  };

  const validateOtp = () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter 6-digit OTP');
      return false;
    }
    return true;
  };

  /* ---------------- SEND OTP ---------------- */
  const sendOtp = async () => {
    if (!validateMobile()) return;

    setLoading(true);
    try {
      const payload = { phoneNumber: mobile };
      const res = await communication.userLogin(payload);

      if (res?.status === 'SUCCESS') {
        setOtpSent(true);
        setOtp('');
        setSecondsLeft(RESEND_TIME);
        setCanResend(false);
        // Alert.alert('OTP Sent Successfully!'); 
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


  /* ---------------- VERIFY OTP ---------------- */
  const verifyOtp = async () => {
    if (!validateOtp()) return;

    setLoading(true);
    try {
      const payload = {
        phoneNumber: mobile,
        otp: otp.toString(),
        deviceToken: await messaging().getToken(),
      };

      const res = await communication.verifyLogin(payload);

      if (res?.status === 'SUCCESS') {
        console.log("token", res?.data?.token);
        console.log("mynaaiUser", res?.data);

        if (res?.data?.token) {
          await AsyncStorage.setItem('mynaai', res?.data?.token);
          await AsyncStorage.setItem(
            'mynaaiUser',
            JSON.stringify(res?.data),
          );

          await AsyncStorage.setItem('isLoggedIn', 'true');
          await AsyncStorage.setItem('userType', 'USER');
        }
        // navigation.replace('Main');


        // navigation.reset({
        //   index: 0,
        //   routes: [{ name: 'Main' }],
        // });
        DeviceEventEmitter.emit('AUTH_CHANGED');

      } else {
        Alert.alert('Invalid OTP', res?.message || 'OTP verification failed');
      }
    } catch (error) {
      Alert.alert(
        'Errors',
        error?.response?.data?.message || 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (otpSent && !canResend && secondsLeft > 0) {
      const timer = setTimeout(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }

    if (secondsLeft === 0) {
      setCanResend(true);
    }
  }, [otpSent, secondsLeft, canResend]);

  useEffect(() => {
    const getDeviceToken = async () => {
      try {
        const token = await messaging().getToken();
        console.log('FCM DEVICE TOKEN userlogin:', token);
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
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
          >
            <Text style={styles.title}>
              {otpSent ? 'Verify OTP' : 'Welcome Back'}
            </Text>

            <Text style={styles.subtitle}>
              {otpSent
                ? `Enter OTP sent to ${mobile}`
                : 'Login to your account'}
            </Text>

            {/* MOBILE INPUT */}
            {!otpSent && (
              <View style={styles.inputBox}>
                <TextInput
                  placeholder="Mobile Number"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={mobile}
                  onChangeText={setMobile}
                  style={styles.input}
                />
              </View>
            )}

            {/* OTP INPUT */}
            {otpSent && (
              <View style={styles.inputBox}>
                <TextInput
                  placeholder="Enter OTP"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                  style={styles.input}
                />
              </View>
            )}

            {/* BUTTON */}
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={otpSent ? verifyOtp : sendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.loginText}>
                  {otpSent ? 'Verify OTP' : 'Login with OTP'}
                </Text>
              )}
            </TouchableOpacity>

            {/* RESEND OTP */}
            {otpSent && (
              !canResend ? (
                <Text style={styles.timerText}>
                  Resend OTP in 00:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={sendOtp}
                  style={{ marginTop: 16 }}
                  disabled={loading}
                >
                  <Text style={styles.resend}>Resend OTP</Text>
                </TouchableOpacity>
              )
            )}


            {/* FOOTER */}
            {!otpSent && (
              <>
                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Don’t have an account?{' '}
                    <Text
                      style={styles.signup}
                      onPress={() => navigation.navigate('UserSignup')}
                    >
                      Sign Up
                    </Text>
                  </Text>
                </View>

                {/* <View style={styles.naaiFooter}>
                  <Text style={styles.footerText}>
                   Salon Partner Login / Register{' '}
                    <Text
                      style={styles.signup}
                      onPress={() => navigation.navigate('NaaiLogin')}
                    >
                      Log In
                    </Text>
                  </Text>
                </View> */}
                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.partnerBtn}
                  onPress={() => navigation.navigate('NaaiLogin')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.partnerBtnText}>
                    Salon Partner Login / Register
                  </Text>
                </TouchableOpacity>


              </>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

export default UserLogin;

/* ======================== STYLES ======================== */

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 26,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 6,
  },

  subtitle: {
    color: '#BDBDBD',
    fontSize: 14,
    marginBottom: 30,
    lineHeight: 20,
  },

  inputBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    paddingHorizontal: 18,
    height: 56,
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },

  input: {
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 0.5,
  },

  loginBtn: {
    backgroundColor: '#E8B97E',
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 6,
  },

  loginText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },

  resend: {
    color: '#E8B97E',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  footer: {
    marginTop: 32,
    alignItems: 'center',
  },

  naaiFooter: {
    marginTop: 16,
    alignItems: 'center',
  },

  footerText: {
    color: '#9E9E9E',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },

  signup: {
    color: '#E8B97E',
    fontWeight: '700',
  },
  timerText: {
    color: '#9E9E9E',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
  },
  partnerBtn: {
    marginTop: 28,
    height: 50,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#E8B97E',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },

  partnerBtnText: {
    color: '#E8B97E',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginVertical: 24,
  }


});
