import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { communication } from '../../services/communication';
import { normalizeShopProduct, categoryLabel, applyShopFilters, SHOP_CATEGORIES, SHOP_GENDERS, PRICE_RANGES } from '../../shop/shopCatalog';
import { cartTotals } from '../../shop/shopOrders';
import { fetchShopSettings } from '../../shop/shopSettings';
import { ShopProductCard, ShopCartBar, EmptyState, SkeletonCard } from '../../shop/ShopComponents';
import { APP_THEME } from '../../shop/shopTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { getShopOwnerId } from '../../shop/shopHelper';
import { shopCopy, getShopSession } from '../../shop/shopBuyer';

function useShopCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  function extractProducts(res) {
    if (!res) return { rows: [], totalPages: 1 };
    // backend may respond as {data:{products, pagination}} OR {products, pagination} OR {data:{data:{products}}}
    const body = res?.data?.products ? res.data : res?.products ? res : res?.data?.data?.products ? res.data.data : res;
    const rows = Array.isArray(body?.products) ? body.products : Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
    const pages = body?.pagination?.totalPages || body?.data?.pagination?.totalPages || res?.pagination?.totalPages || res?.data?.pagination?.totalPages || 1;
    return { rows, totalPages: pages };
  }
  function rowsFromRes(r) {
    const { rows } = extractProducts(r);
    return rows;
  }
  const fetchProductsPage = async (page) => {
    try {
      return await communication.shopProductList({ page, searchString: '' });
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401 || status === 403 || String(e?.message || '').toLowerCase().includes('auth')) {
        return await communication.shopProductListPublic({ page, searchString: '' });
      }
      throw e;
    }
  };
  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const first = await fetchProductsPage(1);
      const { rows, totalPages } = extractProducts(first);
      const pages = Math.min(Number(totalPages) || 1, 10);
      let restRows = [];
      if (pages > 1) {
        const rest = await Promise.all(
          Array.from({ length: pages - 1 }, (_, i) =>
            fetchProductsPage(i + 2)
              .then(r => rowsFromRes(r))
              .catch(() => [])
          )
        );
        restRows = rest.flat();
      }
      const list = [...rows, ...restRows];
      setProducts(list.map((item, idx) => normalizeShopProduct(item, idx)));
    } catch (err) {
      try {
        const first = await communication.shopProductListPublic({ page: 1, searchString: '' });
        const { rows, totalPages } = extractProducts(first);
        const list = rows;
        const pages = Math.min(Number(totalPages) || 1, 10);
        let restRows = [];
        if (pages > 1) {
          const rest = await Promise.all(
            Array.from({ length: pages - 1 }, (_, i) =>
              communication.shopProductListPublic({ page: i + 2, searchString: '' })
                .then(r => rowsFromRes(r))
                .catch(() => [])
            )
          );
          restRows = rest.flat();
        }
        setProducts([...list, ...restRows].map((item, idx) => normalizeShopProduct(item, idx)));
        setError('');
      } catch (e2) {
        setError(err?.response?.data?.message || err?.message || 'Could not load shop products');
        setProducts([]);
      }
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

  const persist = async (lines) => {
    try { await AsyncStorage.setItem(`mynaaiShopCart:${ownerId}`, JSON.stringify(lines)); } catch {}
    setCart(lines);
    DeviceEventEmitter.emit('SHOP_CART_UPDATED');
  };

  const refresh = useCallback(async () => {
    if (!ownerId) return;
    try {
      const raw = await AsyncStorage.getItem(`mynaaiShopCart:${ownerId}`);
      const lines = raw ? JSON.parse(raw) : [];
      setCart(Array.isArray(lines) ? lines : []);
    } catch { setCart([]); }
  }, [ownerId]);

  useEffect(() => {
    refresh();
    (async () => {
      try {
        const res = await communication.shopCartGet();
        const serverLines =
          Array.isArray(res?.data?.lines) ? res.data.lines :
          Array.isArray(res?.lines) ? res.lines :
          Array.isArray(res?.data?.data?.lines) ? res.data.data.lines :
          Array.isArray(res?.data) ? res.data : [];
        if (Array.isArray(serverLines)) {
          const normalized = serverLines.map(l => ({
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

  // Auto-sync when cart cleared/updated from Checkout or other tabs
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('SHOP_CART_UPDATED', refresh);
    return () => sub.remove();
  }, [refresh]);

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

function ShopFilterSelect({ label, valueLabel, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.selectWrap}>
      <Text style={styles.selectLabel}>{label}</Text>
      <TouchableOpacity style={styles.selectBox} onPress={() => setOpen(true)} activeOpacity={0.85}>
        <Text style={styles.selectValue} numberOfLines={1}>{valueLabel}</Text>
        <Ionicons name="chevron-down" size={12} color={APP_THEME.muted} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={18} color={APP_THEME.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {options.map(opt => {
                const active = opt.id === value;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.modalOption, active && styles.modalOptionActive]}
                    onPress={() => { onChange(opt.id); setOpen(false); }}
                  >
                    <Text style={[styles.modalOptionText, active && styles.modalOptionTextActive]}>{opt.label}</Text>
                    {active ? <Ionicons name="checkmark" size={16} color={APP_THEME.gold} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const ShopScreen = ({ navigation }) => {
  const [ownerId, setOwnerId] = useState('guest');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [gender, setGender] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [shopSettings, setShopSettings] = useState(null);
  const [copy, setCopy] = useState(shopCopy(null));

  const { products, loading, error, load, refreshing } = useShopCatalog();

  useEffect(() => {
    (async () => {
      const id = await getShopOwnerId();
      setOwnerId(id);
      try { const session = await getShopSession(); setCopy(shopCopy(session)); } catch {}
    })();
    fetchShopSettings().then(setShopSettings).catch(() => {});
  }, []);

  const { cart, add, setQty } = useSyncedCart(ownerId);
  const visible = useMemo(() => applyShopFilters(products, { search, category, gender, priceRange }), [products, search, category, gender, priceRange]);
  const totals = useMemo(() => cartTotals(cart, shopSettings), [cart, shopSettings]);
  const qtyFor = id => cart.find(l => l.productId === String(id))?.qty || 0;

  const handleAdd = p => add(p, 1);
  const handleSetQty = (product, next) => setQty(product.id, next);
  const openProduct = product => navigation.navigate('ShopProductDetail', { productId: product.id });

  const resetFilters = () => { setSearch(''); setCategory('all'); setGender('all'); setPriceRange('all'); };

  const categoryOptions = useMemo(() => [{ id: 'all', label: 'All categories' }, ...SHOP_CATEGORIES.map(c => ({ id: c.id, label: c.label }))], []);
  const genderOptions = useMemo(() => [{ id: 'all', label: 'All' }, ...SHOP_GENDERS.map(g => ({ id: g.id, label: g.label }))], []);
  const priceOptions = useMemo(() => PRICE_RANGES, []);

  const catLabel = category === 'all' ? 'All categories' : categoryLabel(category);
  const genLabel = gender === 'all' ? 'All' : (SHOP_GENDERS.find(g => g.id === gender)?.label || gender);
  const priceLabel = PRICE_RANGES.find(p => p.id === priceRange)?.label || 'All prices';

  const renderProduct = ({ item }) => (
    <View style={styles.gridCard}>
      <ShopProductCard product={item} qty={qtyFor(item.id)} onAdd={handleAdd} onSetQty={handleSetQty} onOpen={openProduct} />
    </View>
  );

  const hasActive = category !== 'all' || gender !== 'all' || priceRange !== 'all' || search.length > 0;
  const insets = useSafeAreaInsets();
  // Sync with App.jsx tabBarStyle: 52 + max(insets.bottom,10)
  const tabBarHeight = 52 + Math.max(insets.bottom, 10);
  const cartOffset = tabBarHeight + 12;

  return (
    <View style={styles.overlay}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.titleRow}>
          <Text allowFontScaling={false} style={styles.title}>Shop</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('ShopOrders')} activeOpacity={0.85}>
              <Ionicons name="receipt-outline" size={15} color={APP_THEME.white} />
              <Text style={styles.headerBtnText}>My Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.headerBtn, styles.headerBtnPrimary]} onPress={() => navigation.navigate('ShopCart')} activeOpacity={0.85}>
              <Ionicons name="bag-handle-outline" size={15} color={APP_THEME.bg} />
              <Text style={[styles.headerBtnText, styles.headerBtnTextDark]}>My Cart{totals.itemCount ? ` (${totals.itemCount})` : ''}</Text>
              {totals.itemCount > 0 && <View style={styles.headerDot} />}
            </TouchableOpacity>
          </View>
        </View>
        <Text allowFontScaling={false} style={styles.subtitle}>{copy.subtitle}</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={15} color={APP_THEME.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search shampoo, clippers, beard oil…"
            placeholderTextColor={APP_THEME.muted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={APP_THEME.muted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filtersSection}>
          <View style={styles.filtersGrid}>
            <ShopFilterSelect label="Category" valueLabel={catLabel} options={categoryOptions} value={category} onChange={setCategory} />
            <ShopFilterSelect label="Gender" valueLabel={genLabel} options={genderOptions} value={gender} onChange={setGender} />
            <ShopFilterSelect label="Price" valueLabel={priceLabel} options={priceOptions} value={priceRange} onChange={setPriceRange} />
          </View>
          {!!(hasActive || visible.length) && (
            <View style={styles.countRow}>
              <Text style={styles.countText}>
                <Text style={styles.countBold}>{visible.length}</Text>
                <Text style={styles.countText}> {visible.length === 1 ? 'product' : 'products'}</Text>
              </Text>
              {hasActive ? (
                <TouchableOpacity onPress={resetFilters} style={styles.clearBtn}>
                  <Ionicons name="refresh" size={12} color={APP_THEME.gold} />
                  <Text style={styles.clearText}>Clear filters</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.gridSkeleton}>
            {[1,2,3,4,5,6].map(i => (<View key={i} style={styles.gridCard}><SkeletonCard /></View>))}
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
            contentContainerStyle={[styles.listContent, { paddingBottom: cartOffset + 72 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={APP_THEME.gold} colors={[APP_THEME.gold]} />}
          />
        ) : (
          <View style={styles.centerWrap}>
            <EmptyState icon="search-outline" title="No products match" message="Try a different search, category or price range." actionLabel="Clear filters" onAction={resetFilters} />
          </View>
        )}

        <ShopCartBar totals={totals} onOpen={() => navigation.navigate('ShopCart')} offsetBottom={cartOffset} />
      </SafeAreaView>
    </View>
  );
};

export default ShopScreen;

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#080A0A' },
  container: { flex: 1, paddingHorizontal: 14 },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 10,
    flex: 1,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 6 },
  subtitle: { color: APP_THEME.muted, fontSize: 11, fontWeight: '500', marginTop: 4, marginBottom: 8 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 10 },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: APP_THEME.line,
    backgroundColor: APP_THEME.card,
  },
  headerBtnPrimary: { backgroundColor: APP_THEME.gold, borderColor: APP_THEME.gold },
  headerBtnText: { color: APP_THEME.white, fontSize: 11, fontWeight: '700' },
  headerBtnTextDark: { color: APP_THEME.bg },
  headerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: APP_THEME.bg, marginLeft: 2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_THEME.card,
    borderWidth: 1,
    borderColor: APP_THEME.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: { flex: 1, color: APP_THEME.white, fontSize: 13, fontWeight: '500', paddingVertical: 0 },
  filtersSection: { backgroundColor: APP_THEME.card, borderBottomWidth: 1, borderColor: APP_THEME.line, paddingHorizontal: 14, paddingVertical: 10, marginHorizontal: -14, marginTop: 6 },
  filtersGrid: { flexDirection: 'row', gap: 8 },
  selectWrap: { flex: 1, gap: 4 },
  selectLabel: { color: APP_THEME.muted, fontSize: 9, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: APP_THEME.bg,
    borderWidth: 1,
    borderColor: APP_THEME.line,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 6,
  },
  selectValue: { flex: 1, color: APP_THEME.white, fontSize: 11, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: APP_THEME.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 16, borderWidth: 1, borderColor: APP_THEME.line, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: APP_THEME.line },
  modalTitle: { color: APP_THEME.white, fontSize: 13, fontWeight: '800' },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 10, borderRadius: 9, marginBottom: 4 },
  modalOptionActive: { backgroundColor: APP_THEME.goldWash, borderWidth: 1, borderColor: 'rgba(232,185,126,0.18)' },
  modalOptionText: { color: APP_THEME.mutedLight, fontSize: 12, fontWeight: '600', flex: 1 },
  modalOptionTextActive: { color: APP_THEME.white, fontWeight: '800' },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: APP_THEME.line },
  countText: { color: APP_THEME.muted, fontSize: 11, fontWeight: '500' },
  countBold: { color: APP_THEME.white, fontWeight: '800' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: APP_THEME.goldWash, borderWidth: 1, borderColor: 'rgba(232,185,126,0.18)' },
  clearText: { color: APP_THEME.gold, fontWeight: '700', fontSize: 11 },
  gridSkeleton: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginHorizontal: -6, paddingTop: 6 },
  gridCard: { width: '48.5%', marginBottom: 6 },
  columnWrapper: { justifyContent: 'space-between', gap: 6 },
  listContent: { paddingBottom: 140, paddingTop: 6 },
  centerWrap: { flex: 1, justifyContent: 'center', paddingBottom: 80 },
});
