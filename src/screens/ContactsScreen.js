import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, IconCircle } from '../components/ui';
import { useTheme, useStyles, font } from '../theme';
import { CONTACTS } from '../config';

export default function ContactsScreen() {
  const { colors, fs } = useTheme();
  const s = useStyles(makeStyles);

  const open = (url) => {
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <ScrollView contentContainerStyle={s.pad}>
      <Text style={s.intro}>Questions or feedback? Tap a contact to open it.</Text>

      {CONTACTS.map((c) => (
        <TouchableOpacity key={c.label} activeOpacity={0.8} onPress={() => open(c.url)}>
          <Card style={s.row}>
            <IconCircle name={c.icon || 'link-outline'} size={46} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={s.label}>{c.label}</Text>
              <Text style={s.value}>{c.value}</Text>
            </View>
            <Ionicons name="open-outline" size={fs(20)} color={colors.muted} />
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const makeStyles = (c, fs) =>
  StyleSheet.create({
    pad: { padding: 16, paddingBottom: 40 },
    intro: { fontFamily: font.regular, fontSize: fs(15), lineHeight: fs(22), color: c.muted, marginBottom: 16 },
    row: { flexDirection: 'row', alignItems: 'center' },
    label: { fontFamily: font.regular, fontSize: fs(13), color: c.muted },
    value: { fontFamily: font.bold, fontSize: fs(16), color: c.ink, marginTop: 2 },
  });