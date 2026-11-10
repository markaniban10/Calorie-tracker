import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform, SafeAreaView, ScrollView } from 'react-native';
import * as storage from './src/storage/storage';
import ProfileScreen from './src/screens/ProfileScreen';
import TodayScreen from './src/screens/TodayScreen';
import WeightScreen from './src/screens/WeightScreen';
import { colors } from './src/theme';

const TABS = [
  { key: 'today', label: 'Today' },
  { key: 'weight', label: 'Weight' },
  { key: 'profile', label: 'Profile' },
];

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('today');

  useEffect(() => {
    (async () => {
      try {
        await storage.initStorage();
        const p = await storage.getProfile();
        setProfile(p);
        if (!p) setTab('profile');
        setReady(true);
      } catch (e) {
        console.error('Startup failed:', e);
        setError(e);
      }
    })();
  }, []);

  const saveProfile = async (p) => {
    await storage.saveProfile(p);
    setProfile(p);
    setTab('today');
  };

  if (error) {
    return (
      <SafeAreaView style={s.root}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={s.errTitle}>The app could not start</Text>
          <Text style={s.errText}>{String(error?.message ?? error)}</Text>
          {error?.stack ? <Text style={s.errStack}>{String(error.stack).slice(0, 800)}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!ready) {
    return (
      <View style={[s.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.muted }}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={s.header}>
        <Text style={s.title}>{TABS.find((t) => t.key === tab).label}</Text>
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'today' && <TodayScreen profile={profile} goToProfile={() => setTab('profile')} />}
        {tab === 'weight' && <WeightScreen />}
        {tab === 'profile' && <ProfileScreen profile={profile} onSave={saveProfile} />}
      </View>

      <View style={s.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.key} style={s.tab} onPress={() => setTab(t.key)} activeOpacity={0.7}>
            <Text style={[s.tabText, tab === t.key && s.tabTextOn]}>{t.label}</Text>
            {tab === t.key && <View style={s.dot} />}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.card,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabText: { fontSize: 15, color: colors.muted, fontWeight: '600' },
  tabTextOn: { color: colors.ink, fontWeight: '800' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.deficit, marginTop: 4 },
  errTitle: { fontSize: 22, fontWeight: '800', color: colors.danger, marginBottom: 10 },
  errText: { fontSize: 16, color: colors.ink, marginBottom: 12 },
  errStack: { fontSize: 12, color: colors.muted },
});