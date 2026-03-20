import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { communication } from '../services/communication';
import { paymentForMembership } from '../utilities/paymentForMembership';
import Ionicons from 'react-native-vector-icons/Ionicons';

const RESEND_TIME = 30; // seconds

const SalonRegisterOtpScreen = ({ navigation, route }) => {
  const mobile = route?.params?.mobile || '';
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_TIME);
  const [canResend, setCanResend] = useState(false);

  const inputRef = useRef(null);

  /* ---------- TIMER ---------- */
  useEffect(() => {
    if (!canResend && secondsLeft > 0) {
      const timer = setTimeout(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }

    if (secondsLeft === 0) {
      setCanResend(true);
    }
  }, [secondsLeft, canResend]);

  /* ---------- GET STORED FCM TOKEN ---------- */
  const getStoredToken = async () => {
    try {
      return await AsyncStorage.getItem('FCM_TOKEN');
    } catch {
      return '';
    }
  };

  /* ---------- VERIFY OTP ---------- */
  const verifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter 6-digit OTP');
      return;
    }

    setVerifyLoading(true);

    try {
      const token = await getStoredToken();

      const payload = {
        phoneNumber: mobile,
        otp: otp,
      };

      const res = await communication.verifySalonOwnerLogin(payload);

      if (res?.status === 'SUCCESS') {
        navigation.replace("SalonInfoForRegister", {
          phoneNumber: mobile,
          tempToken: res?.data?.token,
          userData: res?.data
        });
      } else {
        Alert.alert('Invalid OTP', res?.message || 'OTP verification failed');
      }
    } catch (error) {
      Alert.alert(
        'Verification Failed',
        error?.response?.data?.message || 'Network issue. Please try again.'
      );
    } finally {
      setVerifyLoading(false);
    }
  };

  /* ---------- RESEND OTP ---------- */
  const resendOtp = async () => {
    if (!canResend || resendLoading) return;

    setResendLoading(true);

    try {
      const payload = { phoneNumber: mobile };
      const res = await communication.salonOwnerLogin(payload);

      if (res?.status === 'SUCCESS') {
        setOtp('');
        setSecondsLeft(RESEND_TIME);
        setCanResend(false);
        inputRef.current?.focus();
      } else {
        Alert.alert('Error', res?.message || 'Failed to resend OTP');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Something went wrong'
      );
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    if (otp.length === 6) {
      verifyOtp();
    }
  }, [otp]);

  // const handlePayment = () => {

  //   const name = "Salon Owner";   // or from previous screen
  //   const mobile = "9999999999";  // pass from route if needed
  //   const amount = 1; // ₹1 test payment

  //   paymentForMembership(name, mobile, amount, (paymentId) => {

  //     console.log("Payment Success:", paymentId);

  //     Alert.alert("Payment Success", "Payment ID: " + paymentId);

  //     // after success navigate
  //     // navigation.navigate("Home");

  //   });

  // };


  // const handleSubscriptions = () => {
  //   console.log("uffhuij");
  //   navigation.navigate("SubscriptionsPlan");


  // }


  return (
    <SafeAreaView style={styles.container}>

      {/* 🔙 Header (fixed) */}
      <View style={styles.header(insets)}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            backgroundColor: 'rgba(0,0,0,0.4)',
            padding: 8,
            borderRadius: 20,
          }}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ✅ Centered Content */}
      <View style={styles.centerContent}>
        <Text style={styles.title}>Phone Verification</Text>

        <TextInput
          ref={inputRef}
          style={styles.otpInput}
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={(text) => {
            const cleaned = text.replace(/[^0-9]/g, '');
            setOtp(cleaned);
          }}
          autoFocus
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          importantForAutofill="yes"
        />

        <TouchableOpacity
          style={[styles.btn, verifyLoading && { opacity: 0.6 }]}
          onPress={verifyOtp}
          disabled={verifyLoading}
        >
          {verifyLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.btnText}>Verify Code</Text>
          )}
        </TouchableOpacity>

        {!canResend ? (
          <Text style={styles.timerText}>
            Resend code in 00:
            {secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
          </Text>
        ) : (
          <TouchableOpacity onPress={resendOtp} disabled={resendLoading}>
            <Text style={styles.resend}>
              {resendLoading ? 'Sending...' : 'Resend a new Code'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

    </SafeAreaView>
  );
};

export default SalonRegisterOtpScreen;

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  header: (insets) => ({
    position: 'absolute',
    top: insets.top + 10,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  }),
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 14,
  },
  otpInput: {
    backgroundColor: '#1E1E1E',
    color: '#fff',
    height: 56,
    borderRadius: 12,
    fontSize: 22,
    letterSpacing: 12,
    textAlign: 'center',
    marginVertical: 30,
  },
  btn: {
    backgroundColor: '#E8B97E',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  timerText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 13,
  },
  resend: {
    color: '#E8B97E',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    fontWeight: '600',
  },
});
