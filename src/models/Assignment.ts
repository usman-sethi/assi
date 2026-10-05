import mongoose, { Schema, Document } from 'mongoose';
import { AssignmentData, QuestionItem } from '../types/assignment.js';
import { connectToDatabase, isMongoConnected, readLocalAssignments, writeLocalAssignments } from '../lib/mongodb.js';

export interface IAssignmentDocument extends Document {
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
  answerLength?: 'short' | 'medium' | 'long';
  difficulty?: 'simple' | 'normal' | 'advanced';
  editorContent: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<QuestionItem>({
  id: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, default: '' },
}, { _id: false });

const AssignmentMongooseSchema = new Schema<IAssignmentDocument>(
  {
    studentName: { type: String, required: true, trim: true },
    rollNumber: { type: String, required: true, trim: true },
    assignmentNumber: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    submittedTo: { type: String, required: true, trim: true },
    department: { type: String, default: '', trim: true },
    semester: { type: String, default: '', trim: true },
    universityName: { type: String, default: '', trim: true },
    logoUrl: { type: String, default: '' },
    questions: [QuestionSchema],
    instructions: { type: String, default: '' },
    answerLength: { type: String, enum: ['short', 'medium', 'long'], default: 'medium' },
    difficulty: { type: String, enum: ['simple', 'normal', 'advanced'], default: 'normal' },
    editorContent: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation in development
export const AssignmentModel =
  mongoose.models.Assignment || mongoose.model<IAssignmentDocument>('Assignment', AssignmentMongooseSchema);

function generateId(): string {
  return 'asgn_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// Unified repository methods that work with MongoDB or fallback store
export async function createAssignment(data: Omit<AssignmentData, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<AssignmentData> {
  const mongoReady = await connectToDatabase();
  const now = new Date().toISOString();

  if (mongoReady && isMongoConnected()) {
    try {
      const doc = await AssignmentModel.create({
        ...data,
      });
      return {
        _id: doc._id.toString(),
        id: doc._id.toString(),
        studentName: doc.studentName,
        rollNumber: doc.rollNumber,
        assignmentNumber: doc.assignmentNumber,
        subject: doc.subject,
        submittedTo: doc.submittedTo,
        department: doc.department,
        semester: doc.semester,
        universityName: doc.universityName,
        logoUrl: doc.logoUrl,
        questions: doc.questions,
        instructions: doc.instructions,
        answerLength: doc.answerLength,
        difficulty: doc.difficulty,
        editorContent: doc.editorContent,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      };
    } catch (err) {
      console.warn('Mongoose creation failed, falling back to local store:', err);
    }
  }

  // Fallback store
  const id = generateId();
  const newAssignment: AssignmentData = {
    _id: id,
    id: id,
    studentName: data.studentName,
    rollNumber: data.rollNumber,
    assignmentNumber: data.assignmentNumber,
    subject: data.subject,
    submittedTo: data.submittedTo,
    department: data.department || '',
    semester: data.semester || '',
    universityName: data.universityName || '',
    logoUrl: data.logoUrl || '',
    questions: data.questions,
    instructions: data.instructions || '',
    answerLength: data.answerLength || 'medium',
    difficulty: data.difficulty || 'normal',
    editorContent: data.editorContent || '',
    createdAt: now,
    updatedAt: now,
  };

  const list = readLocalAssignments();
  list.unshift(newAssignment);
  writeLocalAssignments(list);

  return newAssignment;
}

export async function findAssignmentById(id: string): Promise<AssignmentData | null> {
  const mongoReady = await connectToDatabase();

  if (mongoReady && isMongoConnected() && mongoose.isValidObjectId(id)) {
    try {
      const doc = await AssignmentModel.findById(id).lean();
      if (doc) {
        return {
          _id: doc._id.toString(),
          id: doc._id.toString(),
          studentName: doc.studentName,
          rollNumber: doc.rollNumber,
          assignmentNumber: doc.assignmentNumber,
          subject: doc.subject,
          submittedTo: doc.submittedTo,
          department: doc.department,
          semester: doc.semester,
          universityName: doc.universityName,
          logoUrl: doc.logoUrl,
          questions: doc.questions,
          instructions: doc.instructions,
          answerLength: doc.answerLength,
          difficulty: doc.difficulty,
          editorContent: doc.editorContent,
          createdAt: new Date(doc.createdAt).toISOString(),
          updatedAt: new Date(doc.updatedAt).toISOString(),
        };
      }
    } catch (err) {
      console.warn('MongoDB find failed, trying local store:', err);
    }
  }

  const list = readLocalAssignments();
  const found = list.find((a) => a.id === id || a._id === id);
  return found || null;
}

export async function findAllAssignments(): Promise<AssignmentData[]> {
  const mongoReady = await connectToDatabase();

  if (mongoReady && isMongoConnected()) {
    try {
      const docs = await AssignmentModel.find().sort({ updatedAt: -1 }).lean();
      return docs.map((doc) => ({
        _id: doc._id.toString(),
        id: doc._id.toString(),
        studentName: doc.studentName,
        rollNumber: doc.rollNumber,
        assignmentNumber: doc.assignmentNumber,
        subject: doc.subject,
        submittedTo: doc.submittedTo,
        department: doc.department,
        semester: doc.semester,
        universityName: doc.universityName,
        logoUrl: doc.logoUrl,
        questions: doc.questions,
        instructions: doc.instructions,
        answerLength: doc.answerLength,
        difficulty: doc.difficulty,
        editorContent: doc.editorContent,
        createdAt: new Date(doc.createdAt).toISOString(),
        updatedAt: new Date(doc.updatedAt).toISOString(),
      }));
    } catch (err) {
      console.warn('MongoDB findAll failed, reading local store:', err);
    }
  }

  const list = readLocalAssignments();
  return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function updateAssignmentById(
  id: string,
  update: Partial<AssignmentData>
): Promise<AssignmentData | null> {
  const mongoReady = await connectToDatabase();
  const now = new Date().toISOString();

  if (mongoReady && isMongoConnected() && mongoose.isValidObjectId(id)) {
    try {
      const doc = await AssignmentModel.findByIdAndUpdate(
        id,
        {
          ...update,
          updatedAt: new Date(),
        },
        { new: true }
      ).lean();

      if (doc) {
        return {
          _id: doc._id.toString(),
          id: doc._id.toString(),
          studentName: doc.studentName,
          rollNumber: doc.rollNumber,
          assignmentNumber: doc.assignmentNumber,
          subject: doc.subject,
          submittedTo: doc.submittedTo,
          department: doc.department,
          semester: doc.semester,
          universityName: doc.universityName,
          logoUrl: doc.logoUrl,
          questions: doc.questions,
          instructions: doc.instructions,
          answerLength: doc.answerLength,
          difficulty: doc.difficulty,
          editorContent: doc.editorContent,
          createdAt: new Date(doc.createdAt).toISOString(),
          updatedAt: new Date(doc.updatedAt).toISOString(),
        };
      }
    } catch (err) {
      console.warn('MongoDB update failed, falling back to local store:', err);
    }
  }

  const list = readLocalAssignments();
  const index = list.findIndex((a) => a.id === id || a._id === id);
  if (index === -1) {
    return null;
  }

  const existing = list[index];
  const updatedItem: AssignmentData = {
    ...existing,
    ...update,
    updatedAt: now,
  };

  list[index] = updatedItem;
  writeLocalAssignments(list);

  return updatedItem;
}

export async function deleteAssignmentById(id: string): Promise<boolean> {
  const mongoReady = await connectToDatabase();

  if (mongoReady && isMongoConnected() && mongoose.isValidObjectId(id)) {
    try {
      await AssignmentModel.findByIdAndDelete(id);
      return true;
    } catch (err) {
      console.warn('MongoDB delete failed, checking local store:', err);
    }
  }

  const list = readLocalAssignments();
  const filtered = list.filter((a) => a.id !== id && a._id !== id);
  if (filtered.length !== list.length) {
    writeLocalAssignments(filtered);
    return true;
  }

  return false;
}
