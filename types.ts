
export enum UserRole {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT'
}

export type StudentMode = 'chat' | 'summary' | 'exam' | 'dashboard' | 'exam_result';

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface StudyContext {
  content: string;
  fileName: string;
  updatedAt: Date;
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface ExamResult {
  score: number;
  total: number;
  answers: { questionId: number, selected: number, isCorrect: boolean }[];
}
