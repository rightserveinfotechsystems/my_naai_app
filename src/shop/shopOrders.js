// Ported from my-naai-web/src/lib/shopOrders.js — adapted for React Native AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_PREFIX = 'mynaaiShopCart:';
const ORDERS_PREFIX = 'mynaaiShopOrders:';

export const DELIVERY_FEE = 49;
export const FREE_DELIVERY_ABOVE = 499;
export const DEFAULT_SHOP_SETTINGS = {
  freeDeliveryAbove: FREE_DELIVERY_ABOVE,
  deliveryFee: DELIVERY_FEE,
  discountPercent: 0,
  codThreshold: 0,
  codCharges: 0,
};

export const STATUS_TIMELINE = [
  { key: 'placed', label: 'Order placed', atMinutes: 0 },
  { key: 'packed', label: 'Packing your order', atMinutes: 30 },
  { key: 'shipped', label: 'Out for delivery', atMinutes: 180 },
  { key: 'delivered', label: 'Delivered', atMinutes: 26 * 60 },
];
export const DELIVERY_AT_MINUTES = STATUS_TIMELINE[STATUS_TIMELINE.length - 1].atMinutes;

const ORDER_ID_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function orderKey(salonId) {
  return `${ORDERS_PREFIX}${String(salonId || 'guest')}`;
}
function cartKey(salonId) {
  return `${CART_PREFIX}${String(salonId || 'guest')}`;
}

// Async wrappers — keep sync in-memory compat via readJson fallback for direct callers that already hold arrays
function readJsonSync(key, fallback) {
  return fallback;
}

// -------- Cart pure helpers (sync, operate on arrays) --------
export function normalizeCartLine(line = {}) {
  return {
    productId: String(line.productId || line.id || ''),
    name: line.name || 'Untitled product',
    price: Math.max(0, Number(line.price) || 0),
    mrp: Math.max(0, Number(line.mrp) || 0),
    image: line.image || '',
    category: line.category || '',
    gender: line.gender || '',
    salonName: line.salonName || '',
    qty: Math.max(1, Math.min(99, Math.round(Number(line.qty) || 1))),
  };
}

export function cartCount(lines) {
  return (lines || []).reduce((sum, line) => sum + lineQty(line), 0);
}

function lineQty(line) {
  return Math.max(1, Math.min(99, Math.round(Number(line?.qty) || 1)));
}

const clampPercent = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(100, n);
};
const settingsNumber = (settings, field, fallback) => {
  const n = Number(settings?.[field]);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export function cartTotals(lines, settings = null, { method } = {}) {
  const freeAbove = settingsNumber(settings, 'freeDeliveryAbove', FREE_DELIVERY_ABOVE);
  const fee = settingsNumber(settings, 'deliveryFee', DELIVERY_FEE);
  const discountPct = clampPercent(settings?.discountPercent);
  const codCharges = settingsNumber(settings, 'codCharges', 0);

  const itemTotal = (lines || []).reduce((sum, line) => sum + (Number(line?.price) || 0) * lineQty(line), 0);
  const savings = (lines || []).reduce((sum, line) => sum + Math.max(0, (Number(line?.mrp) || 0) - (Number(line?.price) || 0)) * lineQty(line), 0);
  const discount = Math.round((itemTotal * discountPct) / 100);
  const subtotal = itemTotal - discount;
  const deliveryFee = !lines?.length || subtotal >= freeAbove ? 0 : fee;
  const codFee = method === 'COD' ? codCharges : 0;
  return {
    itemCount: cartCount(lines),
    itemTotal,
    savings,
    discount,
    subtotal,
    deliveryFee,
    codFee,
    total: subtotal + deliveryFee + codFee,
    freeDeliveryAbove: freeAbove,
    deliveryFeeBase: fee,
    discountPercent: discountPct,
  };
}

export function freeDeliveryGap(lines, settings = null) {
  const totals = cartTotals(lines, settings);
  if (!lines?.length || totals.deliveryFee === 0) return 0;
  return totals.freeDeliveryAbove - totals.subtotal;
}

// -------- Async storage layer --------
export async function readCart(salonId) {
  try {
    const raw = await AsyncStorage.getItem(cartKey(salonId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const lines = Array.isArray(parsed) ? parsed : [];
    return lines.map(normalizeCartLine);
  } catch {
    return [];
  }
}

export async function saveCart(salonId, lines) {
  try {
    await AsyncStorage.setItem(cartKey(salonId), JSON.stringify((lines || []).map(normalizeCartLine)));
  } catch {}
}

export async function addToCart(salonId, product, qty = 1) {
  const lines = (await readCart(salonId)).map(l => ({ ...l }));
  const pid = String(product?.id || product?.productId || '');
  const idx = lines.findIndex(l => l.productId === pid);
  if (idx >= 0) lines[idx].qty = Math.min(99, lines[idx].qty + Math.max(1, Math.round(Number(qty) || 1)));
  else lines.push(normalizeCartLine({ ...product, productId: pid, qty: Math.max(1, Math.round(Number(qty) || 1)) }));
  await saveCart(salonId, lines);
  return lines;
}

export async function setCartQty(salonId, productId, qty) {
  let lines = (await readCart(salonId)).map(l => ({ ...l }));
  const next = Math.round(Number(qty) || 0);
  const pid = String(productId);
  if (next <= 0) lines = lines.filter(l => l.productId !== pid);
  else {
    const idx = lines.findIndex(l => l.productId === pid);
    if (idx < 0) return lines;
    lines[idx].qty = Math.min(99, next);
  }
  await saveCart(salonId, lines);
  return lines;
}

export async function removeCartLine(salonId, productId) {
  const pid = String(productId);
  const lines = (await readCart(salonId)).map(l => ({ ...l })).filter(l => l.productId !== pid);
  await saveCart(salonId, lines);
  return lines;
}

export async function clearCart(salonId) {
  await saveCart(salonId, []);
  return [];
}

// -------- Orders (pure + async) --------
function randomOrderIdSuffix(length = 4) {
  let v = '';
  for (let i = 0; i < length; i += 1) v += ORDER_ID_CHARS[Math.floor(Math.random() * ORDER_ID_CHARS.length)];
  return v;
}

export function newOrderId(now = Date.now()) {
  return `MN${String(now).toString(36).toUpperCase()}${randomOrderIdSuffix()}`;
}

export async function readOrders(salonId) {
  try {
    const raw = await AsyncStorage.getItem(orderKey(salonId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const orders = Array.isArray(parsed) ? parsed : [];
    return orders.filter(o => o?.id && o?.items?.length).sort((a, b) => String(b.placedAt).localeCompare(String(a.placedAt)));
  } catch {
    return [];
  }
}

export async function findOrder(salonId, orderId) {
  const orders = await readOrders(salonId);
  return orders.find(o => o.id === orderId) || null;
}

export async function saveOrders(salonId, orders) {
  try {
    await AsyncStorage.setItem(orderKey(salonId), JSON.stringify((orders || []).filter(o => o?.id && o?.items?.length)));
  } catch {}
}

export async function upsertLocalOrder(salonId, order) {
  if (!order?.id) return null;
  const orders = await readOrders(salonId);
  const idx = orders.findIndex(v => v.id === order.id);
  if (idx >= 0) orders[idx] = { ...order };
  else orders.unshift({ ...order });
  await saveOrders(salonId, orders);
  return { ...order };
}

function normalizeAddress(address = {}) {
  const base = {
    name: String(address.name || '').trim(),
    phone: String(address.phone || '').trim(),
    line1: String(address.line1 || '').trim(),
    city: String(address.city || '').trim(),
    state: String(address.state || '').trim(),
    pincode: String(address.pincode || '').trim(),
  };
  try {
    const { toPoint } = require('./geo');
    const pt = toPoint(address);
    if (pt) {
      base.latitude = pt.latitude;
      base.longitude = pt.longitude;
    }
  } catch {}
  return base;
}

function deliveryPointOfAddress(address) {
  try {
    const { toPoint } = require('./geo');
    return toPoint(address) || null;
  } catch { return null; }
}

export async function placeOrder(salonId, { items, address, payment, amounts, salonName = '' } = {}, { now = Date.now() } = {}) {
  const order = {
    id: newOrderId(now),
    salonId: String(salonId || 'guest'),
    salonName: String(salonName || ''),
    items: (items || []).map(l => normalizeCartLine(l)),
    address: normalizeAddress(address),
    deliveryLocation: deliveryPointOfAddress(address),
    payment: {
      method: payment?.method === 'COD' ? 'COD' : 'ONLINE',
      status: payment?.status || 'PENDING',
      paymentId: payment?.paymentId || '',
      amount: Math.max(0, Number(payment?.amount) || Number(amounts?.total) || 0),
    },
    amounts: {
      itemTotal: Number(amounts?.itemTotal) || 0,
      savings: Number(amounts?.savings) || 0,
      discount: Number(amounts?.discount) || 0,
      deliveryFee: Number(amounts?.deliveryFee) || 0,
      codFee: Number(amounts?.codFee) || 0,
      total: Number(amounts?.total) || 0,
    },
    placedAt: new Date(now).toISOString(),
    cancelledAt: null,
    cancelReason: '',
  };
  const orders = await readOrders(salonId);
  orders.unshift(order);
  await saveOrders(salonId, orders);
  return order;
}

export const SERVER_STATUS_TO_STEP_INDEX = {
  PENDING: 0,
  CONFIRMED: 1,
  PROCESSING: 2,
  SHIPPED: 2,
  DELIVERED: 3,
  CANCELLED: -1,
};

export function customerStatusToTrackerKey(status) {
  const idx = SERVER_STATUS_TO_STEP_INDEX[String(status || '').toUpperCase()];
  if (idx === undefined) return null;
  return idx === -1 ? 'cancelled' : STATUS_TIMELINE[idx].key;
}

export function getOrderStatus(order, now = Date.now()) {
  if (!order) return { key: 'placed', label: 'Order placed', stepIndex: 0, progress: 0, eta: null };
  if (order.cancelledAt || String(order.serverStatus || '').toUpperCase() === 'CANCELLED') {
    return { key: 'cancelled', label: 'Cancelled', stepIndex: -1, progress: 0, eta: null };
  }
  const serverKey = customerStatusToTrackerKey(order.serverStatus);
  const placedAt = new Date(order.placedAt).getTime() || 0;
  const eta = new Date(placedAt + DELIVERY_AT_MINUTES * 60000);
  if (serverKey) {
    const stepIndex = STATUS_TIMELINE.findIndex(s => s.key === serverKey);
    return {
      key: serverKey,
      label: STATUS_TIMELINE[stepIndex].label,
      stepIndex,
      progress: Math.round((stepIndex / (STATUS_TIMELINE.length - 1)) * 100),
      eta,
    };
  }
  const elapsedMinutes = Math.max(0, (Number(now) - placedAt) / 60000);
  let stepIndex = 0;
  STATUS_TIMELINE.forEach((step, idx) => { if (elapsedMinutes >= step.atMinutes) stepIndex = idx; });
  return {
    key: STATUS_TIMELINE[stepIndex].key,
    label: STATUS_TIMELINE[stepIndex].label,
    stepIndex,
    progress: Math.min(100, Math.round((elapsedMinutes / DELIVERY_AT_MINUTES) * 100)),
    eta,
  };
}

export const ACTIVE_ORDER_STATUSES = ['placed', 'packed', 'shipped'];

export function canCancelOrder(order, now = Date.now()) {
  if (!order || order.cancelledAt) return false;
  const serverStatus = String(order.serverStatus || '').toUpperCase();
  if (serverStatus) return ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(serverStatus);
  const status = getOrderStatus(order, now);
  return status.key === 'placed' || status.key === 'packed';
}

export async function cancelOrder(salonId, orderId, { now = Date.now(), reason = '' } = {}) {
  const orders = await readOrders(salonId);
  const order = orders.find(v => v.id === orderId);
  if (!order) return null;
  if (order.cancelledAt) return order;
  if (!canCancelOrder(order, now)) return order;
  order.cancelledAt = new Date(now).toISOString();
  order.cancelReason = String(reason || '').trim();
  if (order.payment?.method === 'ONLINE' && order.payment?.status === 'PAID') {
    order.payment = { ...order.payment, status: 'REFUND_REQUESTED' };
  }
  await saveOrders(salonId, orders);
  return order;
}

export function formatEta(eta) {
  if (!(eta instanceof Date) || Number.isNaN(eta.getTime())) return '';
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const day = eta.toDateString() === tomorrow.toDateString() ? 'Tomorrow' : eta.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
  return `${day}, ${eta.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
}

// Synchronous helpers for legacy callers that already hold arrays (e.g., cartCount used inline)
export function clearShopStorage(salonId) {
  try {
    AsyncStorage.removeItem(cartKey(salonId));
    AsyncStorage.removeItem(orderKey(salonId));
  } catch {}
}

// For hooks that need instant sync state — expose key names
export const CART_KEY = (salonId) => cartKey(salonId);
export const ORDERS_KEY = (salonId) => orderKey(salonId);
