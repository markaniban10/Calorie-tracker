import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  SafeAreaView,
  ScrollView,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import * as storage from './src/storage/storage';
import { ThemeProvider, useTheme, useStyles, palettes, font, FONT_SCALES, DEFAULT_SCALE_KEY } from './src/theme';
import { ToastProvider, useToast } from './src/components/Toast';
import Drawer from './src/components/Drawer';
import ProfileScreen from './src/screens/ProfileScreen';
import TodayScreen from './src/screens/TodayScreen';
import WeightScreen from './src/screens/WeightScreen';
import AboutScreen from './src/screens/AboutScreen';
import ContactsScreen from './src/screens/ContactsScreen';

const TABS = [
  { key: 'today', label: 'Today', title: 'Today', icon: 'today-outline', iconOn: 'today' },
  { key: 'weight', label: 'Weight', title: 'Weight', icon: 'barbell-outline', iconOn: 'barbell' },
  { key: 'profile', label: 'Profile', title: 'Profile', icon: 'person-outline', iconOn: 'person' },
];

const PAGES = {
  about: { title: 'About us' },
  contacts: { title: 'Contacts' },
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [dark, setDark] = useState(false);
  const [scaleKey, setScaleKey] = useState(DEFAULT_SCALE_KEY);

  useEffect(() => {
    (async () => {
      try {
        await storage.initStorage();
        setProfile(await storage.getProfile());
        setDark((await storage.getSetting('dark_mode')) === '1');
        const savedScale = await storage.getSetting('font_scale');
        if (FONT_SCALES.some((f) => f.key === savedScale)) setScaleKey(savedScale);
        setReady(true);
      } catch (e) {
        console.error('Startup failed:', e);
        setError(e);
      }
    })();
  }, []);

  // remember dark mode and text size between launches
  useEffect(() => {
    if (ready) storage.setSetting('dark_mode', dark ? '1' : '0');
  }, [dark, ready]);
  useEffect(() => {
    if (ready) storage.setSetting('font_scale', scaleKey);
  }, [scaleKey, ready]);

  const toggleDark = useCallback(() => setDark((d) => !d), []);

  const saveProfile = useCallback(async (p) => {
    await storage.saveProfile(p);
    setProfile(p);
  }, []);

  const light = palettes.light;

  if (error) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: light.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}
      >
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: light.danger, marginBottom: 10 }}>
            The app could not start
          </Text>
          <Text style={{ fontSize: 16, color: light.ink, marginBottom: 12 }}>{String(error?.message ?? error)}</Text>
          {error?.stack ? (
            <Text style={{ fontSize: 12, color: light.muted }}>{String(error.stack).slice(0, 800)}</Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // wait for the database and the font (if the font fails to load, the app still starts with the system font)
  if (!ready || !(fontsLoaded || fontError)) {
    return (
      <View style={{ flex: 1, backgroundColor: light.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: light.muted }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider dark={dark} onToggle={toggleDark} scaleKey={scaleKey} onScaleChange={setScaleKey}>
      <ToastProvider>
        <Main profile={profile} onSaveProfile={saveProfile} initialTab={profile ? 'today' : 'profile'} />
      </ToastProvider>
    </ThemeProvider>
  );
}

function Main({ profile, onSaveProfile, initialTab }) {
  const { colors, fs } = useTheme();
  const s = useStyles(makeStyles);
  const { show } = useToast();
  const [tab, setTab] = useState(initialTab);
  const [page, setPage] = useState(null); // null | 'about' | 'contacts'
  const [drawer, setDrawer] = useState(false);

  const closeDrawer = useCallback(() => setDrawer(false), []);
  const openPage = useCallback((p) => {
    setDrawer(false);
    setPage(p);
  }, []);

  // Android back button leaves a full page
  useEffect(() => {
    if (!page) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setPage(null);
      return true;
    });
    return () => sub.remove();
  }, [page]);

  const handleSaveProfile = async (p) => {
    await onSaveProfile(p);
    setTab('today');
    show('Profile saved');
  };

  const current = TABS.find((t) => t.key === tab);
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />

      {/* Header */}
      {page ? (
        <View style={s.header}>
          <TouchableOpacity onPress={() => setPage(null)} style={s.iconBtn} activeOpacity={0.7} hitSlop={8}>
            <Ionicons name="chevron-back" size={fs(24)} color={colors.ink} />
          </TouchableOpacity>
          <Text style={s.title}>{PAGES[page].title}</Text>
        </View>
      ) : (
        <View style={s.header}>
          <TouchableOpacity onPress={() => setDrawer(true)} style={s.iconBtn} activeOpacity={0.7} hitSlop={8}>
            <Ionicons name="menu" size={fs(24)} color={colors.ink} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{current.title}</Text>
            {tab === 'today' ? <Text style={s.subtitle}>{dateLabel}</Text> : null}
          </View>
        </View>
      )}

      {/* Content */}
      <View style={{ flex: 1 }}>
        {page === 'about' && <AboutScreen />}
        {page === 'contacts' && <ContactsScreen />}
        {!page && tab === 'today' && <TodayScreen profile={profile} goToProfile={() => setTab('profile')} />}
        {!page && tab === 'weight' && <WeightScreen />}
        {!page && tab === 'profile' && <ProfileScreen profile={profile} onSave={handleSaveProfile} />}
      </View>

      {/* Tab bar */}
      {!page && (
        <View style={s.tabBar}>
          {TABS.map((t) => {
            const on = tab === t.key;
            return (
              <TouchableOpacity key={t.key} style={s.tab} onPress={() => setTab(t.key)} activeOpacity={0.7}>
                <View style={[s.tabPill, on && s.tabPillOn]}>
                  <Ionicons name={on ? t.iconOn : t.icon} size={fs(22)} color={on ? colors.deficit : colors.muted} />
                </View>
                <Text style={[s.tabText, on && s.tabTextOn]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Drawer visible={drawer} onClose={closeDrawer} onNavigate={openPage} />
    </SafeAreaView>
  );
}

const makeStyles = (c, fs) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.bg,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
    iconBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.line,
      marginRight: 14,
    },
    title: { fontFamily: font.black, fontSize: fs(28), color: c.ink, letterSpacing: -0.5 },
    subtitle: { fontFamily: font.medium, fontSize: fs(13), color: c.muted, marginTop: 1 },
    tabBar: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: c.line,
      backgroundColor: c.card,
      paddingTop: 8,
      paddingBottom: 10,
    },
    tab: { flex: 1, alignItems: 'center' },
    tabPill: {
      width: fs(56),
      height: fs(32),
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 3,
    },
    tabPillOn: { backgroundColor: c.deficitSoft },
    tabText: { fontFamily: font.semibold, fontSize: fs(12), color: c.muted },
    tabTextOn: { fontFamily: font.bold, color: c.ink },
  });