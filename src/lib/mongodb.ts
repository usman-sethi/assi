import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { AssignmentData } from '../types/assignment.js';

let isConnected = false;
let connectionAttempted = false;

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'assignments.json');

// Ensure data folder and file exist for local fallback
function ensureLocalStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error creating local data store:', err);
  }
}

export function readLocalAssignments(): AssignmentData[] {
  ensureLocalStore();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as AssignmentData[];
  } catch {
    return [];
  }
}

export function writeLocalAssignments(data: AssignmentData[]): void {
  ensureLocalStore();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to local data store:', err);
  }
}

export async function connectToDatabase(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('localhost:27017')) {
    // If not set or points to default unhosted local instance, try once with short timeout
    if (!uri) {
      return false;
    }
  }

  if (isConnected) {
    return true;
  }

  if (connectionAttempted && !isConnected) {
    return false;
  }

  connectionAttempted = true;

  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Short timeout to avoid hanging when MongoDB isn't running
      connectTimeoutMS: 3000,
    });
    isConnected = conn.connection.readyState === 1;
    console.log('Successfully connected to MongoDB');
    return isConnected;
  } catch (err) {
    console.warn('MongoDB connection failed or unavailable. Falling back to local file persistence.', (err as Error).message);
    isConnected = false;
    return false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
