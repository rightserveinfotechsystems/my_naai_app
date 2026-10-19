import { communication } from '../services/communication';
import { normalizeCartLine, customerStatusToTrackerKey, SERVER_STATUS_TO_STEP_INDEX } from './shopOrders';
import AsyncStorage from '@react-native-async-storage/async-storage';

export { customerStatusToTrackerKey, SERVER_STATUS_TO_STEP_INDEX };
export const CANCELLABLE_SERVER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING'];

async function hasSession() {
  try {
    const stored = await AsyncStorage.getItem('mynaai');
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    return Boolean(parsed?.token);
  } catch {
    return false;
  }
}

export function mapServerCartLine(line = {}) {
  return normalizeCartLine({
    productId: line.productId,
    name: line.name,
    price: line.price,
    mrp: line.mrp,
    image: line.image,
    category: line.category,
    gender: line.gender,
    salonName: line.salonName || '',
    qty: line.qty,
  });
}

export function mapServerCart(data) {
  const lines = Array.isArray(data?.lines) ? data.lines : [];
  return lines.map(mapServerCartLine);
}

export function mapServerOrder(order = {}) {
  const status = String(order.status || order.customerStatus || '').toUpperCase();
  const items = (Array.isArray(order.items) ? order.items : []).map(item => ({
    productId: String(item.productId || item.id || ''),
    name: item.name || 'Untitled product',
    price: Math.max(0, Number(item.price) || 0),
    mrp: Math.max(0, Number(item.mrp) || 0),
    image: item.image || '',
    category: item.category || '',
    gender: item.gender || '',
    salonName: item.salonName || order.salon?.salonName || '',
    qty: Math.max(1, Math.min(99, Math.round(Number(item.qty) || 1))),
  }));
  const amounts = order.amounts || {};
  return {
    id: String(order.orderId || order.id || ''),
    salonId: String(order.salonId || ''),
    salonName: String(order.salon?.salonName || ''),
    items,
    address: {
      name: String(order.address?.name || ''),
      phone: String(order.address?.phone || ''),
      line1: String(order.address?.line1 || ''),
      city: String(order.address?.city || ''),
      state: String(order.address?.state || ''),
      pincode: String(order.address?.pincode || ''),
    },
    payment: {
      method: order.payment?.method === 'COD' ? 'COD' : 'ONLINE',
      status: String(order.payment?.status || 'PENDING'),
      paymentId: String(order.payment?.paymentId || ''),
      amount: Math.max(0, Number(order.payment?.amount) || Number(amounts.total) || 0),
    },
    amounts: {
      itemTotal: Number(amounts.itemTotal) || 0,
      savings: Number(amounts.savings) || 0,
      discount: Number(amounts.discount) || 0,
      deliveryFee: Number(amounts.deliveryFee) || 0,
      codFee: Number(amounts.codFee) || 0,
      total: Number(amounts.total) || 0,
    },
    placedAt: order.createdAt ? new Date(order.createdAt).toISOString() : new Date(0).toISOString(),
    cancelledAt: order.cancelledAt ? new Date(order.cancelledAt).toISOString() : null,
    cancelReason: String(order.cancelReason || ''),
    serverStatus: status || null,
  };
}

export async function fetchServerCart() {
  if (!(await hasSession())) return null;
  try {
    const res = await communication.shopCartGet();
    return mapServerCart(res?.data);
  } catch { return null; }
}

export async function pushCartAdd(productId, qty = 1) {
  if (!(await hasSession()) || !productId) return false;
  try { await communication.shopCartAdd({ productId: String(productId), qty }); return true; } catch { return false; }
}

export async function pushCartSetQty(productId, qty) {
  if (!(await hasSession()) || !productId) return false;
  try { await communication.shopCartSetQty({ productId: String(productId), qty }); return true; } catch { return false; }
}

export async function pushCartRemove(productId) {
  if (!(await hasSession()) || !productId) return false;
  try { await communication.shopCartRemove({ productId: String(productId) }); return true; } catch { return false; }
}

export async function clearServerCart() {
  if (!(await hasSession())) return false;
  try { await communication.shopCartClear(); return true; } catch { return false; }
}

export async function registerServerOrder(order) {
  if (!(await hasSession()) || !order?.id) return false;
  try {
    await communication.shopOrderCreate({
      orderId: order.id,
      items: order.items,
      address: order.address,
      payment: {
        method: order.payment?.method === 'COD' ? 'COD' : 'ONLINE',
        status: order.payment?.status === 'PAID' ? 'PAID' : 'PENDING',
        paymentId: order.payment?.paymentId || '',
        amount: Number(order.payment?.amount) || Number(order.amounts?.total) || 0,
      },
    });
    return true;
  } catch { return false; }
}

export async function fetchServerOrders(page = 1) {
  if (!(await hasSession())) return null;
  try {
    const res = await communication.shopOrderList({ page });
    const orders = Array.isArray(res?.data?.orders) ? res.data.orders : [];
    return orders.map(mapServerOrder).filter(o => o.id && o.items.length);
  } catch { return null; }
}

const SERVER_PAGE_SIZE = 20;
export async function fetchAllServerOrders(maxPages = 5) {
  if (!(await hasSession())) return null;
  const all = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const orders = await fetchServerOrders(page);
    if (orders === null) return page === 1 ? null : all;
    all.push(...orders);
    if (orders.length < SERVER_PAGE_SIZE) break;
  }
  return all;
}

export async function fetchServerOrderById(orderId) {
  if (!(await hasSession()) || !orderId) return null;
  try {
    const res = await communication.shopOrderGetById({ orderId: String(orderId) });
    const order = mapServerOrder(res?.data || {});
    return order.id ? order : null;
  } catch { return null; }
}

export async function cancelServerOrder(orderId, reason = '') {
  if (!(await hasSession()) || !orderId) return false;
  try { await communication.shopOrderCancel({ orderId: String(orderId), reason }); return true; } catch { return false; }
}

function orderKey(salonId) {
  return `mynaaiShopOrders:${String(salonId || 'guest')}`;
}
function cartKey(salonId) {
  return `mynaaiShopCart:${String(salonId || 'guest')}`;
}
