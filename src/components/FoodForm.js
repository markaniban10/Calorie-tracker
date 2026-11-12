import React, { useState } from 'react';
import { Text, Alert, StyleSheet } from 'react-native';
import { Field, Button } from './ui';
import { useStyles } from '../theme';

// Shared form for adding or editing one of the user's own foods.
export default function FoodForm({ title, initial, saveLabel = 'Save food', onSave, onCancel }) {
  const s = useStyles(makeStyles);
  const [f, setF] = useState({
    name: initial?.name ?? '',
    serving: initial?.serving ?? '1 serving',
    kcal: initial?.kcal ? String(initial.kcal) : '',
    grams: initial?.grams ? String(initial.grams) : '',
  });
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  const submit = () => {
    const kcal = parseInt(f.kcal, 10);
    if (!f.name.trim() || !kcal || kcal <= 0) {
      Alert.alert('Missing info', 'Enter a name and the calories per serving.');
      return;
    }
    onSave({
      name: f.name.trim(),
      serving: f.serving.trim() || '1 serving',
      kcal,
      grams: parseFloat(f.grams) || null,
    });
  };

  return (
    <>
      <Text style={s.heading}>{title}</Text>
      <Field label="Name" value={f.name} onChangeText={set('name')} placeholder="My usual chicken rice" keyboardType="default" />
      <Field label="Serving size" value={f.serving} onChangeText={set('serving')} placeholder="1 plate" keyboardType="default" />
      <Field label="Calories per serving" suffix="kcal" value={f.kcal} onChangeText={set('kcal')} placeholder="650" />
      <Field label="Weight of one serving (optional)" suffix="g" value={f.grams} onChangeText={set('grams')} placeholder="300" />
      <Text style={s.hint}>
        Tip: copy calories from the nutrition label. Add the serving weight to log this food by grams later.
      </Text>
      <Button title={saveLabel} onPress={submit} />
      <Button title="Cancel" variant="ghost" onPress={onCancel} style={{ marginTop: 8 }} />
    </>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    heading: { fontSize: 18, fontWeight: '800', color: c.ink, marginBottom: 12 },
    hint: { color: c.muted, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  });