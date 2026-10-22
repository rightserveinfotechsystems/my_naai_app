// Ported from my-naai-web/src/lib/geo.js — single source of truth for distances & maps
const EARTH_RADIUS_KM = 6371;

export function toCoordinate(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function isValidLatitude(value) {
  const number = toCoordinate(value);
  return number !== null && number >= -90 && number <= 90;
}

export function isValidLongitude(value) {
  const number = toCoordinate(value);
  return number !== null && number >= -180 && number <= 180;
}

export function toPoint(source) {
  if (!source) return null;
  const latitude = toCoordinate(source.latitude ?? source.lat);
  const longitude = toCoordinate(source.longitude ?? source.lng ?? source.lon);
  if (latitude === null || longitude === null) return null;
  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) return null;
  return { latitude, longitude };
}

export function getDistanceInKm(lat1, lon1, lat2, lon2) {
  const rawValues = [lat1, lon1, lat2, lon2];
  if (rawValues.some(value => value === null || value === undefined || String(value).trim() === '')) return null;
  const values = rawValues.map(Number);
  if (values.some(value => !Number.isFinite(value))) return null;
  const [aLat, aLon, bLat, bLon] = values;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a))));
}

export function distanceBetween(from, to) {
  const a = toPoint(from);
  const b = toPoint(to);
  if (!a || !b) return null;
  const km = getDistanceInKm(a.latitude, a.longitude, b.latitude, b.longitude);
  return Number.isFinite(km) ? km : null;
}

export function normalizeDistanceInKm(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const text = String(value).trim().toLowerCase();
  const match = text.match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const number = Number(match[0].replace(',', '.'));
  if (!Number.isFinite(number) || number <= 0) return null;
  return text.includes('meter') || /\bm\b/.test(text) ? number / 1000 : number;
}

export function formatDistanceInKm(value, { zeroLabel = '< 0.1 km' } = {}) {
  if (value === null || value === undefined || String(value).trim() === '') return '';
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return '';
  if (number === 0) return zeroLabel;
  if (number < 0.1) return '< 0.1 km';
  return `${Number(number.toFixed(1))} km`;
}

export function formatCoordinates(source, digits = 5) {
  const point = toPoint(source);
  if (!point) return '';
  return `${point.latitude.toFixed(digits)}, ${point.longitude.toFixed(digits)}`;
}

export function mapsUrl(source) {
  const point = toPoint(source);
  if (!point) return '';
  return `https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}`;
}

export function openStreetMapEmbedUrl(source, { span = 0.008 } = {}) {
  const point = toPoint(source);
  if (!point) return '';
  const left = (point.longitude - span).toFixed(6);
  const right = (point.longitude + span).toFixed(6);
  const top = (point.latitude + span).toFixed(6);
  const bottom = (point.latitude - span).toFixed(6);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left},${bottom},${right},${top}&layer=mapnik&marker=${point.latitude},${point.longitude}`;
}

export function locationAgeLabel(value, now = Date.now()) {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) return '';
  const minutes = Math.max(0, Math.round((now - then) / 60000));
  if (minutes < 2) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(then).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function deliveryPointOf(source) {
  if (!source) return null;
  return toPoint(source.deliveryLocation) || toPoint(source) || null;
}

// React Native wrapper for browser geolocation — uses react-native-geolocation-service
import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

async function requestLocationPermission() {
  if (Platform.OS === 'android') {
    try {
      // Already granted? Avoid second prompt
      const hasFine = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      if (hasFine) return { granted: true };
      const hasCoarse = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);
      if (hasCoarse) return { granted: true };
      const fineResult = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
        title: 'Location permission',
        message: 'My Naai needs your location to set the delivery pin.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      });
      if (fineResult === PermissionsAndroid.RESULTS.GRANTED) return { granted: true };
      if (fineResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return { granted: false, neverAsk: true, code: 1 };
      if (fineResult === PermissionsAndroid.RESULTS.DENIED) return { granted: false, code: 1 };
      // Fallback to coarse (Android 12+ may offer approximate only)
      try {
        const coarseResult = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);
        if (coarseResult === PermissionsAndroid.RESULTS.GRANTED) return { granted: true };
        if (coarseResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return { granted: false, neverAsk: true, code: 1 };
      } catch {}
      return { granted: false, code: 1 };
    } catch {
      return { granted: false, code: 1 };
    }
  }
  // iOS: try react-native-permissions for precise status, otherwise let OS prompt
  try {
    const { check, request, PERMISSIONS, RESULTS } = require('react-native-permissions');
    const status = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) return { granted: true };
    if (status === RESULTS.BLOCKED) return { granted: false, neverAsk: true, code: 1 };
    const req = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    if (req === RESULTS.GRANTED || req === RESULTS.LIMITED) return { granted: true };
    return { granted: false, code: 1 };
  } catch {
    return { granted: true }; // fall through to system prompt — unknown, let Geolocation decide
  }
}

// Internal helper that mirrors web's getBrowserLocation contract: { value, code }
// code: 0 success, 1 permission denied, 2 position unavailable, 3 timeout
function locateOnce(requestOptions) {
  return new Promise(resolve => {
    Geolocation.getCurrentPosition(
      pos => resolve({ value: { latitude: pos.coords.latitude, longitude: pos.coords.longitude }, code: 0, message: '' }),
      err => resolve({ value: null, code: err?.code || 0, message: err?.message || '' }),
      requestOptions,
    );
  });
}

export async function getCurrentLocationDiagnostic(options = {}) {
  const perm = await requestLocationPermission();
  if (!perm.granted) {
    return { value: null, code: perm.code || 1, message: perm.neverAsk ? 'Permission blocked — enable in Settings' : 'Permission denied', neverAsk: !!perm.neverAsk };
  }
  // First attempt: high accuracy with system dialog to enable GPS if disabled
  const firstOpts = {
    enableHighAccuracy: true,
    timeout: options.timeout || 15000,
    maximumAge: 10000,
    forceRequestLocation: true,
    showLocationDialog: true,
    forceLocationManager: false,
    ...options,
  };
  let res = await locateOnce(firstOpts);
  if (res.value) return res;
  // Retry on timeout only (code 3) — like web's cold Android fix; never retry on permission denial (code 1)
  if (res.code === 3 && !options.timeout) {
    const retryOpts = {
      enableHighAccuracy: false,
      timeout: 25000,
      maximumAge: 10000,
      forceRequestLocation: true,
      showLocationDialog: true,
      ...options,
    };
    const second = await locateOnce(retryOpts);
    if (second.value) return second;
    // If second also timed out, keep its code
    res = second;
  }
  // If position unavailable (code 2) try opposite accuracy mode once — some OEMs need network provider
  if (res.code === 2) {
    const altOpts = {
      enableHighAccuracy: !firstOpts.enableHighAccuracy,
      timeout: 20000,
      maximumAge: 10000,
      forceRequestLocation: true,
      showLocationDialog: true,
      ...options,
    };
    const alt = await locateOnce(altOpts);
    if (alt.value) return alt;
  }
  return res;
}

export function getCurrentLocation(options = {}) {
  return getCurrentLocationDiagnostic(options).then(r => r.value);
}

// Alias for web parity: getBrowserLocation
export const getBrowserLocation = getCurrentLocation;
export const getBrowserLocationDiagnostic = getCurrentLocationDiagnostic;
