import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const BG_IMAGE = require('../assets/salon_page_bg.jpg');

const BOOKED_SALONS = [
  {
    id: '1',
    name: 'Brett Gomez Salon',
    address: 'Katol Road, Katol',
    barber: 'Rahul Sharma',
    date: '18 Dec 2025',
    time: '11:30 AM',
    status: 'Upcoming',
    image: require('../assets/naai/naai1.jpg'),
  },
  {
    id: '2',
    name: 'Gimabel Hair Style',
    address: 'Katol Road, Katol',
    barber: 'Amit',
    date: '10 Dec 2025',
    time: '4:00 PM',
    status: 'Completed',
    image: require('../assets/naai/naai2.jpeg'),
  },
  {
    id: '3',
    name: 'Kobike Barber Shop',
    address: 'Katol Road, Katol',
    barber: 'Suresh',
    date: '02 Dec 2025',
    time: '1:00 PM',
    status: 'Completed',
    image: require('../assets/naai/naai3.jpg'),
  },
];


const ServicesScreen = () => {
  const renderItem = ({ item }) => {
    let btnColor;
    switch (item.status) {
      case 'Upcoming':
        btnColor = '#E1B378'; // gold
        break;
      case 'Completed':
        btnColor = '#4CAF50'; // green
        break;
      default:
        btnColor = '#E53935'; // red
    }

    return (
      <TouchableOpacity style={styles.card}>
        <Image source={item.image} style={styles.image} />

        <View style={styles.infoContainer}>
          <View style={styles.info}>
  <Text style={styles.name}>{item.name}</Text>
  <Text style={styles.address}>{item.address}</Text>

  {/* BARBER */}
  <View style={styles.barberRow}>
    <Ionicons name="person-outline" size={14} color="#aaa" />
    <Text style={styles.barberText}>
      Barber: {item.barber}
    </Text>
  </View>

  <View style={styles.dateRow}>
    <Ionicons name="calendar-outline" size={14} color="#E1B378" />
    <Text style={styles.dateText}>
      {item.date} • {item.time}
    </Text>
  </View>
</View>


          <TouchableOpacity style={[styles.statusBtn, { backgroundColor: btnColor }]}>
            <Text style={styles.statusBtnText}>{item.status}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground source={BG_IMAGE} style={styles.bg}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>My Bookings</Text>

          <FlatList
            data={BOOKED_SALONS}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

export default ServicesScreen;

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  image: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  infoContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  address: {
    color: '#AAA',
    fontSize: 12,
    marginVertical: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  dateText: {
    color: '#E1B378',
    fontSize: 12,
    marginLeft: 6,
  },
  statusBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  barberRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 4,
},

barberText: {
  color: '#bbb',
  fontSize: 12,
  marginLeft: 6,
},

});
