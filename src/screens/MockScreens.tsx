import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../AuthContext';
import { Button, Card, Chip, Screen } from '../components';
import { getCategories, getRandomQuestions, logPractice, saveState } from '../db';
import { useLoad } from '../hooks';
import { syncSoon } from '../sync';
import { useTheme } from '../theme';
import { Category, Question, RootStackParamList } from '../types';

type P<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export function MockSetupScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [cats, setCats] = useState<Category[]>([]);
  const [cat, setCat] = useState('all');
  const [count, setCount] = useState(5);
  const [secs, setSecs] = useState(60);

  useLoad(async () => setCats(await getCategories()));

  const label = (t: string) => <Text style={{ color: colors.text, fontWeight: '700', marginTop: 14 }}>{t}</Text>;

  return (
    <Screen>
      <ScrollView>
        {label('Category')}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Chip label='All' active={cat === 'all'} onPress={() => setCat('all')} />
          {cats.map((c) => <Chip key={c.id} label={c.name} active={cat === c.id} onPress={() => setCat(c.id)} />)}
        </View>
        {label('Number of questions')}
        <View style={{ flexDirection: 'row' }}>
          {[5, 10, 15].map((n) => <Chip key={n} label={String(n)} active={count === n} onPress={() => setCount(n)} />)}
        </View>
        {label('Time per question')}
        <View style={{ flexDirection: 'row' }}>
          {[30, 60, 120].map((s) => <Chip key={s} label={`${s} sec`} active={secs === s} onPress={() => setSecs(s)} />)}
        </View>
        <View style={{ marginTop: 24 }}>
          <Button title='Start mock interview' onPress={() => navigation.navigate('MockSession', { categoryId: cat, count, seconds: secs })} />
        </View>
      </ScrollView>
    </Screen>
  );
}

export function MockSessionScreen({ route, navigation }: P<'MockSession'>) {
  const { categoryId, count, seconds } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const [qs, setQs] = useState<Question[] | null>(null);
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(seconds);
  const [revealed, setRevealed] = useState(false);
  const score = useRef({ poor: 0, okay: 0, good: 0 });

  useEffect(() => { getRandomQuestions(categoryId, count).then(setQs); }, []);

  // countdown: when it reaches zero the answer is revealed automatically
  useEffect(() => {
    if (!qs || revealed) return;
    if (left <= 0) { setRevealed(true); return; }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [qs, left, revealed]);

  if (!qs) return <Screen><ActivityIndicator color={colors.primary} /></Screen>;
  if (qs.length === 0) {
    return <Screen><Text style={{ color: colors.sub }}>No questions available for this category yet.</Text></Screen>;
  }

  const q = qs[i];
  const rate = async (r: 'poor' | 'okay' | 'good') => {
    score.current[r]++;
    if (r === 'good') await saveState(user!.uid, q.id, { practised: 1 });
    else await logPractice(user!.uid, q.id);
    syncSoon(user!.uid);
    if (i + 1 >= qs.length) {
      navigation.replace('MockSummary', { ...score.current, total: qs.length });
    } else {
      setI(i + 1);
      setLeft(seconds);
      setRevealed(false);
    }
  };

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <Screen>
      <ScrollView>
        <Text style={{ color: colors.sub }}>Question {i + 1} of {qs.length}</Text>
        <Text style={{ fontSize: 44, fontWeight: '800', textAlign: 'center', marginVertical: 10, color: left <= 10 && !revealed ? colors.danger : colors.primary }}>
          {mm}:{ss}
        </Text>
        <Card>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>{q.text}</Text>
        </Card>
        {!revealed ? (
          <>
            <Text style={{ color: colors.sub, textAlign: 'center', marginVertical: 8 }}>Answer aloud or in your head, then reveal.</Text>
            <Button title='Reveal expert answer' onPress={() => setRevealed(true)} />
          </>
        ) : (
          <>
            <Card>
              <Text style={{ color: colors.primary, fontWeight: '700', marginBottom: 6 }}>Expert answer</Text>
              <Text style={{ color: colors.text, fontSize: 16, lineHeight: 23 }}>{q.answer}</Text>
            </Card>
            <Text style={{ color: colors.text, fontWeight: '700', marginTop: 6 }}>How did you do?</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}><Button title='Poor' kind='danger' onPress={() => rate('poor')} /></View>
              <View style={{ flex: 1 }}><Button title='Okay' kind='ghost' onPress={() => rate('okay')} /></View>
              <View style={{ flex: 1 }}><Button title='Good' onPress={() => rate('good')} /></View>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

export function MockSummaryScreen({ route, navigation }: P<'MockSummary'>) {
  const { good, okay, poor, total } = route.params;
  const { colors } = useTheme();
  const pct = Math.round(((good * 2 + okay) / (total * 2)) * 100);
  const message = pct >= 80 ? 'Excellent work!' : pct >= 50 ? 'Good progress, keep practising.' : 'Review the expert answers and try again.';

  return (
    <Screen>
      <Card style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 56, fontWeight: '800', color: colors.primary }}>{pct}%</Text>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600' }}>{message}</Text>
        <Text style={{ color: colors.sub, marginTop: 10 }}>Good: {good} · Okay: {okay} · Poor: {poor} · Total: {total}</Text>
      </Card>
      <Button title='Back to Mock Interview' onPress={() => navigation.navigate('Tabs')} />
    </Screen>
  );
}