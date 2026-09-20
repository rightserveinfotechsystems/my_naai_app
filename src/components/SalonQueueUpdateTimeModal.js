import React, { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Platform,
    Keyboard,
    KeyboardAvoidingView,
    Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 700;
const IS_VERY_SMALL = SCREEN_HEIGHT < 620;

/* ---------------- PALETTE ---------------- */
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
    backdrop: 'rgba(0,0,0,0.78)',
};

export default function SalonQueueUpdateTimeModal({ booking, open, onClose, onSubmit, saving }) {
    const insets = useSafeAreaInsets();

    const [mode, setMode] = useState('offset');
    const [offset, setOffset] = useState(null);
    const [custom, setCustom] = useState('');
    const [exactTime, setExactTime] = useState('');
    const [reason, setReason] = useState('');
    const [showTimePicker, setShowTimePicker] = useState(false);

    const bookingDate = booking?.bookingDate;
    const bookingTime = booking?.bookingTime;

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
    const exactUnchanged = mode === 'exact' && exactTime && exactOffset === 0;
    const exactOutOfRange = mode === 'exact' && exactTime && exactOffset !== null && exactOffset !== 0 && !isValidOffset(exactOffset);
    const blocked = Boolean(preview?.inPast);
    const canSend = Boolean(preview) && !blocked && !saving;

    const pickOffset = value => {
        Keyboard.dismiss();
        setMode('offset');
        setOffset(value);
        setCustom('');
    };

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

    /* Quick-select options are plain always-visible chips (no dropdown), grouped
     * into "Running later" and "Free earlier" so every option is visible at a
     * glance and reachable with a single tap. */
    const renderChip = value => {
        const active = mode === 'offset' && effectiveOffset === value;
        const later = value > 0;
        return (
            <TouchableOpacity
                key={value}
                style={[
                    styles.chip,
                    later ? styles.chipLater : styles.chipEarlier,
                    active && (later ? styles.chipLaterActive : styles.chipEarlierActive),
                ]}
                disabled={saving}
                activeOpacity={0.75}
                onPress={() => pickOffset(value)}
                testID={`update-time-chip-${value}`}
            >
                {active && <Ionicons name="checkmark" size={13} color={C.ink} />}
                <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                    {later ? `${value} min later` : `${Math.abs(value)} min earlier`}
                </Text>
            </TouchableOpacity>
        );
    };

    const selectedShort = effectiveOffset !== null && isValidOffset(effectiveOffset)
        ? `${effectiveOffset > 0 ? '+' : ''}${effectiveOffset}m`
        : null;

    return (
        <Modal transparent visible={open} animationType="slide" onRequestClose={safeClose} statusBarTranslucent>
            <KeyboardAvoidingView
                style={styles.keyboardAvoid}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                enabled
            >
                <View style={styles.backdrop}>
                    <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={safeClose} />

                    <View style={styles.sheet} testID="update-time-sheet">
                        <View style={styles.handleWrap}>
                            <View style={styles.handleBar} />
                        </View>

                        <View style={styles.header}>
                            <View style={styles.headerLeft}>
                                <View style={styles.headerIcon}>
                                    <Ionicons name="time" size={14} color={C.ink} />
                                </View>
                                <Text style={styles.title}>Update time</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={safeClose}
                                disabled={saving}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="close" size={18} color={C.mutedLight} />
                            </TouchableOpacity>
                        </View>

                        {/* Scrollable content: the sheet never grows past its max
                            height, so on small phones (or with the keyboard open)
                            this scrolls instead of clipping the controls. */}
                        <ScrollView
                            style={styles.bodyScroll}
                            contentContainerStyle={styles.body}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            testID="update-time-body"
                        >
                            {/* Top pills */}
                            <View style={styles.topRow}>
                                <View style={styles.customerPill}>
                                    <Ionicons name="person" size={11} color={C.gold} />
                                    <Text style={styles.customerText} numberOfLines={1}>
                                        {booking?.userName || 'Customer'}
                                    </Text>
                                </View>
                                <View style={styles.currentPill}>
                                    <Ionicons name="time-outline" size={11} color={C.gold} />
                                    <Text style={styles.currentText}>{currentLabel}</Text>
                                </View>
                                <View style={styles.datePill}>
                                    <Text style={styles.dateText} numberOfLines={1}>
                                        {bookingDate ? formatDate(bookingDate) : ''}
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
                                    <Ionicons name="list" size={12} color={mode === 'offset' ? C.ink : C.muted} style={{ marginRight: 4 }} />
                                    <Text style={[styles.modeBtnText, mode === 'offset' && styles.modeBtnActiveText]}>Quick select</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modeBtn, mode === 'exact' && styles.modeBtnActive]}
                                    disabled={saving}
                                    activeOpacity={0.7}
                                    onPress={() => setMode('exact')}
                                >
                                    <Ionicons name="time-outline" size={12} color={mode === 'exact' ? C.ink : C.muted} style={{ marginRight: 4 }} />
                                    <Text style={[styles.modeBtnText, mode === 'exact' && styles.modeBtnActiveText]}>Exact time</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Content */}
                            {mode === 'offset' ? (
                                <View style={styles.offsetSection} testID="update-time-offset-section">
                                    <View style={styles.groupLabelRow}>
                                        <Text style={styles.groupLabel}>Time adjustment</Text>
                                        {selectedShort && (
                                            <View style={styles.selectedPill}>
                                                <Text style={styles.selectedPillText}>{selectedShort}</Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Running late - always visible */}
                                    <View style={styles.chipGroup}>
                                        <View style={styles.chipGroupHeader}>
                                            <Ionicons name="arrow-forward" size={11} color={C.gold} />
                                            <Text style={[styles.chipGroupLabel, { color: C.goldSoft }]}>Running late</Text>
                                        </View>
                                        <View style={styles.chipGrid}>
                                            {LATER_OFFSETS.map(renderChip)}
                                        </View>
                                    </View>

                                    {/* Free earlier - always visible */}
                                    <View style={styles.chipGroup}>
                                        <View style={styles.chipGroupHeader}>
                                            <Ionicons name="arrow-back" size={11} color={C.green} />
                                            <Text style={[styles.chipGroupLabel, { color: C.green }]}>Free earlier</Text>
                                        </View>
                                        <View style={styles.chipGrid}>
                                            {EARLIER_OFFSETS.map(renderChip)}
                                        </View>
                                    </View>

                                    {/* Custom input - compact row */}
                                    <View style={styles.customRow}>
                                        <Text style={styles.customLabel}>Or custom</Text>
                                        <View style={styles.customInputWrap}>
                                            <TextInput
                                                style={[styles.inputSmall, customInvalid && styles.inputError]}
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
                                        </View>
                                        <Text style={styles.customHint}>min</Text>
                                    </View>
                                    {customInvalid ? (
                                        <Text style={styles.errorText}>Enter -120 to +240, not 0</Text>
                                    ) : (
                                        <Text style={styles.helperText}>Negative = earlier, between {MIN_OFFSET_MINUTES} and {MAX_OFFSET_MINUTES}</Text>
                                    )}
                                </View>
                            ) : (
                                <View style={styles.exactSection}>
                                    <Text style={styles.groupLabel}>Pick new time</Text>
                                    <TouchableOpacity
                                        style={[styles.timeInputBox, exactOutOfRange && styles.inputError]}
                                        disabled={saving}
                                        activeOpacity={0.7}
                                        onPress={() => setShowTimePicker(true)}
                                    >
                                        <View style={styles.timeInputLeft}>
                                            <View style={styles.timeIconBox}>
                                                <Ionicons name="time-outline" size={16} color={C.gold} />
                                            </View>
                                            <View>
                                                <Text style={styles.timeInputLabel}>New start time</Text>
                                                <Text style={styles.timeInputValue}>
                                                    {exactTime ? formatTime(exactTime) : 'Select time'}
                                                </Text>
                                            </View>
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color={C.muted} />
                                    </TouchableOpacity>

                                    {showTimePicker && (
                                        <DateTimePicker
                                            value={pickerDate}
                                            mode="time"
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            themeVariant="dark"
                                            onChange={event => {
                                                if (Platform.OS === 'android') setShowTimePicker(false);
                                                const date = event?.nativeEvent?.timestamp ? new Date(event.nativeEvent.timestamp) : event?.date;
                                                if (date) {
                                                    const h = date.getHours();
                                                    const m = date.getMinutes();
                                                    setExactTime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                                                    setMode('exact');
                                                    if (Platform.OS === 'ios') setShowTimePicker(false);
                                                } else if (event?.type === 'dismissed') {
                                                    setShowTimePicker(false);
                                                }
                                            }}
                                        />
                                    )}
                                    {exactOutOfRange && (
                                        <Text style={styles.errorText}>More than {MAX_OFFSET_MINUTES} min away. Pick closer.</Text>
                                    )}
                                    {!exactOutOfRange && (
                                        <Text style={styles.helperText}>Choose when customer should arrive</Text>
                                    )}
                                </View>
                            )}

                            {/* Note */}
                            <View style={styles.noteRow}>
                                <TextInput
                                    style={styles.noteInput}
                                    value={reason}
                                    onChangeText={text => setReason(text.slice(0, 200))}
                                    placeholder="Note to customer (optional)"
                                    placeholderTextColor={C.placeholder}
                                    editable={!saving}
                                    maxLength={200}
                                    returnKeyType="done"
                                />
                                <Ionicons name="chatbubble-outline" size={14} color={C.muted} />
                            </View>

                            {/* Preview */}
                            {preview ? (
                                <View style={[styles.preview, blocked && styles.previewBlocked]}>
                                    <View style={[styles.previewIcon, blocked && styles.previewIconBlocked]}>
                                        <Ionicons name={blocked ? 'alert' : 'checkmark'} size={12} color={blocked ? C.red : C.greenInk} />
                                    </View>
                                    <View style={styles.previewTexts}>
                                        <Text style={styles.previewMain} numberOfLines={1}>
                                            {preview.originalLabel} → {preview.updatedLabel}
                                            <Text style={styles.previewDot}> • </Text>
                                            <Text style={styles.previewOffset}>{describeOffset(preview.offsetMinutes)}</Text>
                                        </Text>
                                        {preview.crossesDay ? <Text style={styles.previewSub}>Moves to {formatDate(preview.apiDate)}</Text> : null}
                                        {blocked && <Text style={styles.previewWarning}>Time already passed</Text>}
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.emptyPreview}>
                                    <Text style={styles.hintText}>
                                        {exactUnchanged ? 'Same as current — pick different' : customInvalid || exactOutOfRange ? 'Fix time to continue' : 'Select a time to preview'}
                                    </Text>
                                </View>
                            )}
                        </ScrollView>

                        {/* Pinned footer: Update & notify is always reachable,
                            even while the content above scrolls. */}
                        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]} testID="update-time-footer">
                            <View style={styles.actions}>
                                <TouchableOpacity style={styles.cancelBtn} disabled={saving} activeOpacity={0.7} onPress={safeClose}>
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.submitBtn, !canSend && styles.submitBtnDisabled]}
                                    disabled={!canSend}
                                    activeOpacity={0.85}
                                    onPress={() => onSubmit({ preview, reason: reason.trim() })}
                                >
                                    {saving ? <ActivityIndicator size="small" color={C.ink} /> : (
                                        <>
                                            <Text style={styles.submitText}>Update & notify</Text>
                                            <View style={styles.submitIcon}><Ionicons name="paper-plane" size={13} color={C.ink} /></View>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    keyboardAvoid: { flex: 1 },
    backdrop: { flex: 1, backgroundColor: C.backdrop, justifyContent: 'flex-end' },
    backdropTouch: { ...StyleSheet.absoluteFillObject },
    sheet: {
        width: '100%',
        maxHeight: IS_VERY_SMALL ? '96%' : IS_SMALL_SCREEN ? '92%' : '88%',
        backgroundColor: C.modalCard,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderBottomWidth: 0,
        borderColor: C.lineStrong,
        overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 12 },
            android: { elevation: 24 },
        }),
    },
    handleWrap: { alignItems: 'center', paddingTop: 8, paddingBottom: 2 },
    handleBar: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: C.line,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    headerIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    title: { color: C.white, fontSize: IS_SMALL_SCREEN ? 15 : 16, fontWeight: '700', letterSpacing: -0.2 },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },

    /* Scrollable body + pinned footer */
    bodyScroll: { flexGrow: 0, flexShrink: 1 },
    body: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6 },
    footer: {
        paddingHorizontal: 14, paddingTop: 10,
        borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.modalCard,
    },

    topRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
    customerPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 5, maxWidth: SCREEN_WIDTH * 0.38 },
    customerText: { color: C.white, fontSize: 11.5, fontWeight: '600', maxWidth: 100 },
    currentPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.goldWash, borderWidth: 1, borderColor: 'rgba(232,185,126,0.18)', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5, gap: 4 },
    currentText: { color: C.goldSoft, fontSize: 11.5, fontWeight: '700' },
    datePill: { flex: 1, alignItems: 'flex-end' },
    dateText: { color: C.muted, fontSize: 10.5, fontWeight: '500' },

    modeSwitch: { flexDirection: 'row', backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 3, marginBottom: 12, height: 40 },
    modeBtn: { flex: 1, flexDirection: 'row', borderRadius: 9, alignItems: 'center', justifyContent: 'center', height: 32 },
    modeBtnActive: { backgroundColor: C.gold },
    modeBtnText: { color: C.mutedLight, fontSize: 12.5, fontWeight: '600' },
    modeBtnActiveText: { color: C.ink, fontWeight: '700' },

    offsetSection: {},
    groupLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    groupLabel: { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
    selectedPill: { backgroundColor: C.goldWash, borderWidth: 1, borderColor: 'rgba(232,185,126,0.25)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
    selectedPillText: { color: C.goldSoft, fontSize: 10.5, fontWeight: '800' },

    /* ---- Quick select chips (always visible, no dropdown) ---- */
    chipGroup: { marginBottom: 10 },
    chipGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 7 },
    chipGroupLabel: { fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: {
        flexGrow: 1,
        flexBasis: '30.5%',
        minHeight: 36,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 6,
    },
    chipLater: { backgroundColor: C.card, borderColor: 'rgba(232,185,126,0.28)' },
    chipEarlier: { backgroundColor: C.card, borderColor: 'rgba(110,209,158,0.28)' },
    chipLaterActive: { backgroundColor: C.gold, borderColor: C.gold },
    chipEarlierActive: { backgroundColor: C.green, borderColor: C.green },
    chipText: { color: C.mutedLight, fontSize: 11.5, fontWeight: '600', flexShrink: 1 },
    chipTextActive: { color: C.ink, fontWeight: '700' },

    customRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
    customLabel: { color: C.muted, fontSize: 11, fontWeight: '600' },
    customInputWrap: { flex: 1, maxWidth: 130 },
    inputSmall: { height: 38, borderWidth: 1, borderColor: C.lineInput, borderRadius: 10, backgroundColor: C.inputBg, paddingHorizontal: 12, color: C.inputText, fontSize: 13, fontWeight: '500' },
    customHint: { color: C.muted, fontSize: 11, fontWeight: '500' },
    inputError: { borderColor: C.red },
    errorText: { color: C.redText, fontSize: 11, marginTop: 6, lineHeight: 13 },
    helperText: { color: C.muted, fontSize: 10.5, marginTop: 6, lineHeight: 13 },

    exactSection: { gap: 6 },
    timeInputBox: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: C.lineInput, backgroundColor: C.inputBg, borderRadius: 12, paddingHorizontal: 12 },
    timeInputLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    timeIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
    timeInputLabel: { color: C.muted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    timeInputValue: { color: C.inputText, fontSize: 14, fontWeight: '600', marginTop: 1 },

    noteRow: { flexDirection: 'row', alignItems: 'center', height: 42, borderWidth: 1, borderColor: C.lineInput, backgroundColor: C.inputBg, borderRadius: 11, paddingHorizontal: 12, marginTop: 12, gap: 8 },
    noteInput: { flex: 1, color: C.inputText, fontSize: 13.5, fontWeight: '400', paddingVertical: 0, height: '100%' },

    preview: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 11, backgroundColor: C.greenWash, borderWidth: 1, borderColor: C.greenLine, gap: 9 },
    previewBlocked: { backgroundColor: C.redWash, borderColor: C.redLine },
    previewIcon: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
    previewIconBlocked: { backgroundColor: C.red },
    previewTexts: { flex: 1 },
    previewMain: { color: C.white, fontSize: 12.5, fontWeight: '700', lineHeight: 16 },
    previewDot: { color: C.muted, fontWeight: '400' },
    previewOffset: { color: C.mutedLight, fontSize: 11.5, fontWeight: '500' },
    previewSub: { color: C.mutedLight, fontSize: 10.5, marginTop: 2 },
    previewWarning: { color: C.redText, fontSize: 10.5, fontWeight: '600', marginTop: 2 },
    emptyPreview: { marginTop: 10, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', borderStyle: 'dashed' },
    hintText: { color: C.muted, fontSize: 11, fontWeight: '500', textAlign: 'center' },

    actions: { flexDirection: 'row', gap: 10 },
    cancelBtn: { flex: 1, height: 50, borderRadius: 13, backgroundColor: C.cardRaised, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
    cancelText: { color: C.white, fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
    submitBtn: {
        flex: 1.35, height: 50, borderRadius: 13, backgroundColor: C.gold, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        ...Platform.select({ ios: { shadowColor: C.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 }, android: { elevation: 3 } }),
    },
    submitBtnDisabled: { opacity: 0.45 },
    submitText: { color: C.ink, fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
    submitIcon: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.12)', alignItems: 'center', justifyContent: 'center' },
});
