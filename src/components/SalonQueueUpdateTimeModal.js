import React, { useCallback, useEffect, useRef, useState } from 'react';
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

// Where the option card hangs below the select box (56px box + 6px gap).
const DROPDOWN_CARD_TOP = 62;

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
    const [showOffsetPicker, setShowOffsetPicker] = useState(false);

    const bookingDate = booking?.bookingDate;
    const bookingTime = booking?.bookingTime;

    /* ---------------- DROPDOWN GEOMETRY ----------------
     * The option card floats over the rest of the sheet, so it must fit in the
     * space between its top edge and the sheet's bottom (the sheet clips
     * overflow). Measure the sheet height and the select box's position inside
     * it (body → offset section → select wrap, all onLayout-driven so font
     * scaling and small screens are handled), then cap the card height and let
     * the options scroll inside it. */
    const [sheetHeight, setSheetHeight] = useState(0);
    const [anchorTop, setAnchorTop] = useState(0);
    const bodyTopRef = useRef(0); // body y within sheet
    const sectionTopRef = useRef(0); // offset section y within body
    const wrapTopRef = useRef(0); // select wrap y within offset section

    const recomputeAnchor = useCallback(() => {
        const y = bodyTopRef.current + sectionTopRef.current + wrapTopRef.current;
        setAnchorTop(prev => (prev === y ? prev : y));
    }, []);

    const onSheetLayout = useCallback(e => {
        const h = e.nativeEvent.layout.height;
        setSheetHeight(prev => (prev === h ? prev : h));
    }, []);
    const onBodyLayout = useCallback(e => {
        bodyTopRef.current = e.nativeEvent.layout.y;
        recomputeAnchor();
    }, [recomputeAnchor]);
    const onSectionLayout = useCallback(e => {
        sectionTopRef.current = e.nativeEvent.layout.y;
        recomputeAnchor();
    }, [recomputeAnchor]);
    const onWrapLayout = useCallback(e => {
        wrapTopRef.current = e.nativeEvent.layout.y;
        recomputeAnchor();
    }, [recomputeAnchor]);

    const measured = sheetHeight > 0 && anchorTop > 0;
    const cardMaxHeight = measured
        ? Math.max(110, Math.min(sheetHeight - anchorTop - DROPDOWN_CARD_TOP - 8, 340))
        : 300; // safe default for the first frame before layout events land

    useEffect(() => {
        if (!open) return;
        setMode('offset');
        setOffset(null);
        setCustom('');
        setReason('');
        const start = parseBookingDateTime(bookingDate, bookingTime);
        setExactTime(start ? toInputTime(start) : '');
        setShowTimePicker(false);
        setShowOffsetPicker(false);
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
        setMode('offset');
        setOffset(value);
        setCustom('');
        setShowOffsetPicker(false);
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
        if (!saving) {
            setShowOffsetPicker(false);
            onClose();
        }
    };

    const renderDropdownOption = value => {
        const active = mode === 'offset' && effectiveOffset === value;
        const earlier = value < 0;
        return (
            <TouchableOpacity
                key={value}
                style={[
                    styles.dropdownOption,
                    active && !earlier && styles.dropdownOptionActive,
                    active && earlier && styles.dropdownOptionEarlierActive,
                ]}
                disabled={saving}
                activeOpacity={0.75}
                onPress={() => pickOffset(value)}
            >
                <Text style={[
                    styles.dropdownOptionBadge,
                    active && !earlier && styles.dropdownOptionBadgeActive,
                    active && earlier && styles.dropdownOptionBadgeEarlier,
                ]}>
                    {earlier ? `${value}` : `+${value}`}
                </Text>
                <Text style={[
                    styles.dropdownOptionText,
                    active && styles.dropdownOptionTextActive
                ]} numberOfLines={1}>
                    {describeOffset(value)}
                </Text>
                {active && (
                    <Ionicons name="checkmark-circle" size={14} color={earlier ? C.greenInk : C.ink} style={{ marginLeft: 'auto' }} />
                )}
            </TouchableOpacity>
        );
    };

    const selectedLabel = effectiveOffset !== null && isValidOffset(effectiveOffset)
        ? describeOffset(effectiveOffset)
        : null;

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

                    <View
                        style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}
                        onLayout={onSheetLayout}
                        testID="update-time-sheet"
                    >
                        {/* Closes the dropdown when the user taps the sheet outside
                            the option card. Rendered before the body so the body
                            (and the card inside it) stays on top and tappable. */}
                        {showOffsetPicker && (
                            <TouchableOpacity
                                style={StyleSheet.absoluteFillObject}
                                activeOpacity={1}
                                onPress={() => setShowOffsetPicker(false)}
                                testID="update-time-dropdown-tapcatcher"
                            />
                        )}
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

                        <View style={styles.body} onLayout={onBodyLayout} testID="update-time-body">
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
                                    onPress={() => { setMode('offset'); setShowOffsetPicker(false); }}
                                >
                                    <Ionicons name="list" size={12} color={mode === 'offset' ? C.ink : C.muted} style={{ marginRight: 4 }} />
                                    <Text style={[styles.modeBtnText, mode === 'offset' && styles.modeBtnActiveText]}>Quick select</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modeBtn, mode === 'exact' && styles.modeBtnActive]}
                                    disabled={saving}
                                    activeOpacity={0.7}
                                    onPress={() => { setMode('exact'); setShowOffsetPicker(false); }}
                                >
                                    <Ionicons name="time-outline" size={12} color={mode === 'exact' ? C.ink : C.muted} style={{ marginRight: 4 }} />
                                    <Text style={[styles.modeBtnText, mode === 'exact' && styles.modeBtnActiveText]}>Exact time</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Content */}
                            {mode === 'offset' ? (
                                <View style={styles.offsetSection} onLayout={onSectionLayout} testID="update-time-offset-section">
                                    <Text style={styles.groupLabel}>Time adjustment</Text>

                                    {/* SELECT BOX - replaces +10 +20 chips */}
                                    <View style={styles.selectWrap} onLayout={onWrapLayout} testID="update-time-select-wrap">
                                        <TouchableOpacity
                                            style={[
                                                styles.selectBox,
                                                showOffsetPicker && styles.selectBoxOpen,
                                                selectedLabel && styles.selectBoxHasValue,
                                            ]}
                                            disabled={saving}
                                            activeOpacity={0.8}
                                            onPress={() => setShowOffsetPicker(v => !v)}
                                        >
                                            <View style={styles.selectLeft}>
                                                <View style={[styles.selectIconBox, selectedLabel && styles.selectIconBoxActive]}>
                                                    <Ionicons name="flash" size={14} color={selectedLabel ? C.ink : C.gold} />
                                                </View>
                                                <View style={styles.selectTexts}>
                                                    <Text style={styles.selectLabel}>Shift appointment</Text>
                                                    <Text style={[styles.selectValue, !selectedLabel && styles.selectPlaceholder]} numberOfLines={1}>
                                                        {selectedLabel ? `${selectedShort} • ${selectedLabel}` : 'Select minutes (e.g. 20 min later)'}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.selectRight}>
                                                {selectedLabel && (
                                                    <View style={styles.selectBadge}>
                                                        <Text style={styles.selectBadgeText}>{selectedShort}</Text>
                                                    </View>
                                                )}
                                                <Ionicons name={showOffsetPicker ? "chevron-up" : "chevron-down"} size={16} color={C.mutedLight} />
                                            </View>
                                        </TouchableOpacity>

                                        {/* DROPDOWN - proper mobile select.
                                            Anchored just under the select box (no bottom inset, so its
                                            height is always exactly its content), capped to the space
                                            left inside the sheet, with the options scrolling inside. */}
                                        {showOffsetPicker && (
                                            <View
                                                style={[styles.dropdownCard, { maxHeight: cardMaxHeight }]}
                                                testID="update-time-dropdown-card"
                                            >
                                                <View style={styles.dropdownHeader}>
                                                    <Text style={styles.dropdownTitle}>Choose time shift</Text>
                                                    <TouchableOpacity onPress={() => setShowOffsetPicker(false)} style={styles.dropdownClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                                        <Ionicons name="close-circle" size={18} color={C.muted} />
                                                    </TouchableOpacity>
                                                </View>

                                                <ScrollView
                                                    style={styles.dropdownScroll}
                                                    contentContainerStyle={styles.dropdownContent}
                                                    showsVerticalScrollIndicator={false}
                                                    bounces={false}
                                                >
                                                    <View style={styles.dropdownSection}>
                                                        <View style={styles.dropdownSectionHeader}>
                                                            <Ionicons name="arrow-forward" size={10} color={C.gold} />
                                                            <Text style={styles.dropdownSectionLabel}>Running late</Text>
                                                        </View>
                                                        <View style={styles.dropdownGrid}>
                                                            {LATER_OFFSETS.map(renderDropdownOption)}
                                                        </View>
                                                    </View>

                                                    <View style={styles.dropdownSection}>
                                                        <View style={styles.dropdownSectionHeader}>
                                                            <Ionicons name="arrow-back" size={10} color={C.green} />
                                                            <Text style={[styles.dropdownSectionLabel, { color: C.green }]}>Free earlier</Text>
                                                        </View>
                                                        <View style={styles.dropdownGrid}>
                                                            {EARLIER_OFFSETS.map(renderDropdownOption)}
                                                        </View>
                                                    </View>
                                                </ScrollView>
                                            </View>
                                        )}
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

                            {/* Actions */}
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
    body: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6 },
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

    offsetSection: { zIndex: 10 },
    groupLabel: { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },

    /* ---- NEW SELECT (replaces chips) ---- */
    selectWrap: { position: 'relative', zIndex: 20, marginBottom: 12 },
    selectBox: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: C.lineInput,
        backgroundColor: C.inputBg,
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    selectBoxOpen: { borderColor: C.gold, backgroundColor: C.inputFocusBg },
    selectBoxHasValue: { borderColor: 'rgba(232,185,126,0.35)', backgroundColor: '#1A1F1E' },
    selectLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    selectIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
    selectIconBoxActive: { backgroundColor: C.gold, borderColor: C.gold },
    selectTexts: { flex: 1 },
    selectLabel: { color: C.muted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    selectValue: { color: C.white, fontSize: 13.5, fontWeight: '600', marginTop: 2 },
    selectPlaceholder: { color: C.placeholder, fontWeight: '400' },
    selectRight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 },
    selectBadge: { backgroundColor: C.goldWash, borderWidth: 1, borderColor: 'rgba(232,185,126,0.2)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    selectBadgeText: { color: C.goldSoft, fontSize: 11, fontWeight: '700' },

    dropdownCard: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: DROPDOWN_CARD_TOP,
        zIndex: 30,
        backgroundColor: C.cardRaised,
        borderWidth: 1,
        borderColor: C.lineStrong,
        borderRadius: 14,
        overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16 },
            android: { elevation: 12 },
        }),
    },
    dropdownScroll: { flex: 1 },
    dropdownHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: C.card },
    dropdownTitle: { color: C.white, fontSize: 12.5, fontWeight: '700' },
    dropdownClose: { padding: 2 },
    dropdownContent: { padding: 8, gap: 10 },
    dropdownSection: { gap: 6 },
    dropdownSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 2 },
    dropdownSectionLabel: { color: C.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
    dropdownGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    dropdownOption: {
        width: '48.5%',
        height: 42,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        borderWidth: 1,
        borderColor: C.line,
        backgroundColor: C.card,
        borderRadius: 10,
        paddingHorizontal: 10,
    },
    dropdownOptionActive: { backgroundColor: C.gold, borderColor: C.gold },
    dropdownOptionEarlierActive: { backgroundColor: C.green, borderColor: C.green },
    dropdownOptionBadge: { backgroundColor: C.panel, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2, color: C.white, fontSize: 10.5, fontWeight: '800', minWidth: 30, textAlign: 'center', overflow: 'hidden' },
    dropdownOptionBadgeActive: { backgroundColor: 'rgba(0,0,0,0.15)', color: C.ink },
    dropdownOptionBadgeEarlier: { backgroundColor: 'rgba(0,0,0,0.12)', color: C.greenInk },
    dropdownOptionText: { color: C.mutedLight, fontSize: 11.5, fontWeight: '500', flex: 1 },
    dropdownOptionTextActive: { color: C.ink, fontWeight: '700' },

    customRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
    customLabel: { color: C.muted, fontSize: 11, fontWeight: '600' },
    customInputWrap: { flex: 1, maxWidth: 130 },
    inputSmall: { height: 38, borderWidth: 1, borderColor: C.lineInput, borderRadius: 10, backgroundColor: C.inputBg, paddingHorizontal: 12, color: C.inputText, fontSize: 13, fontWeight: '500' },
    customHint: { color: C.muted, fontSize: 11, fontWeight: '500' },
    inputError: { borderColor: C.red },
    errorText: { color: C.redText, fontSize: 11, marginTop: 6, lineHeight: 13 },
    helperText: { color: C.muted, fontSize: 10.5, marginTop: 6, lineHeight: 13 },

    exactSection: { gap: 6, zIndex: 1 },
    timeInputBox: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: C.lineInput, backgroundColor: C.inputBg, borderRadius: 12, paddingHorizontal: 12 },
    timeInputLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    timeIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
    timeInputLabel: { color: C.muted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    timeInputValue: { color: C.inputText, fontSize: 14, fontWeight: '600', marginTop: 1 },

    noteRow: { flexDirection: 'row', alignItems: 'center', height: 42, borderWidth: 1, borderColor: C.lineInput, backgroundColor: C.inputBg, borderRadius: 11, paddingHorizontal: 12, marginTop: 12, gap: 8, zIndex: 1 },
    noteInput: { flex: 1, color: C.inputText, fontSize: 13.5, fontWeight: '400', paddingVertical: 0, height: '100%' },

    preview: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 11, backgroundColor: C.greenWash, borderWidth: 1, borderColor: C.greenLine, gap: 9, zIndex: 1 },
    previewBlocked: { backgroundColor: C.redWash, borderColor: C.redLine },
    previewIcon: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
    previewIconBlocked: { backgroundColor: C.red },
    previewTexts: { flex: 1 },
    previewMain: { color: C.white, fontSize: 12.5, fontWeight: '700', lineHeight: 16 },
    previewDot: { color: C.muted, fontWeight: '400' },
    previewOffset: { color: C.mutedLight, fontSize: 11.5, fontWeight: '500' },
    previewSub: { color: C.mutedLight, fontSize: 10.5, marginTop: 2 },
    previewWarning: { color: C.redText, fontSize: 10.5, fontWeight: '600', marginTop: 2 },
    emptyPreview: { marginTop: 10, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', borderStyle: 'dashed', zIndex: 1 },
    hintText: { color: C.muted, fontSize: 11, fontWeight: '500', textAlign: 'center' },

    actions: { flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 2, zIndex: 1 },
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
