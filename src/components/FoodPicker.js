import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Field, Chips, Button, Label, confirmRemove } from './ui';
import FoodForm from './FoodForm';
import { useToast } from './Toast';
import * as storage from '../storage/storage';
import { useTheme, useStyles, radius, font } from '../theme';

const MODES = [
  { key: 'search', label: 'Search food' },
  { key: 'quick', label: 'Quick add' },
];

const UNITS = [
  { key: 'serving', label: 'Servings' },
  { key: 'grams', label: 'Grams' },
];

export default function FoodPicker({ onLog }) {
  const { colors, fs } = useTheme();
  const s = useStyles(makeStyles);
  const { show } = useToast();

  const [mode, setMode] = useState('search');
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [results, setResults] = useState([]);
  const [recent, setRecent] = useState([]);
  const [tick, setTick] = useState(0); // bump to reload the lists
  const [selected, setSelected] = useState(null);
  const [unit, setUnit] = useState('serving');
  const [amount, setAmount] = useState('1');
  const [custom, setCustom] = useState(null); // null or { name } when adding your own food
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
  }, [query, showAll, tick, typing]);

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

  const resetSearch = () => {
    setSelected(null);
    setQuery('');
    setShowAll(false);
    setTick((t) => t + 1);
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
    show(`Added ${total} kcal`);
    resetSearch();
  };

  const saveCustom = async (values) => {
    const food = await storage.addCustomFood(values);
    await onLog({ name: food.name, kcal: food.kcal, foodId: food.id });
    show(`Saved "${food.name}" and logged it`);
    setCustom(null);
    resetSearch();
  };

  const removeFood = (food) =>
    confirmRemove(
      `Remove "${food.name}"?`,
      'This deletes it from your foods. Meals you already logged keep their calories.',
      async () => {
        await storage.deleteFood(food.id);
        show(`Removed ${food.name}`);
        setTick((t) => t + 1);
      }
    );

  const quickAdd = async () => {
    const kcal = parseInt(quick.kcal, 10);
    if (!kcal || kcal <= 0) {
      Alert.alert('Enter calories', 'Type a number greater than 0.');
      return;
    }
    await onLog({ name: quick.name.trim(), kcal });
    show(`Added ${kcal} kcal`);
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
        <TouchableOpacity onPress={() => removeFood(f)} hitSlop={10} style={{ marginLeft: 12 }}>
          <Ionicons name="trash-outline" size={fs(18)} color={colors.danger} />
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
        <Button title="Add" icon="add" onPress={quickAdd} />
      </>
    );
  } else if (custom) {
    body = (
      <FoodForm
        title="Add your own food"
        initial={{ name: custom.name }}
        saveLabel="Save food and log it"
        onSave={saveCustom}
        onCancel={() => setCustom(null)}
      />
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
        <Button title={`Add ${total} kcal`} icon="add" onPress={logSelected} />
        <Button title="Back" variant="ghost" onPress={() => setSelected(null)} style={{ marginTop: 8 }} />
      </>
    );
  } else {
    let lastLetter = '';
    body = (
      <>
        <View style={s.searchRow}>
          <Ionicons name="search" size={fs(18)} color={colors.muted} style={{ marginRight: 8 }} />
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
              <Ionicons name="close-circle" size={fs(20)} color={colors.muted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {typing && results.length === 0 && <Text style={s.hint}>No food starts with "{query.trim()}".</Text>}
        {typing && results.map(renderFood)}

        {!typing && !showAll && recent.length > 0 && (
          <>
            <Label>Recent</Label>
            {recent.map(renderFood)}
          </>
        )}
        {!typing && !showAll && recent.length === 0 && (
          <Text style={s.hint}>Type to search, or tap Show all foods.</Text>
        )}

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
            icon={showAll ? 'chevron-up' : 'list-outline'}
            variant="ghost"
            onPress={() => setShowAll((v) => !v)}
            style={{ marginTop: 10 }}
          />
        )}

        <Button
          title={typing ? `Add "${query.trim()}" as your own food` : 'Add your own food'}
          icon="add-circle-outline"
          variant="ghost"
          onPress={() => setCustom({ name: query.trim() })}
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

const makeStyles = (c, fs) =>
  StyleSheet.create({
    heading: { fontFamily: font.black, fontSize: fs(20), color: c.ink, marginBottom: 2 },
    hint: { fontFamily: font.regular, color: c.muted, fontSize: fs(13), lineHeight: fs(19), marginBottom: 12 },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: c.line,
      borderRadius: radius.sm,
      backgroundColor: c.inputBg,
      paddingHorizontal: 14,
      marginBottom: 12,
    },
    search: { flex: 1, minHeight: fs(50), fontFamily: font.medium, fontSize: fs(17), color: c.ink },
    letter: { fontFamily: font.black, fontSize: fs(13), color: c.deficit, marginTop: 12, marginBottom: 2 },
    result: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.line,
    },
    rName: { fontFamily: font.semibold, fontSize: fs(16), color: c.ink },
    rServing: { fontFamily: font.regular, fontSize: fs(13), color: c.muted, marginTop: 2 },
    rKcal: { fontFamily: font.black, fontSize: fs(16), color: c.ink },
    mine: { fontFamily: font.bold, fontSize: fs(12), color: c.deficit },
  });