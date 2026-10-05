import { z } from 'zod';

export const QuestionItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  question: z.string().trim().min(3, 'Question must be at least 3 characters long'),
  answer: z.string().optional().default(''),
});

export const CreateAssignmentInputSchema = z.object({
  studentName: z.string().trim().min(1, 'Student name is required'),
  rollNumber: z.string().trim().min(1, 'Roll number is required'),
  assignmentNumber: z.string().trim().min(1, 'Assignment number is required'),
  subject: z.string().trim().min(1, 'Subject is required'),
  submittedTo: z.string().trim().min(1, 'Submitted to (Instructor/Professor) is required'),
  department: z.string().trim().optional().default(''),
  semester: z.string().trim().optional().default(''),
  universityName: z.string().trim().optional().default(''),
  logoUrl: z.string().optional().default(''),
  questions: z.array(QuestionItemSchema).min(1, 'At least one question is required'),
  instructions: z.string().trim().optional().default(''),
  answerLength: z.enum(['short', 'medium', 'long']).default('medium'),
  difficulty: z.enum(['simple', 'normal', 'advanced']).default('normal'),
  editorContent: z.string().optional().default(''),
});

export const GenerateRequestSchema = z.object({
  studentName: z.string().trim().min(1, 'Student name is required'),
  rollNumber: z.string().trim().min(1, 'Roll number is required'),
  assignmentNumber: z.string().trim().min(1, 'Assignment number is required'),
  subject: z.string().trim().min(1, 'Subject is required'),
  submittedTo: z.string().trim().min(1, 'Submitted to is required'),
  department: z.string().trim().optional().default(''),
  semester: z.string().trim().optional().default(''),
  universityName: z.string().trim().optional().default(''),
  logoUrl: z.string().optional().default(''),
  questions: z.array(QuestionItemSchema).min(1, 'At least one question is required'),
  instructions: z.string().trim().optional().default(''),
  answerLength: z.enum(['short', 'medium', 'long']).default('medium'),
  difficulty: z.enum(['simple', 'normal', 'advanced']).default('normal'),
});

export const AiEditRequestSchema = z.object({
  action: z.enum([
    'improve',
    'humanize',
    'simplify',
    'expand',
    'shorten',
    'grammar',
    'formal',
    'example',
    'regenerate',
  ]),
  text: z.string().trim().min(1, 'Text to edit cannot be empty'),
  context: z.string().trim().optional(),
});

export const UpdateAssignmentSchema = z.object({
  studentName: z.string().trim().min(1).optional(),
  rollNumber: z.string().trim().min(1).optional(),
  assignmentNumber: z.string().trim().min(1).optional(),
  subject: z.string().trim().min(1).optional(),
  submittedTo: z.string().trim().min(1).optional(),
  department: z.string().trim().optional(),
  semester: z.string().trim().optional(),
  universityName: z.string().trim().optional(),
  logoUrl: z.string().optional(),
  questions: z.array(QuestionItemSchema).optional(),
  instructions: z.string().trim().optional(),
  answerLength: z.enum(['short', 'medium', 'long']).optional(),
  difficulty: z.enum(['simple', 'normal', 'advanced']).optional(),
  editorContent: z.string().optional(),
});

export const StructuredSectionSchema = z.object({
  heading: z.string(),
  content: z.string(),
});

export const StructuredQuestionSchema = z.object({
  question: z.string(),
  title: z.string(),
  introduction: z.string().optional().default(''),
  sections: z.array(StructuredSectionSchema).default([]),
  conclusion: z.string().optional().default(''),
  keyPoints: z.array(z.string()).optional().default([]),
});

export const StructuredResponseSchema = z.object({
  questions: z.array(StructuredQuestionSchema),
});
