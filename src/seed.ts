import { doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

const cats = [
  { id: 'java', name: 'Java' },
  { id: 'python', name: 'Python' },
  { id: 'sql', name: 'SQL' },
  { id: 'hr', name: 'HR' },
];

const qs: [string, string, string, 'Easy' | 'Medium' | 'Hard'][] = [
  ['java', 'What is the difference between JDK, JRE and JVM?', 'The JVM runs Java bytecode. The JRE is the JVM plus the core libraries needed to run programs. The JDK is the JRE plus development tools such as the javac compiler and the debugger.', 'Easy'],
  ['java', 'What is the difference between an abstract class and an interface?', 'An abstract class can hold state and constructors and gives partial implementation, but a class can extend only one. An interface defines a contract (default methods are allowed) and a class can implement many.', 'Medium'],
  ['java', 'How does garbage collection work in Java?', 'The JVM automatically frees objects that can no longer be reached from any live reference. Generational collectors split the heap into young and old regions because most objects die young.', 'Hard'],
  ['python', 'What is the difference between a list and a tuple?', 'Lists are mutable and tuples are immutable. Tuples can be used as dictionary keys when their contents are hashable, and they are slightly faster and lighter.', 'Easy'],
  ['python', 'What are decorators in Python?', 'A decorator is a function that takes another function and returns an extended version of it, so you can add behaviour such as logging or caching without editing the original code. They are applied with the @ syntax.', 'Medium'],
  ['python', 'Explain the Global Interpreter Lock (GIL).', 'In CPython the GIL lets only one thread run Python bytecode at a time. It limits CPU-bound multithreading, so use multiprocessing for CPU-bound work and threads or asyncio for I/O-bound work.', 'Hard'],
  ['sql', 'What is the difference between WHERE and HAVING?', 'WHERE filters rows before grouping. HAVING filters groups after GROUP BY, usually using aggregates such as COUNT or SUM.', 'Easy'],
  ['sql', 'Explain INNER JOIN and LEFT JOIN.', 'INNER JOIN returns only rows that match in both tables. LEFT JOIN returns every row from the left table, with NULL values where the right table has no match.', 'Medium'],
  ['sql', 'What is database normalization?', 'Organising tables to reduce redundancy and update anomalies: 1NF means atomic values, 2NF removes partial dependencies on a key, and 3NF removes transitive dependencies.', 'Hard'],
  ['hr', 'Tell me about yourself.', 'Give a 60 to 90 second summary: present (who you are and what you study or do), past (relevant projects and skills) and future (why this role). Keep it professional and relevant.', 'Easy'],
  ['hr', 'What is your greatest weakness?', 'Name a real but minor weakness, explain what you are doing to improve it and give a short example of progress. Avoid clichés such as saying you work too hard.', 'Medium'],
  ['hr', 'Why should we hire you?', 'Match your strongest skills and project experience to the job requirements, give one concrete achievement and show that you are keen to learn and contribute to the team.', 'Medium'],
];

export async function seedSampleData() {
  const batch = writeBatch(db);
  cats.forEach((c, i) => batch.set(doc(db, 'categories', c.id), { name: c.name, sortOrder: i + 1 }));
  qs.forEach((q, i) =>
    batch.set(doc(db, 'questions', `${q[0]}-${i + 1}`), { categoryId: q[0], text: q[1], answer: q[2], difficulty: q[3] }),
  );
  await batch.commit();
}