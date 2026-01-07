import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { communication, getServerUrl } from '../services/communication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BookingSchedule = ({ route, navigation }) => {
  const { salon } = route.params;
  console.log("salon", salon);


  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem('mynaaiUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };
    loadUser();
  }, []);

  /* -------------------- SERVICE TOGGLE (MULTI) -------------------- */
  const toggleService = service => {
    setSelectedServices(prev => {
      const exists = prev.some(
        s => s.serviceId === service.serviceId,
      );
      if (exists) {
        return prev.filter(
          s => s.serviceId !== service.serviceId,
        );
      }
      return [...prev, service];
    });
  };

  /* -------------------- TOTAL -------------------- */
  const totalAmount = selectedServices.reduce(
    (sum, s) => sum + Number(s.price || 0),
    0,
  );

  const bookingDate = new Date(
    Date.now() + Number(selectedDate) * 24 * 60 * 60 * 1000
  )
    .toISOString()
    .slice(0, 10); // YYYY-MM-DD


  /* -------------------- CONFIRM -------------------- */
  const handleConfirm = async () => {
    if (selectedServices.length === 0) {
      Alert.alert(
        'Select Service',
        'Please select at least one service.',
      );
      return;
    }
    setLoading(true);
    try {
      const payload = {
        userId: user?.userId,
        salonId: salon?.salonId,
        serviceIds: selectedServices.map(s => s.serviceId),
        bookingDate,
        barberId: selectedBarber ? String(selectedBarber.barberId) : null,

      }
      console.log("payload", payload);

      const res = await communication.bookSalonService(payload);

      if (res?.status === 'SUCCESS') {
        Alert.alert(
          'Booking Confirmed 🎉',
          `Salon: ${salon.salonName}
Services: ${selectedServices
            .map(s => s.serviceName)
            .join(', ')}
Barber: ${selectedBarber ? selectedBarber.fullName : 'Auto Assigned'
          }
Date: ${new Date(
            Date.now() + selectedDate * 86400000,
          ).toDateString()}
Total: ₹${totalAmount}`,
          [
            {
              text: 'OK',
              onPress: () =>
                navigation.navigate('Main', {
                  screen: 'Booked Salon',
                }),
            },
          ],
        )

      } else {
        Alert.alert('Error', res?.message || 'Bookig Appointment failed');
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



  const getStatusColor = isAvailable =>
    isAvailable ? '#4CAF50' : '#F44336';

  return (
    <SafeAreaView style={styles.container}>
      {/* -------------------- HEADER -------------------- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Schedule Appointment
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
        {/* -------------------- SERVICES -------------------- */}
        <View style={styles.card}>
          <Text style={styles.section}>Select Services</Text>

          {salon?.services?.map(service => {
            const selected = selectedServices.some(
              s => s.serviceId === service.serviceId,
            );

            return (
              <TouchableOpacity
                key={service.serviceId}
                style={[
                  styles.optionRow,
                  selected && styles.optionActive,
                ]}
                onPress={() => toggleService(service)}
              >
                <View>
                  <Text
                    style={[
                      styles.serviceName,
                      selected && styles.activeText,
                    ]}
                  >
                    {service.serviceName}
                  </Text>
                  <Text
                    style={[
                      styles.serviceTime,
                      selected && styles.activeText,
                    ]}
                  >
                    ⏱ {service.durationMinutes} min
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.servicePrice,
                      selected && styles.activeText,
                    ]}
                  >
                    ₹{service.price}
                  </Text>

                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#000"
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* -------------------- BARBERS -------------------- */}
        <View style={styles.card}>
          <Text style={styles.section}>
            Select Barber (Optional)
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {salon?.barbers?.map(b => {
              const selected =
                selectedBarber?.barberId === b.barberId;

              return (
                <TouchableOpacity
                  key={b.barberId}
                  style={[
                    styles.barberCard,
                    selected && styles.barberActive,
                  ]}
                  onPress={() =>
                    setSelectedBarber(
                      selected ? null : b,
                    )
                  }
                >
                  <ImageBackground
                    source={{
                      uri: `${getServerUrl()}/getfiles/${b.profileImageUrl}`,
                    }}
                    style={styles.barberImg}
                    imageStyle={{ borderRadius: 12 }}
                  />

                  <Text style={styles.barberName}>
                    {b.fullName}
                  </Text>

                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: getStatusColor(
                            b.isAvailable,
                          ),
                        },
                      ]}
                    />
                    <Text style={styles.statusText}>
                      {b.isAvailable
                        ? 'Available'
                        : 'Not available'}
                    </Text>
                  </View>

                  <Text style={styles.barberInfo}>
                    ⭐ {b.ratingAverage || 0} • ⏱{' '}
                    {b.durationTime || '--'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* -------------------- DATE -------------------- */}
        <View style={styles.card}>
          <Text style={styles.section}>Select Date</Text>

          <View style={styles.dateRow}>
            {[0, 1, 2].map(i => {
              const date = new Date(
                Date.now() + i * 86400000,
              );
              const label =
                i === 0
                  ? 'Today'
                  : i === 1
                    ? 'Tomorrow'
                    : 'Day After';

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.dateBox,
                    selectedDate === i &&
                    styles.dateActive,
                  ]}
                  onPress={() => setSelectedDate(i)}
                >
                  <Text
                    style={[
                      styles.dateDay,
                      selectedDate === i &&
                      styles.activeText,
                    ]}
                  >
                    {label}
                  </Text>
                  <Text
                    style={[
                      styles.dateNum,
                      selectedDate === i &&
                      styles.activeText,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* -------------------- CONFIRM -------------------- */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirm}
        >

          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.confirmText}>
              Confirm Booking ₹{totalAmount}
            </Text>
          )}

        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default BookingSchedule;

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 16,
  },

  card: {
    margin: 16,
    borderRadius: 18,
  },

  section: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },

  optionActive: { backgroundColor: '#E1B378' },
  activeText: { color: '#000' },

  serviceName: { color: '#fff', fontWeight: '600' },
  serviceTime: { color: '#AAA', fontSize: 12 },
  servicePrice: { color: '#E1B378', fontWeight: '700' },

  barberCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 14,
    padding: 10,
    marginRight: 12,
    width: 120,
  },
  barberActive: { borderWidth: 1, borderColor: '#E1B378' },
  barberImg: { height: 80 },
  barberName: { color: '#fff', fontWeight: '600', marginTop: 6 },
  barberInfo: { color: '#AAA', fontSize: 12 },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: { color: '#AAA', fontSize: 12 },

  dateRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dateBox: {
    width: 90,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateActive: { backgroundColor: '#E1B378' },
  dateDay: { color: '#AAA', fontSize: 12 },
  dateNum: { color: '#fff', fontSize: 18, fontWeight: '700' },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#121212',
  },
  confirmBtn: {
    backgroundColor: '#E1B378',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  confirmText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
});
