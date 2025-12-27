import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const BG_IMAGE = require('../assets/salon_page_bg.jpg');

const SCREEN_WIDTH = Dimensions.get('window').width;
const AD_WIDTH = SCREEN_WIDTH - 28;

/* -------------------- ADS -------------------- */
const ADS = [
  require('../assets/naai/ad3.jpg'),
  require('../assets/naai/ad2.jpg'),
  require('../assets/naai/ad3.jpg'),
];

/* -------------------- SALONS -------------------- */
const SALONS = [
  {
    id: '1',
    name: 'Brett Gomez Salon',
    address: 'Katol Road, Katol',
    location: 'Katol',
    waitTime: '25 mins',
    waitNumber: '8',
    rating: 4.6,
    reviews: 120,
    open: true,

    phone: '9876543210',
    latitude: 21.1458,
    longitude: 79.0882,

    image: require('../assets/naai/naai1.jpg'),
    images: [
      require('../assets/naai/naai1.jpg'),
      require('../assets/naai/naai2.jpeg'),
      require('../assets/naai/naai3.jpg'),
    ],
  },

  {
    id: '2',
    name: 'Gimabel Hair Style',
    address: 'Main Chowk, Warud',
    location: 'Warud',
    waitTime: '40 mins',
    waitNumber: '7',
    rating: 4.2,
    reviews: 85,
    open: true,

    phone: '9123456780',
    latitude: 21.4642,
    longitude: 78.9275,

    image: require('../assets/naai/naai2.jpeg'),
    images: [
      require('../assets/naai/naai2.jpeg'),
      require('../assets/naai/naai1.jpg'),
    ],
  },
  {
    id: '3',
    name: 'Kobike Barber Shop',
    address: 'Main Chowk, Katol',
    location: 'Katol',
    waitTime: '—',
    waitNumber: '_',
    rating: 3.9,
    reviews: 42,
    open: false,

    phone: '9000000000',
    latitude: 21.1500,
    longitude: 79.0900,

    image: require('../assets/naai/naai3.jpg'),
    images: [
      require('../assets/naai/naai3.jpg'),
    ],
  },
];

const CITIES = ['All', 'Katol', 'Warud'];

const NaaiDashboard = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const adRef = useRef(null);
  const [adIndex, setAdIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  /* -------- AUTO SLIDE -------- */
  useEffect(() => {
    if (paused) return;

    const timer = setInterval(() => {
      const next = (adIndex + 1) % ADS.length;
      setAdIndex(next);
      adRef.current?.scrollToIndex({ index: next, animated: true });
    }, 3000);

    return () => clearInterval(timer);
  }, [adIndex, paused]);

  /* -------- FILTER -------- */
  const filteredSalons = SALONS.filter(salon => {
    const matchSearch = salon.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchLocation =
      locationFilter === 'All' || salon.location === locationFilter;

    return matchSearch && matchLocation;
  });

  useFocusEffect(
    React.useCallback(() => {
      // Screen is focused → do nothing
      return () => {
        // Screen is blurred (navigating away)
        setShowCityDropdown(false);
      };
    }, [])
  );

  /* -------- SALON CARD -------- */
  const renderSalon = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('SalonDetail', { salon: item })}
    >
      <Image source={item.image} style={styles.image} />

      <View style={styles.cardContent}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#E1B378" />
            <Text style={styles.ratingText}>
              {item.rating} ({item.reviews})
            </Text>
          </View>

          <Text style={styles.address}>{item.address}</Text>

          <View style={styles.waitRow}>
            <View style={styles.waitTime}>

              <Ionicons name="time-outline" size={14} color="#E1B378" />
              <Text style={styles.waitText}>
                {item.open ? ` ${item.waitTime}` : ' Closed'}
              </Text>
            </View>


            {item.open && item.waitNumber !== '_' && (
              <View style={styles.queueBadge}>
                <Text style={styles.queueText}>
                  Queue: {item.waitNumber} people
                </Text>
              </View>
            )}

          </View>

        </View>

        <TouchableOpacity
          style={[
            styles.bookBtn,
            { backgroundColor: item.open ? '#E1B378' : '#555' },
          ]}
          disabled={!item.open}
        >
          <Text style={styles.bookText}>
            {item.open ? 'Book Now' : 'Closed'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <ImageBackground source={BG_IMAGE} style={styles.bg}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <Pressable
            style={{ flex: 1 }}
            onPress={() => showCityDropdown && setShowCityDropdown(false)}
          >

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.greeting}>Hi Jackson 👋</Text>

              {/* INLINE DROPDOWN */}
              {/* <View style={{ marginBottom: 12 }}> */}
              <View style={{ position: 'relative', zIndex: 20 }}>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => setShowCityDropdown(!showCityDropdown)}
                >
                  <Ionicons name="location-outline" size={16} color="#000" />
                  <Text style={styles.dropdownText}>{locationFilter}</Text>
                  <Ionicons
                    name={showCityDropdown ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#000"
                  />
                </TouchableOpacity>

                {showCityDropdown && (
                  <View style={styles.dropdownList}>
                    {CITIES.map(city => (
                      <TouchableOpacity
                        key={city}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setLocationFilter(city);
                          setShowCityDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            locationFilter === city &&
                            styles.activeDropdownText,
                          ]}
                        >
                          {city}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>


            {/* SEARCH */}
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

            {/* ADS */}
            <Pressable
              onPressIn={() => setPaused(true)}
              onPressOut={() => setPaused(false)}
            >
              <FlatList
                ref={adRef}
                data={ADS}
                horizontal
                pagingEnabled
                snapToInterval={AD_WIDTH}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => i.toString()}
                style={styles.adSlider}
                renderItem={({ item }) => (
                  <Image source={item} style={styles.adImage} />
                )}
              />

              <View style={styles.dotsContainer}>
                {ADS.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.dot, adIndex === i && styles.activeDot]}
                  />
                ))}
              </View>
            </Pressable>

            {/* SALONS */}
            <FlatList
              data={filteredSalons}
              keyExtractor={item => item.id}
              renderItem={renderSalon}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 30 }}
            />
          </Pressable>

        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

export default NaaiDashboard;

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)' },
  container: { flex: 1, paddingHorizontal: 14 },

  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
  },

  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E1B378',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },

  dropdownText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 13,
  },

  // dropdownList: {
  //   marginTop: 6,
  //   backgroundColor: '#1E1E1E',
  //   borderRadius: 14,
  //   width: 140,
  //   paddingVertical: 6,
  // },
  dropdownList: {
    position: 'absolute',
    top: 42,              // dropdown opens BELOW button
    right: 0,             // align with button (since it's on right side)
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    width: 140,
    paddingVertical: 6,
    elevation: 10,        // Android shadow
    shadowColor: '#000',  // iOS shadow
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },

  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  dropdownItemText: {
    color: '#AAA',
    fontSize: 13,
    fontWeight: '600',
  },

  activeDropdownText: {
    color: '#E1B378',
    fontWeight: '800',
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 14,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#fff',
    fontSize: 15,
  },

  adSlider: { marginBottom: 6 },
  adImage: {
    width: AD_WIDTH,
    height: 140,
    borderRadius: 16,
  },

  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#555',
    marginHorizontal: 4,
  },

  activeDot: {
    backgroundColor: '#E1B378',
    width: 18,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },

  image: { width: 100, height: '100%' },

  cardContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },

  name: { color: '#fff', fontSize: 16, fontWeight: '700' },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },

  ratingText: {
    color: '#E1B378',
    fontSize: 12,
    marginLeft: 4,
  },

  address: { color: '#AAA', fontSize: 12 },

  waitRow: { marginTop: 4 },
  waitText: { fontSize: 12, color: '#E1B378' },

  bookBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginLeft: 10,
  },

  bookText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  waitTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  queueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  queueText: {
    color: '#dfdbdbff',
    fontSize: 12,
    fontWeight: '700',
  },


});
