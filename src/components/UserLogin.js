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


const BG_IMAGE = require('../assets/salon_page_bg.jpg');

const UserLogin = ({ navigation }) => {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (mobile.length !== 10) {
      Alert.alert('Invalid number', 'Please enter a valid 10-digit mobile number');
      return false;
    }
    return true;
  };

  const handleLogin = () => {
    if (!validate()) return;

    setLoading(true);

    // 🔔 Call LOGIN + SEND OTP API here
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('OtpScreen', { mobile });
    }, 1200);
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

            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Login to your account</Text>

            {/* Phone Input */}
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

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.loginText}>Login with OTP</Text>
              )}
            </TouchableOpacity>

            {/* Footer */}
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

          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

export default UserLogin;

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

  inputBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 54,
    justifyContent: 'center',
    marginBottom: 20,
  },

  input: {
    color: '#fff',
    fontSize: 16,
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
    fontSize: 13,
  },

  signup: {
    color: '#E8B97E',
    fontWeight: '600',
  },
});
