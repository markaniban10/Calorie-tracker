import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native';
import { Card, Field, Label, Chips, Button } from '../components/ui';
import { ACTIVITY_LEVELS, GOALS, PACES, calcTargets } from '../utils/calc';
import { colors } from '../theme';

export default function ProfileScreen({ profile, onSave }) {
  const [form, setForm] = useState({
    sex: profile?.sex ?? 'male',
    age: profile?.age ? String(profile.age) : '',
    heightCm: profile?.heightCm ? String(profile.heightCm) : '',
    weightKg: profile?.weightKg ? String(profile.weightKg) : '',
    activity: profile?.activity ?? 'moderate',
    goal: profile?.goal ?? 'maintain',
    pace: profile?.pace ?? 'steady',
  });

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const result = calcTargets(form);
  const activity = ACTIVITY_LEVELS.find((a) => a.key === form.activity);

  const save = () => {
    if (!result) {
      Alert.alert('Missing info', 'Enter your age, height and weight first.');
      return;
    }
    onSave({
      ...form,
      age: +form.age,
      heightCm: +form.heightCm,
      weightKg: +form.weightKg,
      target: result.target,
      tdee: result.tdee,
    });
  };

  return (
    <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <Card>
        <Label>Sex</Label>
        <Chips
          options={[{ key: 'male', label: 'Male' }, { key: 'female', label: 'Female' }]}
          value={form.sex}
          onChange={set('sex')}
        />
        <View style={s.row}>
          <Field label="Age" suffix="yrs" value={form.age} onChangeText={set('age')} placeholder="21" />
          <View style={{ width: 12 }} />
          <Field label="Height" suffix="cm" value={form.heightCm} onChangeText={set('heightCm')} placeholder="170" />
        </View>
        <Field label="Weight" suffix="kg" value={form.weightKg} onChangeText={set('weightKg')} placeholder="70" />
      </Card>

      <Card>
        <Label>Activity level</Label>
        <Chips options={ACTIVITY_LEVELS} value={form.activity} onChange={set('activity')} />
        <Text style={s.hint}>{activity.hint}</Text>

        <Label>Goal</Label>
        <Chips options={GOALS} value={form.goal} onChange={set('goal')} />

        {form.goal !== 'maintain' && (
          <>
            <Label>Pace (kcal/day)</Label>
            <Chips
              options={PACES[form.goal].map((p) => ({ ...p, label: `${p.label} (${p.kcal})` }))}
              value={form.pace}
              onChange={set('pace')}
            />
          </>
        )}
      </Card>

      {result && (
        <Card>
          <Text style={s.big}>{result.target.toLocaleString()} kcal</Text>
          <Text style={s.sub}>daily target</Text>
          <View style={s.stats}>
            <Stat label="BMR" value={result.bmr} />
            <Stat label="Maintenance" value={result.tdee} />
            <Stat label="Adjustment" value={`${result.adjust > 0 ? '+' : ''}${result.adjust}`} />
          </View>
          {result.belowFloor && (
            <Text style={s.warn}>
              This pace would go below a safe minimum, so the target was raised. Pick a slower pace.
            </Text>
          )}
          <Text style={s.note}>
            This is an estimate. If your weight isn't moving as expected after 2-3 weeks, adjust by 100-200 kcal.
          </Text>
        </Card>
      )}

      <Button title="Save profile" onPress={save} />
    </ScrollView>
  );
}

function Stat({ label, value }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row' },
  hint: { color: colors.muted, fontSize: 13, marginTop: -4, marginBottom: 14 },
  big: { fontSize: 40, fontWeight: '800', color: colors.ink },
  sub: { color: colors.muted, marginBottom: 14 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  stat: { flex: 1 },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.ink },
  statLabel: { fontSize: 12, color: colors.muted },
  warn: { color: colors.danger, fontSize: 13, marginBottom: 8 },
  note: { color: colors.muted, fontSize: 12, lineHeight: 17 },
});
