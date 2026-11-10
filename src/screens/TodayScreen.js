import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card, Button } from '../components/ui';
import FoodPicker from '../components/FoodPicker';
import * as storage from '../storage/storage';
import { todayKey } from '../utils/calc';
import { colors } from '../theme';

export default function TodayScreen({ profile, goToProfile }) {
  const date = todayKey();
  const [entries, setEntries] = useState([]);

  const load = useCallback(async () => setEntries(await storage.getEntries(date)), [date]);
  useEffect(() => { load(); }, [load]);

  if (!profile) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyTitle}>Set up your profile first</Text>
        <Text style={s.emptyText}>We need your height, weight and age to work out your daily target.</Text>
        <Button title="Go to profile" onPress={goToProfile} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const eaten = entries.reduce((sum, e) => sum + e.kcal, 0);
  const left = profile.target - eaten;
  const vsMaintenance = eaten - profile.tdee; // + surplus, - deficit
  const pct = Math.min(eaten / profile.target, 1);
  const over = left < 0;

  const log = async ({ name, kcal, foodId }) => {
    await storage.addEntry({ date, name, kcal, foodId });
    load();
  };

  const remove = async (id) => {
    await storage.deleteEntry(id);
    load();
  };

  return (
    <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <Card>
        <Text style={[s.big, { color: over ? colors.surplus : colors.ink }]}>
          {Math.abs(left).toLocaleString()}
        </Text>
        <Text style={s.sub}>{over ? 'kcal over target' : 'kcal left today'}</Text>

        <View style={s.track}>
          <View
            style={[s.fill, { width: `${pct * 100}%`, backgroundColor: over ? colors.surplus : colors.deficit }]}
          />
        </View>
        <View style={s.rowBetween}>
          <Text style={s.small}>{eaten.toLocaleString()} eaten</Text>
          <Text style={s.small}>{profile.target.toLocaleString()} target</Text>
        </View>
      </Card>

      <Card>
        <Text style={s.small}>Compared to maintenance ({profile.tdee.toLocaleString()} kcal)</Text>
        <Text style={[s.balance, { color: vsMaintenance > 0 ? colors.surplus : colors.deficit }]}>
          {vsMaintenance > 0 ? 'Surplus ' : 'Deficit '}
          {Math.abs(vsMaintenance).toLocaleString()} kcal
        </Text>
      </Card>

      <FoodPicker onLog={log} />

      {entries.length === 0 ? (
        <Text style={s.none}>Nothing logged yet today.</Text>
      ) : (
        entries.map((e) => (
          <View key={e.id} style={s.item}>
            <View style={{ flex: 1 }}>
              <Text style={s.itemName}>{e.name}</Text>
            </View>
            <Text style={s.itemKcal}>{e.kcal}</Text>
            <TouchableOpacity onPress={() => remove(e.id)} hitSlop={10}>
              <Text style={s.del}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 40 },
  empty: { flex: 1, padding: 32, justifyContent: 'center' },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: colors.ink },
  emptyText: { color: colors.muted, marginTop: 6, fontSize: 15, lineHeight: 21 },
  big: { fontSize: 52, fontWeight: '800' },
  sub: { color: colors.muted, marginBottom: 14, fontSize: 15 },
  track: { height: 10, borderRadius: 5, backgroundColor: colors.bg, overflow: 'hidden', marginBottom: 8 },
  fill: { height: 10, borderRadius: 5 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  small: { color: colors.muted, fontSize: 13 },
  balance: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  none: { color: colors.muted, textAlign: 'center', marginTop: 6 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginBottom: 8,
  },
  itemName: { fontSize: 16, color: colors.ink, fontWeight: '600' },
  itemKcal: { fontSize: 16, fontWeight: '800', color: colors.ink, marginHorizontal: 12 },
  del: { color: colors.danger, fontSize: 13, fontWeight: '600' },
});