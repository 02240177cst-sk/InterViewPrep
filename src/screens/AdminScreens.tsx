import React, { useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Button, Card, Chip, Input, Screen } from '../components';
import { getCategories, getQuestion, getQuestions } from '../db';
import { useLoad } from '../hooks';
import { seedSampleData } from '../seed';
import { syncAll } from '../sync';
import { useTheme } from '../theme';
import { Category, Difficulty, QuestionWithState, RootStackParamList } from '../types';

type P<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
const offlineMsg = 'Check your internet connection and admin permission.';

function AdminQuestions({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [items, setItems] = useState<QuestionWithState[]>([]);

  useLoad(async () => setItems(await getQuestions(user!.uid)));

  const remove = (q: QuestionWithState) =>
    Alert.alert('Delete question?', q.text, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await deleteDoc(doc(db, 'questions', q.id)); await syncAll(user!.uid); }
          catch { Alert.alert('Could not delete', offlineMsg); }
        },
      },
    ]);

  return (
    <>
      <Button title='+ Add question' onPress={() => navigation.navigate('AdminQuestionForm', {})} />
      <FlatList
        data={items}
        keyExtractor={(q) => q.id}
        renderItem={({ item }) => (
          <Card>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{item.text}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <View style={{ flex: 1 }}><Button title='Edit' kind='ghost' onPress={() => navigation.navigate('AdminQuestionForm', { id: item.id })} /></View>
              <View style={{ flex: 1 }}><Button title='Delete' kind='danger' onPress={() => remove(item)} /></View>
            </View>
          </Card>
        )}
      />
    </>
  );
}

function AdminCategories() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [cats, setCats] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<Category | null>(null);

  useLoad(async () => setCats(await getCategories()));

  const save = async () => {
    const n = name.trim();
    if (!n) return;
    try {
      if (editing) await updateDoc(doc(db, 'categories', editing.id), { name: n });
      else await addDoc(collection(db, 'categories'), { name: n, sortOrder: cats.length + 1 });
      setName('');
      setEditing(null);
      await syncAll(user!.uid);
    } catch {
      Alert.alert('Could not save', offlineMsg);
    }
  };

  const remove = (c: Category) => {
    if ((c.total ?? 0) > 0) return Alert.alert('Cannot delete', 'Delete or move all questions in this category first.');
    Alert.alert('Delete category?', c.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await deleteDoc(doc(db, 'categories', c.id)); await syncAll(user!.uid); }
          catch { Alert.alert('Could not delete', offlineMsg); }
        },
      },
    ]);
  };

  return (
    <>
      <Input placeholder={editing ? 'Rename category' : 'New category name'} value={name} onChangeText={setName} autoCapitalize='words' />
      <Button title={editing ? 'Save changes' : 'Add category'} onPress={save} />
      <FlatList
        data={cats}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <Card>
            <Text style={{ color: colors.text, fontWeight: '700' }}>{item.name} ({item.total})</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}><Button title='Rename' kind='ghost' onPress={() => { setEditing(item); setName(item.name); }} /></View>
              <View style={{ flex: 1 }}><Button title='Delete' kind='danger' onPress={() => remove(item)} /></View>
            </View>
          </Card>
        )}
      />
    </>
  );
}

function AdminUsers() {
  const { colors } = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    getDocs(collection(db, 'users'))
      .then((s) => setUsers(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(() => setErr('Go online to view registered users.'));
  }, []);

  return (
    <ScrollView>
      {err ? <Text style={{ color: colors.danger }}>{err}</Text> : null}
      <Text style={{ color: colors.sub, marginBottom: 6 }}>{users.length} registered users</Text>
      {users.map((u) => (
        <Card key={u.id}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>{u.name || 'Unnamed'}</Text>
          <Text style={{ color: colors.sub }}>{u.email} · {u.role}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

export function AdminScreen({ navigation }: P<'Admin'>) {
  const { user } = useAuth();
  const [tab, setTab] = useState<'Questions' | 'Categories' | 'Users'>('Questions');

  const seed = async () => {
    try {
      await seedSampleData();
      await syncAll(user!.uid);
      Alert.alert('Done', 'Sample questions uploaded.');
    } catch {
      Alert.alert('Could not upload', offlineMsg);
    }
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {(['Questions', 'Categories', 'Users'] as const).map((t) => (
          <Chip key={t} label={t} active={tab === t} onPress={() => setTab(t)} />
        ))}
      </View>
      {tab === 'Questions' && <AdminQuestions navigation={navigation} />}
      {tab === 'Categories' && <AdminCategories />}
      {tab === 'Users' && <AdminUsers />}
      <Button title='Upload sample questions' kind='ghost' onPress={seed} />
    </Screen>
  );
}

export function AdminQuestionFormScreen({ route, navigation }: P<'AdminQuestionForm'>) {
  const { user } = useAuth();
  const id = route.params?.id;
  const [cats, setCats] = useState<Category[]>([]);
  const [text, setText] = useState('');
  const [answer, setAnswer] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [categoryId, setCategoryId] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      setCats(await getCategories());
      if (id) {
        const q = await getQuestion(user!.uid, id);
        if (q) { setText(q.text); setAnswer(q.answer); setDifficulty(q.difficulty); setCategoryId(q.categoryId); }
      }
    })();
  }, []);

  const save = async () => {
    if (!text.trim() || !answer.trim() || !categoryId) {
      return Alert.alert('Missing information', 'Fill in the question, the answer and choose a category.');
    }
    setBusy(true);
    try {
      const data = { categoryId, text: text.trim(), answer: answer.trim(), difficulty };
      if (id) await updateDoc(doc(db, 'questions', id), data);
      else await addDoc(collection(db, 'questions'), data);
      await syncAll(user!.uid);
      navigation.goBack();
    } catch {
      Alert.alert('Could not save', offlineMsg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps='handled'>
        <Input label='Question' value={text} onChangeText={setText} multiline autoCapitalize='sentences' style={{ minHeight: 70, textAlignVertical: 'top' }} />
        <Input label='Expert answer' value={answer} onChangeText={setAnswer} multiline autoCapitalize='sentences' style={{ minHeight: 120, textAlignVertical: 'top' }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
          {cats.map((c) => <Chip key={c.id} label={c.name} active={categoryId === c.id} onPress={() => setCategoryId(c.id)} />)}
        </View>
        <View style={{ flexDirection: 'row', marginTop: 6 }}>
          {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((d) => <Chip key={d} label={d} active={difficulty === d} onPress={() => setDifficulty(d)} />)}
        </View>
        <Button title={id ? 'Save changes' : 'Add question'} onPress={save} loading={busy} />
      </ScrollView>
    </Screen>
  );
}