import React, { useEffect, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Alert, Keyboard, Platform, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../AuthContext';
import { Button, Card, Input, Screen } from '../components';
import { cancelReminder, getReminder, notificationsAvailable, Reminder, scheduleDaily } from '../notifications';
import { syncAll } from '../sync';
import { useTheme } from '../theme';

export default function ProfileScreen({ navigation }: any) {
  const { user, profile, logOut, updateName, reloadProfile } = useAuth();
  const { mode, setMode, colors } = useTheme();
  const [name, setName] = useState(profile?.name ?? '');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState('');
  const [reminder, setReminder] = useState<Reminder>({ enabled: false, hour: 19, minute: 0 });
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => { getReminder().then(setReminder); }, []);
  useEffect(() => { setName(profile?.name ?? ''); }, [profile?.name]);

  const timeText = `${String(reminder.hour).padStart(2, '0')}:${String(reminder.minute).padStart(2, '0')}`;
  const notAvailable = () =>
  Alert.alert(
    'Reminders need a development build',
    'Expo Go cannot schedule notifications on this phone. Install the development build to use daily reminders.',
  );

  const toggleReminder = async (on: boolean) => {
    if (on) {
      if (!notificationsAvailable()) return notAvailable();
      const ok = await scheduleDaily(reminder.hour, reminder.minute);
      if (!ok) return Alert.alert('Permission needed', 'Allow notifications for this app in your phone settings.');
    } else {
      await cancelReminder();
    }
    setReminder({ ...reminder, enabled: on });
  };

  const pickTime = async (d: Date) => {
    const next = { enabled: notificationsAvailable(), hour: d.getHours(), minute: d.getMinutes() };
    setReminder(next);
    if (!notificationsAvailable()) return notAvailable();
    const ok = await scheduleDaily(next.hour, next.minute);
    if (!ok) Alert.alert('Permission needed', 'Allow notifications for this app in your phone settings.');
  };

  // const toggleReminder = async (on: boolean) => {
  //   if (on) {
  //     const ok = await scheduleDaily(reminder.hour, reminder.minute);
  //     if (!ok) return Alert.alert('Permission needed', 'Allow notifications for this app in your phone settings.');
  //   } else {
  //     await cancelReminder();
  //   }
  //   setReminder({ ...reminder, enabled: on });
  // };

  // const pickTime = async (d: Date) => {
  //   const next = { enabled: true, hour: d.getHours(), minute: d.getMinutes() };
  //   setReminder(next);
  //   const ok = await scheduleDaily(next.hour, next.minute);
  //   if (!ok) Alert.alert('Permission needed', 'Allow notifications for this app in your phone settings.');
  // };
   const saveName = async () => {
    const n = name.trim();
    if (!n) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    Keyboard.dismiss();
    setSaving(true);
    setNameMsg('');
    try {
      // give up waiting after 10 seconds so the button never hangs
      await Promise.race([
        updateName(n),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000)),
      ]);
      setNameMsg('Saved successfully ✓');
      //Alert.alert('Saved successfully', 'Your name has been updated.');
      setTimeout(() => setNameMsg(''), 3000);
    } catch {
      Alert.alert('Could not save', 'Check your internet connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  

  const sync = async () => {
    const ok = await syncAll(user!.uid);
    await reloadProfile();
    setMsg(ok ? 'Synced with the cloud.' : 'You are offline. Changes will sync automatically later.');
  };

  const confirmLogout = () =>
    Alert.alert('Log out?', 'You can log back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logOut },
    ]);

  const row = { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginVertical: 6 };

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps='handled'>
        <Card>
          <Text style={{ color: colors.sub }}>{profile?.email ?? user?.email}</Text>
          <Input label='Name' value={name} onChangeText={setName} autoCapitalize='words' />
          <Button title='Save name' kind='ghost' onPress={saveName} loading={saving} />
          {nameMsg ? (
            <Text style={{ color: colors.success, textAlign: 'center', fontWeight: '700', marginTop: 4 }}>{nameMsg}</Text>
          ) : null}
        </Card>

        <Card>
          <View style={row}>
            <Text style={{ color: colors.text, fontSize: 16 }}>Dark theme</Text>
            <Switch value={mode === 'dark'} onValueChange={(v) => setMode(v ? 'dark' : 'light')} />
          </View>
          <View style={row}>
            <Text style={{ color: colors.text, fontSize: 16 }}>Daily practice reminder</Text>
            <Switch value={reminder.enabled} onValueChange={toggleReminder} />
          </View>
          <TouchableOpacity onPress={() => setShowPicker(true)} style={row}>
            <Text style={{ color: colors.text, fontSize: 16 }}>Reminder time</Text>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>{timeText}</Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={new Date(2000, 0, 1, reminder.hour, reminder.minute)}
              mode='time'
              is24Hour
              onChange={(e, d) => {
                setShowPicker(Platform.OS === 'ios');
                if (e.type === 'set' && d) pickTime(d);
              }}
              
              onDismiss={() => setShowPicker(false)}
            />
          )}
        </Card>

        {msg ? <Text style={{ color: colors.sub, textAlign: 'center', marginVertical: 6 }}>{msg}</Text> : null}
        <Button title='Sync now' kind='ghost' onPress={sync} />
        {profile?.role === 'admin' && <Button title='Admin Panel' onPress={() => navigation.navigate('Admin')} />}
        <Button title='Log out' kind='danger' onPress={confirmLogout} />
      </ScrollView>
    </Screen>
  );
}