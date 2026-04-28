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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { communication, getServerUrl } from '../services/communication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';


const BookingSchedule = ({ route, navigation }) => {
  // const { salon } = route.params;
  const { salon, selectedServices } = route.params;
  const bookedSlots = salon?.bookedSlots || [];
  // const bookedSlots = salon?.data || [];
  console.log("bookedSlots", bookedSlots);



  console.log("salon", salon);


  const [selectedDate, setSelectedDate] = useState(0);
  // const [selectedServices, setSelectedServices] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);


  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem('mynaaiUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };
    loadUser();
  }, []);


  const isPastSlot = (slotValue) => {
    if (selectedDate !== 0) return false;

    const [slotHour, slotMinute] = slotValue.split(':').map(Number);
    const slotTotalMinutes = slotHour * 60 + slotMinute;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return slotTotalMinutes <= currentMinutes;
  };

  /* -------------------- CHECK IF SLOT IS BOOKED -------------------- */
  // const isSlotBooked = (slotValue) => {
  //   if (!bookedSlots?.length) return false;

  //   const [slotHour, slotMinute] = slotValue.split(':').map(Number);
  //   const slotTotalMinutes = slotHour * 60 + slotMinute;

  //   return bookedSlots.some(booked => {
  //     if (
  //       !booked ||
  //       !booked.start ||
  //       !booked.end ||
  //       typeof booked.start !== 'string' ||
  //       typeof booked.end !== 'string' ||
  //       !booked.start.includes(':') ||
  //       !booked.end.includes(':')
  //     ) {
  //       return false;
  //     }
  //     const [startH, startM] = booked.start.split(':').map(Number);
  //     const [endH, endM] = booked.end.split(':').map(Number);

  //     const startMinutes = startH * 60 + startM;
  //     const endMinutes = endH * 60 + endM;

  //     return (
  //       slotTotalMinutes >= startMinutes &&
  //       slotTotalMinutes < endMinutes
  //     );
  //   });
  // };
  const isSlotBooked = (slotValue) => {
    if (!bookedSlots?.length) return false;

    const toMinutes = (time) => {
      const clean = time.slice(0, 5); // "15:30:00" → "15:30"
      const [h, m] = clean.split(':').map(Number);
      return h * 60 + m;
    };

    const slotMinutes = toMinutes(slotValue);

    // ✅ find selected date object
    const dayData = bookedSlots.find(
      (b) => b.date === bookingDate
    );

    if (!dayData || !dayData.slots?.length) return false;

    return dayData.slots.some((s) => {
      const startMinutes = toMinutes(s.start);
      const endMinutes = toMinutes(s.end);

      return slotMinutes >= startMinutes && slotMinutes < endMinutes;
    });
  };

  /* -------------------- GENERATE TIME SLOTS -------------------- */
  const generateTimeSlots = () => {
    const schedule = salon?.businessHours?.[0];

    if (!schedule) return [];

    const convertToMinutes = (time) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const openingMinutes = convertToMinutes(schedule.openingTime);
    const closingMinutes = convertToMinutes(schedule.closingTime);

    const slots = [];

    // for (let mins = openingMinutes; mins < closingMinutes; mins += 20) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (let mins = openingMinutes; mins < closingMinutes; mins += 10) {
      // 👉 Skip past slots ONLY for today
      if (selectedDate === 0 && mins <= currentMinutes) continue;
      const hour = Math.floor(mins / 60);
      const minute = mins % 60;

      const displayHour =
        hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

      const ampm = hour >= 12 ? 'PM' : 'AM';

      const label = `${displayHour}:${minute
        .toString()
        .padStart(2, '0')} ${ampm}`;

      const value = `${hour
        .toString()
        .padStart(2, '0')}:${minute
          .toString()
          .padStart(2, '0')}`;

      slots.push({ label, value });
    }

    return slots;
  };


  const timeSlots = generateTimeSlots();

  const selectedDateObj = new Date(
    Date.now() + selectedDate * 24 * 60 * 60 * 1000
  );

  const selectedDayName = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
  });

  const isHoliday =
    salon?.businessHours?.[0]?.holidayDays?.includes(selectedDayName);

  /* -------------------- SERVICE TOGGLE (MULTI) -------------------- */

  /* -------------------- TOTAL -------------------- */


  const bookingDate = new Date(
    Date.now() + Number(selectedDate) * 24 * 60 * 60 * 1000
  )
    .toISOString()
    .slice(0, 10); // YYYY-MM-DD


  const formatBookingTime = time => {
    if (!time) return null;

    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}:00`;
  };


  /* -------------------- CONFIRM -------------------- */
  const handleConfirm = async () => {
    // if (selectedServices.length === 0) {
    //   Alert.alert(
    //     'Select Service',
    //     'Please select at least one service.',
    //   );
    //   return;
    // }


    if (loading) return;

    if (!selectedTime) {
      Alert.alert("Select Time", "Please select a time slot.");
      return;
    }

    if (!selectedServices?.length) {
      Alert.alert("Select Service", "Please select at least one service.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        salonId: salon?.salonId,
        barberId: selectedBarber?.barberId?.toString() || "",
        bookingDate,
        bookingTime: selectedTime,
        services: selectedServices.map(s => s.serviceId),
      };

      console.log("payload", payload);

      // const res = await communication.bookSalonService(payload);
      const res = await communication.createBookingRequest(payload);

      if (res?.status === 'SUCCESS') {
        //         Alert.alert(
        //           'Booking Confirmed 🎉',
        //           `Salon: ${salon.salonName}
        // Services: ${selectedServices
        //             .map(s => s.serviceName)
        //             .join(', ')}
        // Barber: ${selectedBarber ? selectedBarber.fullName : 'Auto Assigned'
        //           }
        // Date: ${new Date(
        //             Date.now() + selectedDate * 86400000,
        //           ).toDateString()}
        // Time: ${formatTime(selectedTime)}`,
        //           [
        //             {
        //               text: 'OK',
        //               onPress: () =>
        //                 navigation.navigate('Main', {
        //                   screen: 'Booked Salon',
        //                 }),
        //             },
        //           ],
        //         )
        Alert.alert('Request Sent for Salon Appointment, Wait for Salon Response');

        navigation.navigate('Main', {
          screen: 'Booked Salon',
        });
      } else {
        Alert.alert('Error', res?.message || 'Bookig Appointment failed');
      }
    } catch (error) {
      Alert.alert(
        'Warn',
        error?.response?.data?.message || 'Something went wrong'
      );

    } finally {
      setLoading(false);
    }
  };



  const getStatusColor = isAvailable =>
    isAvailable ? '#4CAF50' : '#F44336';


  const onTimeChange = (event, time) => {
    setShowTimePicker(false);

    if (event.type === 'set' && time) {
      setSelectedTime(time);
    }
  };



  const formatTime = date => {
    if (!date) return 'Time';

    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  useEffect(() => {
    if (timeSlots.length > 0 && selectedDate === 0) {
      // 👉 pick first available slot
      setSelectedTime(timeSlots[0].value);
    }
  }, [selectedDate, salon]);

  return (
    <SafeAreaView style={styles.container}>
      {/* -------------------- HEADER -------------------- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text allowFontScaling={false}style={styles.headerTitle}>
          Schedule Appointment
        </Text>
      </View>

      <FlatList
        data={salon?.services || []}
        keyExtractor={item => item.serviceId.toString()}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{
          paddingBottom: 160,
          margin: 20,
        }}
        showsVerticalScrollIndicator={false}


        ListFooterComponent={
          <>
            {/* -------------------- BARBERS -------------------- */}
            <View style={styles.card}>
              {salon?.barbers.length > 0 && (
                <Text allowFontScaling={false}style={styles.section}>
                  Select Barber (Optional)
                </Text>
              )}

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
                        setSelectedBarber(selected ? null : b)
                      }
                    >
                      <ImageBackground
                        source={{
                          uri: `${getServerUrl()}/getfiles/${b.profileImageUrl}`,
                        }}
                        style={styles.barberImg}
                        imageStyle={{ borderRadius: 12 }}
                      />

                      <Text allowFontScaling={false}style={styles.barberName}>{b.fullName}</Text>

                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: getStatusColor(b.isAvailable) },
                          ]}
                        />
                        <Text allowFontScaling={false}style={styles.statusText}>
                          {b.isAvailable ? 'Available' : 'Not available'}
                        </Text>
                      </View>

                      <Text allowFontScaling={false}style={styles.barberInfo}>
                        ⭐ {b.ratingAverage || 0}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* -------------------- DATE -------------------- */}
            <View style={styles.card}>
              <Text allowFontScaling={false}style={styles.section}>Select Date</Text>
              <View style={styles.dateRow}>
                {[0, 1, 2].map(i => {
                  const date = new Date(Date.now() + i * 86400000);
                  const label =
                    i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : 'Day After';

                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.dateBox,
                        selectedDate === i && styles.dateActive,
                      ]}
                      onPress={() => setSelectedDate(i)}
                    >
                      <Text allowFontScaling={false}
                        style={[
                          styles.dateDay,
                          selectedDate === i && styles.activeText,
                        ]}
                      >
                        {label}
                      </Text>
                      <Text allowFontScaling={false}
                        style={[
                          styles.dateNum,
                          selectedDate === i && styles.activeText,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* -------------------- TIME -------------------- */}
            {isHoliday ? (
              <View style={styles.card}>
                <Text allowFontScaling={false}style={[styles.section, { color: 'red' }]}>
                  Salon is closed on {selectedDayName}
                </Text>
              </View>
            ) : (
              <View style={styles.card}>
                <Text allowFontScaling={false}style={styles.section}>Select Time</Text>

                <View style={styles.timeGrid}>
                  {timeSlots.map(slot => {
                    const booked = isSlotBooked(slot.value);
                    const past = isPastSlot(slot.value);

                    const disabled = booked || past;

                    return (
                      <TouchableOpacity
                        key={slot.value}
                        disabled={disabled}
                        style={[
                          styles.timeSlot,
                          selectedTime === slot.value && styles.timeSlotActive,
                          booked && styles.timeSlotBooked,
                          past && styles.pastSlot,
                        ]}
                        onPress={() => setSelectedTime(slot.value)}
                      >
                        <Text allowFontScaling={false}
                          style={[
                            styles.timeSlotText,
                            selectedTime === slot.value && styles.activeText,
                            booked && styles.timeSlotBookedText,
                            past && styles.disabledText,
                          ]}
                        >
                          {slot.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        }
      />



      {/* -------------------- CONFIRM -------------------- */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            loading && { opacity: 0.6 }
          ]}
          onPress={handleConfirm}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text allowFontScaling={false}style={styles.confirmText}>
              Confirm Booking
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
    marginVertical: 16,
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
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  timeSlot: {
    width: '30%',
    backgroundColor: '#2A2A2A',
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },

  timeSlotActive: {
    backgroundColor: '#E1B378',
  },

  timeSlotText: {
    color: '#fff',
    fontWeight: '600',
  },


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
  timeInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 14,
  },

  timeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  serviceBox: {
    width: '48%',
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },

  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeSlotBooked: {
    backgroundColor: '#2e1b1b',
    borderWidth: 1,
    // borderColor: '#F44336',
  },

  timeSlotBookedText: {
    color: '#4e3331',
  },
  pastSlot: {
    backgroundColor: "#2A2A2A",
  },

  bookedSlot: {
    backgroundColor: "#FF4D4D", // your existing booked color
  },

  disabledText: {
    color: "#888",
  },
  //   timeSlotBooked: {
  //   backgroundColor: '#F44336',
  //   opacity: 0.4,
  // },
});
