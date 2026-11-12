import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Card, Button, confirmRemove } from '../components/ui';
import FoodForm from '../components/FoodForm';
import { useToast } from '../components/Toast';
import * as storage from '../storage/storage';
import { useStyles } from '../theme';

export default function MyFoodsScreen() {
  const s = useStyles(makeStyles);
  const { show } = useToast();
  const [foods, setFoods] = useState([]);
  const [form, setForm] = useState(null); // null = closed, {} = adding, food = editing

  const load = useCallback(async () => setFoods(await storage.getCustomFoods()), []);
  useEffect(() => {
    load();
  }, [load]);

  const save = async (values) => {
    if (form && form.id) {
      await storage.updateCustomFood({ id: form.id, ...values });
      show('Food updated');
    } else {
      await storage.addCustomFood({ ...values, markUsed: false });
      show('Food added');
    }
    setForm(null);
    load();
  };

  const remove = (food) =>
    confirmRemove(
      `Remove "${food.name}"?`,
      'This deletes it from your foods. Meals you already logged keep their calories.',
      async () => {
        await storage.deleteFood(food.id);
        show(`Removed ${food.name}`);
        load();
      }
    );

  if (form) {
    return (
      <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
        <Card>
          <FoodForm
            title={form.id ? 'Edit food' : 'Add a food'}
            initial={form.id ? form : null}
            saveLabel={form.id ? 'Save changes' : 'Save food'}
            onSave={save}
            onCancel={() => setForm(null)}
          />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <Card>
        <Text style={s.title}>Foods you added</Text>
        <Text style={s.sub}>
          {foods.length === 0
            ? 'Save foods you eat often, like meals you cook or items from a nutrition label.'
            : `${foods.length} ${foods.length === 1 ? 'food' : 'foods'}. They also show up when you search on the Today tab.`}
        </Text>
        <Button title="Add a food" onPress={() => setForm({})} />
      </Card>

      {foods.length === 0 ? (
        <Text style={s.empty}>Nothing here yet.</Text>
      ) : (
        foods.map((f) => (
          <Card key={f.id}>
            <View style={s.top}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{f.name}</Text>
                <Text style={s.serving}>
                  {f.serving}
                  {f.grams ? ` (${f.grams} g)` : ''}
                </Text>
              </View>
              <Text style={s.kcal}>{f.kcal}</Text>
              <Text style={s.kcalUnit}> kcal</Text>
            </View>
            <View style={s.actions}>
              <Button title="Edit" variant="ghost" small onPress={() => setForm(f)} style={{ flex: 1 }} />
              <View style={{ width: 10 }} />
              <Button title="Remove" variant="danger" small onPress={() => remove(f)} style={{ flex: 1 }} />
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    pad: { padding: 16, paddingBottom: 40 },
    title: { fontSize: 20, fontWeight: '800', color: c.ink },
    sub: { color: c.muted, fontSize: 14, lineHeight: 20, marginTop: 4, marginBottom: 14 },
    empty: { color: c.muted, textAlign: 'center', marginTop: 8 },
    top: { flexDirection: 'row', alignItems: 'baseline' },
    name: { fontSize: 17, fontWeight: '700', color: c.ink },
    serving: { fontSize: 13, color: c.muted, marginTop: 2 },
    kcal: { fontSize: 20, fontWeight: '800', color: c.ink },
    kcalUnit: { fontSize: 13, color: c.muted },
    actions: { flexDirection: 'row', marginTop: 14 },
  });