import React, { useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import { Card, Input, QuestionItem, Screen } from '../components';
import { getProgress, getQuestions, getStreak } from '../db';
import { useLoad } from '../hooks';
import { syncAll } from '../sync';
import { useTheme } from '../theme';
import { QuestionWithState } from '../types';

const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  java: 'cafe', python: 'logo-python', sql: 'server', hr: 'people',
};

type CatRow = Awaited<ReturnType<typeof getProgress>>['cats'][number];

export default function HomeScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const [cats, setCats] = useState<CatRow[]>([]);
  const [streak, setStreak] = useState(0);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<QuestionWithState[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useLoad(async () => {
    const p = await getProgress(user!.uid);
    setCats(p.cats);
    setStreak(await getStreak(user!.uid));
    if (search.trim()) setResults(await getQuestions(user!.uid, { search: search.trim() }));
  }, [search]);

  const refresh = async () => {
    setRefreshing(true);
    await syncAll(user!.uid);
    setRefreshing(false);
  };

  const first = (profile?.name || user?.displayName || '').split(' ')[0];
  const searching = search.trim().length > 0;
  const empty = (text: string) => (
    <Text style={{ color: colors.sub, textAlign: 'center', marginTop: 24 }}>{text}</Text>
  );

  return (
    <Screen>
      {!searching && (
        <View style={{ backgroundColor: colors.primary, borderRadius: 22, padding: 18, marginBottom: 10 }}>
          <Text style={{ color: colors.onPrimary, fontSize: 22, fontWeight: '800' }}>Hello, {first || 'there'} 👋</Text>
          <Text style={{ color: colors.onPrimary, opacity: 0.85, marginTop: 2 }}>
            {streak > 0 ? `${streak} day streak 🔥 keep it going!` : 'Practise today to start your streak'}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Mock')}
            style={{ marginTop: 12, backgroundColor: colors.onPrimary, alignSelf: 'flex-start', paddingVertical: 9, paddingHorizontal: 16, borderRadius: 12 }}
          >
            <Text style={{ color: colors.primary, fontWeight: '700' }}>Start mock interview</Text>
          </TouchableOpacity>
        </View>
      )}

      <Input placeholder='Search questions' value={search} onChangeText={setSearch} />

      {searching ? (
        <FlatList
          data={results}
          keyExtractor={(q) => q.id}
          keyboardShouldPersistTaps='handled'
          renderItem={({ item }) => <QuestionItem q={item} onPress={() => navigation.navigate('QuestionDetail', { id: item.id })} />}
          ListEmptyComponent={empty('No matching questions.')}
        />
      ) : (
        <FlatList
          data={cats}
          keyExtractor={(c) => c.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          renderItem={({ item }) => {
            const pct = item.total ? Math.round((item.practised / item.total) * 100) : 0;
            const icon = icons[item.id] ?? icons[item.name.toLowerCase()] ?? 'albums';
            return (
              <Card onPress={() => navigation.navigate('QuestionList', { categoryId: item.id, title: item.name })}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={icon} size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700' }}>{item.name}</Text>
                    <Text style={{ color: colors.sub, marginTop: 2 }}>{item.practised}/{item.total} practised</Text>
                    <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, marginTop: 8 }}>
                      <View style={{ height: 6, borderRadius: 3, width: `${pct}%`, backgroundColor: colors.primary }} />
                    </View>
                  </View>
                  <Ionicons name='chevron-forward' size={20} color={colors.sub} style={{ marginLeft: 8 }} />
                </View>
              </Card>
            );
          }}
          ListEmptyComponent={empty('No questions yet. Connect to the internet once so the question bank can download.')}
        />
      )}
    </Screen>
  );
}