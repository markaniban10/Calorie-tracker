import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Card, Field, Button, Badge, IconCircle, SectionTitle, confirmRemove } from '../components/ui';
import { useToast } from '../components/Toast';
import * as storage from '../storage/storage';
import { todayKey } from '../utils/calc';
import { useStyles, font } from '../theme';

export default function WeightScreen() {
  const s = useStyles(makeStyles);
  const { show } = useToast();
  const [weights, setWeights] = useState([]); // newest first
  const [kg, setKg] = useState('');

  const load = useCallback(async () => setWeights(await storage.getWeights()), []);
  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    const n = parseFloat(kg);
    if (!n || n <= 0) {
      Alert.alert('Enter your weight', 'Type your weight in kg.');
      return;
    }
    await storage.addWeight({ date: todayKey(), kg: n });
    setKg('');
    show('Weight saved');
    load();
  };

  const remove = (w) =>
    confirmRemove(`Remove ${w.kg} kg?`, `This deletes your weigh-in from ${w.date}.`, async () => {
      await storage.deleteWeight(w.id);
      show('Weigh-in removed');
      load();
    });

  const latest = weights[0];
  const oldest = weights[weights.length - 1];
  const change = latest && oldest && weights.length > 1 ? latest.kg - oldest.kg : null;

  // mini bar trend: last 14 entries, oldest -> newest
  const recent = weights.slice(0, 14).reverse();
  const min = recent.length ? Math.min(...recent.map((w) => w.kg)) : 0;
  const max = recent.length ? Math.max(...recent.map((w) => w.kg)) : 0;
  const range = Math.max(max - min, 0.5);

  return (
    <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <Card>
        <Field label="Today's weight" suffix="kg" value={kg} onChangeText={setKg} placeholder="70.5" />
        <Button title="Log weight" icon="add" onPress={add} />
      </Card>

      {latest && (
        <Card>
          <View style={s.heroHead}>
            <IconCircle name="barbell-outline" size={40} />
            <Text style={s.kicker}>Latest weigh-in</Text>
          </View>
          <View style={s.heroRow}>
            <Text style={s.big}>{latest.kg}</Text>
            <Text style={s.unit}> kg</Text>
          </View>
          {change !== null && (
            <View style={{ alignSelf: 'flex-start', marginBottom: 14 }}>
              <Badge
                tone={change > 0 ? 'surplus' : 'deficit'}
                icon={change > 0 ? 'trending-up' : 'trending-down'}
                text={`${change > 0 ? '+' : ''}${change.toFixed(1)} kg since ${oldest.date}`}
              />
            </View>
          )}
          {recent.length > 1 && (
            <View style={s.chart}>
              {recent.map((w) => (
                <View key={w.id} style={s.barWrap}>
                  <View style={[s.bar, { height: 14 + ((w.kg - min) / range) * 66 }]} />
                </View>
              ))}
            </View>
          )}
        </Card>
      )}

      <SectionTitle icon="time-outline" title="History" right={`${weights.length} ${weights.length === 1 ? 'entry' : 'entries'}`} />

      {weights.length === 0 ? (
        <Card>
          <Text style={s.none}>No weigh-ins yet. Log one above to start your trend.</Text>
        </Card>
      ) : (
        <Card style={{ paddingVertical: 6 }}>
          {weights.map((w, i) => (
            <View key={w.id} style={[s.item, i > 0 && s.itemBorder]}>
              <Text style={s.date}>{w.date}</Text>
              <Text style={s.kg}>{w.kg} kg</Text>
              <TouchableOpacity onPress={() => remove(w)} hitSlop={10}>
                <Text style={s.del}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const makeStyles = (c, fs) =>
  StyleSheet.create({
    pad: { padding: 16, paddingBottom: 40 },
    heroHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    kicker: { fontFamily: font.semibold, fontSize: fs(14), color: c.muted, marginLeft: 12 },
    heroRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
    big: { fontFamily: font.black, fontSize: fs(48), color: c.ink, letterSpacing: -1 },
    unit: { fontFamily: font.semibold, fontSize: fs(18), color: c.muted },
    chart: { flexDirection: 'row', alignItems: 'flex-end', height: 84, gap: 4 },
    barWrap: { flex: 1, justifyContent: 'flex-end' },
    bar: { backgroundColor: c.deficit, borderRadius: 4, opacity: 0.85 },
    none: { fontFamily: font.regular, color: c.muted, textAlign: 'center', lineHeight: fs(21), fontSize: fs(14) },
    item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
    itemBorder: { borderTopWidth: 1, borderTopColor: c.line },
    date: { flex: 1, fontFamily: font.regular, color: c.muted, fontSize: fs(14) },
    kg: { fontFamily: font.bold, fontSize: fs(16), color: c.ink, marginRight: 14 },
    del: { fontFamily: font.semibold, color: c.danger, fontSize: fs(13) },
  });