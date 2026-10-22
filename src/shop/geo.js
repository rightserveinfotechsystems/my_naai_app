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
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
        title: 'Location permission',
        message: 'My Naai needs your location to set the delivery pin.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      });
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  }
  // iOS: the library will prompt automatically on getCurrentPosition, but we can try via react-native-permissions if available
  try {
    const { check, request, PERMISSIONS, RESULTS } = require('react-native-permissions');
    const status = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) return true;
    const req = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    return req === RESULTS.GRANTED || req === RESULTS.LIMITED;
  } catch {
    return true; // fall through to system prompt
  }
}

export function getCurrentLocation(options = {}) {
  return new Promise(async resolve => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return resolve(null);
    Geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      err => resolve(null),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000, forceRequestLocation: true, ...options },
    );
  });
}

// Alias for web parity: getBrowserLocation
export const getBrowserLocation = getCurrentLocation;
