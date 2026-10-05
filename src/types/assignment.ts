/**
 * Academic Assignment Data Types & Schemas
 */

export type AnswerLength = 'short' | 'medium' | 'long';
export type WritingDifficulty = 'simple' | 'normal' | 'advanced';

export interface QuestionItem {
  id: string;
  question: string;
  answer?: string;
}

export interface AssignmentData {
  _id?: string;
  id?: string;
  studentName: string;
  rollNumber: string;
  assignmentNumber: string;
  subject: string;
  submittedTo: string;
  department?: string;
  semester?: string;
  universityName?: string;
  logoUrl?: string;

  questions: QuestionItem[];

  instructions?: string;
  answerLength?: AnswerLength;
  difficulty?: WritingDifficulty;

  editorContent: string;

  createdAt: string;
  updatedAt: string;
}

export interface StructuredAnswerSection {
  heading: string;
  content: string;
}

export interface StructuredQuestionResult {
  question: string;
  title: string;
  introduction?: string;
  sections: StructuredAnswerSection[];
  conclusion?: string;
  keyPoints?: string[];
}

export interface StructuredAssignmentResponse {
  questions: StructuredQuestionResult[];
}

export type AiEditAction =
  | 'improve'
  | 'humanize'
  | 'simplify'
  | 'expand'
  | 'shorten'
  | 'grammar'
  | 'formal'
  | 'example'
  | 'regenerate';

export interface AiEditRequest {
  action: AiEditAction;
  text: string;
  context?: string;
}

export interface AiEditResponse {
  action: AiEditAction;
  originalText: string;
  resultText: string;
}
