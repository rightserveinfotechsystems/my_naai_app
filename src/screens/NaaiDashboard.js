import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const BG_IMAGE = require('../assets/salon_page_bg.jpg');



const SALONS = [
  {
    id: '1',
    name: 'Brett Gomez Salon',
    address: '817 Rebeca Lodge, Pune',
    waitTime: '25 mins',
    open: true,
    image: require('../assets/naai/naai1.jpeg'),
  },
  {
    id: '2',
    name: 'Gimabel Hair Style',
    address: 'FC Road, Pune',
    waitTime: '40 mins',
    open: true,
    image: require('../assets/naai/naai2.jpeg'),
  },
  {
    id: '3',
    name: 'Kobike Barber Shop',
    address: 'MG Road, Pune',
    waitTime: '—',
    open: false,
    image: require('../assets/naai/naai3.jpeg'),
  },
  {
    id: '4',
    name: 'Brett Gomez Salon',
    address: '817 Rebeca Lodge, Pune',
    waitTime: '25 mins',
    open: true,
    image: require('../assets/naai/naai1.jpeg'),
  },
  {
    id: '5',
    name: 'Gimabel Hair Style',
    address: 'FC Road, Pune',
    waitTime: '40 mins',
    open: true,
    image: require('../assets/naai/naai2.jpeg'),
  },
  {
    id: '6',
    name: 'Kobike Barber Shop',
    address: 'MG Road, Pune',
    waitTime: '—',
    open: false,
    image: require('../assets/naai/naai3.jpeg'),
  },
];


const NaaiDashboard = ({ navigation }) => {
  const [search, setSearch] = useState('');

  const filteredSalons = SALONS.filter(salon =>
    salon.name.toLowerCase().includes(search.toLowerCase()),
  );

  const renderSalon = ({ item }) => (
    <View style={styles.card}>
      <Image source={item.image} style={styles.image} />


      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.address}>{item.address}</Text>

        {/* ⏳ Waiting Time */}
        <View style={styles.waitRow}>
          <Ionicons name="time-outline" size={14} color="#D4AF37" />
          <Text style={styles.waitText}>
            {item.open ? ` Waiting: ${item.waitTime}` : ' Closed'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.bookBtn,
            { backgroundColor: item.open ? '#D4AF37' : '#555' },
          ]}
          disabled={!item.open}
          onPress={() =>
            navigation.navigate('SalonDetail',{ salon: item })
          }
        >
          <Text style={styles.bookText}>
            {item.open ? 'Book Now' : 'Closed'}
          </Text>
        </TouchableOpacity>
      </View>



    </View>
  );

  return (
    <ImageBackground
     source={BG_IMAGE}
      style={styles.bg}
      resizeMode="cover"
    >
      {/* Black Overlay */}
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          {/* 🔍 Search */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#999" />
            <TextInput
              placeholder="Find salon, specialists..."
              placeholderTextColor="#999"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* 🧾 Salon List */}
          <FlatList
            data={filteredSalons}
            keyExtractor={item => item.id}
            renderItem={renderSalon}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        </SafeAreaView>
      </View>
    </ImageBackground>
  );

};

export default NaaiDashboard;
const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)', // blackish overlay
  },

  container: {
    flex: 1,
    paddingHorizontal: 14,
  },

  // container: {
  //   flex: 1,
  //   backgroundColor: '#121212',
  //   paddingHorizontal: 14,
  // },

  /* Search */
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#fff',
    fontSize: 15,
  },

  /* Card */
  card: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: {
    width: 100,
    height: "100%",
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    color: '#ccc',
    fontSize: 12,
    marginLeft: 6,
  },

  bookBtn: {
    marginTop: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    width: 100,
  },
  bookText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },

  heart: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  waitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  waitText: {
    fontSize: 12,
    color: '#D4AF37',
    fontWeight: '500',
  },

});

