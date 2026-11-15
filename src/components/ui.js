import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useStyles, radius, font } from '../theme';

// Standard "are you sure?" dialog for every delete in the app.
export function confirmRemove(title, message, onConfirm) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: onConfirm },
  ]);
}

export function Card({ children, style }) {
  const s = useStyles(makeStyles);
  return <View style={[s.card, style]}>{children}</View>;
}

export function Label({ children }) {
  const s = useStyles(makeStyles);
  return <Text style={s.label}>{children}</Text>;
}

// Small round icon, tinted. tone: 'deficit' | 'surplus' | 'neutral'
export function IconCircle({ name, tone = 'deficit', size = 40 }) {
  const { colors } = useTheme();
  const map = {
    deficit: [colors.deficitSoft, colors.deficit],
    surplus: [colors.surplusSoft, colors.surplus],
    neutral: [colors.bg, colors.muted],
  };
  const [bg, fg] = map[tone] || map.deficit;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={name} size={Math.round(size * 0.5)} color={fg} />
    </View>
  );
}

export function SectionTitle({ icon, title, right }) {
  const s = useStyles(makeStyles);
  const { colors, fs } = useTheme();
  return (
    <View style={s.sectionRow}>
      <View style={s.sectionLeft}>
        {icon ? <Ionicons name={icon} size={fs(20)} color={colors.ink} style={{ marginRight: 8 }} /> : null}
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      {right ? <Text style={s.sectionRight}>{right}</Text> : null}
    </View>
  );
}

export function Field({ label, suffix, value, onChangeText, placeholder, keyboardType = 'numeric' }) {
  const s = useStyles(makeStyles);
  const { colors } = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <View style={s.fieldWrap}>
      <Label>{label}</Label>
      <View style={[s.inputRow, focus && s.inputFocus]}>
        <TextInput
          style={s.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={keyboardType}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
        />
        {suffix ? <Text style={s.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

export function Chips({ options, value, onChange }) {
  const s = useStyles(makeStyles);
  return (
    <View style={s.chips}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <TouchableOpacity
            key={o.key}
            onPress={() => onChange(o.key)}
            style={[s.chip, on && s.chipOn]}
            activeOpacity={0.7}
          >
            <Text style={[s.chipText, on && s.chipTextOn]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// variant: 'solid' | 'ghost' | 'danger'.  icon: Ionicons name (optional)
export function Button({ title, onPress, variant = 'solid', style, small, icon }) {
  const s = useStyles(makeStyles);
  const { colors, fs } = useTheme();
  const tint = variant === 'solid' ? colors.onPrimary : variant === 'danger' ? colors.danger : colors.ink;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        s.btn,
        small && s.btnSmall,
        variant === 'ghost' && s.btnGhost,
        variant === 'danger' && s.btnDanger,
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={fs(small ? 16 : 18)} color={tint} style={{ marginRight: 8 }} /> : null}
      <Text
        style={[
          s.btnText,
          small && s.btnTextSmall,
          variant === 'ghost' && s.btnGhostText,
          variant === 'danger' && s.btnDangerText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

// tone: 'deficit' | 'surplus'.  icon: Ionicons name (optional)
export function Badge({ text, tone, icon }) {
  const s = useStyles(makeStyles);
  const { colors, fs } = useTheme();
  const surplus = tone === 'surplus';
  return (
    <View style={[s.badge, surplus ? s.badgeSurplus : s.badgeDeficit]}>
      {icon ? (
        <Ionicons
          name={icon}
          size={fs(14)}
          color={surplus ? colors.surplus : colors.deficit}
          style={{ marginRight: 5 }}
        />
      ) : null}
      <Text style={[s.badgeText, surplus ? s.badgeTextSurplus : s.badgeTextDeficit]}>{text}</Text>
    </View>
  );
}

const makeStyles = (c, fs) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.card,
      borderRadius: radius.md,
      padding: 18,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: c.line,
      ...c.shadow,
    },
    label: { fontFamily: font.semibold, fontSize: fs(13), color: c.muted, marginBottom: 6 },
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
      marginTop: 4,
    },
    sectionLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
    sectionTitle: { fontFamily: font.bold, fontSize: fs(18), color: c.ink },
    sectionRight: { fontFamily: font.regular, fontSize: fs(13), color: c.muted, marginLeft: 8 },
    fieldWrap: { flex: 1, marginBottom: 12 },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: c.line,
      borderRadius: radius.sm,
      backgroundColor: c.inputBg,
      paddingHorizontal: 14,
    },
    inputFocus: { borderColor: c.deficit },
    input: { flex: 1, minHeight: fs(50), fontFamily: font.medium, fontSize: fs(17), color: c.ink },
    suffix: { fontFamily: font.medium, color: c.muted, fontSize: fs(14), marginLeft: 6 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip: {
      paddingVertical: 9,
      paddingHorizontal: 16,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.line,
      backgroundColor: c.card,
    },
    chipOn: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { fontFamily: font.semibold, color: c.ink, fontSize: fs(14) },
    chipTextOn: { color: c.onPrimary },
    btn: {
      flexDirection: 'row',
      minHeight: fs(52),
      borderRadius: radius.sm,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
    },
    btnSmall: { minHeight: fs(42), paddingHorizontal: 14 },
    btnText: { fontFamily: font.bold, color: c.onPrimary, fontSize: fs(16) },
    btnTextSmall: { fontSize: fs(14) },
    btnGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: c.line },
    btnGhostText: { color: c.ink },
    btnDanger: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: c.danger },
    btnDangerText: { color: c.danger },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: radius.pill,
    },
    badgeDeficit: { backgroundColor: c.deficitSoft },
    badgeSurplus: { backgroundColor: c.surplusSoft },
    badgeText: { fontFamily: font.bold, fontSize: fs(13) },
    badgeTextDeficit: { color: c.deficit },
    badgeTextSurplus: { color: c.surplus },
  });