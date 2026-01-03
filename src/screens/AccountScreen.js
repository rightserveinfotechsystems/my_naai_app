import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const GOLD = '#E8B97E';
const DARK = '#121212';
const CARD = '#1E1E1E';

const MENUS = [
  { label: 'FAQ', screen: 'FAQScreen', icon: 'help-circle-outline' },
  { label: 'Terms & Conditions', screen: 'TermsScreen', icon: 'document-text-outline' },
  { label: 'About', screen: 'AboutScreen', icon: 'information-circle-outline' },
];

const AccountScreen = ({ navigation }) => {
  const [editVisible, setEditVisible] = useState(false);
  const [name, setName] = useState('Abhishek Tijare');
  const [mobile, setMobile] = useState('8308594231');

  const handleLogout = async () => {
  Alert.alert(
    'Logout',
    'Are you sure you want to logout?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('mynaai');
            await AsyncStorage.removeItem('mynaaiUser');

            navigation.reset({
              index: 0,
              routes: [{ name: 'UserLogin' }],
            });
          } catch (error) {
            console.log('Logout Error:', error);
          }
        },
      },
    ],
    { cancelable: true }
  );
};


  const handleNaaiRequest = () => {
    navigation.navigate('NaaiLogin')
    //  navigation.navigate('Salon')
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* PROFILE */}
        <View style={styles.profileCard}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.mobile}>📞 {mobile}</Text>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setEditVisible(true)}
          >
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>



        {/* VERTICAL MENU */}
        <View style={styles.menuCard}>
          {MENUS.map(item => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuRow}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={styles.menuLeft}>
                <Ionicons name={item.icon} size={20} color={GOLD} />
                <Text style={styles.menuText}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#777" />
            </TouchableOpacity>
          ))}
        </View>
        {/* Login AS NAII */}
        {/* <TouchableOpacity style={styles.naaiBtn} onPress={handleNaaiRequest}>
          <Ionicons name="storefront-outline" size={18} color="#000" />
          <Text style={styles.naaiText}>
            Login as Salon / Naai Owner
          </Text>
        </TouchableOpacity> */}
        {/* LOGIN */}
        {/* <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('UserLogin')}
        >
          <Ionicons name="log-in-outline" size={18} color="#000" />
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity> */}

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>App Version 1.0.1</Text>
      </ScrollView>

      {/* EDIT PROFILE MODAL */}
      <Modal visible={editVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              // style={styles.input}
              style={[styles.input, { backgroundColor: '#2E2E2E', color: '#AAA' }]}
              placeholder="Mobile Number"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              maxLength={10}
              value={mobile}
              onChangeText={setMobile}
              editable={false}
            />

            <View style={styles.modalRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => setEditVisible(false)}
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AccountScreen;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK,
    padding: 14,
  },

  profileCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },

  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  mobile: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 4,
  },

  editBtn: {
    marginTop: 14,
    backgroundColor: GOLD,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },

  editText: {
    color: '#000',
    fontWeight: '700',
  },

  naaiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD,
    borderRadius: 20,
    paddingVertical: 12,
    marginBottom: 20,
  },

  naaiText: {
    color: '#000',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 13,
  },

  menuCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    marginBottom: 30,
  },

  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#2A2A2A',
  },

  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuText: {
    color: '#fff',
    marginLeft: 12,
    fontWeight: '600',
    fontSize: 14,
  },

  loginBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: GOLD,
    borderRadius: 20,
    paddingVertical: 12,
    marginBottom: 16,
  },

  loginText: {
    color: '#000',
    marginLeft: 6,
    fontWeight: '700',
  },

  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    paddingVertical: 12,
    marginBottom: 20,
  },

  logoutText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
  },

  version: {
    textAlign: 'center',
    color: '#777',
    fontSize: 12,
    marginBottom: 30,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },

  modalCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 20,
  },

  modalTitle: {
    color: GOLD,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },

  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#fff',
    marginBottom: 12,
  },

  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#333',
    alignItems: 'center',
  },

  saveBtn: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: GOLD,
    alignItems: 'center',
  },

  cancelText: {
    color: '#fff',
    fontWeight: '600',
  },

  saveText: {
    color: '#000',
    fontWeight: '700',
  },
});
