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
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { communication, getServerUrl } from '../services/communication';
import { DAYS } from '../utilities/DaysArray';
import RNBlobUtil from 'react-native-blob-util';

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
  const [salonName, setSalonName] = useState('');
  const [salonAddress, setSalonAddress] = useState('');
  const [salonImage, setSalonImage] = useState(null);
  const [openTime, setOpenTime] = useState(new Date());
  const [closeTime, setCloseTime] = useState(new Date());
  const [pickerType, setPickerType] = useState(null);
  const [holiday, setHoliday] = useState(null);

  const [holidayPickerVisible, setHolidayPickerVisible] = useState(false);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [profileData, setProfileData] = useState({});
  const [salonId, setsalonId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);


  const address = `${profileData?.addressLine1}`


  /* ---------------- GET USER FROM STORAGE ---------------- */

  // const buildImageUrl = (path) => {
  //   if (!path) return null;
  //   if (path.startsWith('http')) return path;
  //   return `${getServerUrl()}/getFiles/${path}`;
  // };

  const buildImageUrl = (path) => {
    if (!path) return null;

    // ✅ local image (picked from gallery)
    if (path.startsWith('file://')) return path;

    // ✅ already full URL
    if (path.startsWith('http')) return path;

    // ✅ server relative path
    return `${getServerUrl()}/getFiles/${path}`;
  };



  const userByIdInfo = async () => {
    try {
      const userData = await AsyncStorage.getItem('mynaaiUser');
      const parsedUser = JSON.parse(userData);
      console.log("parsedUser", parsedUser);
      setsalonId(parsedUser?.salon?.salonId)

    } catch (error) {
      console.error("User fetch failed:", error);
      Alert.alert(
        'Error',
        error?.response?.data?.message || error.message || 'Something went wrong.'
      );
    }
  };


  /* ---------------- FETCH PROFILE ---------------- */
  const salonProfile = async (id) => {
    try {
      setProfileLoading(true);

      const response = await communication.salonProfile({ salonId: id });

      if (response?.status === 'SUCCESS') {
        const data = response.data;
        console.log("data", data);


        setProfileData(data);
        setIsOpen(data?.isOpen);

        // BASIC INFO
        setSalonName(data?.salonName || '');
        setSalonAddress(
          `${data?.addressLine1 || ''}`
        );

        // SALON IMAGE
        setSalonImage(data?.imageUrl || null);

        // BUSINESS HOURS
        if (data?.businessHours?.length) {
          const bh = data.businessHours[0];
          setOpenTime(new Date(`1970-01-01T${bh.openingTime}`));
          setCloseTime(new Date(`1970-01-01T${bh.closingTime}`));

          // convert everything to number & remove invalid
          let holidayValue = null;

          if (bh.holidayDays?.length > 0) {
            const day = bh.holidayDays[0];

            holidayValue =
              typeof day === 'number'
                ? day
                : DAYS.find(d => d.label === day)?.value ?? null;
          }

          setHoliday(holidayValue);


        }



        // BARBERS
        setBarbers(
          data.barbers.map(b => ({
            id: b.barberId,
            name: b.fullName,
            image: b.profileImageUrl || null,
            isAvailable: b.isAvailable, // ✅ BOOLEAN
            rating: b.ratingAverage,
          }))
        );


        // SERVICES
        setServices(
          data.services.map(s => ({
            id: s.serviceId,
            name: s.serviceName,
            price: s.price,
            duration: String(s.durationMinutes),
          }))
        );
      }

    } catch (error) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to fetch profile'
      );
    } finally {
      setProfileLoading(false);
    }
  };


  const handleRefreshProfile = async () => {
    if (!salonId) return;

    try {
      setProfileLoading(true);
      await salonProfile(salonId);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh profile');
    } finally {
      setProfileLoading(false);
    }
  };


  const dayMap = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const mapHolidays = (days) => days.map(d => dayMap[d]);

  const formatTimeForApi = (date) => {
    return date.toTimeString().slice(0, 8);
  };


  const formatTime12Hour = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };




  /* ---------------- UPDATE PROFILE ---------------- */
  const handleSaveProfile = async () => {

    // ================= BARBER VALIDATION =================
    const emptyBarber = barbers.find(
      b => !b.name || !b.name.trim()
    );

    if (emptyBarber) {
      Alert.alert(
        'Validation Error',
        'Please enter barber name before saving.'
      );
      setProfileLoading(false);
      return;
    }
    try {
      setProfileLoading(true);

      /* ================= SERVICES ================= */
      // Helper to validate GUID
      const isValidGuid = (id) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      // Existing services (only valid GUIDs)
      const existingServices = services
        .filter(s => isValidGuid(s.id))
        .map(s => ({
          serviceId: s.id,
          serviceName: s.name,
          durationMinutes: Number(s.duration) || 0,
          price: String(s.price || 0),
        }));

      // New services (anything else)
      const newServices = services
        .filter(s => !isValidGuid(s.id))
        .map(s => ({
          serviceName: s.name || 'New Service',
          durationMinutes: Number(s.duration) || 0,
          price: String(s.price || 0),
          description: s.description?.trim() || 'No description', // ✅ must not be empty
        }));

      // Existing barbers (valid GUIDs)
      const existingBarbers = await Promise.all(
        barbers
          .filter(b => isValidGuid(b.id))
          .map(async b => ({
            barberId: b.id,
            profileImageUrl:
              b.image?.startsWith('file://')
                ? await uploadImages(b.image)
                : b.image || null,

            ratingAverage: String(b.rating || '0.0'),
            isAvailable: b.isAvailable,
          }))
      );




      const newBarbers = await Promise.all(
        barbers
          .filter(b => !isValidGuid(b.id))
          .map(async b => ({
            fullName: b.name,
            profileImageUrl:
              b.image?.startsWith('file://')
                ? await uploadImages(b.image)
                : null,

            ratingAverage: String(b.rating || '0.0'),
            isAvailable: b.isAvailable,
          }))
      );




      // Final payload
      // const imagePath =
      //   salonImage?.startsWith('file://')
      //     ? await uploadImages(salonImage)
      //     : salonImage;

      let imagePath = salonImage;

      // Upload only if local image
      if (salonImage && salonImage.startsWith('file://')) {
        imagePath = await uploadImages(salonImage);
      }


      const imagesArray = imagePath ? [imagePath] : [];

      const payload = {
        salonId,
        salonName,
        ownerName: profileData.ownerName,
        phoneNumber: profileData.phoneNumber,
        email: profileData.email,
        addressLine1: salonAddress,
        addressLine2: '',
        city: profileData.city,
        state: profileData.state,
        pincode: profileData.pincode,
        genderType: profileData.genderType || 'UNISEX',
        isActive: true,

        imageUrl: imagePath,
        imagesArray, // ✅ THIS FIXES THE ERROR

        existingServices,
        newServices,

        existingBarbers,
        newBarbers,

        businessHours: [
          {
            scheduleId: profileData.businessHours?.[0]?.scheduleId,
            openingTime: formatTimeForApi(openTime),
            closingTime: formatTimeForApi(closeTime),
            breakStartTime: '13:00:00',
            breakEndTime: '15:00:00',
            holidayDays: holiday !== null ? [holiday] : [],
          },
        ],
      };


      console.log("payload", payload);
      const response = await communication.updateSalonProfile(payload);

      if (response?.status === 'SUCCESS') {
        Alert.alert('Success', 'Salon profile updated successfully');
        setEditVisible(false);
        salonProfile(salonId);
        console.log("response", response);

      } else {
        Alert.alert('Error', response?.message || 'Update failed');
        console.log('Error', response?.message || 'Update failed');
      }

    } catch (error) {
      Alert.alert(
        'Errors',
        error?.response?.data?.message || 'Something went wrong'
      );
      console.log(
        'Error',
        error?.response?.data?.message || 'Something went wrong'
      );
    } finally {
      setProfileLoading(false);
    }
  };

  /* ---------------- EFFECTS ---------------- */
  useEffect(() => {
    userByIdInfo();
  }, []);

  useEffect(() => {
    if (salonId) {
      salonProfile(salonId);
    }
  }, [salonId]);

  const getImageSource = (path) => {
    return path
      ? { uri: `${getServerUrl()}${path}` }
      : require('../assets/my_naai.png');
  };




  const uploadImages = async (localUri) => {
    try {
      const response = await RNBlobUtil.fetch(
        'POST',
        `${getServerUrl()}/api/upload/upload-image`,
        {
          'Content-Type': 'multipart/form-data',
        },
        [
          {
            name: 'image',
            filename: `image_${Date.now()}.jpg`,
            type: 'image/jpeg',
            data: RNBlobUtil.wrap(localUri.replace('file://', '')),
          },
        ]
      );

      const data = response.json();

      if (data?.success) {
        // RETURN RELATIVE PATH ONLY
        return data.url.replace(/^\/+/, '');
      }

      throw new Error('Upload failed');
    } catch (err) {
      console.log('Upload error:', err);
      Alert.alert('Error', 'Image upload failed');
      return null;
    }
  };


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
            await AsyncStorage.removeItem('mynaai');
            await AsyncStorage.removeItem('mynaaiUser');
            await AsyncStorage.removeItem('isLoggedIn');
            await AsyncStorage.removeItem('userType');
            await AsyncStorage.removeItem('token');

            navigation.reset({
              index: 0,
              routes: [{ name: 'UserLogin' }],
            });
          },
        },
      ],
      { cancelable: true }
    );
  };


  /* ---------------- HELPERS ---------------- */
  const formatTime = date =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // const formatDate = date => date.toISOString().split('T')[0];

  /* ---------------- IMAGE PICKER ---------------- */
  const pickImage = (callback) => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.8 },
      (res) => {
        if (res.didCancel || !res.assets?.length) return;

        const asset = res.assets[0];

        if (asset.fileSize / (1024 * 1024) > MAX_IMAGE_MB) {
          Alert.alert('Image Too Large', 'Select image below 2MB');
          return;
        }

        callback(asset.uri); // ✅ file://...
      }
    );
  };


  const selectHoliday = dayValue => {
    setHoliday(Number(dayValue));
    setHolidayPickerVisible(false);
  };


  /* ---------------- SALON TOGGLE ---------------- */
  const handleToggleSalon = () => {
    Alert.alert(
      isOpen ? 'Close Salon?' : 'Open Salon?',
      isOpen
        ? 'Customers will not be able to book.'
        : 'Customers can start booking.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isOpen ? 'Close' : 'Open',
          onPress: async () => {
            try {
              const payload = {
                salonId,
                isOpen: !isOpen,
              };

              const response = await communication.SalonOpenClose(payload);

              if (response?.status === 'SUCCESS') {
                setIsOpen(!isOpen); // ✅ update UI
              } else {
                Alert.alert('Error', 'Unable to change salon status');
              }
            } catch (error) {
              Alert.alert(
                'Error',
                error?.response?.data?.message || 'Something went wrong'
              );
            }
          },
        },
      ]
    );
  };

  if (profileLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={GOLD} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={profileLoading}
            onRefresh={handleRefreshProfile}
            tintColor={GOLD}
          />
        }
      >


        {/* PROFILE */}
        <View style={styles.profileCard}>

          <Image
            source={
              salonImage
                ? { uri: buildImageUrl(salonImage) }
                : require('../assets/my_naai.png')
            }

            style={styles.salonImage}
          />

          <Text style={styles.name}>
            {profileData?.salonName || ''}
          </Text>

          <Text style={styles.mobile}>{address}</Text>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setEditVisible(true)}
          >
            <Text style={styles.editText}>Edit Salon Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.editBtn, { marginTop: 10, backgroundColor: '#2A2A2A' }]}
            onPress={handleRefreshProfile}
          >
            <Text style={[styles.editText, { color: GOLD }]}>
              Refresh Account Details
            </Text>
          </TouchableOpacity>

        </View>

        {/* STATUS */}
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Salon Open/Close Status</Text>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              { backgroundColor: isOpen ? '#4CAF50' : '#E53935' },
            ]}
            onPress={handleToggleSalon}
          >
            <Text style={styles.toggleText}>
              {isOpen ? 'OPEN' : 'CLOSED'}
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

            <View style={styles.profileCard}>

              <TouchableOpacity onPress={() => pickImage(setSalonImage)}>

                <Image
                  source={
                    salonImage
                      ? { uri: buildImageUrl(salonImage) }
                      : require('../assets/my_naai.png')
                  }

                  style={styles.salonImage}
                />

                <Text style={styles.changeImg}>Change Image</Text>
              </TouchableOpacity>
            </View>

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
                  Open: {formatTime12Hour(openTime)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => setPickerType('close')}
              >
                <Text style={styles.timeText}>
                  Close: {formatTime12Hour(closeTime)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Week Off */}
            <Text style={styles.sectionTitle}>Week Off</Text>

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setHolidayPickerVisible(prev => !prev)}
            >
              <Text style={styles.addText}>
                {holiday !== null
                  ? `Week Off: ${DAYS.find(d => d.value === holiday)?.label}`
                  : '+ Add Week Off'}
              </Text>



            </TouchableOpacity>

            {holidayPickerVisible && (
              <View style={styles.dropdown}>
                {DAYS.map(day => (
                  <TouchableOpacity
                    key={day.value}
                    style={styles.dropdownItem}
                    onPress={() => selectHoliday(day.value)}
                  >
                    <Ionicons
                      name={
                        holiday === day.value
                          ? 'radio-button-on'
                          : 'radio-button-off'
                      }
                      size={18}
                      color={holiday === day.value ? '#4CAF50' : '#999'}
                    />
                    <Text style={styles.dropdownText}>{day.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}





            {/* ================= SERVICES ================= */}
            <Text style={styles.sectionTitle}>Services</Text>

            {services.map((service, index) => (
              <View key={service.id} style={styles.serviceRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Service Name"
                  placeholderTextColor="#999"
                  value={service.name}
                  onChangeText={text => {
                    const updated = [...services];
                    updated[index].name = text;
                    setServices(updated);
                  }}
                />

                {/* <TextInput
                  style={[styles.input, styles.smallInput]}
                  placeholder="Price"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                  value={service.price}
                  onChangeText={text => {
                    const updated = [...services];
                    updated[index].price = text;
                    setServices(updated);
                  }}
                /> */}

                <TextInput
                  style={[styles.input, styles.smallInput]}
                  placeholder="Time"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                  value={service.duration}
                  onChangeText={text => {
                    const updated = [...services];
                    updated[index].duration = text;
                    setServices(updated);
                  }}
                />

                {/* <TouchableOpacity
                  onPress={() =>
                    setServices(services.filter(s => s.id !== service.id))
                  }
                >
                  <Ionicons name="trash-outline" size={20} color="#E53935" />
                </TouchableOpacity> */}
              </View>
            ))}

            <TouchableOpacity
              style={styles.addBtn}
              onPress={() =>
                setServices([
                  ...services,
                  {
                    id: Date.now().toString(),
                    name: '',
                    price: '',
                    duration: '',
                  },
                ])
              }
            >
              <Text style={styles.addText}>+ Add Service</Text>
            </TouchableOpacity>


            {/* BARBERS */}
            <Text style={styles.sectionTitle}>Barbers</Text>

            {barbers.map((b, index) => (
              <View key={b.id} style={styles.barberCard}>
                {/* TOP ROW */}
                <View style={styles.barberTopRow}>
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
                          ? { uri: b.image.startsWith('file://') ? b.image : buildImageUrl(b.image) }
                          : require('../assets/my_naai.png')
                      }

                      style={styles.barberImg}
                    />




                  </TouchableOpacity>

                  <TextInput
                    style={[styles.input, styles.barberNameInput]}
                    placeholder="Barber Name"
                    placeholderTextColor="#999"
                    value={b.name}
                    onChangeText={text => {
                      const updated = [...barbers];
                      updated[index].name = text;
                      setBarbers(updated);
                    }}
                  />
                </View>

                {/* BOTTOM ROW */}
                <View style={styles.barberBottomRow}>
                  <TextInput
                    style={styles.ratingInput}
                    placeholder="Rating (1–5)"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    maxLength={1}
                    value={String(b.rating)}
                    onChangeText={text => {
                      if (text === '') {
                        const updated = [...barbers];
                        updated[index].rating = '';
                        setBarbers(updated);
                        return;
                      }

                      const num = Number(text);
                      if (num >= 1 && num <= 5) {
                        const updated = [...barbers];
                        updated[index].rating = num;
                        setBarbers(updated);
                      }
                    }}
                  />

                  <Text style={{ color: '#777', fontSize: 11, marginTop: 4 }}>
                    Out of 5
                  </Text>


                  <View style={styles.statusGroup}>
                    {[
                      { label: 'AVAILABLE', value: true },
                      { label: 'ON LEAVE', value: false },
                    ].map(opt => (
                      <TouchableOpacity
                        key={opt.label}
                        style={[
                          styles.statusPill,
                          {
                            backgroundColor:
                              b.isAvailable === opt.value
                                ? opt.value
                                  ? '#4CAF50'
                                  : '#E53935'
                                : '#333',
                          },
                        ]}
                        onPress={() => {
                          const actionText = opt.value ? 'mark this barber as AVAILABLE' : 'mark this barber as ON LEAVE';

                          Alert.alert(
                            'Confirm Status Change',
                            `Are you sure you want to ${actionText}?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Yes',
                                onPress: () => {
                                  const updated = [...barbers];
                                  updated[index].isAvailable = opt.value; // ✅ boolean
                                  setBarbers(updated);
                                },
                              },
                            ],
                            { cancelable: true }
                          );
                        }}

                      >
                        <Text style={styles.statusPillText}>{opt.label}</Text>
                      </TouchableOpacity>
                    ))}

                  </View>
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
                    isAvailable: true,
                    rating: 1,
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
                onPress={handleSaveProfile}

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
    padding: 5,
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
    paddingBottom: 40,
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
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },

  smallInput: {
    width: 70,
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  ratingInput: {
    width: 90,
    textAlign: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 8,
    color: '#fff',
    fontWeight: '700',
  },


  barberCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },

  barberTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  barberNameInput: {
    flex: 1,
    marginBottom: 0,
  },

  barberBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },



  statusGroup: {
    flexDirection: 'row',
    gap: 6,
  },

  dropdown: {
    backgroundColor: '#2A2A2A',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
  },

  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },

  dropdownText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },


});
