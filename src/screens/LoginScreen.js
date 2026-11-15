import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Field, PasswordField, Button, IconCircle } from '../components/ui';
import { useToast } from '../components/Toast';
import { useAuth } from '../cloud/AuthContext';
import { useTheme, useStyles, font } from '../theme';

const TITLES = {
  login: 'Welcome back',
  signup: 'Create your account',
  reset: 'Reset your password',
};
const SUBS = {
  login: 'Log in to back up your data to your account and get it back on any phone.',
  signup: 'An account lets you back up your data. The app still works offline.',
  reset: 'Enter your email and we will send you a link to choose a new password.',
};

// Shown on first launch and from the Account page.
// "Continue as guest" is always available: accounts are optional.
export default function LoginScreen({ onDone }) {
  const { colors, fs } = useTheme();
  const s = useStyles(makeStyles);
  const { show } = useToast();
  const {
    cloudReady,
    continueAsGuest,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendReset,
    getCloudInfo,
    backupNow,
    restoreNow,
  } = useAuth();

  const [view, setView] = useState('login'); // 'login' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const go = (v) => {
    setView(v);
    setError('');
    setInfo('');
    setPassword('');
    setConfirm('');
  };

  // After signing in: offer to restore an existing backup, or save this phone's data.
  const afterSignIn = async () => {
    try {
      const cloud = await getCloudInfo();
      if (cloud) {
        Alert.alert(
          'Backup found',
          `We found a backup from ${new Date(cloud.updatedAt).toLocaleString()}. Restore it onto this phone? This replaces the data on this phone.`,
          [
            { text: 'Not now', style: 'cancel', onPress: () => onDone() },
            {
              text: 'Restore',
              onPress: async () => {
                try {
                  await restoreNow();
                  show('Data restored');
                } catch (e) {
                  Alert.alert('Restore failed', e.message);
                }
                onDone();
              },
            },
          ]
        );
        return;
      }
      await backupNow();
      show('Signed in. Your data is backed up.');
    } catch (e) {
      // offline or rules not set yet: signing in still worked, backup can be done later
    }
    onDone();
  };

  const google = async () => {
    setError('');
    setInfo('');
    setBusy(true);
    try {
      const ok = await signInWithGoogle();
      if (ok) await afterSignIn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setError('');
    setInfo('');
    const mail = email.trim();
    if (!mail || !mail.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    if (view === 'reset') {
      setBusy(true);
      try {
        await sendReset(mail);
        setInfo(
          'If an account exists for that email, a reset link is on its way. Check your inbox and spam folder. Accounts created with Google do not have a password to reset.'
        );
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (view === 'signup' && password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      if (view === 'signup') await signUpWithEmail(mail, password);
      else await signInWithEmail(mail, password);
      await afterSignIn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const guest = () => {
    continueAsGuest();
    onDone();
  };

  const primary = view === 'signup' ? 'Create account' : view === 'reset' ? 'Send reset link' : 'Log in';

  return (
    <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
      <View style={s.hero}>
        <IconCircle name="flame" size={64} />
        <Text style={s.title}>{TITLES[view]}</Text>
        <Text style={s.sub}>{SUBS[view]}</Text>
      </View>

      {!cloudReady && (
        <Card style={s.notice}>
          <Ionicons name="construct-outline" size={fs(20)} color={colors.surplus} style={{ marginRight: 12 }} />
          <Text style={s.noticeText}>
            Accounts are not set up yet. Add your Firebase keys in src/cloud/firebaseConfig.js. You can still continue as
            a guest.
          </Text>
        </Card>
      )}

      {view !== 'reset' && (
        <>
          <Button title="Continue with Google" icon="logo-google" variant="ghost" onPress={google} disabled={busy} />
          <View style={s.dividerRow}>
            <View style={s.line} />
            <Text style={s.dividerText}>or use email</Text>
            <View style={s.line} />
          </View>
        </>
      )}

      <Card>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {view !== 'reset' && (
          <PasswordField label="Password" value={password} onChangeText={setPassword} placeholder="At least 6 characters" />
        )}
        {view === 'signup' && (
          <PasswordField label="Confirm password" value={confirm} onChangeText={setConfirm} placeholder="Type it again" />
        )}

        {view === 'login' && (
          <TouchableOpacity onPress={() => go('reset')} style={s.forgot} hitSlop={8}>
            <Text style={s.link}>Forgot password?</Text>
          </TouchableOpacity>
        )}

        {!!error && <Text style={s.error}>{error}</Text>}
        {!!info && <Text style={s.infoText}>{info}</Text>}

        <Button title={busy ? 'Please wait...' : primary} onPress={submit} disabled={busy} />

        <View style={s.switchRow}>
          {view === 'login' && (
            <TouchableOpacity onPress={() => go('signup')} hitSlop={8}>
              <Text style={s.switchText}>
                New here? <Text style={s.link}>Create an account</Text>
              </Text>
            </TouchableOpacity>
          )}
          {view === 'signup' && (
            <TouchableOpacity onPress={() => go('login')} hitSlop={8}>
              <Text style={s.switchText}>
                Already have an account? <Text style={s.link}>Log in</Text>
              </Text>
            </TouchableOpacity>
          )}
          {view === 'reset' && (
            <TouchableOpacity onPress={() => go('login')} hitSlop={8}>
              <Text style={s.link}>Back to log in</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>

      <Button title="Continue as guest" icon="person-outline" variant="ghost" onPress={guest} />
      <Text style={s.guestNote}>
        Guest data stays on this phone only. You can sign in later from the menu.
      </Text>
    </ScrollView>
  );
}

const makeStyles = (c, fs) =>
  StyleSheet.create({
    pad: { padding: 20, paddingBottom: 48 },
    hero: { alignItems: 'center', marginTop: 8, marginBottom: 22 },
    title: { fontFamily: font.black, fontSize: fs(26), color: c.ink, marginTop: 14, textAlign: 'center' },
    sub: {
      fontFamily: font.regular,
      fontSize: fs(15),
      lineHeight: fs(22),
      color: c.muted,
      marginTop: 6,
      textAlign: 'center',
    },
    notice: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surplusSoft },
    noticeText: { flex: 1, fontFamily: font.medium, fontSize: fs(13), lineHeight: fs(19), color: c.ink },
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
    line: { flex: 1, height: 1, backgroundColor: c.line },
    dividerText: { fontFamily: font.medium, fontSize: fs(13), color: c.muted, marginHorizontal: 12 },
    forgot: { alignSelf: 'flex-end', marginTop: -2, marginBottom: 14 },
    link: { fontFamily: font.bold, fontSize: fs(14), color: c.deficit },
    switchRow: { alignItems: 'center', marginTop: 16 },
    switchText: { fontFamily: font.regular, fontSize: fs(14), color: c.muted },
    error: { fontFamily: font.medium, fontSize: fs(13), lineHeight: fs(19), color: c.danger, marginBottom: 12 },
    infoText: { fontFamily: font.medium, fontSize: fs(13), lineHeight: fs(19), color: c.deficit, marginBottom: 12 },
    guestNote: {
      fontFamily: font.regular,
      fontSize: fs(13),
      lineHeight: fs(19),
      color: c.muted,
      textAlign: 'center',
      marginTop: 12,
    },
  });