export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type Category = { id: string; name: string; sortOrder: number; total?: number };

export type Question = {
  id: string;
  categoryId: string;
  text: string;
  answer: string;
  difficulty: Difficulty;
};

export type QuestionWithState = Question & { bookmarked: number; practised: number };

export type UserState = {
  questionId: string;
  bookmarked: number;
  practised: number;
  note: string;
  practisedAt: number | null;
  updatedAt: number;
  dirty: number;
};

export type Profile = { name: string; email: string; role: 'user' | 'admin' };

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Forgot: undefined;
  Tabs: undefined;
  QuestionList: { categoryId?: string; title: string };
  QuestionDetail: { id: string };
  MockSession: { categoryId: string; count: number; seconds: number };
  MockSummary: { good: number; okay: number; poor: number; total: number };
  Admin: undefined;
  AdminQuestionForm: { id?: string } | undefined;
};