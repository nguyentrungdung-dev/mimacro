export type Subject = "micro" | "macro";
export type Option = { id: string; text: string; html?: string };
export type Question = {
  id: string;
  number: number;
  html: string;
  text: string;
  options: Option[];
  answer: string;
  explanation: string;
  explanationHtml: string;
  solutionMediaIds: string[];
  sourceId: string;
  sourceTitle: string;
  topic: string;
  chapter: number;
  familyKey: string;
  mediaIds: string[];
  difficulty: "unrated";
};
export type PublicQuestion = Omit<
  Question,
  | "answer"
  | "explanation"
  | "explanationHtml"
  | "solutionMediaIds"
  | "familyKey"
> & {
  review?: {
    answer: string;
    explanation: string;
    explanationHtml: string;
    correct: boolean;
  };
};
export type AnswerRecord = { optionId: string; answeredAt: string };
export type AttemptView = {
  id: string;
  title: string;
  mode: "practice" | "exam";
  subject: Subject;
  language: "en" | "vi";
  status: "in_progress" | "completed";
  startedAt: string;
  deadlineAt: string;
  serverNow: string;
  responses: Record<string, AnswerRecord>;
  questions: PublicQuestion[];
  score: number | null;
  correctCount: number | null;
};
export type UserView = {
  id: string;
  username: string;
  displayName: string;
  role: "student" | "admin";
};
export type SourceView = {
  id: string;
  title: string;
  subject: Subject;
  language: "en" | "vi";
  chapter: number;
  topic: string;
  questionCount: number;
  available: number;
  issues: number;
};
export type HistoryRow = {
  id: string;
  title: string;
  mode: string;
  subject: Subject;
  status: string;
  startedAt: string;
  score: number | null;
  correctCount: number | null;
  questionCount: number;
};
