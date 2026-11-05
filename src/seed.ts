import { doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

const cats = [
  { id: 'java', name: 'Java' },
  { id: 'python', name: 'Python' },
  { id: 'sql', name: 'SQL' },
  { id: 'hr', name: 'HR' },
];

const qs: [string, string, string, 'Easy' | 'Medium' | 'Hard'][] = [
  // ---------- Java ----------
  ['java', 'What is the difference between throw and throws?', 'throw is used inside a method to actually raise an exception object. throws is written in the method signature to declare which checked exceptions the method may pass on to its caller.', 'Easy'],
  ['java', 'What is the difference between an array and an ArrayList?', 'An array has a fixed size and can hold primitives. An ArrayList resizes dynamically, holds only objects and provides helper methods such as add, remove and contains.', 'Easy'],
  ['java', 'What is the static keyword used for?', 'static members belong to the class instead of to an object. They are shared by all instances and can be used without creating an object, for example Math.max().', 'Easy'],
  ['java', 'What is the difference between HashMap and Hashtable?', 'HashMap is not synchronized, allows one null key and null values, and is faster. Hashtable is synchronized (thread-safe), allows no nulls and is considered a legacy class.', 'Medium'],
  ['java', 'What is a constructor and can it be overloaded?', 'A constructor is a special method with the same name as the class that initialises a new object. Yes, a class can have several constructors with different parameter lists.', 'Easy'],
  ['java', 'What are lambda expressions and streams in Java 8?', 'A lambda is a short anonymous function such as (a, b) -> a + b. Streams process collections in a pipeline using operations like filter, map and collect, which makes code shorter and more readable.', 'Medium'],
  ['java', 'What is the difference between Comparable and Comparator?', 'Comparable defines the natural order inside the class itself through compareTo(). Comparator is a separate object that defines custom orderings through compare(), so the same class can be sorted in several ways.', 'Medium'],
  ['java', 'What is multithreading and how do you create a thread?', 'Multithreading runs several tasks at the same time within one program. You create a thread by extending Thread, or by implementing Runnable and passing it to a Thread, or by using an ExecutorService.', 'Medium'],

  ['java', 'What is the difference between == and equals() in Java?', 'For objects, == compares references (whether both variables point to the same object), while equals() compares logical content when a class overrides it, as String does. For primitives, == compares values.', 'Easy'],
  ['java', 'What is the difference between ArrayList and LinkedList?', 'ArrayList is backed by a dynamic array, so access by index is fast but inserting or removing in the middle is slow. LinkedList uses nodes, so inserting and removing is fast once you are at the position, but access by index is slow.', 'Easy'],
  ['java', 'What are the four pillars of OOP?', 'Encapsulation (hiding data behind methods), inheritance (reusing code from a parent class), polymorphism (one interface with many forms) and abstraction (exposing only essential details).', 'Easy'],
  ['java', 'What is the difference between checked and unchecked exceptions?', 'Checked exceptions, such as IOException, must be caught or declared with throws, and the compiler enforces this. Unchecked exceptions extend RuntimeException, such as NullPointerException, and the compiler does not force you to handle them.', 'Medium'],
  ['java', 'What is the purpose of the final keyword?', 'A final variable cannot be reassigned, a final method cannot be overridden and a final class cannot be extended.', 'Easy'],
  ['java', 'What is the difference between String, StringBuilder and StringBuffer?', 'String is immutable. StringBuilder is mutable and fast but not thread-safe. StringBuffer is mutable and thread-safe but slower because its methods are synchronized.', 'Medium'],
  ['java', 'How does a HashMap work internally?', 'The key hashCode decides which bucket stores the entry. Collisions are handled by chaining entries in a linked list or tree inside the bucket. Lookups are O(1) on average.', 'Hard'],
  ['java', 'What is the difference between method overloading and overriding?', 'Overloading means several methods in the same class with the same name but different parameters, resolved at compile time. Overriding means a subclass redefines a parent method with the same signature, resolved at runtime.', 'Medium'],

  // ---------- Python ----------
  ['python', 'What is the difference between a set and a list?', 'A set is unordered, holds only unique elements and has very fast membership checks. A list is ordered and allows duplicates.', 'Easy'],
  ['python', 'What is a lambda function?', 'An anonymous function limited to a single expression, written like lambda x: x * 2. It is often used with map, filter and sorted.', 'Easy'],
  ['python', 'What is the difference between instance methods, class methods and static methods?', 'Instance methods receive self and work on one object. Class methods receive cls through @classmethod and work on the class. Static methods receive neither and behave like plain functions grouped inside the class.', 'Medium'],
  ['python', 'What are mutable and immutable types in Python?', 'Mutable objects such as list, dict and set can be changed after creation. Immutable objects such as int, float, str and tuple cannot be changed once created.', 'Easy'],
  ['python', 'How does exception handling work in Python?', 'Code that may fail goes in a try block. except catches specific errors, else runs when no error happened, and finally always runs for cleanup. raise throws an exception on purpose.', 'Easy'],
  ['python', 'What is the difference between a function and a method?', 'A function is defined on its own and called by name. A method is a function defined inside a class and called on an object, which is passed to it as the first argument.', 'Easy'],
  ['python', 'What are context managers and the with statement?', 'They handle setup and cleanup automatically. For example, with open(path) as f closes the file even if an error occurs. Custom ones use __enter__ and __exit__ or the contextlib module.', 'Medium'],
  ['python', 'What is the difference between multithreading, multiprocessing and asyncio?', 'Threads share memory but are limited by the GIL for CPU-bound work. Multiprocessing uses separate processes for true parallel CPU work. asyncio runs many I/O tasks cooperatively on one thread.', 'Hard'],

  ['python', 'What is the difference between a shallow copy and a deep copy?', 'A shallow copy creates a new container but shares the nested objects with the original. A deep copy recursively copies everything, so changes to the copy never affect the original.', 'Medium'],
  ['python', 'What are *args and **kwargs?', '*args collects extra positional arguments into a tuple, and **kwargs collects extra keyword arguments into a dictionary. They let a function accept a flexible number of arguments.', 'Easy'],
  ['python', 'What is a list comprehension?', 'A short way to build a list from an iterable, with an optional condition. For example, [x * x for x in range(10) if x % 2 == 0] gives the squares of the even numbers.', 'Easy'],
  ['python', 'What is the difference between is and ==?', '== checks whether two values are equal. is checks whether two names point to the exact same object in memory.', 'Easy'],
  ['python', 'What are generators and why are they useful?', 'Generators are functions that use yield to produce values one at a time instead of building a whole list. They save memory and work well with large or infinite sequences.', 'Medium'],
  ['python', 'What is the difference between a module and a package?', 'A module is a single .py file. A package is a folder of modules, normally containing an __init__.py file.', 'Easy'],
  ['python', 'How does Python manage memory?', 'Python uses reference counting, which frees an object when nothing refers to it, plus a cyclic garbage collector that cleans up objects that reference each other.', 'Hard'],
  ['python', 'How do Python dictionaries work?', 'A dictionary is a hash table of key-value pairs with average O(1) lookup. Keys must be hashable, which means immutable types such as strings, numbers and tuples.', 'Medium'],

  // ---------- SQL ----------
  ['sql', 'What is a view in SQL?', 'A view is a saved query that behaves like a virtual table. It simplifies complex queries and can limit which columns or rows users are allowed to see.', 'Medium'],
  ['sql', 'What is the difference between CHAR and VARCHAR?', 'CHAR has a fixed length and pads shorter values with spaces. VARCHAR has a variable length and stores only the characters you give it.', 'Easy'],
  ['sql', 'What are aggregate functions?', 'Functions that calculate one value from many rows: COUNT, SUM, AVG, MIN and MAX. They are often used together with GROUP BY.', 'Easy'],
  ['sql', 'What is a stored procedure?', 'A saved set of SQL statements stored in the database and run by name, optionally with parameters. It reduces repeated code and can improve performance and security.', 'Medium'],
  ['sql', 'What is the difference between a clustered and a non-clustered index?', 'A clustered index decides the physical order of the rows, so a table can have only one. A non-clustered index is a separate structure with pointers to the rows, and a table can have many.', 'Hard'],
  ['sql', 'How do you remove duplicate rows from a query result?', 'Use SELECT DISTINCT to return unique rows. To delete duplicates from a table, number the rows with ROW_NUMBER() over the duplicate columns and delete those numbered above 1.', 'Medium'],
  ['sql', 'What is a self join?', 'A table joined to itself using different aliases. A common example is an employees table joined to itself to show each employee next to their manager.', 'Medium'],
  ['sql', 'What is a NULL value and how do you test for it?', 'NULL means a value is unknown or missing, which is not the same as zero or an empty string. Test it with IS NULL or IS NOT NULL, never with = NULL.', 'Easy'],

  ['sql', 'What is the difference between a primary key and a foreign key?', 'A primary key uniquely identifies each row in a table and cannot be NULL. A foreign key is a column that refers to another table primary key, which keeps related data consistent.', 'Easy'],
  ['sql', 'What is the difference between DELETE, TRUNCATE and DROP?', 'DELETE removes chosen rows and can be rolled back. TRUNCATE removes all rows quickly but keeps the table structure. DROP removes the entire table, including its structure.', 'Medium'],
  ['sql', 'What is an index and when should you use one?', 'An index is a data structure that speeds up searches on columns used in WHERE, JOIN or ORDER BY. The cost is extra storage and slower inserts and updates.', 'Medium'],
  ['sql', 'What are the ACID properties?', 'Atomicity (all or nothing), Consistency (data stays valid), Isolation (transactions do not interfere with each other) and Durability (committed data survives failures).', 'Hard'],
  ['sql', 'What is the difference between UNION and UNION ALL?', 'UNION combines results and removes duplicate rows. UNION ALL keeps all rows including duplicates, so it is faster.', 'Easy'],
  ['sql', 'What is a subquery?', 'A query nested inside another query. It can appear in WHERE, FROM or SELECT to filter rows or calculate a value used by the outer query.', 'Medium'],
  ['sql', 'How do you find the second highest salary in a table?', 'SELECT MAX(salary) FROM employees WHERE salary < (SELECT MAX(salary) FROM employees); This finds the largest salary that is below the overall maximum.', 'Medium'],
  ['sql', 'What does GROUP BY do?', 'It groups rows that share the same value in one or more columns so that aggregate functions such as COUNT, SUM and AVG can be calculated for each group.', 'Easy'],

  // ---------- HR ----------
  ['hr', 'Why did you choose this field of study?', 'Explain what first interested you, what you enjoyed learning and how it connects to the role. A short real story from a project or class makes the answer believable.', 'Easy'],
  ['hr', 'How do you handle criticism?', 'Say you listen without getting defensive, ask questions to understand the feedback, and then apply it. Give one example where feedback improved your work.', 'Medium'],
  ['hr', 'Tell me about a time you failed.', 'Choose a real but minor failure. Explain what went wrong, what you learned and what you changed afterwards. The interviewer wants honesty and growth.', 'Medium'],
  ['hr', 'How do you prioritise your tasks?', 'List everything, rank by urgency and importance, and check the deadlines. Break large tasks into steps and tell your team early if something is at risk.', 'Medium'],
  ['hr', 'What motivates you?', 'Name genuine motivators such as learning new skills, solving problems or seeing your work help people, and link them to what the job offers.', 'Easy'],
  ['hr', 'How would your teammates describe you?', 'Pick two or three positive traits, such as reliable, helpful or calm under pressure, and support each with a short example.', 'Easy'],
  ['hr', 'Are you willing to relocate to another town or dzongkhag?', 'Answer honestly. If you are flexible, say so and show enthusiasm for the opportunity. If you have limits, state them politely and clearly.', 'Easy'],
  ['hr', 'Tell me about a project you are proud of.', 'Describe the purpose, your own role, the tools you used, one challenge you solved and the result. For an IT student, a mobile app or college project works well.', 'Medium'],
  ['hr', 'Where do you see yourself in five years?', 'Show realistic ambition: you want to build strong skills, take on more responsibility and grow with the company. Avoid saying you want to leave or take the interviewer job.', 'Easy'],
  ['hr', 'Why do you want to work for this company?', 'Research the company first. Mention specific products, values or projects that interest you and connect them to your skills and career goals.', 'Easy'],
  ['hr', 'What is your greatest strength?', 'Choose a strength that matches the job, such as problem solving or learning quickly, and back it up with a short example from a project or internship.', 'Easy'],
  ['hr', 'Tell me about a time you faced a challenge.', 'Use the STAR method: describe the Situation, your Task, the Action you took and the Result. Finish with what you learned.', 'Medium'],
  ['hr', 'How do you handle pressure and tight deadlines?', 'Say you prioritise tasks, break work into smaller steps, communicate early if something is at risk and stay calm. Give a short example such as a project submission week.', 'Medium'],
  ['hr', 'Describe a time you worked in a team.', 'Use STAR. Explain your role, how the team communicated, how you handled any disagreement and what the team achieved together.', 'Medium'],
  ['hr', 'What are your salary expectations?', 'Research the typical range for the role first and give a range, not a single number. As a fresh graduate, show you are flexible and care about learning and growth.', 'Medium'],
  ['hr', 'Do you have any questions for us?', 'Always ask something, for example about team culture, training opportunities, what the first 90 days look like and how success is measured in the role.', 'Easy'],
  
];

export async function seedSampleData() {
  const batch = writeBatch(db);
  cats.forEach((c, i) => batch.set(doc(db, 'categories', c.id), { name: c.name, sortOrder: i + 1 }));
  qs.forEach((q, i) =>
    batch.set(doc(db, 'questions', `${q[0]}-${i + 1}`), { categoryId: q[0], text: q[1], answer: q[2], difficulty: q[3] }),
  );
  await batch.commit();
}