import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm } from 'react-hook-form';
import { authMessage, useAuth } from '../AuthContext';
import { Button, FormInput, Screen } from '../components';
import { useTheme } from '../theme';
import { RootStackParamList } from '../types';

type P<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

const emailRules = {
  required: 'Email is required',
  validate: (v: string) => (v.includes('@') && v.includes('.')) || 'Enter a valid email',
};
const passwordRules = {
  required: 'Password is required',
  minLength: { value: 6, message: 'At least 6 characters' },
};

function Layout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <Screen top>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps='handled'>
        <Text style={{ fontSize: 30, fontWeight: '800', color: colors.text }}>{title}</Text>
        <Text style={{ color: colors.sub, marginBottom: 16 }}>{subtitle}</Text>
        {children}
      </ScrollView>
    </Screen>
  );
}

function LinkText({ text, onPress }: { text: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={{ padding: 10, alignItems: 'center' }}>
      <Text style={{ color: colors.primary, fontWeight: '600' }}>{text}</Text>
    </TouchableOpacity>
  );
}

export function LoginScreen({ navigation }: P<'Login'>) {
  const { logIn } = useAuth();
  const { colors } = useTheme();
  const { control, handleSubmit } = useForm({ defaultValues: { email: '', password: '' } });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = handleSubmit(async (v) => {
    setBusy(true);
    setErr('');
    try {
      await logIn(v.email.trim(), v.password);
    } catch (e) {
      setErr(authMessage(e));
    } finally {
      setBusy(false);
    }
  });

  return (
    <Layout title='Welcome back' subtitle='Log in to continue practising'>
      <FormInput control={control} name='email' label='Email' rules={emailRules} keyboardType='email-address' />
      <FormInput control={control} name='password' label='Password' rules={passwordRules} secureTextEntry />
      {err ? <Text style={{ color: colors.danger }}>{err}</Text> : null}
      <Button title='Log in' onPress={submit} loading={busy} />
      <LinkText text='Forgot password?' onPress={() => navigation.navigate('Forgot')} />
      <LinkText text='Create an account' onPress={() => navigation.navigate('Signup')} />
    </Layout>
  );
}

export function SignupScreen({ navigation }: P<'Signup'>) {
  const { signUp } = useAuth();
  const { colors } = useTheme();
  const { control, handleSubmit, getValues } = useForm({
    defaultValues: { name: '', email: '', password: '', confirm: '' },
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = handleSubmit(async (v) => {
    setBusy(true);
    setErr('');
    try {
      await signUp(v.name.trim(), v.email.trim(), v.password);
    } catch (e) {
      setErr(authMessage(e));
    } finally {
      setBusy(false);
    }
  });

  return (
    <Layout title='Create account' subtitle='Start your interview preparation'>
      <FormInput control={control} name='name' label='Full name' rules={{ required: 'Name is required' }} autoCapitalize='words' />
      <FormInput control={control} name='email' label='Email' rules={emailRules} keyboardType='email-address' />
      <FormInput control={control} name='password' label='Password' rules={passwordRules} secureTextEntry />
      <FormInput
        control={control} name='confirm' label='Confirm password' secureTextEntry
        rules={{ validate: (v: string) => v === getValues('password') || 'Passwords do not match' }}
      />
      {err ? <Text style={{ color: colors.danger }}>{err}</Text> : null}
      <Button title='Sign up' onPress={submit} loading={busy} />
      <LinkText text='I already have an account' onPress={() => navigation.goBack()} />
    </Layout>
  );
}

export function ForgotScreen({ navigation }: P<'Forgot'>) {
  const { resetPassword } = useAuth();
  const { colors } = useTheme();
  const { control, handleSubmit } = useForm({ defaultValues: { email: '' } });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = handleSubmit(async (v) => {
    setBusy(true);
    setErr('');
    setMsg('');
    try {
      await resetPassword(v.email.trim());
      setMsg('Reset link sent. Check your email inbox.');
    } catch (e) {
      setErr(authMessage(e));
    } finally {
      setBusy(false);
    }
  });

  return (
    <Layout title='Reset password' subtitle='We will email you a reset link'>
      <FormInput control={control} name='email' label='Email' rules={emailRules} keyboardType='email-address' />
      {err ? <Text style={{ color: colors.danger }}>{err}</Text> : null}
      {msg ? <Text style={{ color: colors.success }}>{msg}</Text> : null}
      <Button title='Send reset link' onPress={submit} loading={busy} />
      <LinkText text='Back to login' onPress={() => navigation.goBack()} />
    </Layout>
  );
}