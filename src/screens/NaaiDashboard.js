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
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { communication, getServerUrl } from '../services/communication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BG_IMAGE = require('../assets/salon_page_bg.jpg');

const SCREEN_WIDTH = Dimensions.get('window').width;
const AD_WIDTH = SCREEN_WIDTH - 28;

/* -------------------- ADS -------------------- */
const ADS = [
  require('../assets/naai/ad3.jpg'),
  require('../assets/naai/ad2.jpg'),
  require('../assets/naai/ad3.jpg'),
];

const CITIES = ['All', 'Katol', 'Warud'];

/* -------------------- API DATA CONVERTER -------------------- */
const convertSalonApiData = (apiData = []) => {
  return apiData.map(item => ({
    id: item.salonId,
    name: item.salonName,
    address: `${item.addressLine1}, ${item.city}`,
    location: item.city,

    rating: Number(item.ratingAverage),
    reviews: item.totalReviews,
    phoneNumber: item.phoneNumber,
    open: item.isOpen,
    waitNumber: item.queues?.[0]?.queueNumber ?? '_',
    // waitTime: item.isOpen ? '25 mins' : '—',
    waitTime: item.isOpen ? item.totalWaitTime?.display : 'Closed',

    // image: { uri: item.imageUrl },


    //   image: item.imageUrl
    // ? { uri: item.imageUrl }
    // : require('../assets/my_naai.jpeg'),

    imageUrl: item.imageUrl,
    imagesArray: item.imagesArray || [],


    raw: item,
  }));
};

const NaaiDashboard = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const adRef = useRef(null);
  const [adIndex, setAdIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const [plans, setPlans] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [userName, setUserName] = useState('');



  const userByIdInfo = async () => {
    try {
      // setIsLoading(true);
      const userData = await AsyncStorage.getItem('mynaaiUser');
      const parsedUser = JSON.parse(userData);
      console.log("parsedUser", parsedUser);
      setUserName(parsedUser?.fullName || 'User');

    } catch (error) {
      console.error("User fetch failed:", error);
      Alert.alert(
        'Error',
        error?.response?.data?.message || error.message || 'Something went wrong.'
      );
    }
  };


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

  /* -------- FETCH SALONS -------- */
  const getSalonList = async (pageNo = 1, refresh = false) => {
    if (loading) return;

    setLoading(true);

    try {
      const response = await communication.userSalonList({
        page: pageNo,
        searchString: search,
        // cityFilter: ""
      });
      console.log("response", response);


      if (response?.status === 'SUCCESS') {
        const convertedData = convertSalonApiData(response.data);

        if (refresh) {
          setPlans(convertedData);
        } else {
          setPlans(prev => [...prev, ...convertedData]);
        }

        setHasMore(convertedData.length > 0);
      } else {
        if (refresh) setPlans([]);
        setHasMore(false);
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to fetch salons');
    } finally {
      setLoading(false);
      if (refresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    userByIdInfo()
    getSalonList(1, true);
  }, []);

  const firstName =
    userName?.trim()
      ? userName.trim().split(' ')[0].charAt(0).toUpperCase() +
      userName.trim().split(' ')[0].slice(1).toLowerCase()
      : '';


  const handleLoadMore = () => {
    if (hasMore && !loading && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      getSalonList(nextPage);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    setPage(1);
    getSalonList(1, true);
  };

  const renderFooter = () => {
    if (!loading || refreshing) return null;
    return (
      <ActivityIndicator
        size="large"
        color="#0e0740"
        style={{ marginVertical: 16 }}
      />
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={{ alignItems: 'center', marginTop: 50 }}>
        <Text style={{ fontSize: 16, color: '#888' }}>
          No Salons Available
        </Text>
      </View>
    );
  };

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setShowCityDropdown(false);
      };
    }, [])
  );





  /* -------- SALON CARD -------- */
  const renderSalon = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('SalonDetail', { salonId: item.id })}
    >
      {/* <Image
  source={{ uri: `${getServerUrl()}${item.imageUrl}` }}
  style={styles.image}
/> */}

      <Image
        source={
          item.imagesArray?.length
            ? { uri: `${getServerUrl()}/getfiles/${item.imagesArray[0]}` }
            : item.imageUrl
              ? { uri: `${getServerUrl()}/getfiles/${item.imageUrl}` }
              : require('../assets/my_naai.jpeg')
        }
        style={styles.image}
      />



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
          <TouchableOpacity style={styles.row}>
            <Ionicons name="call-outline" size={18} color="#E1B378" />
            <Text style={styles.linkText}>{item?.phoneNumber}</Text>
          </TouchableOpacity>

          <View style={styles.waitRow}>
            <View style={styles.waitTime}>
              <Ionicons name="time-outline" size={14} color="#E1B378" />
              <Text style={styles.waitText}>{item?.waitTime}</Text>
            </View>

            {item.open && item.queueLength > 0 && (
              <View style={styles.queueBadge}>
                <Text style={styles.queueText}>
                  Queue: {item.queueLength} people
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
            {item?.open ? 'Book Now' : 'Closed'}
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
              <Text style={styles.greeting}>Hi {firstName} 👋</Text>


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

            <FlatList
              data={plans}
              keyExtractor={item => item.id}
              renderItem={renderSalon}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 30 }}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={renderEmpty}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
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

  // image: { width: 100, height: '100%' },
  image: {
    width: 100,
    height: '100%',       // ✅ REQUIRED
    minHeight: 110,       // ✅ SAFETY
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    backgroundColor: '#333', // debug helper
  },

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
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },

  linkText: { color: '#E1B378', marginLeft: 2 },
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
