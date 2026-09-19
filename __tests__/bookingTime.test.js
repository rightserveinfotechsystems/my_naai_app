/**
 * Salon Queue → "Update time": the time maths ported from the web platform
 * (my-naai-web → src/lib/bookingTime.js) must resolve the exact same slot the
 * web modal sends to POST /api/booking/salon/queue/update-time/:bookingId.
 *
 * Mirrors the expectations in my-naai-web → src/components/SalonQueueUpdateTime.test.jsx.
 */
import {
    EARLIER_OFFSETS,
    LATER_OFFSETS,
    MAX_OFFSET_MINUTES,
    MIN_OFFSET_MINUTES,
    describeOffset,
    formatTime,
    isValidOffset,
    offsetForTargetTime,
    parseBookingDateTime,
    shiftBookingTime,
    shiftBookingToTime,
    toInputTime,
} from '../src/utilities/bookingTime';

// Far-future so the "already passed" guard never fires by accident.
const bookingDate = '2099-09-07';
const bookingTime = '18:30:00';

describe('bookingTime (web parity)', () => {
    it('parses booking date + time as local wall clock', () => {
        const date = parseBookingDateTime(bookingDate, bookingTime);
        expect(date).toBeInstanceOf(Date);
        expect(date.getFullYear()).toBe(2099);
        expect(date.getMonth()).toBe(8); // September
        expect(date.getDate()).toBe(7);
        expect(date.getHours()).toBe(18);
        expect(date.getMinutes()).toBe(30);
        expect(toInputTime(date)).toBe('18:30');
    });

    it('shifts a booking later and reports the API values (web: +20 → 18:50:00)', () => {
        const preview = shiftBookingTime(bookingDate, bookingTime, 20);
        expect(preview.apiTime).toBe('18:50:00');
        expect(preview.apiDate).toBe(bookingDate);
        expect(preview.offsetMinutes).toBe(20);
        expect(preview.crossesDay).toBe(false);
        expect(preview.inPast).toBe(false);
        expect(preview.originalLabel.toLowerCase()).toMatch(/06:30/);
        expect(preview.updatedLabel.toLowerCase()).toMatch(/06:50/);
        expect(describeOffset(preview.offsetMinutes)).toBe('20 minutes later');
    });

    it('shifts a booking earlier with a negative offset (web: -15 → 18:15:00)', () => {
        const preview = shiftBookingTime(bookingDate, bookingTime, -15);
        expect(preview.apiTime).toBe('18:15:00');
        expect(describeOffset(-15)).toBe('15 minutes earlier');
    });

    it('derives the offset from an exact target time (web: 19:15 → +45, 18:05 → -25)', () => {
        expect(offsetForTargetTime(bookingDate, bookingTime, '19:15')).toBe(45);
        expect(offsetForTargetTime(bookingDate, bookingTime, '18:05')).toBe(-25);
        expect(shiftBookingToTime(bookingDate, bookingTime, '19:15').apiTime).toBe('19:15:00');
        expect(shiftBookingToTime(bookingDate, bookingTime, '18:05').apiTime).toBe('18:05:00');
    });

    it('crosses midnight into the next day, not 23 hours away', () => {
        const preview = shiftBookingTime('2099-09-07', '23:40:00', 40);
        expect(preview.apiTime).toBe('00:20:00');
        expect(preview.apiDate).toBe('2099-09-08');
        expect(preview.crossesDay).toBe(true);

        const earlier = shiftBookingTime('2099-09-07', '00:15:00', -30);
        expect(earlier.apiTime).toBe('23:45:00');
        expect(earlier.apiDate).toBe('2099-09-06');
        expect(earlier.crossesDay).toBe(true);
    });

    it('reads a late-night exact pick as the NEXT day (23:45 → 00:15 is +30)', () => {
        expect(offsetForTargetTime('2099-09-07', '23:45:00', '00:15')).toBe(30);
    });

    it('spells offsets out and handles hours', () => {
        expect(describeOffset(90)).toBe('1 hour 30 minutes later');
        expect(describeOffset(-120)).toBe('2 hours earlier');
        expect(describeOffset(60)).toBe('1 hour later');
        expect(describeOffset(0)).toBe('No change');
    });

    it('keeps the same offset bounds as the web (-120…240, whole minutes, not zero)', () => {
        expect(MIN_OFFSET_MINUTES).toBe(-120);
        expect(MAX_OFFSET_MINUTES).toBe(240);
        expect(isValidOffset(240)).toBe(true);
        expect(isValidOffset(-120)).toBe(true);
        expect(isValidOffset(241)).toBe(false);
        expect(isValidOffset(-121)).toBe(false);
        expect(isValidOffset(0)).toBe(false);
        expect(isValidOffset(2.5)).toBe(false);
        expect(isValidOffset('abc')).toBe(false);
    });

    it('keeps the same one-tap offsets as the web', () => {
        expect(LATER_OFFSETS).toEqual([10, 20, 30, 45, 60, 90]);
        expect(EARLIER_OFFSETS).toEqual([-30, -20, -15, -10]);
    });

    it('formats HH:mm[:ss] the way the web queue does (en-IN 12-hour)', () => {
        expect(formatTime('18:30:00').toLowerCase()).toMatch(/06:30/);
        expect(formatTime('09:05').toLowerCase()).toMatch(/09:05/);
        expect(formatTime('00:15').toLowerCase()).toMatch(/12:15/);
    });

    it('rejects unparsable values like the web does', () => {
        expect(parseBookingDateTime(bookingDate, 'garbage')).toBeNull();
        expect(parseBookingDateTime(bookingDate, '')).toBeNull();
        expect(parseBookingDateTime(bookingDate, '24:00')).toBeNull();
        expect(shiftBookingTime(bookingDate, bookingTime, 'nonsense')).toBeNull();
    });
});
