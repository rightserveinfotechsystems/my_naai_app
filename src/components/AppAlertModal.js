import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_THEME } from '../shop/shopTheme';

/**
 * AppAlertModal — themed replacement for Alert.alert
 * Matches My Naai dark theme: bg #080A0A, card #1C2121, line #252B2B, gold #E8B97E
 *
 * Props:
 *  visible: boolean
 *  onClose: () => void
 *  title: string
 *  message: string | ReactNode
 *  icon: Ionicons name (default auto by variant)
 *  iconColor: string
 *  iconBg: string
 *  variant: 'default' | 'info' | 'success' | 'warning' | 'error' | 'location'
 *  buttons: Array<{ text, onPress, style: 'primary'|'secondary'|'ghost'|'destructive', icon }>
 *  dismissOnBackdrop: boolean (default true if no destructive primary)
 */
export function AppAlertModal({
  visible,
  onClose,
  title,
  message,
  icon,
  iconColor,
  iconBg,
  variant = 'default',
  buttons = [],
  dismissOnBackdrop = true,
}) {
  const insets = useSafeAreaInsets();

  const variantMap = {
    default: { icon: 'information-circle', color: APP_THEME.gold, bg: APP_THEME.goldWash },
    info: { icon: 'information-circle', color: APP_THEME.gold, bg: APP_THEME.goldWash },
    success: { icon: 'checkmark-circle', color: APP_THEME.green, bg: 'rgba(110,209,158,0.14)' },
    warning: { icon: 'warning', color: '#E8B97E', bg: 'rgba(232,185,126,0.14)' },
    error: { icon: 'close-circle', color: APP_THEME.red, bg: 'rgba(242,123,116,0.14)' },
    location: { icon: 'location', color: APP_THEME.gold, bg: APP_THEME.goldWash },
    payment: { icon: 'card', color: APP_THEME.gold, bg: APP_THEME.goldWash },
  };

  const v = variantMap[variant] || variantMap.default;
  const resolvedIcon = icon || v.icon;
  const resolvedIconColor = iconColor || v.color;
  const resolvedIconBg = iconBg || v.bg;

  // Normalize buttons: ensure at least one close
  const normButtons =
    buttons && buttons.length
      ? buttons
      : [{ text: 'OK', style: 'primary', onPress: onClose }];

  const handleButtonPress = (btn) => {
    // Close first unless explicitly keepOpen, then run callback
    const keepOpen = btn.keepOpen;
    if (!keepOpen && onClose) onClose();
    // Use setTimeout to avoid state update during render if onClose triggers unmount
    if (btn.onPress) setTimeout(() => btn.onPress(), 10);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.overlay}
        onPress={() => {
          if (dismissOnBackdrop) onClose?.();
        }}
      >
        <Pressable style={[styles.card, { paddingBottom: Math.max(16, insets.bottom + 12) }]} onPress={() => {}}>
          {/* Top accent line */}
          <View style={[styles.accent, { backgroundColor: resolvedIconColor }]} />

          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: resolvedIconBg, borderColor: resolvedIconColor + '22' }]}>
            <Ionicons name={resolvedIcon} size={26} color={resolvedIconColor} />
          </View>

          {/* Title */}
          {title ? <Text style={styles.title}>{title}</Text> : null}

          {/* Message */}
          {message ? (
            typeof message === 'string' ? (
              <Text style={styles.message}>{message}</Text>
            ) : (
              <View style={styles.messageCustom}>{message}</View>
            )
          ) : null}

          {/* Buttons */}
          <View style={normButtons.length === 2 ? styles.row : styles.column}>
            {normButtons.map((btn, idx) => {
              const style = btn.style || (idx === normButtons.length - 1 ? 'primary' : 'secondary');
              const isPrimary = style === 'primary';
              const isDestructive = style === 'destructive';
              const isGhost = style === 'ghost';

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.9}
                  onPress={() => handleButtonPress(btn)}
                  style={[
                    styles.btn,
                    normButtons.length === 2 && styles.btnFlex,
                    isPrimary && styles.btnPrimary,
                    isDestructive && styles.btnDestructive,
                    !isPrimary && !isDestructive && styles.btnSecondary,
                    isGhost && styles.btnGhost,
                    btn.styleOverride,
                  ]}
                >
                  {btn.icon ? (
                    <Ionicons
                      name={btn.icon}
                      size={14}
                      color={isPrimary ? APP_THEME.bg : isDestructive ? '#fff' : isGhost ? APP_THEME.muted : APP_THEME.white}
                      style={{ marginRight: 6 }}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.btnText,
                      isPrimary && styles.btnTextPrimary,
                      isDestructive && styles.btnTextDestructive,
                      isGhost && styles.btnTextGhost,
                    ]}
                    numberOfLines={2}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Convenience hook-like helper — not a real hook, just builder
// Usage: const [alertState, showAlert, hideAlert] = useAppAlertState()
// We'll export a simple state factory you can use in screens without context
import { useState, useCallback } from 'react';
export function useAppAlertState() {
  const [state, setState] = useState(null);
  const show = useCallback((opts) => {
    // opts: { title, message, icon, variant, buttons }
    setState({ visible: true, ...opts });
  }, []);
  const hide = useCallback(() => setState(null), []);
  const modalProps = state
    ? {
        visible: true,
        onClose: hide,
        title: state.title,
        message: state.message,
        icon: state.icon,
        iconColor: state.iconColor,
        iconBg: state.iconBg,
        variant: state.variant,
        buttons: state.buttons?.map((b) => ({
          ...b,
          onPress: () => {
            // allow button to close manually; we close first in handler then call
            if (b.onPress) b.onPress();
          },
        })),
        dismissOnBackdrop: state.dismissOnBackdrop,
      }
    : { visible: false, onClose: hide };
  return [state, show, hide, modalProps];
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: APP_THEME.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: APP_THEME.line,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 24,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.9,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 4,
  },
  title: {
    color: APP_THEME.white,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  message: {
    color: APP_THEME.mutedLight,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  messageCustom: {
    width: '100%',
    marginBottom: 18,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  column: {
    width: '100%',
    gap: 10,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
  },
  btnFlex: {
    flex: 1,
  },
  btnPrimary: {
    backgroundColor: APP_THEME.gold,
    borderColor: APP_THEME.gold,
  },
  btnSecondary: {
    backgroundColor: APP_THEME.bg,
    borderColor: APP_THEME.line,
  },
  btnDestructive: {
    backgroundColor: APP_THEME.red,
    borderColor: APP_THEME.red,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    color: APP_THEME.white,
  },
  btnTextPrimary: {
    color: APP_THEME.bg,
  },
  btnTextDestructive: {
    color: '#fff',
  },
  btnTextGhost: {
    color: APP_THEME.muted,
    fontWeight: '700',
  },
});
