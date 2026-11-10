import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Card, Field, Chips, Button, Label } from './ui';
import * as storage from '../storage/storage';
import { colors, radius } from '../theme';

const MODES = [
  { key: 'search', label: 'Search food' },
  { key: 'quick', label: 'Quick add' },
];

const UNITS = [
  { key: 'serving', label: 'Servings' },
  { key: 'grams', label: 'Grams' },
];

export default function FoodPicker({ onLog }) {
  const [mode, setMode] = useState('search');
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false); // "Show all foods" toggle
  const [results, setResults] = useState([]);
  const [recent, setRecent] = useState([]);
  const [tick, setTick] = useState(0); // bump to reload the lists
  const [selected, setSelected] = useState(null);
  const [unit, setUnit] = useState('serving'); // 'serving' | 'grams'
  const [amount, setAmount] = useState('1');
  const [custom, setCustom] = useState(null); // { name, serving, grams, kcal }
  const [quick, setQuick] = useState({ name: '', kcal: '' });

  const typing = query.trim().length > 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let list = [];
      if (typing) list = await storage.searchFoods(query, 30);
      else if (showAll) list = await storage.searchFoods('', 500);
      const rec = await storage.getRecentFoods(5);
      if (!cancelled) {
        setResults(list);
        setRecent(rec);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query, showAll, tick]);

  const changeMode = (m) => {
    setMode(m);
    setSelected(null);
    setCustom(null);
  };

  const pick = (food) => {
    setSelected(food);
    setUnit('serving');
    setAmount('1');
  };

  const changeUnit = (u) => {
    setUnit(u);
    setAmount(u === 'grams' ? String(selected.grams) : '1');
  };

  const logSelected = async () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) {
      Alert.alert('Enter an amount', unit === 'grams' ? 'Type the weight in grams.' : 'Type a number like 1 or 1.5.');
      return;
    }
    let total, name;
    if (unit === 'grams') {
      total = Math.round((selected.kcal * n) / selected.grams);
      name = `${selected.name} (${n} g)`;
    } else {
      total = Math.round(selected.kcal * n);
      name = n === 1 ? selected.name : `${selected.name} (x${n})`;
    }
    await onLog({ name, kcal: total, foodId: selected.id });
    setSelected(null);
    setQuery('');
    setShowAll(false);
    setTick((t) => t + 1);
  };

  const saveCustom = async () => {
    const kcal = parseInt(custom.kcal, 10);
    if (!custom.name.trim() || !kcal || kcal <= 0) {
      Alert.alert('Missing info', 'Enter a name and the calories per serving.');
      return;
    }
    const grams = parseFloat(custom.grams) || null;
    const food = await storage.addCustomFood({
      name: custom.name.trim(),
      serving: custom.serving.trim(),
      kcal,
      grams,
    });
    await onLog({ name: food.name, kcal: food.kcal, foodId: food.id });
    setCustom(null);
    setQuery('');
    setShowAll(false);
    setTick((t) => t + 1);
  };

  const removeFood = (food) => {
    Alert.alert('Remove food', `Remove "${food.name}" from your foods? Past logs are kept.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await storage.deleteFood(food.id);
          setTick((t) => t + 1);
        },
      },
    ]);
  };

  const quickAdd = async () => {
    const kcal = parseInt(quick.kcal, 10);
    if (!kcal || kcal <= 0) {
      Alert.alert('Enter calories', 'Type a number greater than 0.');
      return;
    }
    await onLog({ name: quick.name.trim(), kcal });
    setQuick({ name: '', kcal: '' });
  };

  const renderFood = (f) => (
    <TouchableOpacity key={f.id} style={s.result} onPress={() => pick(f)} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={s.rName}>
          {f.name}
          {f.isCustom ? <Text style={s.mine}>  Mine</Text> : null}
        </Text>
        <Text style={s.rServing}>
          {f.serving}
          {f.grams ? ` (${f.grams} g)` : ''}
        </Text>
      </View>
      <Text style={s.rKcal}>{f.kcal}</Text>
      {f.isCustom && (
        <TouchableOpacity onPress={() => removeFood(f)} hitSlop={10} style={{ marginLeft: 10 }}>
          <Text style={s.del}>Remove</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  let body;

  if (mode === 'quick') {
    body = (
      <>
        <Field
          label="What did you eat? (optional)"
          value={quick.name}
          onChangeText={(v) => setQuick((q) => ({ ...q, name: v }))}
          placeholder="Chicken rice"
          keyboardType="default"
        />
        <Field
          label="Calories"
          suffix="kcal"
          value={quick.kcal}
          onChangeText={(v) => setQuick((q) => ({ ...q, kcal: v }))}
          placeholder="450"
        />
        <Button title="Add" onPress={quickAdd} />
      </>
    );
  } else if (custom) {
    body = (
      <>
        <Text style={s.heading}>Add your own food</Text>
        <Field
          label="Name"
          value={custom.name}
          onChangeText={(v) => setCustom((c) => ({ ...c, name: v }))}
          placeholder="My usual chicken rice"
          keyboardType="default"
        />
        <Field
          label="Serving size"
          value={custom.serving}
          onChangeText={(v) => setCustom((c) => ({ ...c, serving: v }))}
          placeholder="1 plate"
          keyboardType="default"
        />
        <Field
          label="Calories per serving"
          suffix="kcal"
          value={custom.kcal}
          onChangeText={(v) => setCustom((c) => ({ ...c, kcal: v }))}
          placeholder="650"
        />
        <Field
          label="Weight of one serving (optional)"
          suffix="g"
          value={custom.grams}
          onChangeText={(v) => setCustom((c) => ({ ...c, grams: v }))}
          placeholder="300"
        />
        <Text style={s.hint}>
          Tip: copy calories from the nutrition label. Add the serving weight to log this food by grams later.
        </Text>
        <Button title="Save food and log it" onPress={saveCustom} />
        <Button title="Cancel" variant="ghost" onPress={() => setCustom(null)} style={{ marginTop: 8 }} />
      </>
    );
  } else if (selected) {
    const n = parseFloat(amount) || 0;
    const total =
      unit === 'grams' && selected.grams
        ? Math.round((selected.kcal * n) / selected.grams)
        : Math.round(selected.kcal * n);
    const per100 = selected.grams ? Math.round((selected.kcal / selected.grams) * 100) : null;

    body = (
      <>
        <Text style={s.heading}>{selected.name}</Text>
        <Text style={s.hint}>
          {selected.kcal} kcal per {selected.serving}
          {selected.grams ? ` (${selected.grams} g)` : ''}
          {per100 ? `  |  ${per100} kcal per 100 g` : ''}
        </Text>

        {selected.grams ? <Chips options={UNITS} value={unit} onChange={changeUnit} /> : null}

        <Field
          label={unit === 'grams' ? 'How many grams?' : 'How many servings?'}
          suffix={unit === 'grams' ? 'g' : undefined}
          value={amount}
          onChangeText={setAmount}
          placeholder="1"
        />
        <Button title={`Add ${total} kcal`} onPress={logSelected} />
        <Button title="Back" variant="ghost" onPress={() => setSelected(null)} style={{ marginTop: 8 }} />
      </>
    );
  } else {
    let lastLetter = '';
    body = (
      <>
        <View style={s.searchRow}>
          <TextInput
            style={s.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Search: a, ado, rice, egg..."
            placeholderTextColor={colors.muted}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {typing ? (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
              <Text style={s.clear}>Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Typing: matching foods only */}
        {typing && results.length === 0 && <Text style={s.hint}>No food starts with "{query.trim()}".</Text>}
        {typing && results.map(renderFood)}

        {/* Not typing, list hidden: recent foods only */}
        {!typing && !showAll && recent.length > 0 && (
          <>
            <Label>Recent</Label>
            {recent.map(renderFood)}
          </>
        )}
        {!typing && !showAll && recent.length === 0 && (
          <Text style={s.hint}>Type to search, or tap Show all foods.</Text>
        )}

        {/* Not typing, list shown: everything A to Z with letter headings */}
        {!typing &&
          showAll &&
          results.map((f) => {
            const letter = f.name.charAt(0).toUpperCase();
            const header = letter !== lastLetter;
            lastLetter = letter;
            return (
              <React.Fragment key={f.id}>
                {header ? <Text style={s.letter}>{letter}</Text> : null}
                {renderFood(f)}
              </React.Fragment>
            );
          })}

        {!typing && (
          <Button
            title={showAll ? 'Hide all foods' : 'Show all foods'}
            variant="ghost"
            onPress={() => setShowAll((v) => !v)}
            style={{ marginTop: 10 }}
          />
        )}

        <Button
          title={typing ? `Add "${query.trim()}" as your own food` : 'Add your own food'}
          variant="ghost"
          onPress={() => setCustom({ name: query.trim(), serving: '1 serving', grams: '', kcal: '' })}
          style={{ marginTop: 8 }}
        />
      </>
    );
  }

  return (
    <Card>
      <Chips options={MODES} value={mode} onChange={changeMode} />
      {body}
    </Card>
  );
}

const s = StyleSheet.create({
  heading: { fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: 2 },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  search: { flex: 1, height: 46, fontSize: 17, color: colors.ink },
  clear: { color: colors.muted, fontSize: 14, fontWeight: '600', marginLeft: 8 },
  letter: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.deficit,
    marginTop: 12,
    marginBottom: 2,
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rName: { fontSize: 16, fontWeight: '600', color: colors.ink },
  rServing: { fontSize: 13, color: colors.muted, marginTop: 2 },
  rKcal: { fontSize: 16, fontWeight: '800', color: colors.ink },
  mine: { fontSize: 12, color: colors.deficit, fontWeight: '700' },
  del: { color: colors.danger, fontSize: 13, fontWeight: '600' },
});