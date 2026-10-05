import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  CreateAssignmentInputSchema,
  GenerateRequestSchema,
  AiEditRequestSchema,
  UpdateAssignmentSchema,
} from './src/lib/validation.js';
import { generateAssignmentContent, executeAiEdit } from './src/lib/ai.js';
import {
  createAssignment,
  findAssignmentById,
  findAllAssignments,
  updateAssignmentById,
  deleteAssignmentById,
} from './src/models/Assignment.js';
import { generateDocxDocument } from './src/lib/docx.js';
import { connectToDatabase, isMongoConnected } from './src/lib/mongodb.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parsing middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Initial attempt to connect to MongoDB in background
connectToDatabase().catch((err) => {
  console.warn('Initial MongoDB connection warning (will use local fallback):', err.message);
});

// Health & System status endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    database: isMongoConnected() ? 'mongodb' : 'local-storage',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// 1. Generate Assignment via Gemini AI
app.post('/api/generate', async (req: Request, res: Response) => {
  try {
    const parseResult = GenerateRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { structured, html } = await generateAssignmentContent(parseResult.data);

    return res.json({
      success: true,
      structured,
      html,
    });
  } catch (err: any) {
    console.error('Error generating assignment:', err);
    return res.status(500).json({
      error: err.message || 'Failed to generate assignment',
    });
  }
});

// 2. AI Edit Actions
app.post('/api/ai-edit', async (req: Request, res: Response) => {
  try {
    const parseResult = AiEditRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { action, text, context } = parseResult.data;
    const resultText = await executeAiEdit({ action, text, context });

    return res.json({
      success: true,
      action,
      originalText: text,
      resultText,
    });
  } catch (err: any) {
    console.error('Error executing AI edit:', err);
    return res.status(500).json({
      error: err.message || 'Failed to execute AI edit',
    });
  }
});

// 3. Create / Save new Assignment
app.post('/api/assignments', async (req: Request, res: Response) => {
  try {
    const parseResult = CreateAssignmentInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const newAssignment = await createAssignment(parseResult.data);
    return res.status(201).json(newAssignment);
  } catch (err: any) {
    console.error('Error saving assignment:', err);
    return res.status(500).json({
      error: err.message || 'Failed to save assignment',
    });
  }
});

// 4. List all assignments
app.get('/api/assignments', async (req: Request, res: Response) => {
  try {
    const assignments = await findAllAssignments();
    return res.json(assignments);
  } catch (err: any) {
    console.error('Error fetching assignments:', err);
    return res.status(500).json({
      error: err.message || 'Failed to fetch assignments',
    });
  }
});

// 5. Get assignment by ID
app.get('/api/assignments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await findAssignmentById(id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    return res.json(assignment);
  } catch (err: any) {
    console.error('Error fetching assignment by ID:', err);
    return res.status(500).json({
      error: err.message || 'Failed to fetch assignment',
    });
  }
});

// 6. Update assignment by ID (Save / Autosave)
app.put('/api/assignments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = UpdateAssignmentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const updated = await updateAssignmentById(id, parseResult.data);
    if (!updated) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    return res.json(updated);
  } catch (err: any) {
    console.error('Error updating assignment:', err);
    return res.status(500).json({
      error: err.message || 'Failed to update assignment',
    });
  }
});

// 7. Delete assignment by ID
app.delete('/api/assignments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteAssignmentById(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Assignment not found or already deleted' });
    }
    return res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting assignment:', err);
    return res.status(500).json({
      error: err.message || 'Failed to delete assignment',
    });
  }
});

// 8. Export DOCX
app.post('/api/export', async (req: Request, res: Response) => {
  try {
    let assignment = req.body;

    // If only an ID was provided, fetch the full assignment record
    if (req.body.id && !req.body.studentName) {
      const found = await findAssignmentById(req.body.id);
      if (!found) {
        return res.status(404).json({ error: 'Assignment not found for export' });
      }
      assignment = found;
    }

    if (!assignment.studentName || !assignment.subject) {
      return res.status(400).json({ error: 'Missing required assignment fields for export' });
    }

    const docxBuffer = await generateDocxDocument(assignment);

    // Sanitize filename
    const sanitizedSubject = (assignment.subject || 'Assignment')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 35);
    const sanitizedNum = (assignment.assignmentNumber || '01').replace(/[^a-zA-Z0-9]/g, '');
    const filename = `${sanitizedSubject}-Assignment-${sanitizedNum}.docx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', docxBuffer.length);

    return res.send(docxBuffer);
  } catch (err: any) {
    console.error('Error exporting DOCX:', err);
    return res.status(500).json({
      error: err.message || 'Failed to export DOCX document',
    });
  }
});

// Serve frontend: Vite in development, static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({
      error: 'An internal server error occurred',
      message: err?.message || 'Unknown error',
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Assignment Generator Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
