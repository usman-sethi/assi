import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import type { AssignmentData } from '../types/assignment.ts';

let isConnected = false;
let connectionAttempted = false;
let lastFailureTime = 0;
let failureReason: string | null = null;
let isAuthFailure = false;
const RETRY_COOLDOWN_MS = 60000; // 60-second cooldown on failed connections

// Global cache for serverless environments (e.g. Vercel)
declare global {
  var _mongooseCache: { conn: typeof mongoose | null; promise: Promise<boolean> | null } | undefined;
}

if (!global._mongooseCache) {
  global._mongooseCache = { conn: null, promise: null };
}

// In Vercel serverless, /var/task is read-only, so use /tmp
const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isVercel
  ? path.resolve('/tmp', 'assignment_data')
  : path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'assignments.json');

// Memory fallback in case filesystem is completely locked
let memoryStore: AssignmentData[] = [];

// Safely normalize MongoDB URI with encoded credentials if needed
function normalizeMongoUri(rawUri: string): string {
  try {
    if (rawUri.startsWith('mongodb+srv://') || rawUri.startsWith('mongodb://')) {
      const prefix = rawUri.startsWith('mongodb+srv://') ? 'mongodb+srv://' : 'mongodb://';
      const rest = rawUri.slice(prefix.length);
      const atIndex = rest.lastIndexOf('@');
      if (atIndex !== -1) {
        const userPassPart = rest.slice(0, atIndex);
        const hostPart = rest.slice(atIndex + 1);
        const colonIndex = userPassPart.indexOf(':');
        if (colonIndex !== -1) {
          const rawUser = userPassPart.slice(0, colonIndex);
          const rawPass = userPassPart.slice(colonIndex + 1);
          // Safely decode then re-encode in case of special characters like @, :, #, %
          const cleanUser = encodeURIComponent(decodeURIComponent(rawUser));
          const cleanPass = encodeURIComponent(decodeURIComponent(rawPass));
          return `${prefix}${cleanUser}:${cleanPass}@${hostPart}`;
        }
      }
    }
  } catch {
    // If parsing fails, return original
  }
  return rawUri;
}

// Ensure data folder and file exist for local fallback
function ensureLocalStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const initialFile = path.resolve(process.cwd(), 'data', 'assignments.json');
      if (fs.existsSync(initialFile)) {
        try {
          fs.copyFileSync(initialFile, DATA_FILE);
          return;
        } catch {
          // fallback
        }
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (err) {
    // Suppress warning on read-only environments
  }
}

export function readLocalAssignments(): AssignmentData[] {
  ensureLocalStore();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as AssignmentData[];
      }
    }
  } catch {
    // Fall back to memory store
  }
  return memoryStore;
}

export function writeLocalAssignments(data: AssignmentData[]): void {
  memoryStore = data;
  ensureLocalStore();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // Stored in memoryStore
  }
}

export async function connectToDatabase(): Promise<boolean> {
  const rawUri = process.env.MONGODB_URI?.trim();

  if (!rawUri || rawUri.includes('localhost:27017')) {
    if (!rawUri) {
      return false;
    }
  }

  // Check cached connection for serverless
  if (global._mongooseCache?.conn && mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  // If connection failed recently (e.g. bad auth), don't hammer the database on every request
  const now = Date.now();
  if (lastFailureTime > 0 && now - lastFailureTime < RETRY_COOLDOWN_MS) {
    return false;
  }

  if (global._mongooseCache?.promise) {
    return global._mongooseCache.promise;
  }

  const normalizedUri = normalizeMongoUri(rawUri);

  const connectPromise = (async () => {
    try {
      mongoose.set('strictQuery', false);
      const conn = await mongoose.connect(normalizedUri, {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 4000,
        maxPoolSize: 10,
      });

      isConnected = conn.connection.readyState === 1;
      if (global._mongooseCache) {
        global._mongooseCache.conn = conn;
      }
      failureReason = null;
      isAuthFailure = false;
      console.log('Successfully connected to MongoDB database');
      return isConnected;
    } catch (err: any) {
      isConnected = false;
      lastFailureTime = Date.now();
      const msg = err?.message || String(err);
      failureReason = msg;

      if (msg.includes('bad auth') || msg.includes('authentication failed')) {
        isAuthFailure = true;
        console.warn(
          '[Database Notice] MongoDB authentication failed (bad auth). Using resilient local storage fallback until credentials are fixed in MONGODB_URI.'
        );
      } else {
        console.warn(
          '[Database Notice] MongoDB connection unavailable:',
          msg,
          'Using resilient local storage fallback.'
        );
      }

      if (global._mongooseCache) {
        global._mongooseCache.promise = null;
      }
      return false;
    }
  })();

  if (global._mongooseCache) {
    global._mongooseCache.promise = connectPromise;
  }

  return connectPromise;
}

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export function getDatabaseStatus() {
  return {
    connected: isMongoConnected(),
    type: isMongoConnected() ? 'mongodb' : 'local-storage',
    authFailed: isAuthFailure,
    error: failureReason,
  };
}
