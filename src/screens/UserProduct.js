import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ImageBackground,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { communication, getServerUrl } from '../services/communication';

const BG_IMAGE = require('../assets/salon_page_bg.png');
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

const UserProduct = () => {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async (newPage = 1, searchString = '') => {
    if (loading) return;
    setLoading(true);
    try {
      const payload = { page: newPage, searchString };
      const response = await communication.userProductList(payload);
      console.log('response', response);

      if (response?.status === 'SUCCESS') {
        const apiProducts = response?.data?.products.map(p => ({
          id: p.productId,
          name: p.productName,
          price: p.price,
          rating: parseFloat(p.rating),
          available: p.isAvailable,
          image: p.productImage
            ? `${getServerUrl()}/getfiles/${p.productImage}`
            : null,
          salonName: p.salon?.salonName || '', // salon name added
        }));

        if (newPage === 1) {
          setProducts(apiProducts);
        } else {
          setProducts(prev => [...prev, ...apiProducts]);
        }

        setPage(response.data.pagination.page);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        setProducts([]);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to fetch products'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts(1, '');
  }, []);

  const handleSearch = text => {
    setSearch(text);
    setPage(1);
    fetchProducts(1, text);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loading) {
      fetchProducts(page + 1, search);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchProducts(1, search);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="pricetag-outline" size={32} color="#777" />
        </View>
      )}

      <View style={styles.cardContent}>
        <Text allowFontScaling={false}style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>

        {/* Salon Name */}
        {item.salonName ? (
          <Text allowFontScaling={false}style={styles.salonName} numberOfLines={1}>
            {item.salonName}
          </Text>
        ) : null}

        <View style={styles.row}>
          <Text allowFontScaling={false}style={styles.price}>₹ {item.price}</Text>
          <View style={styles.rating}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text allowFontScaling={false}style={styles.ratingText}>{Math.min(item.rating, 5)}</Text>
          </View>
        </View>

        <Text allowFontScaling={false}
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
            <TextInput allowFontScaling={false}
              placeholder="Search products"
              placeholderTextColor="#999"
              value={search}
              onChangeText={handleSearch}
              style={styles.searchInput}
            />
          </View>

          {/* PRODUCT LIST */}
          <FlatList
            data={products}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              !loading && (
                <View style={styles.noResult}>
                  <Ionicons name="search-circle-outline" size={64} color="#555" />
                  <Text allowFontScaling={false}style={styles.noResultText}>No results found</Text>
                </View>
              )
            }
            ListFooterComponent={
              loading ? (
                <ActivityIndicator size="large" color="#E0B973" style={{ margin: 20 }} />
              ) : null
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

export default UserProduct;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  container: {
    flex: 1,
    padding: 16,
  },
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
    marginBottom: 2,
  },
  salonName: {
    color: '#E0B973',
    fontSize: 12,
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
