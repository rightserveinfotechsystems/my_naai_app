import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ImageBackground,
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

const BG_IMAGE = require('../assets/salon_page_bg.jpg');
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

/* ---------------- SAMPLE PRODUCT DATA ---------------- */
const PRODUCTS = [
  {
    id: '1',
    name: 'Hair Styling Gel',
    price: 299,
    rating: 4.5,
    image: require("../assets/naai/barber5.jpg"),
    available: true,
  },
  {
    id: '2',
    name: 'Beard Oil',
    price: 199,
    rating: 4.2,
    image: null,
    available: false,
  },
  {
    id: '3',
    name: 'Hair Shampoo',
    price: 349,
    rating: 5,
    image: null,
    available: true,
  },
];

const UserProduct = () => {
  const [search, setSearch] = useState('');

  /* ---------------- FILTER PRODUCTS ---------------- */
  const filteredProducts = PRODUCTS.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  /* ---------------- PRODUCT CARD ---------------- */
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.image ? (
        <Image source={item.image} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="pricetag-outline" size={32} color="#777" />
        </View>
      )}

      <View style={styles.cardContent}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.row}>
          <Text style={styles.price}>₹ {item.price}</Text>

          <View style={styles.rating}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>
              {Math.min(item.rating, 5)}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.availability,
            { color: item.available ? '#4CAF50' : '#F44336' },
          ]}
        >
          {item.available ? 'Available' : 'Out of Stock'}
        </Text>
      </View>
    </View>
  );

  return (
    <ImageBackground source={BG_IMAGE} style={{ flex: 1 }}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>

          {/* SEARCH BAR */}
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color="#999" />
            <TextInput
              placeholder="Search products"
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
          </View>

          {/* PRODUCT LIST */}
          <FlatList
            data={filteredProducts}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <View style={styles.noResult}>
                <Ionicons
                  name="search-circle-outline"
                  size={64}
                  color="#555"
                />
                <Text style={styles.noResultText}>
                  No results found
                </Text>
              </View>
            }
          />

        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

export default UserProduct;

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
  },

  container: {
    flex: 1,
    padding: 16,
  },

  /* SEARCH */
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1C',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 16,
  },

  searchInput: {
    flex: 1,
    color: '#fff',
    paddingVertical: 10,
    paddingLeft: 8,
  },

  /* CARD */
  card: {
    backgroundColor: '#1C1C1C',
    borderRadius: 16,
    marginBottom: 16,
    width: CARD_WIDTH,
    overflow: 'hidden',
  },

  image: {
    height: 120,
    width: '100%',
  },

  imagePlaceholder: {
    height: 120,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardContent: {
    padding: 10,
  },

  productName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  price: {
    color: '#E0B973',
    fontSize: 14,
    fontWeight: '700',
  },

  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ratingText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 12,
  },

  availability: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },

  /* NO RESULT */
  noResult: {
    marginTop: 80,
    alignItems: 'center',
  },

  noResultText: {
    color: '#777',
    fontSize: 15,
    marginTop: 8,
    fontWeight: '600',
  },
});
