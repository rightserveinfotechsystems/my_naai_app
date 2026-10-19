import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { communication, getFileUrl } from '../../services/communication';
import { normalizeShopProduct, discountPercent, categoryLabel, SHOP_GENDERS } from '../../shop/shopCatalog';
import { cartTotals } from '../../shop/shopOrders';
import { fetchShopSettings } from '../../shop/shopSettings';
import { ShopQuantityControl, ShopProductCard, ShopCartBar } from '../../shop/ShopComponents';
import { BLINKIT } from '../../shop/shopTheme';
import { getShopOwnerId } from '../../shop/shopHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ShopProductDetailScreen = ({ route, navigation }) => {
  const productId = String(route.params?.productId || '');
  const [ownerId, setOwnerId] = useState('guest');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [settings, setSettings] = useState(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    (async () => {
      const id = await getShopOwnerId();
      setOwnerId(id);
    })();
    fetchShopSettings().then(setSettings).catch(() => {});
  }, []);

  // Load catalog (same as ShopScreen)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
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
        const list = [...rows, ...restRows].map((item, idx) => normalizeShopProduct(item, idx));
        if (!cancelled) setProducts(list);
      } catch { if (!cancelled) setProducts([]); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  // Cart
  const refreshCart = async (oid) => {
    try {
      const raw = await AsyncStorage.getItem(`mynaaiShopCart:${oid}`);
      const lines = raw ? JSON.parse(raw) : [];
      setCart(Array.isArray(lines) ? lines : []);
    } catch { setCart([]); }
  };
  useEffect(() => { if (ownerId) refreshCart(ownerId); }, [ownerId]);

  const persist = async (lines) => {
    try { await AsyncStorage.setItem(`mynaaiShopCart:${ownerId}`, JSON.stringify(lines)); } catch {}
    setCart(lines);
  };

  const add = async (product, qty = 1) => {
    const raw = await AsyncStorage.getItem(`mynaaiShopCart:${ownerId}`);
    const lines = raw ? JSON.parse(raw) : [];
    const pid = String(product?.id || product?.productId || '');
    const idx = lines.findIndex(l => l.productId === pid);
    if (idx >= 0) lines[idx].qty = Math.min(99, lines[idx].qty + Math.max(1, Math.round(Number(qty) || 1)));
    else lines.push({
      productId: pid,
      name: product.name,
      price: Number(product.price) || 0,
      mrp: Number(product.mrp) || 0,
      image: product.image || '',
      category: product.category || '',
      gender: product.gender || '',
      salonName: product.salonName || '',
      qty: Math.max(1, Math.round(Number(qty) || 1)),
    });
    await persist(lines);
    try { await communication.shopCartAdd({ productId: pid, qty }); } catch {}
  };

  const setQty = async (pid, next) => {
    const raw = await AsyncStorage.getItem(`mynaaiShopCart:${ownerId}`);
    let lines = raw ? JSON.parse(raw) : [];
    const n = Math.round(Number(next) || 0);
    if (n <= 0) lines = lines.filter(l => l.productId !== String(pid));
    else {
      const idx = lines.findIndex(l => l.productId === String(pid));
      if (idx >= 0) lines[idx].qty = Math.min(99, n);
    }
    await persist(lines);
    try {
      if (n <= 0) await communication.shopCartRemove({ productId: String(pid) });
      else await communication.shopCartSetQty({ productId: String(pid), qty: n });
    } catch {}
  };

  useEffect(() => { setActiveImage(0); }, [productId]);

  const product = useMemo(() => products.find(p => String(p.id) === productId) || null, [products, productId]);
  const images = useMemo(() => (product?.images?.length ? product.images : product?.image ? [product.image] : []), [product]);
  const similar = useMemo(() => {
    if (!product) return [];
    return products.filter(p => p.available && p.category === product.category && String(p.id) !== String(product.id)).sort((a,b)=>b.rating-a.rating||a.name.localeCompare(b.name)).slice(0,6);
  }, [products, product]);
  const totals = useMemo(() => cartTotals(cart, settings), [cart, settings]);
  const qtyFor = id => cart.find(l => l.productId === String(id))?.qty || 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={BLINKIT.green} />
        <Text style={styles.loadingText}>Loading product…</Text>
      </SafeAreaView>
    );
  }
  if (!product) {
    return (
      <SafeAreaView style={styles.loadingWrap}>
        <Ionicons name="cube-outline" size={48} color={BLINKIT.muted} />
        <Text style={styles.emptyTitle}>Product not available</Text>
        <Text style={styles.emptySub}>It may have been removed from the catalog.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Back to shop</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const off = discountPercent(product);
  const genderLabel = SHOP_GENDERS.find(g => g.id === product.gender)?.label || 'Unisex';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product details</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ShopCart')} style={styles.headerBtn}>
          <Ionicons name="bag-handle-outline" size={20} color="#1a1a1a" />
          {totals.itemCount > 0 && <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>{totals.itemCount}</Text></View>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.hero}>
          {images.length ? (
            <Image source={{ uri: getFileUrl(images[Math.min(activeImage, images.length-1)] || '') }} style={styles.heroImage} resizeMode="contain" />
          ) : (
            <View style={styles.heroPlaceholder}><Ionicons name="image-outline" size={48} color="#ccc" /></View>
          )}
          {!product.available && <View style={styles.veil}><Text style={styles.veilText}>Out of stock</Text></View>}
          {off > 0 && <View style={styles.heroOff}><Text style={styles.heroOffText}>{off}% OFF</Text></View>}
        </View>
        {images.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
            {images.map((img, idx) => (
              <TouchableOpacity key={img} style={[styles.thumb, idx === activeImage && styles.thumbActive]} onPress={() => setActiveImage(idx)}>
                <Image source={{ uri: getFileUrl(img) }} style={styles.thumbImg} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Tags */}
        <View style={styles.tags}>
          <View style={styles.tag}><Text style={styles.tagText}>{categoryLabel(product.category)}</Text></View>
          <View style={styles.tag}><Text style={styles.tagText}>{genderLabel}</Text></View>
          <View style={[styles.tag, product.available ? styles.tagGreen : styles.tagRed]}>
            <Text style={[styles.tagText, product.available ? styles.tagTextGreen : styles.tagTextRed]}>{product.available ? 'In stock' : 'Out of stock'}</Text>
          </View>
        </View>

        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.seller}>{product.salonName ? `Sold by ${product.salonName}` : 'Supplied by My Naai'}</Text>

        <View style={styles.priceRow}>
          <View style={styles.priceLeft}>
            <Text style={styles.price}>₹{product.price}</Text>
            {product.mrp > 0 && <Text style={styles.mrp}>₹{product.mrp}</Text>}
            {off > 0 && <View style={styles.offInline}><Text style={styles.offInlineText}>{off}% off</Text></View>}
          </View>
          {product.rating > 0 && (
            <View style={styles.rating}><Ionicons name="star" size={12} color="#fff" /><Text style={styles.ratingText}>{Number(product.rating).toFixed(1)}</Text></View>
          )}
        </View>

        <View style={styles.actionRow}>
          <ShopQuantityControl qty={qtyFor(product.id)} onAdd={() => add(product,1)} onSet={next => setQty(product.id, next)} disabled={!product.available} large />
          <Text style={styles.actionHint}>{qtyFor(product.id) ? `${qtyFor(product.id)} in cart` : 'Add to cart for salon supply'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>About this product</Text>
          <Text style={styles.cardText}>{product.description || `${categoryLabel(product.category)} pick${product.salonName ? ` from ${product.salonName}` : ' from the Naai Shop catalog'} — delivered to your salon in 1–2 days.`}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}><Ionicons name="car-outline" size={16} color={BLINKIT.green} /><Text style={styles.cardTitle}>Delivery</Text></View>
          <View style={styles.deliveryLine}><Ionicons name="flash" size={13} color={BLINKIT.green} /><Text style={styles.deliveryText}>Next-day delivery to your salon · {settings && product.price >= settings.freeDeliveryAbove ? 'FREE on this item' : `free above ₹${settings?.freeDeliveryAbove || 499}`}</Text></View>
          <View style={styles.deliveryLine}><Ionicons name="cash-outline" size={13} color={BLINKIT.green} /><Text style={styles.deliveryText}>{settings?.codThreshold > 0 && product.price > settings.codThreshold ? 'Online payment via UPI, cards & netbanking' : 'Cash on delivery available • online via UPI, cards & netbanking'}</Text></View>
          <View style={styles.deliveryLine}><Ionicons name="shield-checkmark-outline" size={13} color={BLINKIT.green} /><Text style={styles.deliveryText}>Free cancellation until order goes out for delivery</Text></View>
        </View>

        {similar.length > 0 && (
          <View style={styles.similarSection}>
            <Text style={styles.similarTitle}>You may also like</Text>
            <View style={styles.similarGrid}>
              {similar.map(p => (
                <ShopProductCard key={p.id} product={p} qty={qtyFor(p.id)} onAdd={add} onSetQty={(prod, next)=>setQty(prod.id, next)} onOpen={(prod)=> navigation.replace('ShopProductDetail', { productId: prod.id })} style={styles.similarCard} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <ShopCartBar totals={totals} onOpen={() => navigation.navigate('ShopCart')} />
    </SafeAreaView>
  );
};

export default ShopProductDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
  headerBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#1a1a1a', fontSize: 15, fontWeight: '800' },
  headerBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: BLINKIT.green, minWidth: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  headerBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', gap: 8 },
  loadingText: { color: '#888', marginTop: 8 },
  emptyTitle: { color: '#1a1a1a', fontSize: 16, fontWeight: '800', marginTop: 12 },
  emptySub: { color: '#888', fontSize: 12, marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },
  backBtn: { marginTop: 14, backgroundColor: BLINKIT.green, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  backBtnText: { color: '#fff', fontWeight: '800' },
  scroll: { paddingBottom: 90 },
  hero: { aspectRatio: 1, backgroundColor: '#fafafa', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  heroImage: { width: '85%', height: '85%' },
  heroPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  veil: { position: 'absolute', bottom: 12, left: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.7)', paddingVertical: 6, borderRadius: 10, alignItems: 'center' },
  veilText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  heroOff: { position: 'absolute', top: 12, left: 12, backgroundColor: BLINKIT.green, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  heroOffText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  thumbs: { padding: 12, gap: 8 },
  thumb: { width: 56, height: 56, borderRadius: 10, borderWidth: 1.5, borderColor: '#eee', overflow: 'hidden', backgroundColor: '#fafafa' },
  thumbActive: { borderColor: BLINKIT.green, backgroundColor: '#fff' },
  thumbImg: { width: '100%', height: '100%' },
  tags: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, marginTop: 6, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee' },
  tagText: { color: '#666', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  tagGreen: { backgroundColor: '#e8f5e9', borderColor: '#c8e6c9' },
  tagRed: { backgroundColor: '#ffebee', borderColor: '#ffcdd2' },
  tagTextGreen: { color: BLINKIT.green },
  tagTextRed: { color: '#d32f2f' },
  name: { color: '#1a1a1a', fontSize: 17, fontWeight: '800', paddingHorizontal: 14, marginTop: 12, lineHeight: 22 },
  seller: { color: '#888', fontSize: 12, paddingHorizontal: 14, marginTop: 4 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, marginTop: 10 },
  priceLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { color: '#1a1a1a', fontSize: 18, fontWeight: '800' },
  mrp: { color: '#999', fontSize: 13, textDecorationLine: 'line-through' },
  offInline: { backgroundColor: BLINKIT.green, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 6 },
  offInlineText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  rating: { flexDirection: 'row', alignItems: 'center', backgroundColor: BLINKIT.green, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  ratingText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, marginTop: 14 },
  actionHint: { color: '#888', fontSize: 11, fontWeight: '600' },
  card: { margin: 14, padding: 14, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#eee' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle: { color: '#1a1a1a', fontSize: 13, fontWeight: '800' },
  cardText: { color: '#666', fontSize: 12, lineHeight: 18 },
  deliveryLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  deliveryText: { color: '#555', fontSize: 11, fontWeight: '500', flex: 1, lineHeight: 15 },
  similarSection: { padding: 12 },
  similarTitle: { color: '#1a1a1a', fontSize: 15, fontWeight: '800', marginBottom: 12 },
  similarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  similarCard: { width: '48.5%', marginBottom: 10 },
});
