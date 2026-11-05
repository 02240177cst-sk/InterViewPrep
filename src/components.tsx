import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TextInputProps, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './theme';
import { QuestionWithState } from './types';

export function Screen({ children, top, style }: { children: React.ReactNode; top?: boolean; style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      edges={top ? ['top', 'left', 'right', 'bottom'] : ['left', 'right', 'bottom']}
      style={[{ flex: 1, backgroundColor: colors.bg, padding: 16 }, style]}
    >
      {children}
    </SafeAreaView>
  );
}

export function Button({ title, onPress, kind = 'primary', disabled, loading }: {
  title: string; onPress: () => void; kind?: 'primary' | 'ghost' | 'danger'; disabled?: boolean; loading?: boolean;
}) {
  const { colors } = useTheme();
  const bg = kind === 'primary' ? colors.primary : kind === 'danger' ? colors.danger : 'transparent';
  const fg = kind === 'ghost' ? colors.primary : colors.onPrimary;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={{
        backgroundColor: bg, borderColor: colors.primary, borderWidth: kind === 'ghost' ? 1.5 : 0,
        minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
        marginVertical: 6, opacity: disabled ? 0.5 : 1,
      }}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontWeight: '700', fontSize: 16 }}>{title}</Text>}
    </TouchableOpacity>
  );
}

export function Input({ label, error, ...rest }: TextInputProps & { label?: string; error?: string }) {
  const { colors } = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ marginVertical: 6 }}>
      {label ? <Text style={{ color: colors.sub, marginBottom: 4, fontWeight: '600' }}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.sub}
        autoCapitalize='none'
        {...rest}
        onFocus={(e) => { setFocus(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setFocus(false); rest.onBlur?.(e); }}
        style={[
          {
            backgroundColor: colors.card, color: colors.text, borderRadius: 14, padding: 14, fontSize: 16,
            borderWidth: 1.5, borderColor: error ? colors.danger : focus ? colors.primary : colors.border,
          },
          rest.style,
        ]}
      />
      {error ? <Text style={{ color: colors.danger, marginTop: 2 }}>{error}</Text> : null}
    </View>
  );
}

// react-hook-form wrapper around Input
export function FormInput({ control, name, rules, ...rest }: any) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <Input value={value} onChangeText={onChange} onBlur={onBlur} error={error?.message} {...rest} />
      )}
    />
  );
}

export function Card({ children, onPress, style }: { children: React.ReactNode; onPress?: () => void; style?: ViewStyle }) {
  const { colors } = useTheme();
  const base: ViewStyle = {
    backgroundColor: colors.card, borderRadius: 18, padding: 16, marginVertical: 6,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  };
  return onPress ? (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[base, style]}>{children}</TouchableOpacity>
  ) : (
    <View style={[base, style]}>{children}</View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 8, marginVertical: 4,
        backgroundColor: active ? colors.primary : colors.card, borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
      }}
    >
      <Text style={{ color: active ? colors.onPrimary : colors.text, fontWeight: active ? '700' : '500' }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function DifficultyBadge({ level }: { level: string }) {
  const { colors } = useTheme();
  const c = level === 'Easy' ? colors.success : level === 'Hard' ? colors.danger : colors.warn;
  return (
    <View style={{ backgroundColor: c + '22', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start' }}>
      <Text style={{ color: c, fontSize: 12, fontWeight: '700' }}>{level}</Text>
    </View>
  );
}

export function QuestionItem({ q, onPress }: { q: QuestionWithState; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', lineHeight: 22 }}>{q.text}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 }}>
            <DifficultyBadge level={q.difficulty} />
            {q.practised ? <Ionicons name='checkmark-circle' size={20} color={colors.success} /> : null}
            {q.bookmarked ? <Ionicons name='bookmark' size={18} color={colors.primary} /> : null}
          </View>
        </View>
        <Ionicons name='chevron-forward' size={20} color={colors.sub} />
      </View>
    </Card>
  );
}