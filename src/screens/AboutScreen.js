import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Card, IconCircle } from '../components/ui';
import { useStyles, font } from '../theme';
import { APP_NAME, APP_VERSION, ABOUT, HIGHLIGHTS } from '../config';

export default function AboutScreen() {
  const s = useStyles(makeStyles);
  return (
    <ScrollView contentContainerStyle={s.pad}>
      <Card style={s.hero}>
        <IconCircle name="flame" size={68} />
        <Text style={s.name}>{APP_NAME}</Text>
        <Text style={s.version}>Version {APP_VERSION}</Text>
      </Card>

      <Card>
        {ABOUT.map((p, i) => (
          <Text key={i} style={[s.para, i === ABOUT.length - 1 && { marginBottom: 0 }]}>
            {p}
          </Text>
        ))}
      </Card>

      {HIGHLIGHTS.map((h) => (
        <Card key={h.title} style={s.highlight}>
          <IconCircle name={h.icon} size={44} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={s.hTitle}>{h.title}</Text>
            <Text style={s.hText}>{h.text}</Text>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const makeStyles = (c, fs) =>
  StyleSheet.create({
    pad: { padding: 16, paddingBottom: 40 },
    hero: { alignItems: 'center', paddingVertical: 28 },
    name: { fontFamily: font.black, fontSize: fs(24), color: c.ink, marginTop: 14 },
    version: { fontFamily: font.medium, fontSize: fs(14), color: c.muted, marginTop: 4 },
    para: { fontFamily: font.regular, fontSize: fs(15), lineHeight: fs(23), color: c.ink, marginBottom: 12 },
    highlight: { flexDirection: 'row', alignItems: 'center' },
    hTitle: { fontFamily: font.bold, fontSize: fs(16), color: c.ink },
    hText: { fontFamily: font.regular, fontSize: fs(14), lineHeight: fs(20), color: c.muted, marginTop: 2 },
  });