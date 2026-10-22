import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { APP_THEME } from './shopTheme';
import { toPoint, formatCoordinates, mapsUrl } from './geo';
import { WebView } from 'react-native-webview';

const NAGPUR_FALLBACK = { latitude: 21.1458, longitude: 79.0882 };
const DELHI_FALLBACK = { latitude: 28.6139, longitude: 77.209 };

// Leaflet HTML — OSM tiles, draggable marker, tap to place
function leafletHtml(lat, lng, zoom = 15) {
  // Escape: numbers only, so safe
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html,body{height:100%;margin:0;padding:0;background:#0F1212;overflow:hidden}
  #map{height:100%;width:100%;}
  .leaflet-control-attribution{font-size:9px;opacity:0.7}
</style>
</head>
<body>
<div id="map"></div>
<script>
var map = L.map('map', { zoomControl:true, attributionControl:true }).setView([${lat}, ${lng}], ${zoom});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19, attribution:'© OpenStreetMap' }).addTo(map);
var marker = L.marker([${lat}, ${lng}], { draggable:true }).addTo(map);

function emit(lat,lng){
  try{ window.ReactNativeWebView.postMessage(JSON.stringify({lat:lat,lng:lng})); }catch(e){}
}

marker.on('dragend', function(){
  var p = marker.getLatLng();
  emit(p.lat, p.lng);
});
map.on('click', function(e){
  marker.setLatLng(e.latlng);
  emit(e.latlng.lat, e.latlng.lng);
});

// RN -> WebView
window.setPinFromRN = function(lat,lng){
  try{
    var ll = L.latLng(lat,lng);
    marker.setLatLng(ll);
    map.setView(ll, map.getZoom());
  }catch(e){}
};
window.addEventListener("message", function(e){
  try{
    var d = JSON.parse(e.data);
    if(d && typeof d.lat==='number' && typeof d.lng==='number') window.setPinFromRN(d.lat,d.lng);
  }catch{}
});
document.addEventListener("message", function(e){
  try{
    var d = JSON.parse(e.data);
    if(d && typeof d.lat==='number' && typeof d.lng==='number') window.setPinFromRN(d.lat,d.lng);
  }catch{}
});
</script>
</body>
</html>`;
}

// Nominatim search — no API key, free; requires User-Agent, but RN fetch will supply one.
async function searchPlaces(query) {
  const q = String(query || '').trim();
  if (q.length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=in&addressdetails=1`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'MyNaai/1.0 (my-naai-app)',
    },
  });
  if (!res.ok) throw new Error('Search failed');
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map(item => ({
    id: String(item.place_id),
    display: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon),
    type: item.type,
  })).filter(r => Number.isFinite(r.lat) && Number.isFinite(r.lng));
}

export function ShopMapPinPicker({ visible, initial, onConfirm, onClose }) {
  const insets = useSafeAreaInsets();
  const webRef = useRef(null);
  const initialPoint = toPoint(initial) || NAGPUR_FALLBACK;
  const [pending, setPending] = useState(initialPoint);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [webError, setWebError] = useState(false);

  useEffect(() => {
    if (visible) {
      const pt = toPoint(initial) || NAGPUR_FALLBACK;
      setPending(pt);
      setResults([]);
      setQuery('');
      setMapReady(false);
      setWebError(false);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const pushToWebView = useCallback((pt) => {
    try {
      const js = `window.setPinFromRN(${pt.latitude}, ${pt.longitude}); true;`;
      webRef.current?.injectJavaScript(js);
    } catch {}
  }, []);

  const handleWebMessage = useCallback((e) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      const pt = toPoint({ latitude: data.lat, longitude: data.lng });
      if (pt) setPending(pt);
    } catch {}
  }, []);

  const doSearch = async () => {
    const q = query.trim();
    if (q.length < 3) {
      Alert.alert('Type more', 'Enter at least 3 characters — e.g. “Home, Manish Nagar, Nagpur” or “Office, Sitabuldi”.');
      return;
    }
    setSearching(true);
    try {
      const hits = await searchPlaces(q);
      setResults(hits);
      if (hits.length === 0) Alert.alert('No results', 'No place found for that text. Try a broader query like “Nagpur” + area name.');
    } catch (err) {
      Alert.alert('Search failed', 'Could not search maps right now. Check internet and try again.');
    } finally {
      setSearching(false);
    }
  };

  const pickResult = (r) => {
    const pt = toPoint({ latitude: r.lat, longitude: r.lng });
    if (!pt) return;
    setPending(pt);
    pushToWebView(pt);
    setResults([]);
    setQuery(r.display);
  };

  const nudge = (dLat, dLng) => {
    const next = { latitude: pending.latitude + dLat, longitude: pending.longitude + dLng };
    const pt = toPoint(next);
    if (!pt) return;
    setPending(pt);
    pushToWebView(pt);
  };

  const handleConfirm = () => {
    if (!toPoint(pending)) return Alert.alert('Pick a pin', 'Move the pin on the map to exact spot.');
    onConfirm?.(pending);
    onClose?.();
  };

  const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${pending.latitude},${pending.longitude}&zoom=16&size=600x400&markers=${pending.latitude},${pending.longitude},red-pushpin`;
  const html = leafletHtml(pending.latitude, pending.longitude, 15);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn} hitSlop={8}>
            <Ionicons name="close" size={20} color={APP_THEME.white} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Pin delivery location</Text>
            <Text style={styles.headerSub}>Search address and drag pin to exact spot</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Search bar */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={14} color={APP_THEME.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search area, e.g. Manish Nagar Nagpur"
              placeholderTextColor={APP_THEME.muted}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={doSearch}
              returnKeyType="search"
              autoCorrect={false}
            />
            {query.length > 0 ? (
              <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={APP_THEME.muted} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={doSearch} disabled={searching} activeOpacity={0.85}>
            {searching ? <ActivityIndicator size="small" color={APP_THEME.bg} /> : <Text style={styles.searchBtnText}>Search</Text>}
          </TouchableOpacity>
        </View>

        {results.length > 0 ? (
          <View style={styles.resultsBox}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ maxHeight: 140 }}>
              {results.map(r => (
                <TouchableOpacity key={r.id} style={styles.resultRow} onPress={() => pickResult(r)} activeOpacity={0.8}>
                  <Ionicons name="location-outline" size={14} color={APP_THEME.gold} />
                  <Text numberOfLines={2} style={styles.resultText}>{r.display}</Text>
                  <Ionicons name="chevron-forward" size={12} color={APP_THEME.muted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Map */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.mapWrap}>
          {webError ? (
            <View style={styles.webWrap}>
              <Image source={{ uri: staticMapUrl }} style={styles.fallbackImage} resizeMode="cover" />
              <View style={styles.fallbackPin} pointerEvents="none">
                <Ionicons name="location" size={36} color={APP_THEME.gold} />
                <View style={styles.fallbackPinShadow} />
              </View>
              <View style={styles.centerHint} pointerEvents="none">
                <View style={styles.hintPill}>
                  <Ionicons name="map-outline" size={10} color={APP_THEME.gold} />
                  <Text style={styles.hintText}>Move pin with controls below</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.webWrap}>
              <WebView
                ref={webRef}
                source={{ html, baseUrl: 'https://unpkg.com' }}
                onMessage={handleWebMessage}
                onLoadEnd={() => setMapReady(true)}
                onError={() => setWebError(true)}
                onHttpError={() => setWebError(true)}
                style={styles.webview}
                originWhitelist={['*']}
                mixedContentMode="always"
                javaScriptEnabled
                domStorageEnabled
                allowFileAccess
                setSupportMultipleWindows={false}
              />
              {!mapReady ? (
                <View style={styles.mapLoading}>
                  <ActivityIndicator color={APP_THEME.gold} />
                  <Text style={styles.mapLoadingText}>Loading map…</Text>
                </View>
              ) : null}
              <View style={styles.centerHint} pointerEvents="none">
                <View style={styles.hintPill}>
                  <Ionicons name="hand-left-outline" size={10} color={APP_THEME.gold} />
                  <Text style={styles.hintText}>Tap map or drag pin • pinch to zoom</Text>
                </View>
              </View>
            </View>
          )}

          {/* Coord controls */}
          <View style={styles.controls}>
            <View style={styles.coordsRow}>
              <View style={styles.coordsBadge}>
                <View style={styles.coordsDot} />
                <Text style={styles.coordsText}>{formatCoordinates(pending, 5)}</Text>
                <TouchableOpacity onPress={() => pending && Linking.openURL(mapsUrl(pending))} hitSlop={8} style={styles.openMapsBtn}>
                  <Text style={styles.openMapsText}>Open in Maps</Text>
                  <Ionicons name="open-outline" size={11} color={APP_THEME.gold} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.nudgeRow}>
              <Text style={styles.nudgeLabel}>Fine-tune pin</Text>
              <View style={styles.nudgeGrid}>
                <TouchableOpacity style={styles.nudgeBtn} onPress={() => nudge(0.0005, 0)}><Ionicons name="chevron-up" size={14} color={APP_THEME.white} /></TouchableOpacity>
                <View style={styles.nudgeMidRow}>
                  <TouchableOpacity style={styles.nudgeBtn} onPress={() => nudge(0, -0.0005)}><Ionicons name="chevron-back" size={14} color={APP_THEME.white} /></TouchableOpacity>
                  <View style={styles.nudgeCenter}><Ionicons name="locate" size={12} color={APP_THEME.gold} /></View>
                  <TouchableOpacity style={styles.nudgeBtn} onPress={() => nudge(0, 0.0005)}><Ionicons name="chevron-forward" size={14} color={APP_THEME.white} /></TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.nudgeBtn} onPress={() => nudge(-0.0005, 0)}><Ionicons name="chevron-down" size={14} color={APP_THEME.white} /></TouchableOpacity>
              </View>
              <Text style={styles.nudgeHint}>Each tap moves ~50 m — use map zoom + drag for big moves</Text>
            </View>
          </View>

          {/* Confirm */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) + 8 }]}>
            <View style={styles.footerNote}>
              <Ionicons name="shield-checkmark-outline" size={12} color={APP_THEME.gold} />
              <Text style={styles.footerNoteText}>Delivery partner navigates to this pin. Make sure the pin is on your building/gate, not the street centre.</Text>
            </View>
            <View style={styles.footerActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.85}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.9}>
                <Ionicons name="checkmark-circle" size={16} color={APP_THEME.bg} />
                <Text style={styles.confirmText}>Confirm pin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_THEME.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 10, backgroundColor: APP_THEME.bg, borderBottomWidth: 1, borderColor: APP_THEME.line, gap: 8 },
  headerBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: APP_THEME.card, borderWidth: 1, borderColor: APP_THEME.line, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: APP_THEME.white, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  headerSub: { color: APP_THEME.muted, fontSize: 10, textAlign: 'center', marginTop: 3, lineHeight: 13, paddingHorizontal: 8 },
  searchWrap: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: APP_THEME.card, borderBottomWidth: 1, borderColor: APP_THEME.line, alignItems: 'center' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: APP_THEME.bg, borderWidth: 1, borderColor: APP_THEME.line, borderRadius: 10, paddingHorizontal: 10, height: 38 },
  searchInput: { flex: 1, color: APP_THEME.white, fontSize: 12, paddingVertical: 0 },
  searchBtn: { backgroundColor: APP_THEME.gold, paddingHorizontal: 14, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', minWidth: 64 },
  searchBtnText: { color: APP_THEME.bg, fontWeight: '800', fontSize: 12 },
  resultsBox: { backgroundColor: APP_THEME.card, borderBottomWidth: 1, borderColor: APP_THEME.line, paddingHorizontal: 12, paddingVertical: 8 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: APP_THEME.line },
  resultText: { flex: 1, color: APP_THEME.white, fontSize: 11, lineHeight: 14 },
  mapWrap: { flex: 1 },
  webWrap: { flex: 1, backgroundColor: '#0F1212', position: 'relative' },
  webview: { flex: 1, backgroundColor: '#0F1212' },
  mapLoading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,10,10,0.85)', justifyContent: 'center', alignItems: 'center', gap: 8 },
  mapLoadingText: { color: APP_THEME.muted, fontSize: 11, marginTop: 6 },
  centerHint: { position: 'absolute', top: 10, left: 0, right: 0, alignItems: 'center' },
  hintPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.72)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(232,185,126,0.3)' },
  hintText: { color: APP_THEME.white, fontSize: 10, fontWeight: '600' },
  fallbackImage: { flex: 1, width: '100%', backgroundColor: '#0F1212' },
  fallbackPin: { position: 'absolute', top: '50%', left: '50%', marginTop: -18, marginLeft: -14, alignItems: 'center' },
  fallbackPinShadow: { width: 22, height: 6, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.45)', marginTop: -4 },
  controls: { backgroundColor: APP_THEME.card, borderTopWidth: 1, borderColor: APP_THEME.line, padding: 12, gap: 10 },
  coordsRow: { flexDirection: 'row', justifyContent: 'center' },
  coordsBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: APP_THEME.bg, borderWidth: 1, borderColor: APP_THEME.line, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  coordsDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: APP_THEME.gold },
  coordsText: { color: APP_THEME.white, fontSize: 11, fontWeight: '700' },
  openMapsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 6, paddingLeft: 8, borderLeftWidth: 1, borderColor: APP_THEME.line },
  openMapsText: { color: APP_THEME.gold, fontSize: 10, fontWeight: '700' },
  nudgeRow: { alignItems: 'center', gap: 6, backgroundColor: APP_THEME.bg, borderWidth: 1, borderColor: APP_THEME.line, borderRadius: 10, padding: 10 },
  nudgeLabel: { color: APP_THEME.mutedLight, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  nudgeGrid: { alignItems: 'center', gap: 6 },
  nudgeBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: APP_THEME.card, borderWidth: 1, borderColor: APP_THEME.line, justifyContent: 'center', alignItems: 'center' },
  nudgeMidRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nudgeCenter: { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(232,185,126,0.12)', borderWidth: 1, borderColor: 'rgba(232,185,126,0.2)', justifyContent: 'center', alignItems: 'center' },
  nudgeHint: { color: APP_THEME.muted, fontSize: 9, textAlign: 'center', lineHeight: 12 },
  footer: { backgroundColor: APP_THEME.card, borderTopWidth: 1, borderColor: APP_THEME.line, paddingHorizontal: 12, paddingTop: 10, gap: 10 },
  footerNote: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  footerNoteText: { color: APP_THEME.muted, fontSize: 10, flex: 1, lineHeight: 13 },
  footerActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: APP_THEME.line, backgroundColor: APP_THEME.bg, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelText: { color: APP_THEME.white, fontWeight: '700', fontSize: 12 },
  confirmBtn: { flex: 1.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: APP_THEME.gold, paddingVertical: 12, borderRadius: 10 },
  confirmText: { color: APP_THEME.bg, fontWeight: '800', fontSize: 12 },
});
