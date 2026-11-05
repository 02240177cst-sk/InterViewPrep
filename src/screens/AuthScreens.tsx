import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { authMessage, useAuth } from '../AuthContext';
import { RootStackParamList } from '../types';

type P<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

const GREEN = [34, 197, 94];
const RUST = [190, 95, 75];
const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

const emailRules = {
  required: 'Email is required',
  validate: (v: string) => (v.includes('@') && v.includes('.')) || 'Enter a valid email',
};
const passwordRules = {
  required: 'Password is required',
  minLength: { value: 6, message: 'At least 6 characters' },
};

// colour animation: slow while idle, fast while waiting for login / sign up
function useColorCycle(busy: boolean) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const d = busy ? 600 : 2800;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: d, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(t, { toValue: 0, duration: d, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [busy]);
  return (alpha: number) => t.interpolate({ inputRange: [0, 1], outputRange: [rgba(GREEN, alpha), rgba(RUST, alpha)] });
}

function Layout({ title, subtitle, busy, buttonTitle, onSubmit, footer, children }: {
  title: string; subtitle: string; busy: boolean; buttonTitle: string;
  onSubmit: () => void; footer: React.ReactNode; children: React.ReactNode;
}) {
  const mix = useColorCycle(busy);
  return (
    <View style={{ flex: 1, backgroundColor: '#05080A' }}>
      <StatusBar style='light' />
      
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 2, minHeight: '100%'  }} keyboardShouldPersistTaps='handled'>
        {/* three layers of animated colour make the glowing border */}
        <Animated.View style={{ borderRadius: 38, padding: 14, backgroundColor: mix(0.08) }}>
          <Animated.View style={{ borderRadius: 32, padding: 8, backgroundColor: mix(0.16) }}>
            <Animated.View style={{ borderRadius: 28, padding: 2, backgroundColor: mix(0.9) }}>
              <View style={{ borderRadius: 26, backgroundColor: '#0D1117', padding: 22 }}>
                <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' }}>{title}</Text>
                <Text style={{ color: '#8B949E', textAlign: 'center', marginTop: 4 }}>{subtitle}</Text>

                {children}

                <Animated.View style={{ borderRadius: 12, marginTop: 22, backgroundColor: mix(1) }}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={onSubmit}
                    disabled={busy}
                    style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
                  >
                    {busy ? (
                      <ActivityIndicator color='#FFFFFF' />
                    ) : (
                      <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>{buttonTitle}</Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                <View style={{ marginTop: 8 }}>{footer}</View>
              </View>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function AuthInput({ control, name, label, rules, ...rest }: any) {
  const [focus, setFocus] = useState(false);
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <View style={{ marginTop: 14 }}>
          <Text style={{ color: '#C9D1D9', marginBottom: 6, fontWeight: '600', fontSize: 13 }}>{label}</Text>
          <TextInput
            value={value}
            onChangeText={onChange}
            onFocus={() => setFocus(true)}
            onBlur={() => { setFocus(false); onBlur(); }}
            autoCapitalize='none'
            selectionColor='#9CA3AF'
            style={{
              backgroundColor: '#161B22', color: '#F0F6FC', borderRadius: 10, padding: 12, fontSize: 16,
              borderWidth: 1, borderColor: error ? '#F87171' : focus ? '#4B5563' : '#21262D',
            }}
            {...rest}
          />
          {error ? <Text style={{ color: '#F87171', marginTop: 3 }}>{error.message}</Text> : null}
        </View>
      )}
    />
  );
}

function LinkText({ text, onPress }: { text: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ padding: 10, alignItems: 'center' }}>
      <Text style={{ color: '#9CA3AF', fontWeight: '500' }}>{text}</Text>
    </TouchableOpacity>
  );
}

export function LoginScreen({ navigation }: P<'Login'>) {
  const { logIn } = useAuth();
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
    <Layout
      title='Welcome back'
      subtitle='Log in to continue practising'
      busy={busy}
      buttonTitle='Log in'
      onSubmit={submit}
      footer={
        <>
          <LinkText text='Forgot password?' onPress={() => navigation.navigate('Forgot')} />
          <LinkText text='Create an account' onPress={() => navigation.navigate('Signup')} />
        </>
      }
    >
      <AuthInput control={control} name='email' label='Email' rules={emailRules} keyboardType='email-address' />
      <AuthInput control={control} name='password' label='Password' rules={passwordRules} secureTextEntry />
      {err ? <Text style={{ color: '#F87171', marginTop: 10 }}>{err}</Text> : null}
    </Layout>
  );
}

export function SignupScreen({ navigation }: P<'Signup'>) {
  const { signUp } = useAuth();
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
    <Layout
      title='Create account'
      subtitle='Start your interview preparation'
      busy={busy}
      buttonTitle='Sign up'
      onSubmit={submit}
      footer={<LinkText text='I already have an account' onPress={() => navigation.goBack()} />}
    >
      <AuthInput control={control} name='name' label='Full name' rules={{ required: 'Name is required' }} autoCapitalize='words' />
      <AuthInput control={control} name='email' label='Email' rules={emailRules} keyboardType='email-address' />
      <AuthInput control={control} name='password' label='Password' rules={passwordRules} secureTextEntry />
      <AuthInput
        control={control}
        name='confirm'
        label='Confirm password'
        secureTextEntry
        rules={{ validate: (v: string) => v === getValues('password') || 'Passwords do not match' }}
      />
      {err ? <Text style={{ color: '#F87171', marginTop: 10 }}>{err}</Text> : null}
    </Layout>
  );
}

export function ForgotScreen({ navigation }: P<'Forgot'>) {
  const { resetPassword } = useAuth();
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
    <Layout
      title='Reset password'
      subtitle='We will email you a reset link'
      busy={busy}
      buttonTitle='Send reset link'
      onSubmit={submit}
      footer={<LinkText text='Back to login' onPress={() => navigation.goBack()} />}
    >
      <AuthInput control={control} name='email' label='Email' rules={emailRules} keyboardType='email-address' />
      {err ? <Text style={{ color: '#F87171', marginTop: 10 }}>{err}</Text> : null}
      {msg ? <Text style={{ color: '#4ADE80', marginTop: 10 }}>{msg}</Text> : null}
    </Layout>
  );
}