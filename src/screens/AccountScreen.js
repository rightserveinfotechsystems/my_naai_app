import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { communication } from '../services/communication';

const GOLD = '#E8B97E';
const DARK = '#121212';
const CARD = '#1E1E1E';

const MENUS = [
  { label: 'About', screen: 'AboutScreen', icon: 'information-circle-outline' },
  { label: 'FAQ', screen: 'FAQScreen', icon: 'help-circle-outline' },
  { label: 'Terms & Conditions', screen: 'TermsScreen', icon: 'document-text-outline' },
];

const AccountScreen = ({ navigation }) => {
  const [editVisible, setEditVisible] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [profileData, setProfileData] = useState({});
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);


  /* ---------------- GET USER FROM STORAGE ---------------- */
  const getUserInfo = async () => {
    try {
      const userData = await AsyncStorage.getItem('mynaaiUser');
      if (!userData) return;

      const parsed = JSON.parse(userData);
      if (parsed?.userId) {
        setUserId(parsed.userId);
      }
    } catch {
      Alert.alert('Error', 'Unable to load user');
    }
  };

  /* ---------------- FETCH PROFILE ---------------- */
  const userProfile = async (id) => {
    try {
      setLoading(true);

      const response = await communication.userProfile({ userId: id });

      if (response?.status === 'SUCCESS') {
        setProfileData(response.data);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to fetch profile'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UPDATE PROFILE ---------------- */
  const updateProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Name cannot be empty');
      return;
    }

    try {
      const payload = {
        userId,
        fullName: name.trim(),
      };

      const response = await communication.updateProfile(payload);

      if (response?.status === 'SUCCESS') {
        setEditVisible(false);
        await userProfile(userId);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', response?.message || 'Update failed');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to update profile'
      );
    }
  };


  /* ---------------- EFFECTS ---------------- */
  useEffect(() => {
    getUserInfo();
  }, []);

  useEffect(() => {
    if (userId) {
      userProfile(userId);
    }
  }, [userId]);

  /* ---------------- LOGOUT ---------------- */

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([
              'mynaai',
              'mynaaiUser',
              'isLoggedIn',
              'userType',
              'token',
            ]);

            // 🔥 Notify App.js immediately
            DeviceEventEmitter.emit('AUTH_CHANGED');
          },
        },
      ],
      { cancelable: true }
    );
  };

  /* ---------------- OPEN EDIT MODAL ---------------- */
  const openEditModal = () => {
    setName(profileData?.fullName || '');
    setMobile(profileData?.phoneNumber || '');
    setEditVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={GOLD} />
        <Text style={{ color: '#aaa', marginTop: 10 }}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* PROFILE */}
        <View style={styles.profileCard}>
          <Text style={styles.name}>
            {profileData?.fullName || 'User'}
          </Text>

          <Text style={styles.mobile}>
            📞 {profileData?.phoneNumber || ''}
          </Text>

          <TouchableOpacity style={styles.editBtn} onPress={openEditModal}>
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* MENU */}
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
              style={[styles.input, { backgroundColor: '#2E2E2E', color: '#AAA' }]}
              placeholder="Mobile Number"
              keyboardType="number-pad"
              value={mobile}
              editable={false}
            />

            <View style={styles.modalRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={updateProfile}>
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
    fontWeight: '800',
    textTransform: "capitalize",
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
