import NetInfo from '@react-native-community/netinfo';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getAllStates, markClean, putState, replaceCatalog } from './db';
import { Category, Question } from './types';

const listeners = new Set<() => void>();
export const onSynced = (cb: () => void) => {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
};

let running = false;
let timer: ReturnType<typeof setTimeout> | undefined;

export async function syncAll(uid: string): Promise<boolean> {
  if (running) return false;
  const net = await NetInfo.fetch();
  if (!net.isConnected || net.isInternetReachable === false) return false;
  running = true;
  try {
    const [cs, qs, ss] = await Promise.all([
      getDocs(collection(db, 'categories')),
      getDocs(collection(db, 'questions')),
      getDocs(collection(db, 'users', uid, 'states')),
    ]);

    // 1. catalog: cloud to phone
    await replaceCatalog(
      cs.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) })),
      qs.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Question, 'id'>) })),
    );

    // 2. user state: Last Write Wins
    const local = await getAllStates(uid);
    const localMap = new Map(local.map((s) => [s.questionId, s]));
    const remote = new Map(ss.docs.map((d) => [d.id, d.data() as any]));

    for (const [qid, r] of remote) {
      const l = localMap.get(qid);
      if (!l || r.updatedAt > l.updatedAt) {
        await putState(uid, {
          questionId: qid, bookmarked: r.bookmarked ?? 0, practised: r.practised ?? 0,
          note: r.note ?? '', practisedAt: r.practisedAt ?? null, updatedAt: r.updatedAt,
        });
      }
    }
    for (const l of local) {
      if (!l.dirty) continue;
      const r = remote.get(l.questionId);
      if (!r || l.updatedAt >= r.updatedAt) {
        await setDoc(doc(db, 'users', uid, 'states', l.questionId), {
          bookmarked: l.bookmarked, practised: l.practised, note: l.note,
          practisedAt: l.practisedAt, updatedAt: l.updatedAt,
        });
        await markClean(uid, l.questionId);
      }
    }
    listeners.forEach((cb) => cb());
    return true;
  } catch (e) {
    console.warn('sync failed', e);
    return false;
  } finally {
    running = false;
  }
}

// call after every local change; waits 3 seconds so quick taps are batched
export function syncSoon(uid: string) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => syncAll(uid), 3000);
}