import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { communication, getServerUrl } from '../services/communication';
import { getUserLocation } from '../utilities/getUserLocation';
import { wp, hp } from '../utils/AppScreen';

const BG_IMAGE = require('../assets/salon_page_bg.png');
const AD_WIDTH = wp(93);

const CACHE_KEYS = {
  SALONS: 'CACHE_USER_SALONS',
  ADS: 'CACHE_USER_ADS',
  USER_INFO: 'CACHE_USER_INFO',
};

/* -------------------- IST TIMEZONE OPEN/CLOSED CALCULATOR -------------------- */
const getSalonStatus = (businessHours = []) => {
  if (!businessHours || !businessHours.length) {
    return { isOpen: false, text: 'CLOSED', color: '#F44336' };
  }

  const schedule = businessHours[0];
  if (!schedule) {
    return { isOpen: false, text: 'CLOSED', color: '#F44336' };
  }

  /* 🎯 Calculate Indian Standard Time (IST = UTC + 5:30) */
  const utcNow = Date.now();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  
  // Create IST Date object independent of device timezone
  const systemOffsetMs = new Date().getTimezoneOffset() * 60000;
  const istDate = new Date(utcNow + systemOffsetMs + istOffsetMs);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = daysOfWeek[istDate.getDay()];

  // 1. Check Holiday Days
  if (schedule.holidayDays && Array.isArray(schedule.holidayDays) && schedule.holidayDays.includes(currentDay)) {
    return { isOpen: false, text: 'CLOSED (HOLIDAY)', color: '#F44336' };
  }

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.split(':');
    if (parts.length < 2) return 0;
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };

  const currentMinutes = istDate.getHours() * 60 + istDate.getMinutes();
  const openMinutes = parseTimeToMinutes(schedule.openingTime);
  const closeMinutes = parseTimeToMinutes(schedule.closingTime);

  let isOpen = false;

  if (closeMinutes > openMinutes) {
    // Normal operating hours (e.g. 09:00 to 21:00)
    isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } else if (closeMinutes < openMinutes) {
    // Overnight operating hours (e.g. 20:00 to 02:00)
    isOpen = currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }

  return {
    isOpen,
    text: isOpen ? 'OPEN NOW' : 'CLOSED',
    color: isOpen ? '#4CAF50' : '#F44336',
  };
};

/* -------------------- DISTANCE UTILITY -------------------- */
const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

  const R = 6371; // Earth radius in KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
};

/* -------------------- API CONVERTER -------------------- */
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

    // Calculate IST open status dynamically
    const status = getSalonStatus(item.businessHours);

    return {
      id: item.salonId,
      name: item.salonName || '',
      genderType: item.genderType || '',
      address: item.addressLine1 || '',
      location: item.city || '',
      rating: Number(item.ratingAverage || 0),
      reviews: item.totalReviews || 0,
      phoneNumber: item.phoneNumber || '',
      isOpen: status.isOpen,
      statusText: status.text,
      statusColor: status.color,
      waitTime: status.isOpen ? item.totalWaitTime?.display : 'Closed',
      imageUrl: item.imageUrl,
      imagesArray: item.imagesArray || [],
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      distance: distance !== null && distance !== undefined ? Number(distance) : null,
      raw: item,
    };
  });
};

/* -------------------- MEMOIZED SALON CARD -------------------- */
const SalonCard = React.memo(
  ({ item, isSaved, isSaving, userLocation, onSelect, onBookmark }) => {
    const distance = useMemo(() => {
      if (!userLocation) return item.distance;
      return getDistanceInKm(
        userLocation.latitude,
        userLocation.longitude,
        item.latitude,
        item.longitude
      );
    }, [userLocation, item.latitude, item.longitude, item.distance]);

    const handleLocationPress = useCallback(() => {
      if (!item.latitude || !item.longitude) {
        Alert.alert('Location unavailable', 'Coordinates for this salon are missing.');
        return;
      }
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`
      );
    }, [item.latitude, item.longitude]);

    const imageSource = useMemo(() => {
      if (item.imagesArray && item.imagesArray.length > 0) {
        return { uri: `${getServerUrl()}/getfiles/${item.imagesArray[0]}` };
      }
      if (item.imageUrl) {
        return { uri: `${getServerUrl()}/getfiles/${item.imageUrl}` };
      }
      return require('../assets/myNaai.jpeg');
    }, [item.imagesArray, item.imageUrl]);

    return (
      <TouchableOpacity style={styles.card} onPress={() => onSelect(item.id)}>
        <View style={styles.imageContainer}>
          <Image source={imageSource} style={styles.image} />
          {distance !== null && distance !== undefined && (
            <View style={styles.distanceBadge}>
              <Text allowFontScaling={false} style={styles.distanceBadgeText}>
                {distance} KM
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <View style={{ flex: 1 }}>
            <Text allowFontScaling={false} style={styles.genderName}>
              {item.genderType}
            </Text>
            <Text
              allowFontScaling={false}
              style={styles.name}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.name}
            </Text>

            <TouchableOpacity style={styles.row} onPress={handleLocationPress}>
              <Text
                allowFontScaling={false}
                style={styles.linkText}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.address}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => onBookmark(item.id)}
            style={styles.bookmarkBtn}
            disabled={isSaving}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={isSaved ? '#E1B378' : '#AAA'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.bookBtn,
              { backgroundColor: item.isOpen ? '#E1B378' : '#555' },
            ]}
            disabled={!item.isOpen}
            onPress={() => onSelect(item.id)}
          >
            <Text allowFontScaling={false} style={styles.bookText}>
              {item.isOpen
                ? 'Book Now'
                : item.statusText === 'CLOSED (HOLIDAY)'
                ? 'Holiday'
                : 'Closed'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }
);

/* -------------------- MAIN DASHBOARD COMPONENT -------------------- */
const NaaiDashboard = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [locationFilter] = useState('All');

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

  /* -------- RECURRING VISIT CACHE LOADER -------- */
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const [cachedSalons, cachedAds, cachedUser] = await Promise.all([
          AsyncStorage.getItem(CACHE_KEYS.SALONS),
          AsyncStorage.getItem(CACHE_KEYS.ADS),
          AsyncStorage.getItem(CACHE_KEYS.USER_INFO),
        ]);

        if (cachedSalons) setPlans(JSON.parse(cachedSalons));
        if (cachedAds) setAds(JSON.parse(cachedAds));
        if (cachedUser) {
          const parsed = JSON.parse(cachedUser);
          setUserName(parsed?.fullName || 'User');
        }
      } catch (err) {
        // Silent error catching for caching failures
      }
    };

    loadCachedData();
    userByIdInfo();
    userAds();
  }, []);

  const userByIdInfo = async () => {
    try {
      const userData = await AsyncStorage.getItem('mynaaiUser');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUserName(parsedUser?.fullName || 'User');
        await AsyncStorage.setItem(CACHE_KEYS.USER_INFO, userData);
      }
    } catch (error) {
      // Handle user info fetch silently
    }
  };

  /* -------- AUTO SLIDE ADS -------- */
  useEffect(() => {
    if (paused || ads.length <= 1) return;

    const timer = setInterval(() => {
      const next = (adIndex + 1) % ads.length;
      setAdIndex(next);
      adRef.current?.scrollToIndex({ index: next, animated: true });
    }, 3000);

    return () => clearInterval(timer);
  }, [adIndex, paused, ads]);

  /* -------- FETCH SALONS -------- */
  const getSalonList = useCallback(
    async (pageNo = 1, refresh = false) => {
      const requestId = ++latestRequestRef.current;

      if (refresh) setLoading(true);

      try {
        const location = await getUserLocation();
        if (location) setUserLocation(location);

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

        if (requestId !== latestRequestRef.current) return;

        if (response?.status === 'SUCCESS') {
          const convertedData = convertSalonApiData(response?.data || [], location);

          const sortedData = convertedData.sort((a, b) => {
            if (a.id === savedSalonId) return -1;
            if (b.id === savedSalonId) return 1;
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
          });

          if (refresh) {
            setPlans(sortedData);
            AsyncStorage.setItem(CACHE_KEYS.SALONS, JSON.stringify(sortedData)).catch(() => {});
          } else {
            setPlans(prev => {
              const merged = [...prev, ...sortedData];
              return merged.sort((a, b) => {
                if (a.id === savedSalonId) return -1;
                if (b.id === savedSalonId) return 1;
                if (a.distance === null) return 1;
                if (b.distance === null) return -1;
                return a.distance - b.distance;
              });
            });
          }

          const pages = response?.pagination?.totalPages || 1;
          setTotalPages(pages);
          setHasMore(pageNo < pages);
        } else {
          if (refresh) setPlans([]);
          setHasMore(false);
        }
      } catch (error) {
        if (requestId === latestRequestRef.current && refresh) {
          Alert.alert('Notice', 'Unable to refresh salons. Showing offline data.');
        }
      } finally {
        if (requestId === latestRequestRef.current) {
          setLoading(false);
          if (refresh) setRefreshing(false);
        }
      }
    },
    [search, genderFilter, locationFilter, savedSalonId]
  );

  const userAds = async () => {
    try {
      const response = await communication.userAds();
      if (response?.status === 'SUCCESS') {
        const adImages = response.data?.images || [];
        setAds(adImages);
        AsyncStorage.setItem(CACHE_KEYS.ADS, JSON.stringify(adImages)).catch(() => {});
      } else {
        setAds([]);
      }
    } catch (error) {
      setAds([]);
    }
  };

  const toggleSaveSalon = useCallback(
    async salonId => {
      if (savingSalonId) return;

      try {
        setSavingSalonId(salonId);
        if (savedSalonId && savedSalonId !== salonId) {
          Alert.alert('Bookmark Exists', 'Please remove previous bookmarked salon first.');
          return;
        }

        const response = await communication.toggleSaveSalon({ salonId });

        if (response?.status === 'SUCCESS') {
          const msg = response?.message?.toLowerCase() || '';
          const isNowBookmarked = msg.includes('save') && !msg.includes('unsave');

          setSavedSalonId(isNowBookmarked ? salonId : null);
          setPlans([]);
          setPage(1);
          setHasMore(true);
          getSalonList(1, true);
        } else {
          Alert.alert('Bookmark', 'Failed to update bookmark.');
        }
      } catch (error) {
        Alert.alert('Bookmark', 'Network error while bookmarking.');
      } finally {
        setSavingSalonId(null);
      }
    },
    [savingSalonId, savedSalonId, getSalonList]
  );

  /* -------- SEARCH & FILTER TRIGGERS -------- */
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    getSalonList(1, true);
  }, [genderFilter, locationFilter]);

  useEffect(() => {
    const delay = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      getSalonList(1, true);
    }, 400);

    return () => clearTimeout(delay);
  }, [search]);

  const firstName = useMemo(() => {
    if (!userName?.trim()) return 'User';
    const name = userName.trim().split(' ')[0];
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }, [userName]);

  const handleLoadMore = useCallback(() => {
    if (loading || refreshing || !hasMore) return;
    const nextPage = page + 1;
    if (nextPage <= totalPages) {
      setPage(nextPage);
      getSalonList(nextPage);
    }
  }, [loading, refreshing, hasMore, page, totalPages, getSalonList]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true);
    setPage(1);
    getSalonList(1, true);
  }, [getSalonList]);

  const handleSalonSelect = useCallback(
    salonId => {
      navigation.navigate('SalonDetail', { salonId });
    },
    [navigation]
  );

  const renderSalon = useCallback(
    ({ item }) => (
      <SalonCard
        item={item}
        isSaved={savedSalonId === item.id}
        isSaving={savingSalonId === item.id}
        userLocation={userLocation}
        onSelect={handleSalonSelect}
        onBookmark={toggleSaveSalon}
      />
    ),
    [savedSalonId, savingSalonId, userLocation, handleSalonSelect, toggleSaveSalon]
  );

  const renderFooter = useCallback(() => {
    if (!loading || refreshing || !hasMore) return null;
    return <ActivityIndicator size="large" color="#E1B378" style={{ marginVertical: 20 }} />;
  }, [loading, refreshing, hasMore]);

  const renderEmpty = useCallback(() => {
    if (loading) return null;
    return (
      <View style={{ alignItems: 'center', marginTop: 60 }}>
        <Ionicons name="cut-outline" size={wp(10)} color="#777" />
        <Text allowFontScaling={false} style={{ color: '#aaa', marginTop: 10, fontSize: 14 }}>
          No salons available
        </Text>
      </View>
    );
  }, [loading]);

  const renderAdsSlider = useMemo(
    () => (
      <Pressable onPressIn={() => setPaused(true)} onPressOut={() => setPaused(false)}>
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
            <View key={i} style={[styles.dot, adIndex === i && styles.activeDot]} />
          ))}
        </View>
      </Pressable>
    ),
    [ads, adIndex]
  );

  return (
    <ImageBackground source={BG_IMAGE} style={styles.bg}>
      <View style={styles.overlay}>
        <SafeAreaView
          style={[styles.container, { paddingBottom: insets.bottom }]}
          edges={['top', 'bottom', 'left', 'right']}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text allowFontScaling={false} style={styles.greeting}>
                Hi {firstName} 👋
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.genderToggle}>
                  <TouchableOpacity
                    disabled={loading}
                    style={[styles.genderBtn, genderFilter === 'male' && styles.activeGenderBtn]}
                    onPress={() => setGenderFilter('male')}
                  >
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.genderText,
                        genderFilter === 'male' && styles.activeGenderText,
                      ]}
                    >
                      Male
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={loading}
                    style={[
                      styles.genderBtn,
                      genderFilter === 'female' && styles.activeGenderBtn,
                    ]}
                    onPress={() => setGenderFilter('female')}
                  >
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.genderText,
                        genderFilter === 'female' && styles.activeGenderText,
                      ]}
                    >
                      Female
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => navigation.navigate('UserNotifications')}
                >
                  <Ionicons name="notifications-outline" size={wp(5)} color="#000" />
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              data={plans}
              keyExtractor={item => String(item.id)}
              renderItem={renderSalon}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: insets.bottom + 120,
                flexGrow: 1,
              }}
              ListHeaderComponent={
                <>
                  <View style={styles.searchBox}>
                    <Ionicons name="search" size={wp(4.5)} color="#999" />
                    <TextInput
                      allowFontScaling={false}
                      placeholder="Find salon, specialists..."
                      placeholderTextColor="#999"
                      style={styles.searchInput}
                      value={search}
                      onChangeText={setSearch}
                    />
                  </View>
                  {renderAdsSlider}
                </>
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={renderEmpty}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              /* ⚡ Optimized Scroll Configuration */
              initialNumToRender={6}
              maxToRenderPerBatch={8}
              windowSize={5}
              removeClippedSubviews={true}
            />
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

export default NaaiDashboard;

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.70)' },
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
  imageContainer: {
    maxHeight: hp(18),
    position: 'relative',
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
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 0 },
  linkText: {
    color: '#E1B378',
    fontSize: wp(3.4),
    textTransform: 'capitalize',
    marginLeft: wp(2),
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
  bookmarkBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});

