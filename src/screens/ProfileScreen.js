import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native';
import { Card, Field, Label, Chips, Button, IconCircle, SectionTitle } from '../components/ui';
import { ACTIVITY_LEVELS, GOALS, PACES, calcTargets } from '../utils/calc';
import { useStyles, font } from '../theme';

export default function ProfileScreen({ profile, onSave }) {
  const s = useStyles(makeStyles);
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
      <SectionTitle icon="person-outline" title="About you" />
      <Card>
        <Label>Sex</Label>
        <Chips
          options={[
            { key: 'male', label: 'Male' },
            { key: 'female', label: 'Female' },
          ]}
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

      <SectionTitle icon="flame-outline" title="Activity and goal" />
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
          <View style={s.heroHead}>
            <IconCircle name="flag-outline" size={40} />
            <Text style={s.kicker}>Your daily target</Text>
          </View>
          <View style={s.heroRow}>
            <Text style={s.big}>{result.target.toLocaleString()}</Text>
            <Text style={s.unit}> kcal</Text>
          </View>
          <View style={s.stats}>
            <Stat s={s} label="BMR" value={result.bmr} />
            <Stat s={s} label="Maintenance" value={result.tdee} />
            <Stat s={s} label="Adjustment" value={`${result.adjust > 0 ? '+' : ''}${result.adjust}`} />
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

      <Button title="Save profile" icon="checkmark" onPress={save} />
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
    row: { flexDirection: 'row' },
    hint: { fontFamily: font.regular, color: c.muted, fontSize: fs(13), marginTop: -4, marginBottom: 14 },
    heroHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    kicker: { fontFamily: font.semibold, fontSize: fs(14), color: c.muted, marginLeft: 12 },
    heroRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 14 },
    big: { fontFamily: font.black, fontSize: fs(44), color: c.ink, letterSpacing: -1 },
    unit: { fontFamily: font.semibold, fontSize: fs(18), color: c.muted },
    stats: { flexDirection: 'row', marginBottom: 12 },
    stat: { flex: 1 },
    statValue: { fontFamily: font.bold, fontSize: fs(18), color: c.ink },
    statLabel: { fontFamily: font.regular, fontSize: fs(12), color: c.muted, marginTop: 2 },
    warn: { fontFamily: font.medium, color: c.danger, fontSize: fs(13), marginBottom: 8, lineHeight: fs(19) },
    note: { fontFamily: font.regular, color: c.muted, fontSize: fs(12), lineHeight: fs(18) },
  });