import React, { useState, useCallback, useEffect } from 'react';
import { Alert as RNAlert } from 'react-native';
import { AppAlertModal } from './AppAlertModal';

// Global holder for show function so Alert.alert patch can call it even outside React
let globalShow = null;

export function showAppAlert(opts) {
  if (globalShow) globalShow(opts);
}

export function patchAlert() {
  const original = RNAlert.alert.bind(RNAlert);
  RNAlert.alert = (title, message, buttons, options) => {
    // Support Alert.alert('message') single arg
    // Also Alert.alert(title, message, buttons)
    let t = title;
    let m = message;
    let btns = buttons;
    // If first arg is string and second is undefined and buttons undefined, it's probably message only
    // But native handles title as first param. We'll just pass through.
    // Normalize if message is array (buttons passed as second arg)
    if (Array.isArray(message) && !buttons) {
      btns = message;
      m = undefined;
    }
    // Map RN buttons to our modal buttons
    const mapped = Array.isArray(btns)
      ? btns.map(b => {
          const s = (b.style || '').toLowerCase();
          let style = 'secondary';
          if (s === 'destructive') style = 'destructive';
          else if (s === 'cancel') style = 'ghost';
          else if (s === 'default') style = 'primary';
          // Heuristic: last button is primary
          return { text: b.text || 'OK', style, onPress: b.onPress };
        })
      : undefined;

    // Heuristic variant from title
    const lower = String(t || '').toLowerCase();
    let variant = 'default';
    if (lower.includes('error') || lower.includes('failed') || lower.includes('invalid')) variant = 'error';
    else if (lower.includes('success') || lower.includes('placed') || lower.includes('confirm')) variant = 'success';
    else if (lower.includes('logout')) variant = 'warning';
    else if (lower.includes('cancel')) variant = 'info';

    // If we have a global modal, use it; otherwise fallback to original (should not happen)
    if (globalShow) {
      globalShow({
        title: String(t || ''),
        message: m ? String(m) : '',
        variant,
        buttons: mapped,
      });
      // Do not call original - we replaced
    } else {
      original(title, message, buttons, options);
    }
  };
}

export function GlobalAlertProvider({ children }) {
  const [state, setState] = useState(null);

  const show = useCallback((opts) => {
    setState({ visible: true, ...opts });
  }, []);
  const hide = useCallback(() => setState(null), []);

  useEffect(() => {
    globalShow = show;
    patchAlert();
    return () => {
      globalShow = null;
    };
  }, [show]);

  const modalProps = state
    ? {
        visible: true,
        onClose: hide,
        title: state.title,
        message: state.message,
        variant: state.variant || 'default',
        icon: state.icon,
        iconColor: state.iconColor,
        iconBg: state.iconBg,
        buttons: state.buttons?.map(b => ({
          ...b,
          onPress: () => {
            if (b.onPress) b.onPress();
          },
        })),
        dismissOnBackdrop: state.dismissOnBackdrop,
      }
    : { visible: false, onClose: hide };

  return (
    <>
      {children}
      <AppAlertModal {...modalProps} />
    </>
  );
}
