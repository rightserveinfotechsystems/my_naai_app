import React, { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hp } from '../utils/AppScreen';
import {
    EARLIER_OFFSETS,
    LATER_OFFSETS,
    MAX_OFFSET_MINUTES,
    MIN_OFFSET_MINUTES,
    describeOffset,
    formatDate,
    formatTime,
    isValidOffset,
    offsetForTargetTime,
    parseBookingDateTime,
    shiftBookingTime,
    toInputTime,
} from '../utilities/bookingTime';

/* ---------------- WEB PLATFORM PALETTE ----------------
   Same colour combination as my-naai-web (src/styles.css :root), so the
   salon sees identical branding in the mobile queue as in the web portal. */
const C = {
    black: '#080A0A',
    panel: '#111414',
    card: '#171B1B',
    cardRaised: '#1C2121',
    modalCard: '#151A19',
    inputBg: '#131818',
    inputFocusBg: '#191F1E',
    line: 'rgba(255,255,255,0.08)',
    lineInput: 'rgba(255,255,255,0.15)',
    lineStrong: 'rgba(232,185,126,0.28)',
    gold: '#E8B97E',
    goldSoft: '#F3C992',
    goldWash: 'rgba(232,185,126,0.11)',
    muted: '#899191',
    mutedLight: '#B7BEBE',
    white: '#F8F8F5',
    inputText: '#FBFBF9',
    ink: '#0C0D0D',
    green: '#6ED19E',
    greenWash: 'rgba(110,209,158,0.1)',
    greenLine: 'rgba(110,209,158,0.34)',
    greenInk: '#09120D',
    red: '#F27B74',
    redWash: 'rgba(242,123,116,0.1)',
    redLine: 'rgba(242,123,116,0.4)',
    redText: '#FFB3AD',
    placeholder: '#8D9695',
    backdrop: 'rgba(0,0,0,0.76)',
};

// Lets a salon move a queued appointment earlier or later and notify the
// customer, without leaving the queue. The salon reads a real clock time
// ("6:50 PM"), not just an offset, because that is what it will say to the
// customer on the phone and what the customer sees in the notification.
//
// Fields mirror the web platform's UpdateTimeModal (my-naai-web →
// src/components/SalonScreens.jsx) 1:1, and the time maths comes from the
// same library (src/lib/bookingTime.js) so both clients send the same
// payload to POST /api/booking/salon/queue/update-time/:bookingId.
export default function SalonQueueUpdateTimeModal({ booking, open, onClose, onSubmit, saving }) {
    const insets = useSafeAreaInsets();

    // `mode` decides which control owns the new time, so the two can never
    // disagree about what will be sent: 'offset' = a chip or the minutes box,
    // 'exact' = the time picker.
    const [mode, setMode] = useState('offset');
    const [offset, setOffset] = useState(null);
    const [custom, setCustom] = useState('');
    const [exactTime, setExactTime] = useState('');
    const [reason, setReason] = useState('');
    const [showTimePicker, setShowTimePicker] = useState(false);

    const bookingDate = booking?.bookingDate;
    const bookingTime = booking?.bookingTime;

    // Reset whenever a different booking is opened, so the previous customer's
    // choice can never be sent for this one. The picker starts at the booking's
    // own time, which is the sensible place to nudge from.
    useEffect(() => {
        if (!open) return;
        setMode('offset');
        setOffset(null);
        setCustom('');
        setReason('');
        const start = parseBookingDateTime(bookingDate, bookingTime);
        setExactTime(start ? toInputTime(start) : '');
        setShowTimePicker(false);
    }, [open, booking?.bookingId, bookingDate, bookingTime]);

    const customOffset = custom.trim() !== '' ? Number(custom) : null;
    const effectiveOffset = customOffset !== null ? customOffset : offset;
    const exactOffset = mode === 'exact' && exactTime ? offsetForTargetTime(bookingDate, bookingTime, exactTime) : null;

    const preview = mode === 'exact'
        ? (isValidOffset(exactOffset) ? shiftBookingTime(bookingDate, bookingTime, exactOffset) : null)
        : (isValidOffset(effectiveOffset) ? shiftBookingTime(bookingDate, bookingTime, effectiveOffset) : null);

    const currentLabel = formatTime(bookingTime);
    const customInvalid = mode === 'offset' && custom.trim() !== '' && !isValidOffset(customOffset);
    // Picking the time it is already booked for is a no-op, not an error worth shouting about.
    const exactUnchanged = mode === 'exact' && exactTime && exactOffset === 0;
    const exactOutOfRange = mode === 'exact' && exactTime && exactOffset !== null && exactOffset !== 0 && !isValidOffset(exactOffset);
    const blocked = Boolean(preview?.inPast);
    const canSend = Boolean(preview) && !blocked && !saving;

    const pickOffset = value => {
        setMode('offset');
        setOffset(value);
        setCustom('');
    };

    // Native time picker behind "Pick exact time" (the web uses <input type="time">).
    const pickerBase = parseBookingDateTime(bookingDate, bookingTime) || new Date();
    const pickerDate = (() => {
        if (!exactTime) return pickerBase;
        const [h, m] = exactTime.split(':').map(Number);
        const d = new Date(pickerBase);
        d.setHours(h, m, 0, 0);
        return d;
    })();

    const safeClose = () => {
        if (!saving) onClose();
    };

    const renderChip = value => {
        const active = mode === 'offset' && effectiveOffset === value;
        const earlier = value < 0;
        return (
            <TouchableOpacity
                key={value}
                style={[
                    styles.chip,
                    active && !earlier && styles.chipActive,
                    active && earlier && styles.chipEarlierActive,
                ]}
                disabled={saving}
                activeOpacity={0.7}
                onPress={() => pickOffset(value)}
            >
                <Text style={[styles.chipText, active && !earlier && styles.chipActiveText, active && earlier && styles.chipEarlierActiveText]}>
                    {earlier ? `${value} min` : `+${value} min`}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <Modal transparent visible={open} animationType="slide" onRequestClose={safeClose}>
            <View style={[styles.backdrop, { paddingBottom: Math.max(insets.bottom, 12) }]}>
                <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={safeClose} />
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Update appointment time</Text>
                        <TouchableOpacity style={styles.closeBtn} onPress={safeClose} disabled={saving} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="close" size={22} color={C.mutedLight} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.body}
                        contentContainerStyle={styles.bodyContent}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        showsVerticalScrollIndicator={false}
                    >
                        <Text style={styles.lede}>
                            Running late, or free earlier than expected? Set the new time for{' '}
                            <Text style={styles.ledeStrong}>{booking?.userName || 'this customer'}</Text> and My Naai will notify them straight away.
                        </Text>

                        {/* Current booking */}
                        <View style={styles.currentBox}>
                            <Ionicons name="time-outline" size={16} color={C.gold} />
                            <View style={styles.currentTexts}>
                                <Text style={styles.currentSmall}>Booked for</Text>
                                <Text style={styles.currentStrong}>
                                    {bookingDate ? formatDate(bookingDate) : '—'} · {currentLabel}
                                </Text>
                            </View>
                        </View>

                        {/* Mode switch */}
                        <View style={styles.modeSwitch}>
                            <TouchableOpacity
                                style={[styles.modeBtn, mode === 'offset' && styles.modeBtnActive]}
                                disabled={saving}
                                activeOpacity={0.7}
                                onPress={() => setMode('offset')}
                            >
                                <Text style={[styles.modeBtnText, mode === 'offset' && styles.modeBtnActiveText]}>Shift by minutes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modeBtn, mode === 'exact' && styles.modeBtnActive]}
                                disabled={saving}
                                activeOpacity={0.7}
                                onPress={() => setMode('exact')}
                            >
                                <Text style={[styles.modeBtnText, mode === 'exact' && styles.modeBtnActiveText]}>Pick exact time</Text>
                            </TouchableOpacity>
                        </View>

                        {mode === 'offset' ? (
                            <>
                                <Text style={styles.groupLabel}>Running late — push it later</Text>
                                <View style={styles.offsetGrid}>
                                    {LATER_OFFSETS.map(renderChip)}
                                </View>

                                <Text style={styles.groupLabel}>Free earlier — bring it forward</Text>
                                <View style={styles.offsetGrid}>
                                    {EARLIER_OFFSETS.map(renderChip)}
                                </View>

                                <Text style={styles.fieldLabel}>Or enter minutes</Text>
                                <Text style={styles.fieldHint}>
                                    Negative for earlier, e.g. -25. Between {MIN_OFFSET_MINUTES} and {MAX_OFFSET_MINUTES}.
                                </Text>
                                <TextInput
                                    style={[styles.input, customInvalid && styles.inputError]}
                                    value={custom}
                                    onChangeText={text => {
                                        setCustom(text);
                                        setOffset(null);
                                        setMode('offset');
                                    }}
                                    placeholder="e.g. 25 or -15"
                                    placeholderTextColor={C.placeholder}
                                    keyboardType="numbers-and-punctuation"
                                    maxLength={4}
                                    editable={!saving}
                                    autoCorrect={false}
                                />
                                {customInvalid && (
                                    <Text style={styles.errorText}>
                                        Enter a whole number of minutes, not zero, within the allowed range.
                                    </Text>
                                )}
                            </>
                        ) : (
                            <>
                                <Text style={styles.fieldLabel}>New start time</Text>
                                <Text style={styles.fieldHint}>
                                    Choose the time this customer should arrive. My Naai works out the difference for you.
                                </Text>
                                <TouchableOpacity
                                    style={[styles.input, styles.timeInput, exactOutOfRange && styles.inputError]}
                                    disabled={saving}
                                    activeOpacity={0.7}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Ionicons name="time-outline" size={16} color={C.gold} />
                                    <Text style={styles.timeInputText}>
                                        {exactTime ? formatTime(exactTime) : 'Select time'}
                                    </Text>
                                </TouchableOpacity>
                                {showTimePicker && (
                                    <DateTimePicker
                                        value={pickerDate}
                                        mode="time"
                                        // Android: native clock dialog. iOS: inline wheel with a Set
                                        // button. Both resolve through onChange(date).
                                        display="default"
                                        themeVariant="dark"
                                        onChange={event => {
                                            setShowTimePicker(false);
                                            const date = event?.date;
                                            if (date) {
                                                const h = date.getHours();
                                                const m = date.getMinutes();
                                                setExactTime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                                                setMode('exact');
                                            }
                                        }}
                                    />
                                )}
                                {exactOutOfRange && (
                                    <Text style={styles.errorText}>
                                        That is more than {MAX_OFFSET_MINUTES} minutes away from the booked time. Use a smaller change, or rebook the appointment.
                                    </Text>
                                )}
                            </>
                        )}

                        {/* Note to the customer */}
                        <Text style={styles.fieldLabel}>Note to the customer</Text>
                        <Text style={styles.fieldHint}>Optional · sent with the notification, max 200 characters</Text>
                        <TextInput
                            style={styles.textarea}
                            value={reason}
                            onChangeText={text => setReason(text.slice(0, 200))}
                            placeholder="e.g. Previous service is running long — sorry for the wait!"
                            placeholderTextColor={C.placeholder}
                            multiline
                            maxLength={200}
                            editable={!saving}
                        />

                        {/* Preview */}
                        {preview && (
                            <View style={[styles.preview, blocked && styles.previewBlocked]}>
                                <Ionicons
                                    name={blocked ? 'alert-circle-outline' : 'time-outline'}
                                    size={17}
                                    color={blocked ? C.red : C.green}
                                />
                                <View style={styles.previewTexts}>
                                    <Text style={styles.previewStrong}>
                                        {preview.originalLabel} → {preview.updatedLabel}
                                    </Text>
                                    <Text style={styles.previewSmall}>
                                        {describeOffset(preview.offsetMinutes)}
                                        {preview.crossesDay ? ` · moves to ${formatDate(preview.apiDate)}` : ''}
                                    </Text>
                                    {blocked && (
                                        <Text style={styles.previewWarning}>
                                            That time has already passed. Pick a later time — a customer cannot be notified about a slot in the past.
                                        </Text>
                                    )}
                                </View>
                            </View>
                        )}

                        {/* Actions */}
                        <View style={styles.actions}>
                            <TouchableOpacity style={styles.cancelBtn} disabled={saving} activeOpacity={0.7} onPress={safeClose}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.submitBtn, !canSend && styles.submitBtnDisabled]}
                                disabled={!canSend}
                                activeOpacity={0.8}
                                onPress={() => onSubmit({ preview, reason: reason.trim() })}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color={C.ink} />
                                ) : (
                                    <View style={styles.submitRow}>
                                        <Text style={styles.submitText}>Update &amp; notify</Text>
                                        <Ionicons name="checkmark" size={17} color={C.ink} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {!preview && !customInvalid && !exactOutOfRange && (
                            <Text style={styles.hint}>
                                {exactUnchanged
                                    ? 'That is the current booking time — pick a different one.'
                                    : 'Choose a new time to continue.'}
                            </Text>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

/* ---------------- STYLES (web styles.css colour values) ---------------- */
const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: C.backdrop,
        justifyContent: 'flex-end',
        padding: 12,
    },
    backdropTouch: {
        flex: 1,
    },
    /* .modal-card — floats above the screen edge like the web sheet. */
    sheet: {
        maxHeight: hp(88),
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        backgroundColor: C.modalCard,
        borderWidth: 1,
        borderColor: C.lineStrong,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingBottom: 12,
    },
    title: {
        color: C.white,
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
    },
    closeBtn: {
        padding: 4,
        marginLeft: 12,
    },
    body: {
        maxHeight: hp(76),
    },
    bodyContent: {
        paddingHorizontal: 16,
        paddingBottom: 18,
        paddingTop: 2,
    },
    lede: {
        color: C.muted,
        fontSize: 12,
        lineHeight: 18,
        marginBottom: 13,
    },
    ledeStrong: {
        color: C.white,
        fontWeight: '700',
    },

    /* .time-update-current */
    currentBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingVertical: 11,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.line,
    },
    currentTexts: {
        marginLeft: 10,
        flex: 1,
    },
    currentSmall: {
        color: C.muted,
        fontSize: 10,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    currentStrong: {
        color: C.white,
        fontSize: 13,
        fontWeight: '700',
        marginTop: 2,
    },

    /* .time-mode-switch */
    modeSwitch: {
        flexDirection: 'row',
        marginBottom: 14,
        padding: 4,
        borderRadius: 13,
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.line,
    },
    modeBtn: {
        flex: 1,
        minHeight: 38,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    modeBtnActive: {
        backgroundColor: C.gold,
    },
    modeBtnText: {
        color: C.mutedLight,
        fontSize: 12.5,
        fontWeight: '700',
        textAlign: 'center',
    },
    modeBtnActiveText: {
        color: '#111111',
    },

    /* .time-update-group-label */
    groupLabel: {
        color: C.muted,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 8,
        marginTop: 4,
    },

    /* .time-offset-grid (gap 7px) / .time-offset-chip */
    offsetGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 7,
        marginBottom: 16,
    },
    chip: {
        width: '31%',
        minHeight: 42,
        borderWidth: 1,
        borderColor: C.line,
        borderRadius: 11,
        backgroundColor: C.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chipText: {
        color: C.white,
        fontSize: 12.5,
        fontWeight: '700',
    },
    chipActive: {
        backgroundColor: C.gold,
        borderColor: C.gold,
    },
    chipActiveText: {
        color: '#111111',
    },
    chipEarlierActive: {
        backgroundColor: C.green,
        borderColor: C.green,
    },
    chipEarlierActiveText: {
        color: C.greenInk,
    },

    /* .field label / hint / input */
    fieldLabel: {
        color: C.white,
        fontSize: 12.5,
        fontWeight: '700',
        marginTop: 8,
        marginBottom: 4,
    },
    fieldHint: {
        color: C.muted,
        fontSize: 11,
        lineHeight: 16,
        marginBottom: 8,
    },
    input: {
        minHeight: 50,
        borderWidth: 1,
        borderColor: C.lineInput,
        borderRadius: 12,
        backgroundColor: C.inputBg,
        paddingHorizontal: 14,
        color: C.inputText,
        fontSize: 15,
        fontWeight: '500',
    },
    inputError: {
        borderColor: C.red,
    },
    errorText: {
        color: C.red,
        fontSize: 11,
        marginTop: 6,
        lineHeight: 16,
    },
    timeInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timeInputText: {
        color: C.inputText,
        fontSize: 15,
        fontWeight: '500',
    },

    /* .time-update-note */
    textarea: {
        minHeight: 58,
        borderWidth: 1,
        borderColor: C.lineInput,
        borderRadius: 12,
        backgroundColor: C.inputBg,
        padding: 13,
        color: C.inputText,
        fontSize: 15,
        textAlignVertical: 'top',
        lineHeight: 22,
    },

    /* .time-update-preview */
    preview: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 16,
        marginBottom: 16,
        padding: 12,
        borderRadius: 12,
        backgroundColor: C.greenWash,
        borderWidth: 1,
        borderColor: C.greenLine,
    },
    previewBlocked: {
        backgroundColor: C.redWash,
        borderColor: C.redLine,
    },
    previewTexts: {
        flex: 1,
        marginLeft: 10,
    },
    previewStrong: {
        color: C.white,
        fontSize: 14,
        fontWeight: '700',
    },
    previewSmall: {
        color: C.mutedLight,
        fontSize: 11,
        lineHeight: 16,
        marginTop: 4,
    },
    previewWarning: {
        color: C.redText,
        fontSize: 11,
        lineHeight: 16,
        marginTop: 4,
    },

    /* .form-actions (.btn / .btn-secondary / .btn-primary) */
    actions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    cancelBtn: {
        flex: 1,
        minHeight: 46,
        borderRadius: 13,
        backgroundColor: C.cardRaised,
        borderWidth: 1,
        borderColor: C.line,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
    },
    cancelText: {
        color: C.white,
        fontWeight: '700',
        fontSize: 13,
    },
    submitBtn: {
        flex: 1.4,
        minHeight: 46,
        borderRadius: 13,
        backgroundColor: C.gold,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
    },
    submitBtnDisabled: {
        opacity: 0.5,
    },
    submitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    submitText: {
        color: C.ink,
        fontWeight: '700',
        fontSize: 13,
    },

    /* .time-update-hint */
    hint: {
        color: C.muted,
        fontSize: 11,
        textAlign: 'center',
        marginTop: 10,
    },
});
