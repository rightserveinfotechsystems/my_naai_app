import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Alert,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

/* -------------------- DATA -------------------- */

const CATEGORIES = ['Hair', 'Beard', 'Facial', 'Grooming'];
const { width } = Dimensions.get('window');

const SERVICES = [
  { id: '1', name: 'Classic Haircut', price: 199, category: 'Hair' },
  { id: '2', name: 'Premium Haircut', price: 299, category: 'Hair' },
  { id: '3', name: 'Hair Spa', price: 599, category: 'Hair' },

  { id: '4', name: 'Beard Trim', price: 149, category: 'Beard' },
  { id: '5', name: 'Beard Styling', price: 249, category: 'Beard' },

  { id: '6', name: 'Basic Facial', price: 399, category: 'Facial' },
  { id: '7', name: 'Gold Facial', price: 699, category: 'Facial' },

  { id: '8', name: 'Head Massage', price: 199, category: 'Grooming' },
  { id: '9', name: 'Manicure', price: 349, category: 'Grooming' },
];

/* -------------------- SCREEN -------------------- */

const SalonDetailScreen = ({ route, navigation }) => {
  const { salon } = route.params;

  const [favorite, setFavorite] = useState(false);
  const [gender, setGender] = useState('Male');
  const [activeCategory, setActiveCategory] = useState('Hair');
  const [activeIndex, setActiveIndex] = useState(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const scrollRef = useRef(null);
  const autoScrollRef = useRef(null);

  /* -------------------- AUTO SLIDER -------------------- */

  useEffect(() => {
    if (!salon?.images?.length) return;

    autoScrollRef.current = setInterval(() => {
      setActiveIndex(prev => {
        const next =
          prev === salon.images.length - 1 ? 0 : prev + 1;

        scrollRef.current?.scrollTo({
          x: next * width,
          animated: true,
        });

        return next;
      });
    }, 3000);

    return () => clearInterval(autoScrollRef.current);
  }, []);

  /* -------------------- FILTER SERVICES -------------------- */

  const filteredServices = useMemo(
    () => SERVICES.filter(s => s.category === activeCategory),
    [activeCategory]
  );

  /* -------------------- BOOK -------------------- */

  const handleBooking = () => {
    Alert.alert(
      'Confirm Booking 💈',
      'Do you want to proceed with this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: () => navigation.navigate('UserLogin') },
      ]
    );
  };

  /* -------------------- UI -------------------- */

  return (
    <View style={styles.container}>
      <ImageBackground source={salon.image} style={styles.bg}>
        <View style={styles.overlay}>
          <SafeAreaView style={{ flex: 1 }}>

            {/* HEADER */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setFavorite(!favorite)}>
                <Ionicons
                  name={favorite ? 'heart' : 'heart-outline'}
                  size={26}
                  color={favorite ? '#E1B378' : '#fff'}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 160 }}
            >
              {/* IMAGE SLIDER */}
              <View style={styles.sliderWrapper}>
                <ScrollView
                  ref={scrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={e => {
                    const index = Math.round(
                      e.nativeEvent.contentOffset.x / width
                    );
                    setActiveIndex(index);
                  }}
                >
                  {salon.images.map((img, index) => (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.9}
                      onPress={() => {
                        setSelectedImage(img);
                        setModalVisible(true);
                      }}
                    >
                      <ImageBackground
                        source={img}
                        style={styles.sliderImage}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* DOTS */}
                <View style={styles.dotsRow}>
                  {salon.images.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        activeIndex === i && styles.activeDot,
                      ]}
                    />
                  ))}
                </View>
              </View>

              {/* DETAILS */}
              <View style={styles.card}>
                <Text style={styles.name}>{salon.name}</Text>
                <Text style={styles.address}>{salon.address}</Text>

                {/* GENDER */}
                <View style={styles.genderRow}>
                  {['Male', 'Female'].map(g => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderBtn,
                        gender === g && styles.genderActive,
                      ]}
                      onPress={() => setGender(g)}
                    >
                      <Text style={styles.genderText}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* CATEGORY */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryTab,
                        activeCategory === cat && styles.categoryActive,
                      ]}
                      onPress={() => setActiveCategory(cat)}
                    >
                      <Text style={styles.categoryText}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* SERVICES */}
                <View style={styles.rowWrap}>
                  {filteredServices.map(service => (
                    <View key={service.id} style={styles.serviceChip}>
                      <Text style={styles.chipText}>{service.name}</Text>
                      <Text style={styles.price}>₹{service.price}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </ImageBackground>

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bookBtn} onPress={handleBooking}>
          <Text style={styles.bookText}>Confirm Booking</Text>
        </TouchableOpacity>
      </View>

      {/* IMAGE MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalClose}
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </Pressable>

          <ImageBackground
            source={selectedImage}
            style={styles.modalImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
};

export default SalonDetailScreen;

/* -------------------- STYLES -------------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },
  bg: { flex: 1 },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },

  header: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  sliderWrapper: { height: 260 },
  sliderImage: { width, height: 260 },

  dotsRow: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 4,
  },

  activeDot: {
    backgroundColor: '#E1B378',
    width: 10,
  },

  card: {
    margin: 16,
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#1E1E1E',
  },

  name: { color: '#fff', fontSize: 22, fontWeight: '700' },
  address: { color: '#AAA', marginBottom: 12 },

  genderRow: { flexDirection: 'row', marginBottom: 14 },

  genderBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    marginRight: 10,
  },

  genderActive: { backgroundColor: '#E1B378' },
  genderText: { color: '#fff', fontWeight: '600' },

  categoryTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    marginRight: 10,
    marginVertical: 12,
  },

  categoryActive: { backgroundColor: '#E1B378' },
  categoryText: { color: '#fff', fontWeight: '600' },

  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  serviceChip: {
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 14,
    minWidth: '45%',
  },

  chipText: { color: '#fff', fontWeight: '600' },
  price: { color: '#E1B378', fontSize: 12 },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E1E1E',
    padding: 16,
    alignItems: 'center',
  },

  bookBtn: {
    backgroundColor: '#E1B378',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
  },

  bookText: { color: '#000', fontWeight: '700', fontSize: 16 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalImage: { width: '100%', height: '80%' },

  modalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
});
