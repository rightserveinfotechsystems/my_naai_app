import React, { useMemo, useState } from 'react';
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

const BG_IMAGE = require('../assets/salon_page_bg.jpg');

const UserSignup = ({ navigation }) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  /* ---------------- VALIDATION ---------------- */
  const isNameValid = name.trim().length >= 2;
  const isMobileValid = /^\d{10}$/.test(mobile);

  const canSubmit = useMemo(() => {
    return isNameValid && isMobileValid;
  }, [isNameValid, isMobileValid]);

  /* ---------------- SEND OTP ---------------- */
  const onSubmit = async () => {
    if (!canSubmit || loading) return;

    setLoading(true);
    try {
      const response = await communication.sendRegisterOtp({
        phoneNumber: mobile,
      });

      console.log('sendRegisterOtp response:', response);

      if (response?.status === 'SUCCESS') {
        // Alert.alert(response.otp)
        navigation.replace('OtpScreen', {
          mobile,
          fullName: name,
        });
      } else {
        Alert.alert('Error', response?.message || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || error.message,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={BG_IMAGE} style={styles.bg}>
      <View style={styles.overlay}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.replace('UserLogin')}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View> */}

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
          >
            <Text style={styles.title}>Create an Account</Text>

            <View style={styles.inputBox}>
              <TextInput
                placeholder="User name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                style={styles.input}
              />
            </View>

            {/* <View style={styles.inputBox}>
              <TextInput
                placeholder="Phone number"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                maxLength={10}
                value={mobile}
                onChangeText={setMobile}
                style={styles.input}
              />
            </View> */}
            <View style={styles.inputBox}>
              <View style={styles.phoneContainer}>
                <Text style={styles.countryCode}>+91</Text>

                <TextInput
                  placeholder="Phone number"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={mobile}
                  onChangeText={setMobile}
                  style={styles.phoneInput}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.signupBtn,
                !canSubmit && { opacity: 0.6 },
              ]}
              onPress={onSubmit}
              disabled={!canSubmit || loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.signupText}>Send OTP</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.footer}>
              Already have an account?{' '}
              <Text
                style={styles.link}
                onPress={() => navigation.navigate('UserLogin')}
              >
                Sign In
              </Text>
            </Text>

            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.partnerBtn}
              onPress={() => navigation.navigate('NaaiRequest')}
              activeOpacity={0.8}
            >
              <Text style={styles.partnerBtnText}>
                Salon Partner Login / Register
              </Text>
            </TouchableOpacity>


          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

export default UserSignup;

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)' },
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
  input: { color: '#fff', fontSize: 15 },
  signupBtn: {
    backgroundColor: '#E8B97E',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
    fontWeight: '500',
  },
  link: {
    color: '#E8B97E',
    fontWeight: '600',
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
