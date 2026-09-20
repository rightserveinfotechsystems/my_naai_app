// Time maths for the salon "update appointment time" flow.
//
// Ported 1:1 from the web platform (my-naai-web → src/lib/bookingTime.js) so the
// mobile salon queue resolves the same new slot as the web modal does:
//
// The salon can tell a customer it is running late *or* that it can take them
// earlier. Both are the same operation with a signed offset, so everything here
// works in signed minutes: negative = earlier, positive = later.
//
// Booking times arrive as 'HH:mm' or 'HH:mm:ss'; booking dates as 'YYYY-MM-DD'
// or a full ISO timestamp. Parse them as *local* wall-clock values: a salon
// thinks in its own clock.

// 'YYYY-MM-DD' or full ISO timestamp -> 'YYYY-MM-DD'.
export function toDay(value) {
    const match = String(value || '').match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : '';
}

export function parseBookingDateTime(date, time) {
    const dateText = String(date || '').trim();
    const timeText = String(time || '').trim();
    if (!timeText) return null;
    const timeMatch = timeText.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (!timeMatch) return null;
    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const seconds = Number(timeMatch[3] || 0);
    if (!Number.isFinite(hours) || hours > 23 || !Number.isFinite(minutes) || minutes > 59) return null;
    const dateOnly = dateText.slice(0, 10);
    const dateMatch = dateOnly.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const base = dateMatch
        ? new Date(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3]))
        : new Date();
    if (Number.isNaN(base.getTime())) return null;
    base.setHours(hours, minutes, seconds, 0);
    return base;
}

function pad(value) {
    return String(value).padStart(2, '0');
}

export function toApiTime(value) {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return '';
    return `${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
}

export function toApiDate(value) {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return '';
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

// The customer-facing label. Uses the same en-IN 12-hour formatting as the rest
// of the portal so "6:30 pm" in the modal matches "6:30 pm" in the booking list.
export function formatClockTime(value) {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return '';
    return value.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Web Shared.formatDate — '07 Sep 2026'.
export function formatDate(value) {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Web Shared.formatTime — 'HH:mm[:ss]' -> '06:30 pm'.
export function formatTime(value) {
    if (!value) return '—';
    const [hours, minutes] = String(value).slice(0, 5).split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return String(value);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// Applies a signed offset and reports everything a caller needs: the API values,
// the human label, and whether the shift crossed midnight into another day
// (which the UI must warn about rather than silently move an appointment).
export function shiftBookingTime(date, time, offsetMinutes) {
    const start = parseBookingDateTime(date, time);
    const minutes = Number(offsetMinutes);
    if (!start || !Number.isFinite(minutes)) return null;
    const shifted = new Date(start.getTime() + minutes * 60000);
    return {
        original: start,
        updated: shifted,
        originalLabel: formatClockTime(start),
        updatedLabel: formatClockTime(shifted),
        apiTime: toApiTime(shifted),
        apiDate: toApiDate(shifted),
        offsetMinutes: minutes,
        // A +60 on a 23:30 booking, or a -30 on a 00:15 one, lands on another date.
        crossesDay: toApiDate(shifted) !== toApiDate(start),
        // Moving a slot into the past helps nobody; the UI blocks sending it.
        inPast: shifted.getTime() < Date.now(),
    };
}

// The inverse of shiftBookingTime: the salon picks an exact clock time and we
// derive the offset.
//
// `targetTime` is an 'HH:mm' value. `targetDate` is optional and defaults to
// the booking's own date.
//
// Midnight rule: with no explicit date, a target that lands more than 12 hours
// *before* the booking is read as the next day. A salon closing at 00:30 that
// picks 00:15 for a 23:45 booking means fifteen minutes later, not
// twenty-three-and-a-half hours earlier. Beyond that window the literal reading
// wins, so an ordinary "earlier" pick still moves backwards.
export function offsetForTargetTime(bookingDate, bookingTime, targetTime, targetDate = '') {
    const start = parseBookingDateTime(bookingDate, bookingTime);
    if (!start) return null;
    const explicitDate = String(targetDate || '').trim();
    const target = parseBookingDateTime(explicitDate || toApiDate(start), targetTime);
    if (!target) return null;
    let minutes = Math.round((target.getTime() - start.getTime()) / 60000);
    if (!explicitDate && minutes < -12 * 60) minutes += 24 * 60;
    return minutes;
}

// Convenience wrapper: pick a clock time, get the same result shape as
// shiftBookingTime so the UI has one preview path for both controls.
export function shiftBookingToTime(bookingDate, bookingTime, targetTime, targetDate = '') {
    const minutes = offsetForTargetTime(bookingDate, bookingTime, targetTime, targetDate);
    if (minutes === null) return null;
    return shiftBookingTime(bookingDate, bookingTime, minutes);
}

// 'HH:mm' for a time picker, which does not accept seconds.
export function toInputTime(value) {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return '';
    return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

// "20 minutes later" / "15 minutes earlier" — spelled out, because "+20" and
// "-20" are easy to misread on a phone in a busy salon.
export function describeOffset(offsetMinutes) {
    const minutes = Number(offsetMinutes);
    if (!Number.isFinite(minutes) || minutes === 0) return 'No change';
    const absolute = Math.abs(minutes);
    const hours = Math.floor(absolute / 60);
    const rest = absolute % 60;
    const parts = [];
    if (hours) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
    if (rest) parts.push(`${rest} minute${rest === 1 ? '' : 's'}`);
    return `${parts.join(' ')} ${minutes < 0 ? 'earlier' : 'later'}`;
}

// Offsets the salon can pick with one tap. Deliberately asymmetric: running
// late is the common case and needs longer options, while pulling a customer
// in early is only reasonable by a short amount (they still have to travel).
export const EARLIER_OFFSETS = [-30, -20, -15, -10];
export const LATER_OFFSETS = [10, 20, 30, 45, 60, 90];

export const MIN_OFFSET_MINUTES = -120;
export const MAX_OFFSET_MINUTES = 240;

export function isValidOffset(offsetMinutes) {
    const minutes = Number(offsetMinutes);
    return Number.isFinite(minutes)
        && Number.isInteger(minutes)
        && minutes !== 0
        && minutes >= MIN_OFFSET_MINUTES
        && minutes <= MAX_OFFSET_MINUTES;
}
