import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useTheme, useStyles, radius } from '../theme';
import { Button } from './ui';
import { APP_NAME, APP_VERSION, ABOUT, CONTACTS } from '../config';

const WIDTH = Math.min(Dimensions.get('window').width * 0.8, 320);

export default function Drawer({ visible, onClose }) {
  const { colors, dark, toggleDark } = useTheme();
  const s = useStyles(makeStyles);
  const slide = useRef(new Animated.Value(0)).current; // 0 = closed, 1 = open
  const [mounted, setMounted] = useState(false);
  const [info, setInfo] = useState(null); // 'about' | 'contacts' | null

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(slide, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    } else {
      Animated.timing(slide, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, slide]);

  const openInfo = (which) => {
    onClose();
    setInfo(which);
  };

  const openLink = (url) => {
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <>
      {mounted && (
        <View style={s.overlay}>
          <TouchableWithoutFeedback onPress={onClose}>
            <Animated.View style={[s.backdrop, { opacity: slide }]} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              s.panel,
              { transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [-WIDTH, 0] }) }] },
            ]}
          >
            <View style={s.brand}>
              <Text style={s.brandName}>{APP_NAME}</Text>
              <Text style={s.brandSub}>Offline. No account.</Text>
            </View>

            <TouchableOpacity style={s.row} onPress={() => openInfo('about')} activeOpacity={0.7}>
              <Text style={s.rowText}>About us</Text>
              <Text style={s.chev}>{'>'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.row} onPress={() => openInfo('contacts')} activeOpacity={0.7}>
              <Text style={s.rowText}>Contacts</Text>
              <Text style={s.chev}>{'>'}</Text>
            </TouchableOpacity>

            <View style={s.row}>
              <Text style={s.rowText}>Dark mode</Text>
              <Switch
                value={dark}
                onValueChange={toggleDark}
                trackColor={{ false: colors.line, true: colors.deficit }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={s.footer}>
              <Text style={s.version}>App version v{APP_VERSION}</Text>
            </View>
          </Animated.View>
        </View>
      )}

      <Modal visible={info !== null} transparent animationType="fade" onRequestClose={() => setInfo(null)}>
        <View style={s.modalWrap}>
          <TouchableWithoutFeedback onPress={() => setInfo(null)}>
            <View style={s.modalBackdrop} />
          </TouchableWithoutFeedback>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>{info === 'about' ? 'About us' : 'Contacts'}</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {info === 'about' &&
                ABOUT.map((p, i) => (
                  <Text key={i} style={s.para}>
                    {p}
                  </Text>
                ))}
              {info === 'contacts' &&
                CONTACTS.map((c) => (
                  <TouchableOpacity key={c.label} style={s.contact} onPress={() => openLink(c.url)} activeOpacity={0.7}>
                    <Text style={s.contactLabel}>{c.label}</Text>
                    <Text style={s.contactValue}>{c.value}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
            <Button title="Close" onPress={() => setInfo(null)} style={{ marginTop: 14 }} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
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
    brand: { paddingHorizontal: 22, paddingBottom: 22, borderBottomWidth: 1, borderBottomColor: c.line, marginBottom: 6 },
    brandName: { fontSize: 22, fontWeight: '800', color: c.ink },
    brandSub: { fontSize: 13, color: c.muted, marginTop: 2 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 22,
      paddingVertical: 16,
    },
    rowText: { fontSize: 16, color: c.ink, fontWeight: '600' },
    chev: { fontSize: 16, color: c.muted },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      padding: 22,
      borderTopWidth: 1,
      borderTopColor: c.line,
    },
    version: { fontSize: 13, color: c.muted },
    modalWrap: { flex: 1, justifyContent: 'center', padding: 24 },
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: c.overlay },
    sheet: { backgroundColor: c.card, borderRadius: radius.md, padding: 22, borderWidth: 1, borderColor: c.line },
    sheetTitle: { fontSize: 20, fontWeight: '800', color: c.ink, marginBottom: 12 },
    para: { fontSize: 15, lineHeight: 22, color: c.ink, marginBottom: 12 },
    contact: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.line },
    contactLabel: { fontSize: 13, color: c.muted },
    contactValue: { fontSize: 16, color: c.deficit, fontWeight: '600', marginTop: 2 },
  });