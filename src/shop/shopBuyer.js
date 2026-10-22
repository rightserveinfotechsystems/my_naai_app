// Mirrors my-naai-web/src/lib/shopBuyer.js — audience-aware shop helpers
export const SHOP_AUDIENCE = {
  SALON: 'SALON',
  CUSTOMER: 'CUSTOMER',
  GUEST: 'GUEST',
};

export function shopAudience(session) {
  if (!session || !session.userId) return SHOP_AUDIENCE.GUEST;
  return String(session.role || '').toUpperCase() === 'SALON' ? SHOP_AUDIENCE.SALON : SHOP_AUDIENCE.CUSTOMER;
}

export function isShopGuest(session) {
  return shopAudience(session) === SHOP_AUDIENCE.GUEST;
}

export function buyerName(session) {
  const user = session?.user || {};
  const salon = user.salon || {};
  if (shopAudience(session) === SHOP_AUDIENCE.SALON) {
    return String(salon.salonName || user.salonName || user.ownerName || user.fullName || 'My Naai salon').trim();
  }
  return String(user.fullName || user.name || user.ownerName || '').trim();
}

export function shopStorageOwnerId(session) {
  if (!session?.userId) return 'guest';
  const id = String(session.userId);
  return shopAudience(session) === SHOP_AUDIENCE.SALON ? id : `user:${id}`;
}

export function shopCopy(session) {
  const audience = shopAudience(session);
  const salon = audience === SHOP_AUDIENCE.SALON;
  const guest = audience === SHOP_AUDIENCE.GUEST;
  return {
    audience,
    isSalon: salon,
    isGuest: guest,
    title: 'Naai Shop',
    subtitle: salon ? 'Grooming stock for your salon, supplied by My Naai.' : 'Salon-grade grooming products, delivered to your door.',
    deliveryTarget: salon ? 'your salon' : 'your address',
    addressFieldLabel: salon ? 'Shop / salon address' : 'Delivery address',
    checkoutSubtitle: salon ? 'Delivery to your salon' : 'Delivery to your address',
    cartEmptyHint: salon ? 'Fill it with shampoo, clippers and beard oil — delivered to your salon.' : 'Fill it with shampoo, beard oil and grooming essentials — delivered to your door.',
    locationCaption: salon ? 'Our delivery partner navigates to this point. It is the salon GPS location unless you set it here.' : 'Our delivery partner navigates to this point. It is your saved location unless you set it here.',
    codLine: salon ? 'when the order reaches your salon' : 'when the order reaches your address',
    deliveryLine: salon ? 'delivered to your salon in 1–2 days' : 'delivered to your address in 1–2 days',
    sellerFallback: 'Supplied by My Naai',
    deliveredLine: salon ? 'Delivered — enjoy the stock at' : 'Delivered — enjoy your order',
    guestCheckoutTitle: 'Sign in to place this order',
    guestCheckoutLead: 'One OTP signs you in — and creates your account if you are new. Your cart is kept.',
    guestCheckoutPoints: [
      'Delivery needs a phone number we can call.',
      'The order can be tracked and cancelled before it ships.',
      'Reorder from My orders any time.',
    ],
    guestCheckoutCta: 'Sign in / Create account',
    guestCheckoutBack: 'Keep shopping',
  };
}

// Mobile helper: build a lightweight session from AsyncStorage values
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getShopSession() {
  try {
    const rawUser = await AsyncStorage.getItem('mynaaiUser');
    const userType = await AsyncStorage.getItem('userType');
    if (!rawUser) return { userId: null, role: null, user: {} };
    const parsed = JSON.parse(rawUser);
    // mynaaiUser may be {salon: {...}, userId, id} or flat
    const userId = String(parsed?.salon?.salonId || parsed?.userId || parsed?.id || parsed?.salonId || '');
    if (!userId) return { userId: null, role: null, user: parsed };
    const role = String(parsed?.role || userType || (parsed?.salon ? 'SALON' : 'USER')).toUpperCase();
    const normalizedRole = role === 'SALON' ? 'SALON' : role === 'USER' || role === 'CUSTOMER' ? 'CUSTOMER' : role || 'CUSTOMER';
    return { userId, role: normalizedRole, user: parsed };
  } catch {
    return { userId: null, role: null, user: {} };
  }
}

export async function getShopOwnerIdForCurrentUser() {
  const session = await getShopSession();
  return shopStorageOwnerId(session);
}

export async function getShopCopyForCurrentUser() {
  const session = await getShopSession();
  return shopCopy(session);
}
