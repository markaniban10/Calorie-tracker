import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card, Button, Badge, IconCircle, SectionTitle, confirmRemove } from '../components/ui';
import FoodPicker from '../components/FoodPicker';
import { useToast } from '../components/Toast';
import * as storage from '../storage/storage';
import { todayKey } from '../utils/calc';
import { useTheme, useStyles, font } from '../theme';

export default function TodayScreen({ profile, goToProfile }) {
  const { colors } = useTheme();
  const s = useStyles(makeStyles);
  const { show } = useToast();
  const date = todayKey();
  const [entries, setEntries] = useState([]);

  const load = useCallback(async () => setEntries(await storage.getEntries(date)), [date]);
  useEffect(() => {
    load();
  }, [load]);

  if (!profile) {
    return (
      <View style={s.empty}>
        <IconCircle name="person-outline" size={64} />
        <Text style={s.emptyTitle}>Set up your profile first</Text>
        <Text style={s.emptyText}>We need your height, weight and age to work out your daily target.</Text>
        <Button title="Go to profile" icon="person-outline" onPress={goToProfile} style={{ marginTop: 18 }} />
      </View>
    );
  }

  const eaten = entries.reduce((sum, e) => sum + e.kcal, 0);
  const left = profile.target - eaten;
  const vsMaintenance = eaten - profile.tdee; // + surplus, - deficit
  const pct = Math.min(eaten / profile.target, 1);
  const over = left < 0;
  const isSurplus = vsMaintenance > 0;

  const log = async ({ name, kcal, foodId }) => {
    await storage.addEntry({ date, name, kcal, foodId });
    load();
  };

  const remove = (entry) =>
    confirmRemove(`Remove "${entry.name}"?`, `This takes ${entry.kcal} kcal off today's total.`, async () => {
      await storage.deleteEntry(entry.id);
      show(`Removed ${entry.name}`);
      load();
    });

  return (
    <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <Card>
        <Text style={s.kicker}>{over ? 'Over your target by' : 'Left today'}</Text>
        <View style={s.heroRow}>
          <Text style={[s.big, over && { color: colors.surplus }]}>{Math.abs(left).toLocaleString()}</Text>
          <Text style={s.unit}> kcal</Text>
        </View>

        <View style={s.track}>
          <View
            style={[s.fill, { width: `${pct * 100}%`, backgroundColor: over ? colors.surplus : colors.deficit }]}
          />
        </View>

        <View style={s.stats}>
          <Stat s={s} label="Eaten" value={eaten.toLocaleString()} />
          <Stat s={s} label="Target" value={profile.target.toLocaleString()} />
          <Stat s={s} label="Maintenance" value={profile.tdee.toLocaleString()} />
        </View>

        <View style={s.divider} />

        <View style={s.rowBetween}>
          <Text style={s.small}>Compared to maintenance</Text>
          <Badge
            tone={isSurplus ? 'surplus' : 'deficit'}
            icon={isSurplus ? 'trending-up' : 'trending-down'}
            text={`${isSurplus ? 'Surplus' : 'Deficit'} ${Math.abs(vsMaintenance).toLocaleString()}`}
          />
        </View>
      </Card>

      <FoodPicker onLog={log} />

      <SectionTitle
        icon="restaurant-outline"
        title="Today's log"
        right={`${entries.length} ${entries.length === 1 ? 'item' : 'items'}`}
      />

      {entries.length === 0 ? (
        <Card>
          <Text style={s.none}>Nothing logged yet. Search a food above to add your first meal.</Text>
        </Card>
      ) : (
        <Card style={{ paddingVertical: 6 }}>
          {entries.map((e, i) => (
            <View key={e.id} style={[s.item, i > 0 && s.itemBorder]}>
              <IconCircle name="restaurant-outline" size={38} tone="neutral" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.itemName}>{e.name}</Text>
                <Text style={s.itemSub}>{e.kcal} kcal</Text>
              </View>
              <TouchableOpacity onPress={() => remove(e)} hitSlop={10}>
                <Text style={s.del}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

function Stat({ s, label, value }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = (c, fs) =>
  StyleSheet.create({
    pad: { padding: 16, paddingBottom: 40 },
    empty: { flex: 1, padding: 32, justifyContent: 'center', alignItems: 'center' },
    emptyTitle: { fontFamily: font.black, fontSize: fs(22), color: c.ink, marginTop: 16, textAlign: 'center' },
    emptyText: {
      fontFamily: font.regular,
      color: c.muted,
      marginTop: 6,
      fontSize: fs(15),
      lineHeight: fs(22),
      textAlign: 'center',
    },
    kicker: { fontFamily: font.semibold, fontSize: fs(14), color: c.muted },
    heroRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2, marginBottom: 14 },
    big: { fontFamily: font.black, fontSize: fs(56), color: c.ink, letterSpacing: -1.5 },
    unit: { fontFamily: font.semibold, fontSize: fs(18), color: c.muted },
    track: { height: 12, borderRadius: 6, backgroundColor: c.bg, overflow: 'hidden', marginBottom: 16 },
    fill: { height: 12, borderRadius: 6 },
    stats: { flexDirection: 'row' },
    stat: { flex: 1 },
    statValue: { fontFamily: font.bold, fontSize: fs(17), color: c.ink },
    statLabel: { fontFamily: font.regular, fontSize: fs(12), color: c.muted, marginTop: 2 },
    divider: { height: 1, backgroundColor: c.line, marginVertical: 14 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    small: { fontFamily: font.regular, color: c.muted, fontSize: fs(13), flexShrink: 1, marginRight: 8 },
    none: { fontFamily: font.regular, color: c.muted, textAlign: 'center', lineHeight: fs(21), fontSize: fs(14) },
    item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    itemBorder: { borderTopWidth: 1, borderTopColor: c.line },
    itemName: { fontFamily: font.semibold, fontSize: fs(16), color: c.ink },
    itemSub: { fontFamily: font.regular, fontSize: fs(13), color: c.muted, marginTop: 2 },
    del: { fontFamily: font.semibold, color: c.danger, fontSize: fs(13) },
  });