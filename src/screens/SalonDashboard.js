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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const BG_IMAGE = require('../assets/salon_page_bg.jpg');



const CUSTOMERS = [
  {
    id: '1',
    name: 'Brett Gomez',
    mobile: '9876543210',
    services: 'Haircut, Beard',
  },
  {
    id: '2',
    name: 'Salman Khan',
    mobile: '9123456789',
    services: 'Hair Spa',
  },
  {
    id: '3',
    name: 'Shahrukh Khan',
    mobile: '9988776655',
    services: 'Haircut, Color',
  },
];




const SalonDashboard = ({ navigation }) => {
  const [search, setSearch] = useState('');

  const filteredSalons = CUSTOMERS.filter(salon =>
    salon.name.toLowerCase().includes(search.toLowerCase()),
  );

const renderSalon = ({ item }) => (
  <View style={styles.card}>
    <View style={styles.infoRow}>
      
      {/* LEFT INFO */}
     <View style={styles.infoLeft}>
  <Text style={styles.name}>{item.name}</Text>

  <TouchableOpacity
    onPress={() => Linking.openURL(`tel:${item.mobile}`)}
  >
    <Text style={[styles.subText, { textDecorationLine: 'underline' }]}>
      📞 {item.mobile}
    </Text>
  </TouchableOpacity>

  <Text style={styles.subText}>✂️ {item.services}</Text>
</View>

      {/* RIGHT DONE BUTTON */}
      <TouchableOpacity
        style={styles.doneBtn}
        onPress={() => console.log('Customer Done:', item.id)}
      >
        <Text style={styles.doneText}>Done</Text>
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
          {/* 🔝 Top Right Actions */}
<View style={styles.topBar}>
  <Text style={styles.title}>Customer Queue</Text>

  <View style={styles.actions}>
    <TouchableOpacity
      style={styles.iconBtn}
      onPress={() => navigation.navigate('AddOfflineCustomer')}
    >
      <Ionicons name="add" size={22} color="#000" />
    </TouchableOpacity>

    <TouchableOpacity style={styles.iconBtn}>
      <Ionicons name="notifications-outline" size={20} color="#000" />
    </TouchableOpacity>
  </View>
</View>

          {/* 🔍 Search */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#999" />
            <TextInput
              placeholder="Find customers..."
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

export default SalonDashboard;
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
    // flexDirection: 'row',
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
    color: '#E1B378',
    fontWeight: '500',
  },
  topBar: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 14,
},
title: {
  color: '#fff',
  fontSize: 22,
  fontWeight: '700',
},
actions: {
  flexDirection: 'row',
},
iconBtn: {
  backgroundColor: '#E1B378',
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: 'center',
  justifyContent: 'center',
  marginLeft: 10,
},

subText: {
  color: '#AAA',
  fontSize: 13,
  marginTop: 4,
},

doneBtn: {
  marginTop: 10,
  // backgroundColor: '#4CAF50',
  backgroundColor: '#E1B378',
  paddingVertical: 6,
  borderRadius: 20,
  alignItems: 'center',
  width: 80,
},
doneText: {
  // color: '#fff',
  color: '#000',
  fontSize: 12,
  fontWeight: '600',
},
infoRow: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 12,
},

infoLeft: {
  flex: 1,
  paddingRight: 10,
},



});

