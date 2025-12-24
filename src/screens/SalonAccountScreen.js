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

const SalonAccountScreen = ({ navigation }) => {
  const [editVisible, setEditVisible] = useState(false);

  const [salonOpen, setSalonOpen] = useState(true);
  const [salonName, setSalonName] = useState('Golden Scissors Salon');
  const [salonAddress, setSalonAddress] = useState('Nagpur, Maharashtra');
  const [openTime, setOpenTime] = useState('09:00 AM');
  const [closeTime, setCloseTime] = useState('09:00 PM');

  const [barbers, setBarbers] = useState([
    { id: '1', name: 'Rahul' },
    { id: '2', name: 'Ritik' },
  ]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () =>
          navigation.navigate('Main', { screen: 'Salon Naai' }),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* PROFILE */}
        <View style={styles.profileCard}>
          <Text style={styles.name}>{salonName}</Text>
          <Text style={styles.mobile}>{salonAddress}</Text>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setEditVisible(true)}
          >
            <Text style={styles.editText}>Edit Salon Profile</Text>
          </TouchableOpacity>
        </View>

        {/* SALON STATUS */}
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Salon Status</Text>

          <TouchableOpacity
            style={[
              styles.toggleBtn,
              { backgroundColor: salonOpen ? '#4CAF50' : '#E53935' },
            ]}
            onPress={() => setSalonOpen(!salonOpen)}
          >
            <Text style={styles.toggleText}>
              {salonOpen ? 'OPEN' : 'CLOSED'}
            </Text>
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

        <Text style={styles.version}>App Version 1.0.0</Text>
      </ScrollView>

      {/* EDIT SALON MODAL */}
      <Modal visible={editVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalCard}>

            <Text style={styles.modalTitle}>Salon Profile</Text>

            <TextInput
              style={styles.input}
              placeholder="Salon Name"
              placeholderTextColor="#999"
              value={salonName}
              onChangeText={setSalonName}
            />

            <TextInput
              style={styles.input}
              placeholder="Salon Address"
              placeholderTextColor="#999"
              value={salonAddress}
              onChangeText={setSalonAddress}
            />

            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 6 }]}
                placeholder="Opening Time"
                placeholderTextColor="#999"
                value={openTime}
                onChangeText={setOpenTime}
              />
              <TextInput
                style={[styles.input, { flex: 1, marginLeft: 6 }]}
                placeholder="Closing Time"
                placeholderTextColor="#999"
                value={closeTime}
                onChangeText={setCloseTime}
              />
            </View>

            <Text style={styles.sectionTitle}>Barbers</Text>

            {barbers.map((b, index) => (
              <View key={b.id} style={styles.barberRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Barber Name"
                  placeholderTextColor="#999"
                  value={b.name}
                  onChangeText={text => {
                    const updated = [...barbers];
                    updated[index].name = text;
                    setBarbers(updated);
                  }}
                />
                <TouchableOpacity
                  onPress={() =>
                    setBarbers(barbers.filter(x => x.id !== b.id))
                  }
                >
                  <Ionicons name="trash-outline" size={20} color="#E53935" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() =>
                setBarbers([...barbers, { id: Date.now().toString(), name: '' }])
              }
            >
              <Ionicons name="add-circle-outline" size={18} color="#000" />
              <Text style={styles.addText}>Add Barber</Text>
            </TouchableOpacity>

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

          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SalonAccountScreen;


/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK,
    padding: 14,
  },

  /* ---------------- PROFILE CARD ---------------- */
  profileCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },

  name: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },

  mobile: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },

  editBtn: {
    marginTop: 16,
    backgroundColor: GOLD,
    paddingHorizontal: 26,
    paddingVertical: 10,
    borderRadius: 30,
  },

  editText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 13,
  },

  /* ---------------- SALON STATUS ---------------- */
  statusRow: {
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  statusLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  toggleBtn: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 20,
  },

  toggleText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },

  /* ---------------- MENU ---------------- */
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

  /* ---------------- LOGOUT ---------------- */
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 22,
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

  /* ---------------- MODAL ---------------- */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 16,
  },

  modalCard: {
    backgroundColor: CARD,
    borderRadius: 22,
    padding: 18,
    maxHeight: '90%',
  },

  modalTitle: {
    color: GOLD,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },

  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    marginBottom: 12,
    fontSize: 14,
  },

  timeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },

  sectionTitle: {
    color: GOLD,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 10,
  },

  barberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD,
    borderRadius: 20,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 16,
  },

  addText: {
    color: '#000',
    fontWeight: '700',
    marginLeft: 8,
  },

  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 22,
    backgroundColor: '#333',
    alignItems: 'center',
  },

  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 22,
    backgroundColor: GOLD,
    alignItems: 'center',
  },

  cancelText: {
    color: '#fff',
    fontWeight: '600',
  },

  saveText: {
    color: '#000',
    fontWeight: '800',
  },
});

