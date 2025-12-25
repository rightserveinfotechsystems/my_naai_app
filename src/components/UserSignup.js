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

const UserSignup = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!username.trim()) {
      Alert.alert('Validation', 'Please enter username');
      return false;
    }
    if (mobile.length !== 10) {
      Alert.alert('Validation', 'Enter valid 10-digit mobile number');
      return false;
    }
    return true;
  };

  const handleSignup = () => {
    if (!validate()) return;

    setLoading(true);

    // 🔔 Simulate API
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('OtpScreen', { mobile });
    }, 1500);
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
            {/* <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity> */}

            <Text style={styles.title}>Create an Account</Text>

            <View style={styles.inputBox}>
              <TextInput
                placeholder="User name"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
              />
            </View>

            <View style={styles.inputBox}>
              <TextInput
                placeholder="Phone number"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                maxLength={10}
                value={mobile}
                onChangeText={setMobile}
                style={styles.input}
              />
            </View>

            <TouchableOpacity
              style={styles.signupBtn}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.signupText}>Sign up</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.terms}>
              By continuing Sign up you agree to the following{'\n'}
              terms & Conditions without reservation
            </Text>

            <Text style={styles.footer}>
              Already have an account?{' '}
              <Text
                style={styles.link}
                onPress={() => navigation.navigate('UserLogin')}
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

export default UserSignup;

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)' },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    // paddingTop: 50,
    justifyContent: 'center',
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
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginVertical: 30,
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
    marginTop: 10,
  },
  signupText: { color: '#000', fontSize: 16, fontWeight: '700' },
  terms: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  footer: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 24,
  },
  link: { color: '#E8B97E', fontWeight: '600' },
});
