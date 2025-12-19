import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const TABS = ['FAQ', 'Terms', 'About'];
const GOLD = '#D4AF37';
const DARK = '#121212';
const CARD = '#1E1E1E';

const AccountScreen = () => {
  const [activeTab, setActiveTab] = useState('FAQ');
  const [editVisible, setEditVisible] = useState(false);

  const [name, setName] = useState('Abhishek Tijare');
  const [mobile, setMobile] = useState('8308594231');

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          console.log('User logged out');
        },
      },
    ]);
  };

  const handleNaaiRequest = () => {
    Alert.alert(
      'Request Submitted',
      'Your request to register as a Salon / Naai Owner has been submitted. Our team will contact you shortly.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* 👤 Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/150?img=12' }}
            style={styles.avatar}
          />

          <Text style={styles.name}>{name}</Text>
          <Text style={styles.mobile}>📞 {mobile}</Text>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setEditVisible(true)}
          >
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* 🧾 Register as Salon Owner */}
        <TouchableOpacity style={styles.naaiBtn} onPress={handleNaaiRequest}>
          <Ionicons name="storefront-outline" size={18} color="#000" />
          <Text style={styles.naaiText}>
            Request to Register as Salon / Naai Owner
          </Text>
        </TouchableOpacity>

        {/* 🔖 Tabs */}
        <View style={styles.tabRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabBtn,
                activeTab === tab && styles.activeTab,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 📄 Content */}
        <View style={styles.contentCard}>
          {activeTab === 'FAQ' && (
            <>
              <Text style={styles.itemTitle}>How do I book a salon?</Text>
              <Text style={styles.itemText}>
                Choose a salon, select services and confirm your booking.
              </Text>
            </>
          )}

          {activeTab === 'Terms' && (
            <Text style={styles.itemText}>
              By using this app, you agree to all salon policies and terms.
            </Text>
          )}

          {activeTab === 'About' && (
            <Text style={styles.itemText}>
              Naai Salon App helps you find and book trusted salons nearby.
            </Text>
          )}
        </View>

        {/* 🚪 Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>App Version 1.0.0</Text>
      </ScrollView>

      {/* ✏️ Edit Profile Modal */}
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
              style={styles.input}
              placeholder="Mobile Number"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              maxLength={10}
              value={mobile}
              onChangeText={setMobile}
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

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: GOLD,
  },

  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 10,
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

  /* 🧾 Naai Owner Button */
  naaiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },

  naaiText: {
    color: '#000',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 13,
  },

  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  tabBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: CARD,
    alignItems: 'center',
  },

  activeTab: {
    backgroundColor: GOLD,
  },

  tabText: {
    color: '#aaa',
    fontWeight: '600',
    fontSize: 13,
  },

  activeTabText: {
    color: '#000',
  },

  contentCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 16,
    marginBottom: 30,
  },

  itemTitle: {
    color: GOLD,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 10,
  },

  itemText: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 20,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
