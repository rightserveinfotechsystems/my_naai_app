import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

/* -------------------- TIME SLOTS -------------------- */
const TIME_SLOTS = [
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
];

/* -------------------- SCREEN -------------------- */
const BookingSchedule = ({ route, navigation }) => {
  const { salon, services, barber } = route.params;

  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);

  /* -------------------- QUEUE LOGIC -------------------- */
  const queuePosition = useMemo(() => {
    const baseQueue = barber ? 3 : 5; // barber selected → shorter queue
    return baseQueue + selectedDate;
  }, [barber, selectedDate]);

  /* -------------------- TOTAL -------------------- */
  const totalAmount = services.reduce((sum, s) => sum + s.price, 0);

  /* -------------------- CONFIRM -------------------- */
  const handleConfirm = () => {
    if (!selectedSlot) {
      Alert.alert('Select Time', 'Please select a time slot');
      return;
    }

    Alert.alert(
      'Booking Confirmed 🎉',
      `Salon: ${salon.name}
Services: ${services.map(s => s.name).join(', ')}
Barber: ${barber ? barber.name : 'Auto Assigned'}
Date: ${new Date(
        Date.now() + selectedDate * 86400000
      ).toDateString()}
Time: ${selectedSlot}
Queue No: ${queuePosition}`,
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Main', { screen: 'Booked Salon' }),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* -------------------- HEADER -------------------- */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Schedule Appointment</Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
          {/* -------------------- SUMMARY -------------------- */}
          <View style={styles.card}>
            <Text style={styles.section}>Summary</Text>

            <Text style={styles.summaryText}>
              Salon: <Text style={styles.bold}>{salon.name}</Text>
            </Text>

            <Text style={styles.summaryText}>
              Services:{' '}
              <Text style={styles.bold}>
                {services.map(s => s.name).join(', ')}
              </Text>
            </Text>

            <Text style={styles.summaryText}>
              Barber:{' '}
              <Text style={styles.bold}>
                {barber ? barber.name : 'Auto Assign'}
              </Text>
            </Text>

            <Text style={styles.totalText}>Total: ₹{totalAmount}</Text>
          </View>

          {/* -------------------- DATE PICKER -------------------- */}
          <View style={styles.card}>
            <Text style={styles.section}>Select Date</Text>
            <View style={styles.dateRow}>
              {[0, 1, 2, 3, 4, 5, 6].map(i => {
                const date = new Date(Date.now() + i * 86400000);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.dateBox,
                      selectedDate === i && styles.dateActive,
                    ]}
                    onPress={() => setSelectedDate(i)}
                  >
                    <Text style={styles.dateDay}>
                      {date.toDateString().slice(0, 3)}
                    </Text>
                    <Text style={styles.dateNum}>{date.getDate()}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* -------------------- TIME SLOTS -------------------- */}
          <View style={styles.card}>
            <Text style={styles.section}>Select Time</Text>
            <View style={styles.slotWrap}>
              {TIME_SLOTS.map(slot => (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.slot,
                    selectedSlot === slot && styles.slotActive,
                  ]}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Text style={styles.slotText}>{slot}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* -------------------- QUEUE INFO -------------------- */}
          <View style={styles.queueBox}>
            <Ionicons name="people-outline" size={20} color="#E1B378" />
            <Text style={styles.queueText}>
              Estimated Queue Position:{' '}
              <Text style={styles.bold}>#{queuePosition}</Text>
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* -------------------- CONFIRM BUTTON -------------------- */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmText}>Confirm Booking</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    backgroundColor: '#1E1E1E',
    margin: 16,
    padding: 16,
    borderRadius: 18,
  },

  section: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  summaryText: {
    color: '#AAA',
    marginBottom: 6,
  },

  bold: {
    color: '#fff',
    fontWeight: '600',
  },

  totalText: {
    color: '#E1B378',
    fontWeight: '700',
    marginTop: 8,
    fontSize: 16,
  },

  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateBox: {
    width: 44,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateActive: {
    backgroundColor: '#E1B378',
  },
  dateDay: {
    color: '#AAA',
    fontSize: 12,
  },
  dateNum: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  slotWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  slot: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    margin: 6,
  },
  slotActive: {
    backgroundColor: '#E1B378',
  },
  slotText: {
    color: '#fff',
    fontWeight: '600',
  },

  queueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
  },
  queueText: {
    color: '#AAA',
    marginLeft: 10,
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
});
