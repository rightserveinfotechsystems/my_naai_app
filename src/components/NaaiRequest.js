// NaaiRequest.js
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

const BG_IMAGE = require('../assets/salon_page_bg.jpg');

const NaaiRequest = ({ navigation }) => {
  const [naaiName, setNaaiName] = useState('');
  const [salonName, setSalonName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  /* ---------------- VALIDATION ---------------- */

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
    if (!address.trim()) {
      Alert.alert('Validation', 'Please enter address');
      return false;
    }
    return true;
  };

  /* ---------------- SUBMIT ---------------- */

  // const handleSignup = () => {


  const handleSignup = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        fullName: naaiName,
        phoneNumber: mobile,
        salonName: salonName,
        address: address
      }
      console.log("payload", payload);

      const res = await communication.salonRequest(payload);
      if (res?.status === 'SUCCESS') {
        Alert.alert("Salon request submitted successfully");
        navigation.navigate("NaaiLogin")
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
            <Text style={styles.title}>Register as a Salon Owner</Text>

            <View style={styles.inputBox}>
              <TextInput
                placeholder="Naai name"
                placeholderTextColor="#999"
                value={naaiName}
                onChangeText={setNaaiName}
                style={styles.input}
              />
            </View>

            <View style={styles.inputBox}>
              <TextInput
                placeholder="Salon name"
                placeholderTextColor="#999"
                value={salonName}
                onChangeText={setSalonName}
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

            <View style={styles.inputBox}>
              <TextInput
                placeholder="Address"
                placeholderTextColor="#999"
                value={address}
                onChangeText={setAddress}
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
                <Text style={styles.signupText}>Register as Salon owner</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.terms}>
              By continuing you agree to our{'\n'}
              Terms & Conditions
            </Text>

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

  link: {
    color: '#E8B97E',
    fontWeight: '600',
  },
});
