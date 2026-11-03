import * as SQLite from 'expo-sqlite';
import { Category, Question, QuestionWithState, UserState } from './types';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('interviewprep.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, sortOrder INTEGER DEFAULT 0);
        CREATE TABLE IF NOT EXISTS questions (id TEXT PRIMARY KEY, categoryId TEXT NOT NULL, text TEXT NOT NULL, answer TEXT NOT NULL, difficulty TEXT DEFAULT 'Medium');
        CREATE TABLE IF NOT EXISTS user_state (
          uid TEXT NOT NULL, questionId TEXT NOT NULL,
          bookmarked INTEGER DEFAULT 0, practised INTEGER DEFAULT 0, note TEXT DEFAULT '',
          practisedAt INTEGER, updatedAt INTEGER NOT NULL, dirty INTEGER DEFAULT 0,
          PRIMARY KEY (uid, questionId)
        );
        CREATE TABLE IF NOT EXISTS practice_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT, uid TEXT NOT NULL, questionId TEXT NOT NULL, day TEXT NOT NULL,
          UNIQUE (uid, questionId, day)
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ---------- catalog (copied from Firestore) ----------
export async function replaceCatalog(cats: Category[], qs: Question[]) {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM categories');
    await db.runAsync('DELETE FROM questions');
    for (const c of cats) {
      await db.runAsync('INSERT INTO categories (id, name, sortOrder) VALUES (?, ?, ?)', [c.id, c.name, c.sortOrder ?? 0]);
    }
    for (const q of qs) {
      await db.runAsync(
        'INSERT INTO questions (id, categoryId, text, answer, difficulty) VALUES (?, ?, ?, ?, ?)',
        [q.id, q.categoryId, q.text, q.answer, q.difficulty ?? 'Medium'],
      );
    }
  });
}

export async function getCategories(): Promise<Category[]> {
  const db = await getDb();
  return db.getAllAsync<Category>(
    `SELECT c.id, c.name, c.sortOrder, COUNT(q.id) AS total
     FROM categories c LEFT JOIN questions q ON q.categoryId = c.id
     GROUP BY c.id ORDER BY c.sortOrder, c.name`,
  );
}

type Filters = {
  categoryId?: string;
  search?: string;
  difficulty?: string;
  status?: 'all' | 'practised' | 'unpractised';
  bookmarkedOnly?: boolean;
};

export async function getQuestions(uid: string, o: Filters = {}): Promise<QuestionWithState[]> {
  const db = await getDb();
  const where: string[] = [];
  const args: any[] = [uid]; // the first ? belongs to the JOIN
  if (o.categoryId) { where.push('q.categoryId = ?'); args.push(o.categoryId); }
  if (o.search) { where.push('(q.text LIKE ? OR q.answer LIKE ?)'); args.push(`%${o.search}%`, `%${o.search}%`); }
  if (o.difficulty && o.difficulty !== 'All') { where.push('q.difficulty = ?'); args.push(o.difficulty); }
  if (o.status === 'practised') where.push('COALESCE(s.practised, 0) = 1');
  if (o.status === 'unpractised') where.push('COALESCE(s.practised, 0) = 0');
  if (o.bookmarkedOnly) where.push('COALESCE(s.bookmarked, 0) = 1');
  const sql = `SELECT q.*, COALESCE(s.bookmarked, 0) AS bookmarked, COALESCE(s.practised, 0) AS practised
    FROM questions q LEFT JOIN user_state s ON s.questionId = q.id AND s.uid = ?
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY q.text`;
  return db.getAllAsync<QuestionWithState>(sql, args);
}

export async function getQuestion(uid: string, id: string) {
  const db = await getDb();
  return db.getFirstAsync<QuestionWithState & { note: string }>(
    `SELECT q.*, COALESCE(s.bookmarked, 0) AS bookmarked, COALESCE(s.practised, 0) AS practised, COALESCE(s.note, '') AS note
     FROM questions q LEFT JOIN user_state s ON s.questionId = q.id AND s.uid = ? WHERE q.id = ?`,
    [uid, id],
  );
}

export async function getRandomQuestions(categoryId: string, n: number): Promise<Question[]> {
  const db = await getDb();
  if (categoryId === 'all') return db.getAllAsync<Question>('SELECT * FROM questions ORDER BY RANDOM() LIMIT ?', [n]);
  return db.getAllAsync<Question>('SELECT * FROM questions WHERE categoryId = ? ORDER BY RANDOM() LIMIT ?', [categoryId, n]);
}

// ---------- user state (bookmark / practised / note) ----------
export async function logPractice(uid: string, questionId: string) {
  const db = await getDb();
  await db.runAsync('INSERT OR IGNORE INTO practice_log (uid, questionId, day) VALUES (?, ?, ?)', [uid, questionId, dayKey()]);
}

export async function saveState(
  uid: string,
  questionId: string,
  patch: Partial<Pick<UserState, 'bookmarked' | 'practised' | 'note'>>,
) {
  const db = await getDb();
  const cur = await db.getFirstAsync<UserState>('SELECT * FROM user_state WHERE uid = ? AND questionId = ?', [uid, questionId]);
  const next = {
    bookmarked: cur?.bookmarked ?? 0,
    practised: cur?.practised ?? 0,
    note: cur?.note ?? '',
    practisedAt: cur?.practisedAt ?? null,
    ...patch,
  };
  if (patch.practised === 1 && !cur?.practised) next.practisedAt = Date.now();
  await db.runAsync(
    `INSERT OR REPLACE INTO user_state (uid, questionId, bookmarked, practised, note, practisedAt, updatedAt, dirty)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [uid, questionId, next.bookmarked, next.practised, next.note, next.practisedAt, Date.now()],
  );
  if (patch.practised === 1) await logPractice(uid, questionId);
}

export async function getAllStates(uid: string) {
  const db = await getDb();
  return db.getAllAsync<UserState>(
    'SELECT questionId, bookmarked, practised, note, practisedAt, updatedAt, dirty FROM user_state WHERE uid = ?',
    [uid],
  );
}

export async function putState(uid: string, s: Omit<UserState, 'dirty'>, dirty = 0) {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO user_state (uid, questionId, bookmarked, practised, note, practisedAt, updatedAt, dirty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [uid, s.questionId, s.bookmarked, s.practised, s.note, s.practisedAt, s.updatedAt, dirty],
  );
}

export async function markClean(uid: string, questionId: string) {
  const db = await getDb();
  await db.runAsync('UPDATE user_state SET dirty = 0 WHERE uid = ? AND questionId = ?', [uid, questionId]);
}

// ---------- progress, streak, weekly chart ----------
export async function getProgress(uid: string) {
  const db = await getDb();
  const cats = await db.getAllAsync<{ id: string; name: string; total: number; practised: number }>(
    `SELECT c.id, c.name, COUNT(q.id) AS total,
            COALESCE(SUM(CASE WHEN s.practised = 1 THEN 1 ELSE 0 END), 0) AS practised
     FROM categories c
     LEFT JOIN questions q ON q.categoryId = c.id
     LEFT JOIN user_state s ON s.questionId = q.id AND s.uid = ?
     GROUP BY c.id ORDER BY c.sortOrder`,
    [uid],
  );
  const b = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM user_state s JOIN questions q ON q.id = s.questionId WHERE s.uid = ? AND s.bookmarked = 1',
    [uid],
  );
  return { cats, practised: cats.reduce((a, c) => a + c.practised, 0), bookmarked: b?.n ?? 0 };
}

export async function getStreak(uid: string) {
  const db = await getDb();
  const rows = await db.getAllAsync<{ day: string }>('SELECT DISTINCT day FROM practice_log WHERE uid = ?', [uid]);
  const days = new Set(rows.map((r) => r.day));
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1); // not practised yet today does not break the streak
  let streak = 0;
  while (days.has(dayKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export async function getWeekly(uid: string) {
  const db = await getDb();
  const out: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const r = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM practice_log WHERE uid = ? AND day = ?', [uid, dayKey(d)]);
    out.push({ label: d.toLocaleDateString('en', { weekday: 'short' }), value: r?.n ?? 0 });
  }
  return out;
}