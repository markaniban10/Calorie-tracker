import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Card, Field, Button } from '../components/ui';
import * as storage from '../storage/storage';
import { todayKey } from '../utils/calc';
import { colors } from '../theme';

export default function WeightScreen() {
  const [weights, setWeights] = useState([]); // newest first
  const [kg, setKg] = useState('');

  const load = useCallback(async () => setWeights(await storage.getWeights()), []);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    const n = parseFloat(kg);
    if (!n || n <= 0) {
      Alert.alert('Enter your weight', 'Type your weight in kg.');
      return;
    }
    await storage.addWeight({ date: todayKey(), kg: n });
    setKg('');
    load();
  };

  const remove = async (id) => {
    await storage.deleteWeight(id);
    load();
  };

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
        <Button title="Log weight" onPress={add} />
      </Card>

      {latest && (
        <Card>
          <Text style={s.big}>{latest.kg} kg</Text>
          {change !== null && (
            <Text style={s.sub}>
              {change > 0 ? '+' : ''}
              {change.toFixed(1)} kg since {oldest.date}
            </Text>
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

      {weights.length === 0 ? (
        <Text style={s.none}>No weigh-ins yet. Log one above to start your trend.</Text>
      ) : (
        weights.map((w) => (
          <View key={w.id} style={s.item}>
            <Text style={s.date}>{w.date}</Text>
            <Text style={s.kg}>{w.kg} kg</Text>
            <TouchableOpacity onPress={() => remove(w.id)} hitSlop={10}>
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
  big: { fontSize: 40, fontWeight: '800', color: colors.ink },
  sub: { color: colors.muted, marginBottom: 14, fontSize: 14 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 84, gap: 4 },
  barWrap: { flex: 1, justifyContent: 'flex-end' },
  bar: { backgroundColor: colors.deficit, borderRadius: 3, opacity: 0.85 },
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
  date: { flex: 1, color: colors.muted, fontSize: 14 },
  kg: { fontSize: 16, fontWeight: '800', color: colors.ink, marginRight: 12 },
  del: { color: colors.danger, fontSize: 13, fontWeight: '600' },
});
