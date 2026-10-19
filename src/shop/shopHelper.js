import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getShopOwnerId() {
  try {
    const raw = await AsyncStorage.getItem('mynaaiUser');
    if (!raw) return 'guest';
    const parsed = JSON.parse(raw);
    return String(parsed?.salon?.salonId || parsed?.userId || parsed?.id || parsed?.salonId || 'guest');
  } catch {
    return 'guest';
  }
}

export async function getShopSalonName() {
  try {
    const raw = await AsyncStorage.getItem('mynaaiUser');
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    return parsed?.salon?.salonName || parsed?.salonName || parsed?.fullName || parsed?.user?.salon?.salonName || '';
  } catch {
    return '';
  }
}

export async function getShopAddressDefaults() {
  try {
    const raw = await AsyncStorage.getItem('mynaaiUser');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const user = parsed?.salon ? parsed.salon : parsed;
    const merged = { ...parsed, ...user, ...(user?.salon || {}) };
    return {
      name: merged.ownerName || merged.fullName || merged.name || '',
      phone: merged.phoneNumber || merged.phone || '',
      line1: merged.addressLine1 || merged.address || `${merged.salonName || 'Salon'}, ` + [merged.addressLine1, merged.city].filter(Boolean).join(', '),
      city: merged.city || '',
      state: merged.state || '',
      pincode: merged.pincode || '',
    };
  } catch {
    return null;
  }
}

export function formatCurrency(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return `₹ ${value || 0}`;
  return `₹ ${n.toLocaleString('en-IN')}`;
}

export function getSalonCityFallback() {
  return '';
}
