import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme, useStyles, font } from '../theme';

const ToastContext = createContext({ show: () => {} });
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const { colors } = useTheme();
  const s = useStyles(makeStyles);
  const [message, setMessage] = useState('');
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  const show = useCallback(
    (text) => {
      setMessage(text);
      clearTimeout(timer.current);
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start();
      }, 2200);
    },
    [opacity]
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {children}
        <Animated.View pointerEvents="none" style={[s.toast, { opacity, backgroundColor: colors.ink }]}>
          <Text style={[s.text, { color: colors.bg }]} numberOfLines={2}>
            {message}
          </Text>
        </Animated.View>
      </View>
    </ToastContext.Provider>
  );
}

const makeStyles = (c, fs) =>
  StyleSheet.create({
    toast: {
      position: 'absolute',
      left: 24,
      right: 24,
      bottom: 104,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 14,
      alignItems: 'center',
    },
    text: { fontFamily: font.semibold, fontSize: fs(14), textAlign: 'center' },
  });