import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { communication, getFileUrl } from '../../services/communication';
import { normalizeShopProduct, categoryChipsFor, categoryLabel, applyShopFilters, SHOP_CATEGORIES, SHOP_GENDERS, PRICE_RANGES } from '../../shop/shopCatalog';
import { cartTotals } from '../../shop/shopOrders';
import { fetchShopSettings } from '../../shop/shopSettings';
import { ShopProductCard, ShopCartBar, EmptyState, SkeletonCard } from '../../shop/ShopComponents';
import { BLINKIT } from '../../shop/shopTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getShopOwnerId } from '../../shop/shopHelper';

const HEADER_BG = BLINKIT.green;

function useShopCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const first = await communication.shopProductList({ page: 1, searchString: '' });
      const firstBody = first?.data || {};
      const rows = firstBody.products || (Array.isArray(firstBody) ? firstBody : []);
      const totalPages = firstBody.pagination?.totalPages || 1;
      const pages = Math.min(totalPages, 10);
      let restRows = [];
      if (pages > 1) {
        const rest = await Promise.all(
          Array.from({ length: pages - 1 }, (_, i) =>
            communication.shopProductList({ page: i + 2, searchString: '' })
              .then(r => r?.data?.products || (Array.isArray(r?.data) ? r.data : []))
              .catch(() => [])
          )
        );
        restRows = rest.flat();
      }
      const list = [...rows, ...restRows];
      setProducts(list.map((item, idx) => normalizeShopProduct(item, idx)));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Could not load shop products');
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { products, loading, error, load, refreshing };
}

function useSyncedCart(ownerId) {
  const [cart, setCart] = useState([]);
  const ownerRef = useRef(ownerId);
  ownerRef.current = ownerId;

  // Minimal AsyncStorage cart implementation — we keep it simple for mobile
  const refresh = useCallback(async () => {
    if (!ownerId) return;
    try {
      const raw = await AsyncStorage.getItem(`mynaaiShopCart:${ownerId}`);
      const lines = raw ? JSON.parse(raw) : [];
      setCart(Array.isArray(lines) ? lines : []);
    } catch { setCart([]); }
  }, [ownerId]);

  const persist = async (lines) => {
    try {
      await AsyncStorage.setItem(`mynaaiShopCart:${ownerId}`, JSON.stringify(lines));
    } catch {}
    setCart(lines);
  };

  useEffect(() => {
    refresh();
    // Try server cart if signed in
    (async () => {
      try {
        const res = await communication.shopCartGet();
        const lines = res?.data?.lines || [];
        if (Array.isArray(lines) && lines.length >= 0) {
          // Server is source of truth when it responds
          const normalized = lines.map(l => ({
            productId: String(l.productId),
            name: l.name || 'Untitled',
            price: Number(l.price) || 0,
            mrp: Number(l.mrp) || 0,
            image: l.image || '',
            category: l.category || '',
            gender: l.gender || '',
            salonName: l.salonName || '',
            qty: Math.max(1, Math.min(99, Math.round(Number(l.qty) || 1))),
          }));
          await persist(normalized);
        }
      } catch {}
    })();
  }, [ownerId, refresh]);

  const add = useCallback(async (product, qty = 1) => {
    const raw = await AsyncStorage.getItem(`mynaaiShopCart:${ownerId}`);
    const lines = raw ? JSON.parse(raw) : [];
    const pid = String(product?.id || product?.productId || '');
    const idx = lines.findIndex(l => l.productId === pid);
    if (idx >= 0) lines[idx].qty = Math.min(99, lines[idx].qty + Math.max(1, Math.round(Number(qty) || 1)));
    else lines.push({
      productId: pid,
      name: product.name || product.productName || 'Untitled',
      price: Math.max(0, Number(product.price) || 0),
      mrp: Math.max(0, Number(product.mrp) || 0),
      image: product.image || '',
      category: product.category || '',
      gender: product.gender || '',
      salonName: product.salonName || '',
      qty: Math.max(1, Math.round(Number(qty) || 1)),
    });
    await persist(lines);
    try { await communication.shopCartAdd({ productId: pid, qty }); } catch {}
  }, [ownerId]);

  const setQty = useCallback(async (productId, next) => {
    const raw = await AsyncStorage.getItem(`mynaaiShopCart:${ownerId}`);
    let lines = raw ? JSON.parse(raw) : [];
    const pid = String(productId);
    const n = Math.round(Number(next) || 0);
    if (n <= 0) lines = lines.filter(l => l.productId !== pid);
    else {
      const idx = lines.findIndex(l => l.productId === pid);
      if (idx >= 0) lines[idx].qty = Math.min(99, n);
    }
    await persist(lines);
    try {
      if (n <= 0) await communication.shopCartRemove({ productId: pid });
      else await communication.shopCartSetQty({ productId: pid, qty: n });
    } catch {}
  }, [ownerId]);

  return { cart, add, setQty, refresh };
}

const ShopScreen = ({ navigation }) => {
  const [ownerId, setOwnerId] = useState('guest');
  const [salonCity, setSalonCity] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [gender, setGender] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [shopSettings, setShopSettings] = useState(null);

  const { products, loading, error, load, refreshing } = useShopCatalog();

  useEffect(() => {
    (async () => {
      const id = await getShopOwnerId();
      setOwnerId(id);
      try {
        const raw = await AsyncStorage.getItem('mynaaiUser');
        const parsed = raw ? JSON.parse(raw) : null;
        const city = parsed?.salon?.city || parsed?.city || '';
        setSalonCity(city);
      } catch {}
    })();
    fetchShopSettings().then(setShopSettings).catch(() => {});
  }, []);

  const { cart, add, setQty } = useSyncedCart(ownerId);
  const categories = useMemo(() => categoryChipsFor(products), [products]);
  const visible = useMemo(() => applyShopFilters(products, { search, category, gender, priceRange }), [products, search, category, gender, priceRange]);
  const totals = useMemo(() => cartTotals(cart, shopSettings), [cart, shopSettings]);
  const qtyFor = id => cart.find(l => l.productId === String(id))?.qty || 0;

  const handleAdd = p => add(p, 1);
  const handleSetQty = (product, next) => setQty(product.id, next);
  const openProduct = product => navigation.navigate('ShopProductDetail', { productId: product.id });

  const resetFilters = () => {
    setSearch('');
    setCategory('all');
    setGender('all');
    setPriceRange('all');
  };

  const renderProduct = ({ item }) => (
    <ShopProductCard product={item} qty={qtyFor(item.id)} onAdd={handleAdd} onSetQty={handleSetQty} onOpen={openProduct} style={styles.gridCard} />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Blinkit Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.deliveryPill}>
              <Ionicons name="flash" size={12} color={BLINKIT.yellow} />
              <Text style={styles.deliveryPillText}>Delivery in 24 hours</Text>
            </View>
            <Text style={styles.headerLocation}>My Naai Salon Supply • {salonCity || 'Your salon'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('ShopOrders')}>
              <Ionicons name="receipt-outline" size={19} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.cartIconBtn} onPress={() => navigation.navigate('ShopCart')}>
              <Ionicons name="bag-handle-outline" size={19} color="#fff" />
              {totals.itemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{totals.itemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        {/* Search Bar - Blinkit style white with rounded corners */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search shampoo, clippers, beard oil…"
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="#bbb" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter chips - horizontal scroll Blinkit */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity style={[styles.filterChip, category === 'all' && styles.filterChipActive]} onPress={() => setCategory('all')}>
            <Text style={[styles.filterChipText, category === 'all' && styles.filterChipTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map(c => (
            <TouchableOpacity key={c.id} style={[styles.filterChip, category === c.id && styles.filterChipActive]} onPress={() => setCategory(c.id)}>
              <Text style={[styles.filterChipText, category === c.id && styles.filterChipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.secondaryFilters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <View style={styles.dropdownPill}>
              <Text style={styles.dropdownLabel}>For:</Text>
              <TouchableOpacity style={styles.dropdownBtn} onPress={() => {}}>
                <Text style={styles.dropdownValue}>{gender === 'all' ? 'All' : SHOP_GENDERS.find(g => g.id === gender)?.label || gender}</Text>
                <Ionicons name="chevron-down" size={12} color="#666" />
              </TouchableOpacity>
            </View>
            {/* Simple tappable gender chips instead of picker */}
            {[{ id: 'all', label: 'All' }, ...SHOP_GENDERS].map(g => (
              <TouchableOpacity key={`g-${g.id}`} style={[styles.miniChip, gender === g.id && styles.miniChipActive]} onPress={() => setGender(g.id)}>
                <Text style={[styles.miniChipText, gender === g.id && styles.miniChipTextActive]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.divider} />
            {PRICE_RANGES.map(p => (
              <TouchableOpacity key={p.id} style={[styles.miniChip, priceRange === p.id && styles.miniChipActive]} onPress={() => setPriceRange(p.id)}>
                <Text style={[styles.miniChipText, priceRange === p.id && styles.miniChipTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Count line */}
      {!loading && !error && (
        <View style={styles.countLine}>
          <Text style={styles.countText}><Text style={styles.countBold}>{visible.length}</Text> {visible.length === 1 ? 'product' : 'products'}</Text>
          {(category !== 'all' || gender !== 'all' || priceRange !== 'all' || search) && (
            <TouchableOpacity onPress={resetFilters}>
              <Text style={styles.clearFilters}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Grid */}
      {loading ? (
        <View style={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <View key={i} style={styles.gridCard}><SkeletonCard /></View>
          ))}
        </View>
      ) : error ? (
        <View style={styles.centerWrap}>
          <EmptyState icon="cloud-offline-outline" title="Shop is out of reach" message={error} actionLabel="Retry" onAction={() => load()} />
        </View>
      ) : visible.length ? (
        <FlatList
          data={visible}
          renderItem={renderProduct}
          keyExtractor={item => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={BLINKIT.green} colors={[BLINKIT.green]} />}
        />
      ) : (
        <View style={styles.centerWrap}>
          <EmptyState icon="search-outline" title="No products match" message="Try a different search, category or price range." actionLabel="Clear filters" onAction={resetFilters} />
        </View>
      )}

      <ShopCartBar totals={totals} onOpen={() => navigation.navigate('ShopCart')} />
    </SafeAreaView>
  );
};

export default ShopScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BLINKIT.bg },
  header: {
    backgroundColor: HEADER_BG,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  headerLeft: { flex: 1 },
  deliveryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 4,
  },
  deliveryPillText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  headerLocation: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  cartIconBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: BLINKIT.yellow, minWidth: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, borderWidth: 1, borderColor: HEADER_BG },
  badgeText: { color: '#000', fontSize: 10, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: { flex: 1, color: '#1a1a1a', fontSize: 13, fontWeight: '500', paddingVertical: 0 },
  filterSection: { backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 8 },
  filterScroll: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  filterChipActive: { backgroundColor: BLINKIT.green, borderColor: BLINKIT.green },
  filterChipText: { color: '#555', fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  secondaryFilters: { marginTop: 8, borderTopWidth: 1, borderColor: '#f0f0f0', paddingTop: 8 },
  dropdownPill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dropdownLabel: { color: '#999', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  dropdownBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#fafafa' },
  dropdownValue: { color: '#333', fontSize: 11, fontWeight: '700' },
  miniChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee' },
  miniChipActive: { backgroundColor: '#e8f5e9', borderColor: BLINKIT.green },
  miniChipText: { color: '#666', fontSize: 11, fontWeight: '600' },
  miniChipTextActive: { color: BLINKIT.green },
  divider: { width: 1, height: 20, backgroundColor: '#e0e0e0', marginHorizontal: 4 },
  countLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff' },
  countText: { color: '#888', fontSize: 11, fontWeight: '500' },
  countBold: { color: '#1a1a1a', fontWeight: '800' },
  clearFilters: { color: BLINKIT.green, fontWeight: '700', fontSize: 11 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 8 },
  gridCard: { width: '48.5%', marginBottom: 8 },
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 8, gap: 8 },
  listContent: { paddingBottom: 90, paddingTop: 8, paddingHorizontal: 4 },
  centerWrap: { flex: 1, justifyContent: 'center', paddingBottom: 80 },
});
