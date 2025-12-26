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
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const GOLD = '#E8B97E';
const DARK = '#121212';
const CARD = '#1E1E1E';
const MAX_IMAGE_MB = 2;

const MENUS = [
  { label: 'FAQ', screen: 'FAQScreen', icon: 'help-circle-outline' },
  { label: 'Terms & Conditions', screen: 'TermsScreen', icon: 'document-text-outline' },
  { label: 'About', screen: 'AboutScreen', icon: 'information-circle-outline' },
];

const SalonAccountScreen = ({ navigation }) => {
  const [editVisible, setEditVisible] = useState(false);
  const [salonOpen, setSalonOpen] = useState(true);

  const [salonName, setSalonName] = useState('Golden Scissors Salon');
  const [salonAddress, setSalonAddress] = useState('Katol, Maharashtra');
  const [salonImage, setSalonImage] = useState(null);

  const [openTime, setOpenTime] = useState(new Date());
  const [closeTime, setCloseTime] = useState(new Date());
  const [pickerType, setPickerType] = useState(null);

  const [holidays, setHolidays] = useState([]);
  const [holidayPickerVisible, setHolidayPickerVisible] = useState(false);

  const [barbers, setBarbers] = useState([
    { id: '1', name: 'Rahul', image: null, status: 'available' },
    { id: '2', name: 'Ritik', image: null, status: 'available' },
  ]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () =>
          // navigation.navigate('Main', { screen: 'Salon Naai' }),
          navigation.navigate('UserLogin'),
      },
    ]);
  };

  /* ---------------- HELPERS ---------------- */
  const formatTime = date =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDate = date => date.toISOString().split('T')[0];

  /* ---------------- IMAGE PICKER ---------------- */
  const pickImage = callback => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, res => {
      if (res.didCancel || !res.assets?.length) return;
      const asset = res.assets[0];
      if (asset.fileSize / (1024 * 1024) > MAX_IMAGE_MB) {
        Alert.alert('Image Too Large', 'Select image below 2MB');
        return;
      }
      callback(asset.uri);
    });
  };

  /* ---------------- SALON TOGGLE ---------------- */
  const handleToggleSalon = () => {
    Alert.alert(
      salonOpen ? 'Close Salon?' : 'Open Salon?',
      salonOpen
        ? 'Customers will not be able to book.'
        : 'Customers can start booking.',
      [
        { text: 'Cancel' },
        {
          text: salonOpen ? 'Close' : 'Open',
          onPress: () => setSalonOpen(!salonOpen),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>

        {/* PROFILE */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={() => pickImage(setSalonImage)}>
            <Image
              source={
                salonImage
                  ? { uri: salonImage }
                  : require('../assets/my_naai.jpeg')
              }
              style={styles.salonImage}
            />
            <Text style={styles.changeImg}>Change Image</Text>
          </TouchableOpacity>

          <Text style={styles.name}>{salonName}</Text>
          <Text style={styles.mobile}>{salonAddress}</Text>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setEditVisible(true)}
          >
            <Text style={styles.editText}>Edit Salon Profile</Text>
          </TouchableOpacity>
        </View>

        {/* STATUS */}
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Salon Status</Text>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              { backgroundColor: salonOpen ? '#4CAF50' : '#E53935' },
            ]}
            onPress={handleToggleSalon}
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

        <Text style={styles.version}>App Version 1.0.1</Text>

      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={editVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalCard}>

            <Text style={styles.modalTitle}>Salon Settings</Text>

            <TextInput
              style={styles.input}
              value={salonName}
              onChangeText={setSalonName}
              placeholder="Salon Name"
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.input}
              value={salonAddress}
              onChangeText={setSalonAddress}
              placeholder="Salon Address"
              placeholderTextColor="#999"
            />

            {/* TIME */}
            <View style={styles.timeRow}>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => setPickerType('open')}
              >
                <Text style={styles.timeText}>
                  Open: {formatTime(openTime)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => setPickerType('close')}
              >
                <Text style={styles.timeText}>
                  Close: {formatTime(closeTime)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* HOLIDAYS */}
            <Text style={styles.sectionTitle}>Holidays</Text>

            <TouchableOpacity
              style={styles.timeBtn}
              onPress={() => setHolidayPickerVisible(true)}
            >
              <Text style={styles.timeText}>Add Holiday</Text>
            </TouchableOpacity>

            {holidays.map(date => (
              <View key={date} style={styles.holidayRow}>
                <Text style={styles.holidayText}>{date}</Text>
                <TouchableOpacity
                  onPress={() =>
                    setHolidays(holidays.filter(d => d !== date))
                  }
                >
                  <Ionicons name="close-circle" size={20} color="#E53935" />
                </TouchableOpacity>
              </View>
            ))}

            {/* BARBERS */}
            <Text style={styles.sectionTitle}>Barbers</Text>

            {barbers.map((b, index) => (
              <View key={b.id} style={styles.barberRow}>
                <TouchableOpacity
                  onPress={() =>
                    pickImage(uri => {
                      const updated = [...barbers];
                      updated[index].image = uri;
                      setBarbers(updated);
                    })
                  }
                >
                  <Image
                    source={
                      b.image
                        ? { uri: b.image }
                        : require('../assets/my_naai.jpeg')
                    }
                    style={styles.barberImg}
                  />
                </TouchableOpacity>

                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={b.name}
                  onChangeText={text => {
                    const updated = [...barbers];
                    updated[index].name = text;
                    setBarbers(updated);
                  }}
                />

                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {['available', 'busy', 'leave'].map(s => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor:
                            b.status === s
                              ? s === 'available'
                                ? '#4CAF50'
                                : s === 'busy'
                                  ? '#FFC107'
                                  : '#E53935'
                              : '#333',
                        },
                      ]}
                      onPress={() => {
                        const updated = [...barbers];
                        updated[index].status = s;
                        setBarbers(updated);
                      }}
                    >
                      <Text style={styles.statusPillText}>
                        {s.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() =>
                setBarbers([
                  ...barbers,
                  {
                    id: Date.now().toString(),
                    name: '',
                    image: null,
                    status: 'available',
                  },
                ])
              }
            >
              <Text style={styles.addText}>+ Add Barber</Text>
            </TouchableOpacity>

            {/* SAVE */}
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

      {/* TIME PICKERS */}
      {pickerType && (
        <DateTimePicker
          value={pickerType === 'open' ? openTime : closeTime}
          mode="time"
          onChange={(e, d) => {
            setPickerType(null);
            if (d) pickerType === 'open' ? setOpenTime(d) : setCloseTime(d);
          }}
        />
      )}

      {holidayPickerVisible && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          onChange={(e, d) => {
            setHolidayPickerVisible(false);
            if (d) {
              const f = formatDate(d);
              if (!holidays.includes(f)) setHolidays([...holidays, f]);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default SalonAccountScreen;
const styles = StyleSheet.create({
  /* ================= ROOT ================= */
  container: {
    flex: 1,
    backgroundColor: DARK,
    padding: 14,
  },

  /* ================= PROFILE CARD ================= */
  profileCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
    elevation: 4,
  },

  salonImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: GOLD,
  },

  changeImg: {
    color: GOLD,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },

  name: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
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
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 30,
  },

  editText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },

  /* ================= SALON STATUS ================= */
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
    fontWeight: '700',
  },

  toggleBtn: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },

  toggleText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },

  /* ================= MENU ================= */
  menuCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    marginBottom: 30,
    overflow: 'hidden',
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

  /* ================= MODAL ================= */
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
    maxHeight: '92%',
  },

  modalTitle: {
    color: GOLD,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.6,
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

  /* ================= TIME PICKER ================= */
  timeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },

  timeBtn: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 8,
  },

  timeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },

  /* ================= SECTIONS ================= */
  sectionTitle: {
    color: GOLD,
    fontSize: 15,
    fontWeight: '800',
    marginVertical: 12,
  },

  /* ================= HOLIDAYS ================= */
  holidayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 10,
    borderRadius: 12,
    marginTop: 6,
  },

  holidayText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  /* ================= BARBERS ================= */
  barberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },

  barberImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: GOLD,
  },

  /* ================= BARBER STATUS ================= */
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  statusPillText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '800',
  },

  /* ================= ADD BARBER ================= */
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD,
    borderRadius: 22,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 14,
  },

  addText: {
    color: '#000',
    fontWeight: '800',
    marginLeft: 8,
    fontSize: 13,
  },

  /* ================= MODAL BUTTONS ================= */
  modalRow: {
    flexDirection: 'row',
    marginTop: 14,
  },

  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 6,
    borderRadius: 22,
    backgroundColor: '#333',
    alignItems: 'center',
  },

  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 6,
    borderRadius: 22,
    backgroundColor: GOLD,
    alignItems: 'center',
  },

  cancelText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  saveText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
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
});
