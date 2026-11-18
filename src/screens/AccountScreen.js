import React, { useState } from 'react';
import { ScrollView, View, Text, Alert, StyleSheet } from 'react-native';
import { Card, Button, Badge, IconCircle, SectionTitle } from '../components/ui';
import { useToast } from '../components/Toast';
import { useAuth } from '../cloud/AuthContext';
import { useStyles, font } from '../theme';

export default function AccountScreen({ onOpenLogin }) {
  const s = useStyles(makeStyles);
  const { show } = useToast();
  const { user, cloudReady, signOut, saveNow, restoreNow, autoSave, lastSaved, saveStatus } = useAuth();
  const [busy, setBusy] = useState('');

  const doSave = async () => {
    setBusy('save');
    try {
      await saveNow();
      show('Saved to your account');
    } catch (e) {
      Alert.alert('Save failed', e.message);
    } finally {
      setBusy('');
    }
  };

  const doRestore = () =>
    Alert.alert('Restore from your account?', 'This replaces the data on this phone with your saved data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        style: 'destructive',
        onPress: async () => {
          setBusy('restore');
          try {
            await restoreNow();
            show('Data restored');
          } catch (e) {
            Alert.alert('Restore failed', e.message);
          } finally {
            setBusy('');
          }
        },
      },
    ]);

  const doSignOut = () =>
    Alert.alert('Sign out?', 'Your data stays on this phone. You can sign in again any time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            show('Signed out');
          } catch (e) {
            Alert.alert('Could not sign out', e.message);
          }
        },
      },
    ]);

  // Guest
  if (!user) {
    return (
      <ScrollView contentContainerStyle={s.pad}>
        <Card style={s.center}>
          <IconCircle name="person-outline" size={64} tone="neutral" />
          <Text style={s.name}>You are using a guest account</Text>
          <Text style={s.sub}>
            Everything works offline and your data is saved on this phone only. Sign in to save it to your account.
          </Text>
          <Button
            title="Sign in or create account"
            icon="log-in-outline"
            onPress={onOpenLogin}
            style={{ alignSelf: 'stretch', marginTop: 18 }}
          />
          {!cloudReady && (
            <Text style={s.devNote}>
              Developer note: accounts are not set up yet. Add your Firebase keys in src/cloud/firebaseConfig.js.
            </Text>
          )}
        </Card>
      </ScrollView>
    );
  }

  // Signed in
  const saving = saveStatus === 'saving' || busy === 'save';
  const failed = saveStatus === 'error';

  let status;
  if (saving) {
    status = 'Saving...';
  } else if (lastSaved) {
    status = `Last saved: ${new Date(lastSaved).toLocaleString()}`;
  } else {
    status = 'Not saved yet. Tap Save to store your log, weight history, foods and profile in your account.';
  }

  return (
    <ScrollView contentContainerStyle={s.pad}>
      <Card style={s.center}>
        <IconCircle name="person" size={64} />
        <Text style={s.name}>{user.name}</Text>
        {!!user.email && <Text style={s.sub}>{user.email}</Text>}
        <View style={{ marginTop: 12 }}>
          <Badge tone="deficit" icon="checkmark-circle" text={`Signed in with ${user.provider}`} />
        </View>
      </Card>

      <SectionTitle icon="cloud-outline" title="Cloud save" />
      <Card>
        <Text style={s.body}>{status}</Text>
        {failed && !saving && (
          <Text style={s.error}>The last save did not go through. It will try again when you are back online.</Text>
        )}

        <Button
          title={busy === 'save' ? 'Saving...' : 'Save'}
          icon="save-outline"
          onPress={doSave}
          disabled={!!busy || saving}
          style={{ marginTop: 14 }}
        />
        <Button
          title={busy === 'restore' ? 'Restoring...' : 'Restore from cloud'}
          icon="cloud-download-outline"
          variant="ghost"
          onPress={doRestore}
          disabled={!!busy || saving}
          style={{ marginTop: 8 }}
        />
        <Text style={s.hint}>
          {autoSave
            ? 'Auto-save is on: your changes are saved to your account a few seconds after you make them.'
            : 'Auto-save is off. Tap Save to store your latest changes, or turn on Auto-save in the menu.'}{' '}
          Saving needs an internet connection. The app itself always works offline.
        </Text>
      </Card>

      <Button title="Sign out" icon="log-out-outline" variant="danger" onPress={doSignOut} />
    </ScrollView>
  );
}

const makeStyles = (c, fs) =>
  StyleSheet.create({
    pad: { padding: 16, paddingBottom: 40 },
    center: { alignItems: 'center', paddingVertical: 26 },
    name: { fontFamily: font.black, fontSize: fs(20), color: c.ink, marginTop: 14, textAlign: 'center' },
    sub: {
      fontFamily: font.regular,
      fontSize: fs(14),
      lineHeight: fs(21),
      color: c.muted,
      marginTop: 6,
      textAlign: 'center',
    },
    devNote: {
      fontFamily: font.regular,
      fontSize: fs(12),
      lineHeight: fs(18),
      color: c.muted,
      marginTop: 14,
      textAlign: 'center',
    },
    body: { fontFamily: font.medium, fontSize: fs(15), lineHeight: fs(22), color: c.ink },
    error: { fontFamily: font.medium, fontSize: fs(13), lineHeight: fs(19), color: c.danger, marginTop: 8 },
    hint: { fontFamily: font.regular, fontSize: fs(12), lineHeight: fs(18), color: c.muted, marginTop: 12 },
  });