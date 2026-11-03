import React, { useRef, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../AuthContext';
import { Button, Card, Input, Screen } from '../components';
import { getQuestion, saveState } from '../db';
import { useLoad } from '../hooks';
import { syncSoon } from '../sync';
import { useTheme } from '../theme';
import { QuestionWithState, RootStackParamList } from '../types';

export default function QuestionDetailScreen({ route }: NativeStackScreenProps<RootStackParamList, 'QuestionDetail'>) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const uid = user!.uid;
  const id = route.params.id;
  const [q, setQ] = useState<(QuestionWithState & { note: string }) | null>(null);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const noteLoaded = useRef(false);

  const load = async () => {
    const r = await getQuestion(uid, id);
    setQ(r);
    if (!noteLoaded.current) {
      setNote(r?.note ?? '');
      noteLoaded.current = true; // do not overwrite what the user is typing
    }
  };
  useLoad(load, [id]);

  if (!q) return <Screen><Text style={{ color: colors.sub }}>Question not found.</Text></Screen>;

  const toggleBookmark = async () => { await saveState(uid, id, { bookmarked: q.bookmarked ? 0 : 1 }); syncSoon(uid); load(); };
  const togglePractised = async () => { await saveState(uid, id, { practised: q.practised ? 0 : 1 }); syncSoon(uid); load(); };
  const saveNote = async () => { await saveState(uid, id, { note }); syncSoon(uid); setSaved(true); };

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps='handled'>
        <Card>
          <Text style={{ color: colors.sub }}>{q.difficulty}</Text>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700', marginTop: 4 }}>{q.text}</Text>
        </Card>
        <Card>
          <Text style={{ color: colors.primary, fontWeight: '700', marginBottom: 6 }}>Expert answer</Text>
          <Text style={{ color: colors.text, fontSize: 16, lineHeight: 23 }}>{q.answer}</Text>
        </Card>
        <Input
          label='My notes' placeholder='Write your own answer or reminders' value={note} multiline
          onChangeText={(t) => { setNote(t); setSaved(false); }}
          style={{ minHeight: 100, textAlignVertical: 'top' }}
        />
        <Button title={saved ? 'Note saved' : 'Save note'} kind='ghost' onPress={saveNote} />
        <Button title={q.bookmarked ? 'Remove bookmark' : 'Bookmark'} kind='ghost' onPress={toggleBookmark} />
        <Button title={q.practised ? 'Marked as practised (tap to undo)' : 'Mark as practised'} onPress={togglePractised} />
      </ScrollView>
    </Screen>
  );
}