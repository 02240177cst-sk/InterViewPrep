import React, { useState } from 'react';
import { FlatList, Text } from 'react-native';
import { useAuth } from '../AuthContext';
import { QuestionItem, Screen } from '../components';
import { getQuestions } from '../db';
import { useLoad } from '../hooks';
import { useTheme } from '../theme';
import { QuestionWithState } from '../types';

export default function BookmarksScreen({ navigation }: any) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [items, setItems] = useState<QuestionWithState[]>([]);

  useLoad(async () => setItems(await getQuestions(user!.uid, { bookmarkedOnly: true })));

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(q) => q.id}
        renderItem={({ item }) => <QuestionItem q={item} onPress={() => navigation.navigate('QuestionDetail', { id: item.id })} />}
        ListEmptyComponent={<Text style={{ color: colors.sub, textAlign: 'center', marginTop: 30 }}>No bookmarks yet. Tap Bookmark on any question to save it here.</Text>}
      />
    </Screen>
  );
}