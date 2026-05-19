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
  // Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { communication, getServerUrl } from '../services/communication';
import { getUserLocation } from '../utilities/getUserLocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CITIES from '../utilities/CitiesArray';
import { wp, hp } from '../utils/AppScreen';

const BG_IMAGE = require('../assets/salon_page_bg.jpg');

// const SCREEN_WIDTH = Dimensions.get('window').width;
const AD_WIDTH = wp(93);

/* -------------------- ADS -------------------- */


// const CITIES = ['All', 'Katol', 'Warud'];

/* -------------------- API DATA CONVERTER -------------------- */
const convertSalonApiData = (apiData = [], userLocation = null) => {
  return apiData.map(item => {
    const distance =
      userLocation &&
      getDistanceInKm(
        userLocation.latitude,
        userLocation.longitude,
        Number(item.latitude),
        Number(item.longitude)
      );

    return {
      id: item.salonId,
      name: item.salonName,
      genderType: item.genderType,
      // address: `${item.addressLine1}, ${item.city}`,
      address: `${item.addressLine1}`,
      location: item.city,
      rating: Number(item.ratingAverage),
      reviews: item.totalReviews,
      phoneNumber: item.phoneNumber,
      open: item.isOpen,
      waitNumber: item.queues?.[0]?.queueNumber ?? '_',
      waitTime: item.isOpen ? item.totalWaitTime?.display : 'Closed',
      imageUrl: item.imageUrl,
      imagesArray: item.imagesArray || [],
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),

      distance: distance !== null && distance !== undefined
        ? Number(distance)
        : null,
      raw: item,
    };
  });
};

const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

  const R = 6371; // Earth radius in KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((R * c).toFixed(1)); // 1 decimal like 2.4 km
};

const getSalonStatus = (businessHours = []) => {
  if (!businessHours.length) {
    return { isOpen: false, text: 'Closed', color: '#F44336' };
  }

  const schedule = businessHours[0];

  const now = new Date();

  const currentDay = now.toLocaleDateString('en-US', {
    weekday: 'long',
  });

  // ✅ Holiday check
  if (schedule.holidayDays?.includes(currentDay)) {
    return { isOpen: false, text: 'Closed (Holiday)', color: '#F44336' };
  }

  const convertToMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const openingMinutes = convertToMinutes(schedule.openingTime);
  const closingMinutes = convertToMinutes(schedule.closingTime);

  const isOpen = currentMinutes >= openingMinutes && currentMinutes < closingMinutes;

  return {
    isOpen,
    text: isOpen ? 'OPEN NOW' : 'CLOSED',
    color: isOpen ? '#4CAF50' : '#F44336',
    openingTime: schedule.openingTime,
    closingTime: schedule.closingTime,
  };
};


const formatTime12Hour = (time) => {
  if (!time) return '';

  const [h, m] = time.split(':');
  let hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';

  hour = hour % 12 || 12;

  return `${hour}:${m} ${ampm}`;
};

const NaaiDashboard = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const adRef = useRef(null);
  const latestRequestRef = useRef(0);
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
  const [userLocation, setUserLocation] = useState(null);



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
    const requestId = ++latestRequestRef.current;
    if (refresh) {
      setLoading(true);
    }

    try {
      const location = await getUserLocation();

      if (location) {
        setUserLocation(location);
      }

      const payload = {
        page: pageNo,
        searchString: search,
        genderType: genderFilter,
      };

      if (location) {
        payload.latitude = location.latitude;
        payload.longitude = location.longitude;
      }

      if (locationFilter !== 'All') {
        payload.cityFilter = locationFilter;
      }

      const response = await communication.userSalonList(payload);
      if (requestId !== latestRequestRef.current) {
        return;
      }
      if (response?.status === 'SUCCESS') {
        const convertedData = convertSalonApiData(response?.data || [], location);

        const sortedData = convertedData.sort((a, b) => {
          // ⭐ 1. Bookmarked salon first
          if (a.id === savedSalonId) return -1;
          if (b.id === savedSalonId) return 1;

          // 📍 2. Then sort by distance
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;

          return a.distance - b.distance;
        });

        if (refresh) {
          setPlans(sortedData);
        } else {
          setPlans(prev => {
            const merged = [...prev, ...sortedData];

            return merged.sort((a, b) => {
              // ⭐ Bookmarked first
              if (a.id === savedSalonId) return -1;
              if (b.id === savedSalonId) return 1;

              // 📍 Distance next
              if (a.distance === null) return 1;
              if (b.distance === null) return -1;

              return a.distance - b.distance;
            });
          });
        }

        const totalPages = response?.pagination?.totalPages || 1;

        setTotalPages(totalPages);
        setHasMore(pageNo < totalPages);
      } else {
        if (refresh) setPlans([]);
        setHasMore(false);
      }

    } catch (error) {
      Alert.alert('Error', 'Failed to fetch salons');
    } finally {
      if (requestId === latestRequestRef.current) {
        setLoading(false);

        if (refresh) {
          setRefreshing(false);
        }
      }
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
    console.log("salonId", salonId);

    if (savingSalonId) return;

    try {
      setSavingSalonId(salonId);
      if (savedSalonId && savedSalonId !== salonId) {
        Alert.alert(
          "Bookmark Exists",
          "Please remove previous bookmarked salon first."
        );
        return;
      }

      const response = await communication.toggleSaveSalon({ salonId });

      if (response?.status === "SUCCESS") {

        const msg = response?.message?.toLowerCase();

        const isNowBookmarked = msg?.includes("save") && !msg?.includes("unsave");

        if (isNowBookmarked) {
          setSavedSalonId(salonId);
          // Alert.alert("Salon bookmarked successfully");
        } else {
          setSavedSalonId(null);
          // Alert.alert("Bookmark removed successfully");
        }

        // ✅ Refresh list properly
        setPlans([]);
        setPage(1);
        setHasMore(true);
        getSalonList(1, true);

      } else {
        Alert.alert("Error", "Failed to update bookmark");
      }

    } catch (error) {
      // Alert.alert("Error", "Something went wrong");
      console.log("Error", error);
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
        <Ionicons
          name="cut-outline"
          size={wp(10)}
          color="#777"
        />
        <Text allowFontScaling={false} style={{ color: '#aaa', marginTop: 10, fontSize: 14 }}>
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
  const renderSalon = ({ item }) => {

    const distance =
      userLocation &&
      getDistanceInKm(
        userLocation.latitude,
        userLocation.longitude,
        item.latitude,
        item.longitude
      );

    const status = getSalonStatus(item.raw?.businessHours);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('SalonDetail', { salonId: item.id })
        }
      >

        <View style={styles.imageContainer}>
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

          {distance !== null && distance !== undefined && (
            <View style={styles.distanceBadge}>
              <Text allowFontScaling={false} style={styles.distanceBadgeText}>{distance} KM</Text>
            </View>
          )}
        </View>



        <View style={styles.cardContent}>
          <View style={{ flex: 1 }}>
            <Text allowFontScaling={false} style={styles.genderName}>{item?.genderType}</Text>
            <Text allowFontScaling={false} style={styles.name} numberOfLines={2}
              ellipsizeMode="tail">{item?.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              {/* <Ionicons
    name="time-outline"
    size={14}
    color={status.color}
  /> */}

              {/* <Text allowFontScaling={false}style={{ color: status.color, marginLeft: 4, fontSize: 12, fontWeight: '700' }}>
    {status.text}
  </Text> */}

              {/* {status.openingTime && (
                <Text allowFontScaling={false}style={{ color: '#aaa', fontSize: 12 }}>
                  (
                  {formatTime12Hour(status.openingTime)} - {formatTime12Hour(status.closingTime)}
                  )
                </Text>
              )} */}
            </View>
            {/* {distance !== null && (
              <View style={styles.row}>
                <Ionicons name="location-outline" size={14} color="#E1B378" />
                <Text allowFontScaling={false}style={styles.distanceText}>
                  {distance} KM
                </Text>
              </View>
            )} */}
            {/* <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#E1B378" />
            <Text allowFontScaling={false}style={styles.ratingText}>
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
              {/* <Ionicons name="location-outline" size={18} color="#E1B378" /> */}
              <Text allowFontScaling={false} style={styles.linkText} numberOfLines={2}
                ellipsizeMode="tail" >{item.address}</Text>
              {/* <Ionicons name="open-outline" size={14} color="#AAA" style={{ marginLeft: 4 }} /> */}
            </TouchableOpacity>
            {/* <Text allowFontScaling={false}style={styles.address}>{item.address}</Text> */}
            {/* <TouchableOpacity style={styles.row}
              onPress={() => Linking.openURL(`tel:${item?.phoneNumber}`)}
            >
              <Ionicons name="call-outline" size={18} color="#E1B378" />
              <Text allowFontScaling={false}style={styles.linkText}>{item?.phoneNumber}</Text>
            </TouchableOpacity> */}




            {/* <View style={styles.waitRow}>
              {item?.open &&

                <View style={styles.waitTime}>

                  <Ionicons name="time-outline" size={14} color="#E1B378" />
                  <Text allowFontScaling={false}style={styles.waitText}>{item?.waitTime}</Text>
                  <Text allowFontScaling={false}style={styles.queueText}>
                    Queue: {item?.raw?.queueLength} people
                  </Text>

                </View>
              }

            </View> */}

          </View>
          <TouchableOpacity
            onPress={() => toggleSaveSalon(item.id)}
            style={{ position: 'absolute', top: 8, right: 8 }}
            disabled={savingSalonId === item.id}
          >
            {/* {savingSalonId === item.id ? (
            <ActivityIndicator size="small" color="#E1B378" />
          ) 
          :
          ( */}
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
            {/* )
          } */}
          </TouchableOpacity>


          <TouchableOpacity
            style={[
              styles.bookBtn,
              { backgroundColor: status.isOpen ? '#E1B378' : '#555' },
            ]}
            disabled={!status.isOpen}
            onPress={() => navigation.navigate('SalonDetail', { salonId: item.id })}

          >
            <Text allowFontScaling={false} style={styles.bookText}>
              {status.isOpen
                ? 'Book Now'
                : status.text === 'Closed (Holiday)'
                  ? 'Holiday'
                  : 'Closed'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )
  };
  const renderAdsSlider = () => (
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
  );
  return (
    <ImageBackground source={BG_IMAGE} style={styles.bg}>
      <View style={styles.overlay}>
        <SafeAreaView
          style={[
            styles.container,
            { paddingBottom: insets.bottom }
          ]}
          edges={['top', 'bottom', 'left', 'right']}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={() => showCityDropdown && setShowCityDropdown(false)}
          >
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Text allowFontScaling={false} style={styles.greeting}>Hi {firstName} 👋</Text>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>

                {/* Gender Toggle */}
                <View style={styles.genderToggle}>
                  <TouchableOpacity
                    disabled={loading}
                    style={[
                      styles.genderBtn,
                      genderFilter === 'male' && styles.activeGenderBtn
                    ]}
                    onPress={() => setGenderFilter('male')}
                  >
                    <Text allowFontScaling={false} style={[
                      styles.genderText,
                      genderFilter === 'male' && styles.activeGenderText
                    ]}>
                      Male
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={loading}
                    style={[
                      styles.genderBtn,
                      genderFilter === 'female' && styles.activeGenderBtn
                    ]}
                    onPress={() => setGenderFilter('female')}
                  >
                    <Text allowFontScaling={false} style={[
                      styles.genderText,
                      genderFilter === 'female' && styles.activeGenderText
                    ]}>
                      Female
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() =>
                    navigation.navigate('UserNotifications')
                  }
                >
                  <Ionicons
                    name="notifications-outline"
                    size={wp(5)}
                    color="#000"
                  />


                  {/* {notificationCount > 0 && (
                  <View style={styles.badge}>
                    <Text allowFontScaling={false}style={styles.badgeText}>{notificationCount}</Text>
                  </View>
                )} */}
                </TouchableOpacity>
                {/* City Dropdown */}
                {/* <View style={{ position: 'relative', zIndex: 20 }}>
                  <TouchableOpacity
                    style={styles.dropdownBtn}
                    onPress={() => setShowCityDropdown(!showCityDropdown)}
                  >
                    <Ionicons name="location-outline" size={16} color="#000" />
                    <Text allowFontScaling={false}style={styles.dropdownText}>{locationFilter}</Text>
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
                          <Text allowFontScaling={false}
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
                </View> */}

              </View>
            </View>

            {/* <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#999" />
              <TextInput allowFontScaling={false}
                placeholder="Find salon, specialists..."
                placeholderTextColor="#999"
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
              />
            </View> */}

            {/* <Pressable
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

            </Pressable> */}

            <FlatList
              data={plans}
              keyExtractor={(item, index) => `${item.id}_${index}`}
              renderItem={renderSalon}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: insets.bottom + 120,
                flexGrow: 1,
              }}

              ListHeaderComponent={
                <>
                  <View style={styles.searchBox}>
                    <Ionicons
                      name="search"
                      size={wp(4.5)}
                      color="#999"
                    />


                    <TextInput allowFontScaling={false}
                      placeholder="Find salon, specialists..."
                      placeholderTextColor="#999"
                      style={styles.searchInput}
                      value={search}
                      onChangeText={setSearch}
                    />
                  </View>

                  {renderAdsSlider()}
                </>
              }

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
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
  },

  greeting: {
    fontSize: wp(6),
    fontWeight: '700',
    color: '#fff',
    marginBottom: hp(1),
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E1B378',
    paddingHorizontal: wp(1),
    paddingVertical: hp(0.8),
    borderRadius: wp(5),
    gap: wp(1.5),
  },

  dropdownText: {
    color: '#000',
    fontWeight: '700',
    fontSize: wp(3.2),
  },

  dropdownList: {
    position: 'absolute',
    top: hp(5),
    right: 0,
    backgroundColor: '#1E1E1E',
    borderRadius: wp(4),
    width: wp(35),
    paddingVertical: hp(1),
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },

  dropdownItem: {
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(3.5),
  },

  dropdownItemText: {
    color: '#AAA',
    fontSize: wp(3.2),
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
    borderRadius: wp(4),
    paddingHorizontal: wp(4),
    height: hp(6),
    marginBottom: hp(1.5),
    marginTop: hp(1),
  },

  searchInput: {
    flex: 1,
    marginLeft: wp(3),
    color: '#fff',
    fontSize: wp(3.8),
  },

  adSlider: { marginBottom: 6 },
  adImage: {
    width: AD_WIDTH,
    height: hp(23),
    borderRadius: wp(4),
  },

  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },

  dot: {
    width: wp(2),
    height: wp(2),
    borderRadius: wp(1),
    backgroundColor: '#555',
    marginHorizontal: wp(1),
  },

  activeDot: {
    backgroundColor: '#E1B378',
    width: wp(5),
  },


  card: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: wp(4),
    marginBottom: hp(2),
    overflow: 'hidden',
  },

  image: {
    width: wp(30),
    height: '100%',
    minHeight: hp(14),
    backgroundColor: '#333',
  },

  cardContent: {
    flex: 1,
    flexDirection: 'row',
    padding: wp(3),
    alignItems: 'center',
  },

  name: {
    color: '#fff',
    fontSize: wp(4),
    fontWeight: '700',
  },

  genderName: {
    color: '#bcb3b3c0',
    fontSize: wp(3.2),
    fontWeight: '500',
    letterSpacing: 1,
    marginBottom: hp(0.6),
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },

  ratingText: {
    color: '#E1B378',
    fontSize: wp(3),
    marginLeft: wp(1),
  },

  address: { color: '#AAA', fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 0 },

  linkText: {
    color: '#E1B378',
    fontSize: wp(3.4),
    textTransform: 'capitalize',
    marginLeft: wp(2),
  },
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
    fontSize: wp(3),
    color: '#E1B378',
    fontWeight: '600',
  },

  queueText: {
    fontSize: wp(3),
    color: '#E1B378',
    fontWeight: '600',
    marginLeft: wp(1),
  },



  bookBtn: {
    paddingVertical: hp(0.7),
    paddingHorizontal: wp(3),
    borderRadius: wp(6),
    marginLeft: wp(2),
  },

  bookText: {
    fontSize: wp(3),
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
    borderRadius: wp(6),
    padding: wp(1),
  },
  activeGenderBtn: {
    backgroundColor: '#E1B378',
    borderRadius: wp(4),
  },
  genderBtn: {
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
    borderRadius: wp(4),
  },

  iconBtn: {
    backgroundColor: '#E1B378',
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: wp(2),
  },

  genderText: {
    fontSize: wp(3),
    fontWeight: '700',
    color: '#AAA',
  },

  activeGenderText: {
    color: '#000',
  },

  distanceText: {
    color: '#E1B378',
    fontSize: wp(3),
    fontWeight: '600',
  },

  imageContainer: {
    maxHeight: hp(18),
    position: 'relative',
  },

  distanceBadge: {
    position: 'absolute',
    bottom: hp(1),
    left: 0,
    backgroundColor: '#fff',
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.5),
    borderRadius: wp(2.5),
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },

  distanceBadgeText: {
    fontSize: wp(3),
    fontWeight: '700',
    color: '#000',
  },

});
