import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
  View,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMessaging, getToken } from '@react-native-firebase/messaging'; // 👈 Direct Firebase fallback
import {communication} from '../services/communication';

const RESEND_TIME = 30;
const OTP_LENGTH = 6;

const {SmsUserConsent} = NativeModules;

const smsConsentEmitter =
  Platform.OS === 'android' && SmsUserConsent
    ? new NativeEventEmitter(SmsUserConsent)
    : null;

const SalonOtpScreen = ({route}) => {
  const mobile = route?.params?.mobile || '';

  const [otp, setOtp] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_TIME);
  const [canResend, setCanResend] = useState(false);

  const inputRef = useRef(null);
  const verificationStartedRef = useRef(false);
  const isFailedRef = useRef(false); // 👈 Prevents auto-retry infinite loop on failure

  const extractOtp = useCallback(message => {
    if (!message) return '';
    const smsText = String(message);
    const exactMatch = smsText.match(/\b\d{6}\b/);
    if (exactMatch?.[0]) return exactMatch[0];

    const possibleCode = smsText.match(/(?:^|\D)(\d[\d\s-]{4,8}\d)(?:\D|$)/);
    if (!possibleCode?.[1]) return '';

    const cleanedCode = possibleCode[1].replace(/\D/g, '');
    return cleanedCode.length === OTP_LENGTH ? cleanedCode : '';
  }, []);

  const startSmsConsentListener = useCallback(async () => {
    if (Platform.OS !== 'android' || !SmsUserConsent) return;
    try {
      await SmsUserConsent.startListening(null);
    } catch (error) {
      console.log('SMS User Consent start error:', error);
    }
  }, []);

  const stopSmsConsentListener = useCallback(async () => {
    if (Platform.OS !== 'android' || !SmsUserConsent) return;
    try {
      await SmsUserConsent.stopListening();
    } catch (error) {
      console.log('SMS User Consent stop error:', error);
    }
  }, []);

  /* ---------- ANDROID SMS USER CONSENT ---------- */
  useEffect(() => {
    if (Platform.OS !== 'android' || !smsConsentEmitter) return undefined;

    const receivedSubscription = smsConsentEmitter.addListener(
      'SmsUserConsentReceived',
      event => {
        const detectedOtp = extractOtp(event?.message);
        if (detectedOtp) {
          verificationStartedRef.current = false;
          isFailedRef.current = false;
          setOtp(detectedOtp);
        }
      },
    );

    const cancelledSubscription = smsConsentEmitter.addListener(
      'SmsUserConsentCancelled',
      () => {
        inputRef.current?.focus();
      },
    );

    const errorSubscription = smsConsentEmitter.addListener(
      'SmsUserConsentError',
      () => {},
    );

    startSmsConsentListener();

    return () => {
      receivedSubscription.remove();
      cancelledSubscription.remove();
      errorSubscription.remove();
      stopSmsConsentListener();
    };
  }, [extractOtp, startSmsConsentListener, stopSmsConsentListener]);

  /* ---------- RESEND TIMER ---------- */
  useEffect(() => {
    if (canResend) return undefined;
    if (secondsLeft <= 0) {
      setCanResend(true);
      return undefined;
    }

    const timer = setTimeout(() => {
      setSecondsLeft(previous => Math.max(previous - 1, 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondsLeft, canResend]);

  /* ---------- 🚀 RELIABLE DEVICE TOKEN FETCH ---------- */
  const getDeviceToken = async () => {
    try {
      // 1. First check AsyncStorage
      let token = await AsyncStorage.getItem('FCM_TOKEN');
      if (token) return token;

      // 2. Direct FCM call if missing from storage
      const messaging = getMessaging();
      token = await getToken(messaging);
      
      if (token) {
        await AsyncStorage.setItem('FCM_TOKEN', token);
        return token;
      }
    } catch (err) {
      console.log("FCM Token fetch error inside screen:", err);
    }
    return '';
  };

  /* ---------- VERIFY OTP ---------- */
  const verifyOtp = useCallback(
    async otpValue => {
      const cleanedOtp = String(otpValue || otp)
        .replace(/\D/g, '')
        .slice(0, OTP_LENGTH);

      if (cleanedOtp.length !== OTP_LENGTH) {
        Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP.');
        return;
      }

      if (verifyLoading || verificationStartedRef.current) return;

      verificationStartedRef.current = true;
      setVerifyLoading(true);

      try {
        const deviceToken = await getDeviceToken(); // 👈 Guaranteed token attempt

        const payload = {
          phoneNumber: mobile,
          otp: cleanedOtp,
          deviceToken: deviceToken || '',
        };

        const res = await communication.verifySalonLogin(payload);

        if (res?.status === 'SUCCESS' && res?.data?.token) {
          const isNewSalon =
            res?.isNewSalon === true || res?.data?.isNewSalon === true;

          await AsyncStorage.multiSet([
            ['mynaai', res.data.token],
            ['mynaaiUser', JSON.stringify(res.data)],
            ['isLoggedIn', 'true'],
            ['userType', 'SALON'],
            ['isNewSalon', isNewSalon ? 'true' : 'false'],
          ]);

          await stopSmsConsentListener();
          DeviceEventEmitter.emit('AUTH_CHANGED');
          return;
        }

        // Mark failed so auto-verify useEffect won't trigger continuously
        isFailedRef.current = true;
        verificationStartedRef.current = false;

        Alert.alert('Invalid OTP', res?.message || 'OTP verification failed.');
      } catch (error) {
        // Mark failed so auto-verify useEffect won't trigger continuously
        isFailedRef.current = true;
        verificationStartedRef.current = false;

        Alert.alert(
          'Verification Failed',
          error?.response?.data?.message ||
            error?.message ||
            'Network issue. Please try again.',
        );
      } finally {
        setVerifyLoading(false);
      }
    },
    [mobile, otp, stopSmsConsentListener, verifyLoading],
  );

  /* ---------- AUTO VERIFY FILLED OTP ---------- */
  useEffect(() => {
    if (
      otp.length === OTP_LENGTH &&
      !verifyLoading &&
      !verificationStartedRef.current &&
      !isFailedRef.current // 👈 STOP REPEATED API LOOPS ON ERROR
    ) {
      verifyOtp(otp);
    }
  }, [otp, verifyLoading, verifyOtp]);

  /* ---------- RESEND OTP ---------- */
  const resendOtp = async () => {
    if (!canResend || resendLoading) return;

    setResendLoading(true);

    try {
      setOtp('');
      verificationStartedRef.current = false;
      isFailedRef.current = false; // Reset failure flag for new attempt

      if (Platform.OS === 'android') {
        await stopSmsConsentListener();
        await startSmsConsentListener();
      }

      const res = await communication.SalonLogin({phoneNumber: mobile});

      if (res?.status === 'SUCCESS') {
        setSecondsLeft(RESEND_TIME);
        setCanResend(false);

        setTimeout(() => {
          inputRef.current?.focus();
        }, 200);

        return;
      }

      Alert.alert('Error', res?.message || 'Failed to resend OTP.');
    } catch (error) {
      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Something went wrong.',
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text allowFontScaling={false} style={styles.title}>
          Phone Verification
        </Text>

        <Text allowFontScaling={false} style={styles.subtitle}>
          Enter the code sent to +91 {mobile}
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            allowFontScaling={false}
            style={styles.otpInput}
            value={otp}
            onChangeText={text => {
              const cleanedOtp = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
              verificationStartedRef.current = false;
              isFailedRef.current = false; // Reset failure on user text change
              setOtp(cleanedOtp);
            }}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            autoFocus
            textContentType={Platform.OS === 'ios' ? 'oneTimeCode' : 'none'}
            autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
            importantForAutofill={Platform.OS === 'android' ? 'yes' : 'auto'}
            returnKeyType="done"
            onSubmitEditing={() => verifyOtp(otp)}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.btn, verifyLoading && styles.disabledButton]}
          onPress={() => {
            isFailedRef.current = false; // Reset failure flag on manual button tap
            verifyOtp(otp);
          }}
          disabled={verifyLoading}>
          {verifyLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text allowFontScaling={false} style={styles.btnText}>
              Verify Code
            </Text>
          )}
        </TouchableOpacity>

        {!canResend ? (
          <Text allowFontScaling={false} style={styles.timerText}>
            Resend code in 00:
            {secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
          </Text>
        ) : (
          <TouchableOpacity onPress={resendOtp} disabled={resendLoading}>
            <Text allowFontScaling={false} style={styles.resend}>
              {resendLoading ? 'Sending...' : 'Resend a New Code'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export default SalonOtpScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
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
    marginTop: 10,
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  otpInput: {
    backgroundColor: '#1E1E1E',
    color: '#fff',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    fontSize: 22,
    letterSpacing: 12,
    textAlign: 'center',
    paddingHorizontal: 15,
  },
  btn: {
    backgroundColor: '#E8B97E',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.65,
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