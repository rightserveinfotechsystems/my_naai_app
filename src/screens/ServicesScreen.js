// import React from 'react'
// import { Text, View } from 'react-native';

// const ServicesScreen = () => {
//   return (
//     <View>
//         <Text>
//             This Services screen in bottom navbar tab
//         </Text>
      
//     </View>
//   )
// }

// export default ServicesScreen;


import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const BG_IMAGE = require('../assets/salon_page_bg.jpg');

/* -------------------- BOOKED DATA -------------------- */

const BOOKED_SALONS = [
  {
    id: '1',
    name: 'Brett Gomez Salon',
    address: '817 Rebeca Lodge, Pune',
    date: '18 Dec 2025',
    time: '11:30 AM',
    status: 'Upcoming',
    image: require('../assets/naai/naai1.jpeg'),
  },
  {
    id: '2',
    name: 'Gimabel Hair Style',
    address: 'FC Road, Pune',
    date: '10 Dec 2025',
    time: '4:00 PM',
    status: 'Completed',
    image: require('../assets/naai/naai2.jpeg'),
  },
  {
    id: '3',
    name: 'Kobike Barber Shop',
    address: 'MG Road, Pune',
    date: '02 Dec 2025',
    time: '1:00 PM',
    status: 'Completed',
    image: require('../assets/naai/naai3.jpeg'),
  },
];

/* -------------------- SCREEN -------------------- */

const ServicesScreen = () => {
  const renderItem = ({ item }) => {
    const statusColor =
      item.status === 'Upcoming'
        ? '#D4AF37'
        : item.status === 'Completed'
        ? '#4CAF50'
        : '#E53935';

    return (
      <View style={styles.card}>
        <Image source={item.image} style={styles.image} />

        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.address}>{item.address}</Text>

          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color="#D4AF37" />
            <Text style={styles.dateText}>
              {item.date} • {item.time}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>
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

/* -------------------- STYLES -------------------- */

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },

  container: {
    flex: 1,
    paddingHorizontal: 14,
  },

  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    marginTop: 10,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },

  image: {
    width: 100,
    height: '100%',
    resizeMode: 'cover',
  },

  info: {
    flex: 1,
    padding: 12,
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
    color: '#D4AF37',
    fontSize: 12,
    marginLeft: 6,
  },

  statusBadge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },

  statusText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
});
