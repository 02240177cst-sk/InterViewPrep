import React, { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../AuthContext';
import { Chip, QuestionItem, Screen } from '../components';
import { getQuestions } from '../db';
import { useLoad } from '../hooks';
import { useTheme } from '../theme';
import { QuestionWithState, RootStackParamList } from '../types';

const difficulties = ['All', 'Easy', 'Medium', 'Hard'];
const statuses = [
  { label: 'All', value: 'all' },
  { label: 'Practised', value: 'practised' },
  { label: 'Not practised', value: 'unpractised' },
] as const;

export default function QuestionListScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'QuestionList'>) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [items, setItems] = useState<QuestionWithState[]>([]);
  const [difficulty, setDifficulty] = useState('All');
  const [status, setStatus] = useState<'all' | 'practised' | 'unpractised'>('all');

  useLoad(async () => {
    setItems(await getQuestions(user!.uid, { categoryId: route.params.categoryId, difficulty, status }));
  }, [difficulty, status]);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {difficulties.map((d) => <Chip key={d} label={d} active={difficulty === d} onPress={() => setDifficulty(d)} />)}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {statuses.map((s) => <Chip key={s.value} label={s.label} active={status === s.value} onPress={() => setStatus(s.value)} />)}
      </View>
      <FlatList
        data={items}
        keyExtractor={(q) => q.id}
        renderItem={({ item }) => <QuestionItem q={item} onPress={() => navigation.navigate('QuestionDetail', { id: item.id })} />}
        ListEmptyComponent={<Text style={{ color: colors.sub, textAlign: 'center', marginTop: 20 }}>No questions match these filters.</Text>}
      />
    </Screen>
  );
}