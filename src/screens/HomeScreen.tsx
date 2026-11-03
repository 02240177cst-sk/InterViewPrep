import React, { useState } from 'react';
import { FlatList, RefreshControl, Text } from 'react-native';
import { useAuth } from '../AuthContext';
import { Card, Input, QuestionItem, Screen } from '../components';
import { getCategories, getQuestions } from '../db';
import { useLoad } from '../hooks';
import { syncAll } from '../sync';
import { useTheme } from '../theme';
import { Category, QuestionWithState } from '../types';

export default function HomeScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const [cats, setCats] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<QuestionWithState[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useLoad(async () => {
    setCats(await getCategories());
    if (search.trim()) setResults(await getQuestions(user!.uid, { search: search.trim() }));
  }, [search]);

  const refresh = async () => {
    setRefreshing(true);
    await syncAll(user!.uid);
    setRefreshing(false);
  };

  const first = (profile?.name || user?.displayName || '').split(' ')[0];
  const searching = search.trim().length > 0;

  return (
    <Screen>
      <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>Hello, {first || 'there'}</Text>
      <Text style={{ color: colors.sub }}>What would you like to practise today?</Text>
      <Input placeholder='Search questions' value={search} onChangeText={setSearch} />

      {searching ? (
        <FlatList
          data={results}
          keyExtractor={(q) => q.id}
          renderItem={({ item }) => <QuestionItem q={item} onPress={() => navigation.navigate('QuestionDetail', { id: item.id })} />}
          ListEmptyComponent={<Text style={{ color: colors.sub, textAlign: 'center', marginTop: 20 }}>No matching questions.</Text>}
        />
      ) : (
        <FlatList
          data={cats}
          keyExtractor={(c) => c.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          renderItem={({ item }) => (
            <Card onPress={() => navigation.navigate('QuestionList', { categoryId: item.id, title: item.name })}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>{item.name}</Text>
              <Text style={{ color: colors.sub, marginTop: 4 }}>{item.total} questions</Text>
            </Card>
          )}
          ListEmptyComponent={
            <Text style={{ color: colors.sub, textAlign: 'center', marginTop: 20 }}>
              No questions yet. Connect to the internet once so the question bank can download.
            </Text>
          }
        />
      )}
    </Screen>
  );
}