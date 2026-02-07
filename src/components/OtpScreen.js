import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { communication } from '../services/communication';

const RESEND_TIME = 30;

const OtpScreen = ({ route, onLoginSuccess }) => {
  const { mobile, fullName } = route.params;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_TIME);
  const [canResend, setCanResend] = useState(false);

  const inputRef = useRef(null);

  /* ⏳ TIMER */
  useEffect(() => {
    if (!canResend && secondsLeft > 0) {
      const timer = setTimeout(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (secondsLeft === 0) setCanResend(true);
  }, [secondsLeft, canResend]);

  /* 🔐 GET STORED FCM TOKEN */
  const getStoredToken = async () => {
    try {
      return await AsyncStorage.getItem('FCM_TOKEN');
    } catch {
      return '';
    }
  };

  /* ✅ VERIFY OTP */
  const verifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter 6-digit OTP');
      return;
    }

    setLoading(true);
    const token = await getStoredToken();

    try {
      const response = await communication.createUser({
        phoneNumber: mobile,
        fullName,
        otp,
        deviceToken: token || '',
      });

      if (response?.status === 'SUCCESS') {
        await AsyncStorage.setItem('mynaai', response?.data?.token);
        await AsyncStorage.setItem(
          'mynaaiUser',
          JSON.stringify(response?.data)
        );
        await AsyncStorage.setItem('userType', 'USER');

        onLoginSuccess('USER');
      } else {
        Alert.alert('Error', response?.message || 'Invalid OTP');
      }
    } catch (error) {
      Alert.alert(
        'Verification Failed',
        error?.response?.data?.message || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  /* 🔁 RESEND OTP */
  const resendOtp = async () => {
    if (!canResend || loading) return;

    setLoading(true);
    try {
      const res = await communication.sendRegisterOtp({
        phoneNumber: mobile,
      });

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
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Phone Verification</Text>
      <Text style={styles.subtitle}>
        Enter the code sent to +91 {mobile}
      </Text>

      <TextInput
        ref={inputRef}
        style={styles.otpInput}
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
        autoFocus
      />

      <TouchableOpacity style={styles.btn} onPress={verifyOtp} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.btnText}>Verify Code</Text>
        )}
      </TouchableOpacity>

      {!canResend ? (
        <Text style={styles.timerText}>
          Resend code in 00:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
        </Text>
      ) : (
        <TouchableOpacity onPress={resendOtp}>
          <Text style={styles.resend}>Resend a new Code</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

export default OtpScreen;



const styles = StyleSheet.create({
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
    backgroundColor: '#000',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
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
