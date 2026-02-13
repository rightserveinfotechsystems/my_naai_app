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
import { getUserLocation } from '../utilities/getUserLocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CITIES from '../utilities/CitiesArray';


const BG_IMAGE = require('../assets/salon_page_bg.jpg');

const SCREEN_WIDTH = Dimensions.get('window').width;
const AD_WIDTH = SCREEN_WIDTH - 28;

/* -------------------- ADS -------------------- */


// const CITIES = ['All', 'Katol', 'Warud'];

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
    imageUrl: item.imageUrl,
    imagesArray: item.imagesArray || [],
    latitude: Number(item.latitude),
    longitude: Number(item.longitude),

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
  const [totalPages, setTotalPages] = useState(1);
  const [ads, setAds] = useState([]);
  const [genderFilter, setGenderFilter] = useState('male');

  const [savedSalonId, setSavedSalonId] = useState(null);
  const [savingSalonId, setSavingSalonId] = useState(null);




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
    if (paused || ads.length === 0) return;

    const timer = setInterval(() => {
      const next = (adIndex + 1) % ads.length;
      setAdIndex(next);
      adRef.current?.scrollToIndex({ index: next, animated: true });
    }, 3000);

    return () => clearInterval(timer);
  }, [adIndex, paused, ads]);

  /* -------- FETCH SALONS -------- */
  const getSalonList = async (pageNo = 1, refresh = false) => {
    if (loading) return;

    setLoading(true);

    try {
      const location = await getUserLocation();

      const payload = {
        page: pageNo,
        searchString: search,
        genderType: genderFilter,
      };

      // ✅ Add location ONLY if available
      if (location) {
        payload.latitude = location.latitude;
        payload.longitude = location.longitude;
      }

      if (locationFilter !== 'All') {
        payload.cityFilter = locationFilter;
      }

      const response = await communication.userSalonList(payload);

      if (response?.status === 'SUCCESS') {
        console.log("userSalonList response", response);

        const convertedData = convertSalonApiData(response.data);
        const pagination = response.pagination;

        if (refresh) {
          setPlans(convertedData);
        } else {
          setPlans(prev => [...prev, ...convertedData]);
        }

        setTotalPages(pagination?.totalPages || 1);
        setHasMore(pageNo < (pagination?.totalPages || 1));
      } else {
        if (refresh) setPlans([]);
        setHasMore(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch salons');
    } finally {
      setLoading(false);
      if (refresh) setRefreshing(false);
    }
  };

  // ads
  const userAds = async () => {
    try {
      const response = await communication.userAds();

      if (response?.status === 'SUCCESS') {
        setAds(response.data?.images || []); // 👈 IMPORTANT
      } else {
        setAds([]);
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to fetch Ads');
      setAds([]);
    }
  };


  const toggleSaveSalon = async (salonId) => {
    if (savingSalonId) return;

    try {
      setSavingSalonId(salonId);

      // ✅ If clicking same saved salon → REMOVE
      if (savedSalonId === salonId) {

        const response = await communication.removeSalon({
          salonId: salonId,
        });

        if (response?.status === 'SUCCESS') {
          setSavedSalonId(null);
          Alert.alert('Removed from bookmark');
          getSalonList(1, true); // refresh list to reorder
        } else {
          Alert.alert('Error', 'Failed to remove bookmark');
        }

        return;
      }

      // ✅ If another salon already saved → block
      if (savedSalonId && savedSalonId !== salonId) {
        Alert.alert(
          'Bookmark Exists',
          'Please remove previous bookmarked salon first.'
        );
        return;
      }

      // ✅ If no salon saved → ADD
      const response = await communication.saveSalon({
        salonId: salonId,
      });

      if (response?.status === 'SUCCESS') {
        setSavedSalonId(salonId);
        Alert.alert('Salon bookmarked successfully');
        getSalonList(1, true); // refresh to move it to top
      } else {
        Alert.alert('Error', 'Failed to bookmark salon');
      }

    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setSavingSalonId(null);
    }
  };




  useEffect(() => {
    userByIdInfo()
    userAds()
  }, []);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    getSalonList(1, true);
  }, [locationFilter]);


  useEffect(() => {
    setPlans([]);
    setPage(1);
    setHasMore(true);

    getSalonList(1, true);
  }, [genderFilter]);

  useEffect(() => {
    const delay = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      getSalonList(1, true);
    }, 500);

    return () => clearTimeout(delay);
  }, [search]);


  const firstName =
    userName?.trim()
      ? userName.trim().split(' ')[0].charAt(0).toUpperCase() +
      userName.trim().split(' ')[0].slice(1).toLowerCase()
      : '';


  const handleLoadMore = () => {
    if (loading || refreshing || !hasMore) return;

    const nextPage = page + 1;

    if (nextPage <= totalPages) {
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
    if (!loading || refreshing || !hasMore) return null;

    return (
      <ActivityIndicator
        size="large"
        color="#E1B378"
        style={{ marginVertical: 20 }}
      />
    );
  };

  // const openMap = () => {
  //     if (!convertedData.latitude || !convertedData.longitude) {
  //       Alert.alert('Location not available');
  //       return;
  //     }

  //     Linking.openURL(
  //       `https://www.google.com/maps/search/?api=1&query=${convertedData.latitude},${convertedData.longitude}`
  //     );
  //   };

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={{ alignItems: 'center', marginTop: 60 }}>
        <Ionicons name="cut-outline" size={40} color="#777" />
        <Text style={{ color: '#aaa', marginTop: 10, fontSize: 14 }}>
          No salons available
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

      <Image
        source={
          item.imagesArray?.length
            ? { uri: `${getServerUrl()}/getfiles/${item.imagesArray[0]}` }
            : item.imageUrl
              ? { uri: `${getServerUrl()}/getfiles/${item.imageUrl}` }
              : require('../assets/myNaai.jpeg')
        }
        style={styles.image}
      />



      <View style={styles.cardContent}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>

          {/* <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#E1B378" />
            <Text style={styles.ratingText}>
              {item.rating} ({item.reviews})
            </Text>
          </View> */}
          {/* LOCATION */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              if (!item.latitude || !item.longitude) {
                Alert.alert('Location not available');
                return;
              }

              Linking.openURL(
                `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`
              );
            }}
          >
            <Ionicons name="location-outline" size={18} color="#E1B378" />
            <Text style={styles.linkText}>{item.address}</Text>
            {/* <Ionicons name="open-outline" size={14} color="#AAA" style={{ marginLeft: 4 }} /> */}
          </TouchableOpacity>
          {/* <Text style={styles.address}>{item.address}</Text> */}
          <TouchableOpacity style={styles.row}
            onPress={() => Linking.openURL(`tel:${item?.phoneNumber}`)}
          >
            <Ionicons name="call-outline" size={18} color="#E1B378" />
            <Text style={styles.linkText}>{item?.phoneNumber}</Text>
          </TouchableOpacity>




          <View style={styles.waitRow}>
            <View style={styles.waitTime}>
              <Ionicons name="time-outline" size={14} color="#E1B378" />
              <Text style={styles.waitText}>{item?.waitTime}</Text>
              {item?.open &&
                <Text style={styles.queueText}>
                  Queue: {item?.raw?.queueLength} people
                </Text>}
            </View>
          </View>

        </View>
        <TouchableOpacity
          onPress={() => toggleSaveSalon(item.id)}
          style={{ position: 'absolute', top: 8, right: 8 }}
          disabled={savingSalonId === item.id}
        >
          {savingSalonId === item.id ? (
            <ActivityIndicator size="small" color="#E1B378" />
          ) : (
            <Ionicons
              name={
                savedSalonId === item.id
                  ? 'bookmark'
                  : 'bookmark-outline'
              }
              size={22}
              color={
                savedSalonId === item.id
                  ? '#E1B378'
                  : '#AAA'
              }
            />
          )}
        </TouchableOpacity>


        <TouchableOpacity
          style={[
            styles.bookBtn,
            { backgroundColor: item.open ? '#E1B378' : '#555' },
          ]}
          disabled={!item.open}
          onPress={() => navigation.navigate('SalonDetail', { salonId: item.id })}

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
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Text style={styles.greeting}>Hi {firstName} 👋</Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>

                {/* Gender Toggle */}
                <View style={styles.genderToggle}>
                  <TouchableOpacity
                    style={[
                      styles.genderBtn,
                      genderFilter === 'male' && styles.activeGenderBtn
                    ]}
                    onPress={() => setGenderFilter('male')}
                  >
                    <Text style={[
                      styles.genderText,
                      genderFilter === 'male' && styles.activeGenderText
                    ]}>
                      Male
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.genderBtn,
                      genderFilter === 'female' && styles.activeGenderBtn
                    ]}
                    onPress={() => setGenderFilter('female')}
                  >
                    <Text style={[
                      styles.genderText,
                      genderFilter === 'female' && styles.activeGenderText
                    ]}>
                      Female
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* City Dropdown */}
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
                data={ads}
                horizontal
                pagingEnabled
                snapToInterval={AD_WIDTH}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => index.toString()}
                style={styles.adSlider}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: `${getServerUrl()}/getfiles/${item}` }}
                    style={styles.adImage}
                  />
                )}
              />


              <View style={styles.dotsContainer}>
                {ads.map((_, i) => (
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
    paddingHorizontal: 4,
    paddingVertical: 6,
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
  waitRow: {
    marginTop: 6,
  },

  // waitTime: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   flexWrap: 'wrap',      
  //   gap: 8,               
  // },
  waitText: {
    fontSize: 12,
    color: '#E1B378',
    fontWeight: '600',
  },
  queueText: {
    fontSize: 12,
    color: '#E1B378',
    fontWeight: '600',
    marginLeft: 5,
  },

  bookBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
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

  // queueText: {
  //   color: '#dfdbdbff',
  //   fontSize: 12,
  //   fontWeight: '700',
  // },

  genderToggle: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 3,
  },

  genderBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },

  activeGenderBtn: {
    backgroundColor: '#E1B378',
  },

  genderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#AAA',
  },

  activeGenderText: {
    color: '#000',
  },

});
