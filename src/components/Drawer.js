import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useStyles, FONT_SCALES, font, radius } from '../theme';
import { IconCircle } from './ui';
import { APP_NAME, APP_VERSION } from '../config';
import { useAuth } from '../cloud/AuthContext';

const WIDTH = Math.min(Dimensions.get('window').width * 0.82, 340);

export default function Drawer({ visible, onClose, onNavigate }) {
  const { colors, dark, toggleDark, scaleKey, setScaleKey, fs } = useTheme();
  const s = useStyles(makeStyles);
  const { user } = useAuth();
  const slide = useRef(new Animated.Value(0)).current; // 0 = closed, 1 = open
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const [mounted, setMounted] = useState(false);

  // slide in / out
  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(slide, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      return undefined;
    }
    Animated.timing(slide, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
    // safety net: always unmount shortly after closing
    const t = setTimeout(() => {
      if (!visibleRef.current) setMounted(false);
    }, 300);
    return () => clearTimeout(t);
  }, [visible, slide]);

  // Android back button closes the sidebar
  useEffect(() => {
    if (!visible) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (!mounted) return null;

  const navRow = (icon, label, page, sub) => (
    <TouchableOpacity key={label} style={s.row} onPress={() => onNavigate(page)} activeOpacity={0.7}>
      <IconCircle name={icon} size={38} />
      <View style={s.rowTextWrap}>
        <Text style={s.rowLabel}>{label}</Text>
        {sub ? (
          <Text style={s.rowSub} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={fs(18)} color={colors.muted} />
    </TouchableOpacity>
  );

  return (
    <View style={s.overlay}>
      {/* Tap anywhere outside the panel to close */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View pointerEvents="none" style={[s.backdrop, { opacity: slide }]} />
      </Pressable>

      <Animated.View
        style={[
          s.panel,
          { transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [-WIDTH, 0] }) }] },
        ]}
      >
        <View style={s.brand}>
          <View style={{ flex: 1 }}>
            <Text style={s.brandName}>{APP_NAME}</Text>
            <Text style={s.brandSub}>Offline. No account.</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={10} activeOpacity={0.7}>
            <Ionicons name="close" size={fs(24)} color={colors.muted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 90 }}>
          <Text style={s.group}>Account</Text>
          {navRow(
            user ? 'person-circle' : 'person-circle-outline',
            'Account',
            'account',
            user ? user.email || user.name : 'Guest: data stays on this phone'
          )}

          <Text style={s.group}>About</Text>
          {navRow('information-circle-outline', 'About us', 'about')}
          {navRow('mail-outline', 'Contacts', 'contacts')}

          <Text style={s.group}>Preferences</Text>

          <View style={s.row}>
            <IconCircle name={dark ? 'moon' : 'sunny-outline'} size={38} tone="neutral" />
            <Text style={s.rowText}>Dark mode</Text>
            <Switch
              value={dark}
              onValueChange={toggleDark}
              trackColor={{ false: colors.line, true: colors.deficit }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={s.sizeBlock}>
            <View style={s.sizeHead}>
              <IconCircle name="text-outline" size={38} tone="neutral" />
              <Text style={s.rowText}>Text size</Text>
            </View>
            <View style={s.sizeRow}>
              {FONT_SCALES.map((f) => {
                const on = f.key === scaleKey;
                return (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => setScaleKey(f.key)}
                    activeOpacity={0.7}
                    style={[s.sizeBtn, on && s.sizeBtnOn]}
                  >
                    <Text style={[s.sizeText, on && s.sizeTextOn]}>{f.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={s.footer}>
          <Text style={s.version}>App version v{APP_VERSION}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const makeStyles = (c, fs) =>
  StyleSheet.create({
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, elevation: 50 },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: c.overlay },
    panel: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      width: WIDTH,
      backgroundColor: c.card,
      paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 64,
      borderRightWidth: 1,
      borderRightColor: c.line,
    },
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 22,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: c.line,
    },
    brandName: { fontFamily: font.black, fontSize: fs(22), color: c.ink },
    brandSub: { fontFamily: font.regular, fontSize: fs(13), color: c.muted, marginTop: 2 },
    closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: -8 },
    group: {
      fontFamily: font.bold,
      fontSize: fs(12),
      color: c.muted,
      paddingHorizontal: 22,
      marginTop: 20,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 22,
      paddingVertical: 11,
    },
    rowText: { flex: 1, fontFamily: font.semibold, fontSize: fs(16), color: c.ink, marginLeft: 14 },
    rowTextWrap: { flex: 1, marginLeft: 14 },
    rowLabel: { fontFamily: font.semibold, fontSize: fs(16), color: c.ink },
    rowSub: { fontFamily: font.regular, fontSize: fs(12), color: c.muted, marginTop: 1 },
    sizeBlock: { paddingHorizontal: 22, paddingVertical: 11 },
    sizeHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    sizeRow: { flexDirection: 'row', gap: 8 },
    sizeBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: radius.sm,
      borderWidth: 1.5,
      borderColor: c.line,
    },
    sizeBtnOn: { backgroundColor: c.primary, borderColor: c.primary },
    sizeText: { fontFamily: font.bold, fontSize: fs(15), color: c.ink },
    sizeTextOn: { color: c.onPrimary },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      padding: 22,
      borderTopWidth: 1,
      borderTopColor: c.line,
      backgroundColor: c.card,
    },
    version: { fontFamily: font.medium, fontSize: fs(13), color: c.muted },
  });