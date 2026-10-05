import { GoogleGenAI, Type } from '@google/genai';
import { StructuredResponseSchema } from './validation.js';
import {
  AiEditAction,
  QuestionItem,
  StructuredAssignmentResponse,
} from '../types/assignment.js';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please check your environment variables.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface GenerateOptions {
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
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatParagraph(text: string): string {
  const escaped = escapeHtml(text);
  return escaped.replace(/\n\n+/g, '</p><p style="line-height: 1.7; margin-bottom: 0.85rem; color: #334155;">');
}

/**
 * Builds standard academic HTML document for the Tiptap editor
 */
export function buildEditorContentFromStructured(
  meta: GenerateOptions,
  structured: StructuredAssignmentResponse
): string {
  const univ = meta.universityName?.trim() || 'University of Peshawar';
  const dept = meta.department?.trim() || 'Department of Computer Science';
  const sem = meta.semester?.trim() || '3rd Semester';
  const logo = meta.logoUrl || '/university-logo.png';

  let html = `
<div class="assignment-document">
  <div class="assignment-header text-center" style="text-align: center; border-bottom: 2px solid #334155; padding-bottom: 1.25rem; margin-bottom: 1.5rem;">
    <div style="margin-bottom: 0.75rem;">
      <img src="${logo}" alt="${escapeHtml(univ)} Logo" style="max-height: 80px; max-width: 140px; margin: 0 auto; display: block; object-fit: contain;" />
    </div>
    <h1 style="margin: 0; font-size: 1.6rem; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.05em;">${escapeHtml(univ)}</h1>
    <p style="margin: 0.25rem 0 0 0; font-size: 1rem; font-weight: 600; color: #475569;">${escapeHtml(dept)}</p>
    <h2 style="margin: 0.75rem 0 0 0; font-size: 1.3rem; font-weight: 700; color: #1d4ed8; text-transform: uppercase;">Assignment No. ${escapeHtml(meta.assignmentNumber)}</h2>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem; border: 1px solid #cbd5e1;">
    <tbody>
      <tr style="background-color: #f8fafc;">
        <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; width: 25%;">Student Name:</td>
        <td style="padding: 8px 12px; border: 1px solid #cbd5e1; width: 25%;">${escapeHtml(meta.studentName)}</td>
        <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; width: 25%;">Roll Number:</td>
        <td style="padding: 8px 12px; border: 1px solid #cbd5e1; width: 25%;">${escapeHtml(meta.rollNumber)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold;">Subject / Course:</td>
        <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">${escapeHtml(meta.subject)}</td>
        <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold;">Submitted To:</td>
        <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">${escapeHtml(meta.submittedTo)}</td>
      </tr>
      <tr style="background-color: #f8fafc;">
        <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold;">Semester:</td>
        <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">${escapeHtml(sem)}</td>
        <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold;">Submission Date:</td>
        <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
      </tr>
    </tbody>
  </table>

  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 2rem 0;" />
`;

  structured.questions.forEach((q, idx) => {
    const qNum = idx + 1;
    html += `
  <section class="question-block" style="margin-bottom: 2.5rem;">
    <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-top: 1.5rem; margin-bottom: 0.5rem; border-left: 4px solid #2563eb; padding-left: 0.75rem;">
      Question ${qNum}: ${escapeHtml(q.question)}
    </h2>
    <h3 style="font-size: 1.1rem; font-weight: 600; color: #1e40af; margin-top: 1rem; margin-bottom: 0.5rem;">
      ${escapeHtml(q.title || 'Solution')}
    </h3>
`;

    if (q.introduction) {
      html += `<p style="line-height: 1.7; margin-bottom: 1rem; color: #334155;">${formatParagraph(q.introduction)}</p>`;
    }

    if (Array.isArray(q.sections)) {
      q.sections.forEach((sec) => {
        if (sec.heading) {
          html += `<h4 style="font-size: 1rem; font-weight: 600; color: #1e293b; margin-top: 1.25rem; margin-bottom: 0.35rem;">${escapeHtml(sec.heading)}</h4>`;
        }
        if (sec.content) {
          html += `<p style="line-height: 1.7; margin-bottom: 0.85rem; color: #334155;">${formatParagraph(sec.content)}</p>`;
        }
      });
    }

    if (Array.isArray(q.keyPoints) && q.keyPoints.length > 0) {
      html += `<p style="font-weight: 600; color: #1e293b; margin-top: 1rem; margin-bottom: 0.25rem;">Key Takeaways & Summary:</p><ul>`;
      q.keyPoints.forEach((pt) => {
        html += `<li style="line-height: 1.6; margin-bottom: 0.25rem; color: #334155;">${escapeHtml(pt)}</li>`;
      });
      html += `</ul>`;
    }

    if (q.conclusion) {
      html += `
    <blockquote style="border-left: 3px solid #94a3b8; padding: 0.75rem 1rem; margin: 1.25rem 0; font-style: italic; color: #475569; background-color: #f8fafc;">
      <strong>Conclusion:</strong> ${escapeHtml(q.conclusion)}
    </blockquote>`;
    }

    html += `</section>`;
  });

  html += `</div>`;
  return html;
}

const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.8-flash',
];

function parseErrorMessage(err: any): string {
  if (!err) return 'An unknown error occurred';
  const msg = err.message || String(err);
  try {
    const parsed = JSON.parse(msg);
    if (parsed.error && parsed.error.message) {
      return parsed.error.message;
    }
  } catch {
    // Not JSON
  }
  return msg;
}

function cleanUserFriendlyError(raw: string): string {
  if (!raw) return 'The AI service is temporarily unavailable. Please try again.';
  const retryMatch = raw.match(/retry in ([0-9.]+)s/i);
  if (retryMatch) {
    const seconds = Math.ceil(parseFloat(retryMatch[1]));
    return `Free-tier quota limit reached. Please wait ~${seconds}s and click Try Again.`;
  }
  if (
    raw.toLowerCase().includes('high demand') ||
    raw.includes('503') ||
    raw.includes('UNAVAILABLE') ||
    raw.toLowerCase().includes('the page c')
  ) {
    return 'The AI service is experiencing a temporary surge in traffic. Please wait a moment and click Try Again.';
  }
  return raw;
}

/**
 * Executes a Gemini API call with fast model fallback to stay well within gateway timeout
 */
async function callGeminiWithResilience<T>(
  actionName: string,
  fn: (model: string) => Promise<T>
): Promise<T> {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      // 22-second timeout per model so total time stays well under Cloud Run 60s gateway timeout
      let timeoutHandle: any;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(`Request timed out on ${model}`)), 22000);
      });

      const result = await Promise.race([fn(model), timeoutPromise]);
      clearTimeout(timeoutHandle);
      return result;
    } catch (err: any) {
      lastError = err;
      const msg = parseErrorMessage(err);
      console.warn(`[AI ${actionName}] Attempt on model "${model}" failed: ${msg}. Switching to next candidate model...`);
      // Immediately try next model in the pool
      continue;
    }
  }

  const finalMsg = parseErrorMessage(lastError);
  throw new Error(cleanUserFriendlyError(finalMsg));
}

/**
 * Generate humanized, structured academic assignment using Gemini
 */
export async function generateAssignmentContent(
  options: GenerateOptions
): Promise<{ structured: StructuredAssignmentResponse; html: string }> {
  const ai = getGeminiClient();

  const questionsList = options.questions
    .map((q, idx) => `Question ${idx + 1}: ${q.question}`)
    .join('\n\n');

  const lengthInstructions = {
    short: 'Concise and focused. Explain the essential concept and key mechanics directly without fluff (approx. 250-400 words per question).',
    medium: 'Balanced university assignment. Include thorough explanations, practical code or mathematical examples, and key implications (approx. 500-750 words per question).',
    long: 'Comprehensive academic depth. Include detailed conceptual breakdown, comparative analysis, multiple concrete examples, and analytical discussion (approx. 800-1200 words per question).',
  }[options.answerLength || 'medium'];

  const difficultyInstructions = {
    simple: 'Clear, approachable, conversational student English with intuitive everyday analogies.',
    normal: 'Undergraduate university standard: rigorous, technically accurate, clear, and authentic.',
    advanced: 'Graduate/advanced academic standard: deep theoretical precision, algorithmic analysis, and critical evaluation.',
  }[options.difficulty || 'normal'];

  const prompt = `
Institution: ${options.universityName || 'University of Peshawar'}
Department: ${options.department || 'Department of Computer Science'}
Subject / Course: ${options.subject}
Assignment Number: ${options.assignmentNumber}
Level / Semester: ${options.semester || '3rd Semester'}
Target Length: ${options.answerLength || 'medium'} (${lengthInstructions})
Target Difficulty: ${options.difficulty || 'normal'} (${difficultyInstructions})

Additional Instructions from Student/Instructor:
${options.instructions ? options.instructions : 'Focus on providing direct, insightful, and authentic explanations.'}

Assignment Questions to Answer:
${questionsList}

Provide structured academic answers for each question matching the schema exactly.
`;

  // Explicit Humanization and Anti-AI Slop Constitution
  const systemInstruction = `You are a high-achieving university student and academic peer mentor writing an outstanding coursework assignment.

CRITICAL HUMANIZATION & ANTI-AI SLOP RULES:
1. SOUND NATURAL & AUTHENTIC: Write in clear, confident, student-written English. Never write like a generic corporate AI chatbot or Wikipedia summary.
2. STRICTLY FORBIDDEN AI BUZZWORDS & CLICHÉS:
   - NEVER use words or phrases like: "delve into", "in today's fast-paced digital world", "a testament to", "tapestry", "in the realm of", "it is crucial to remember", "it is worth noting that", "furthermore", "moreover", "in conclusion, it can be seen that", "pivotal role", "beacon of", "seamlessly", "game-changer", "navigating the complexities", "a multifaceted concept".
3. CONCRETE & GROUNDED MECHANICS:
   - Provide concrete numbers, realistic code snippets (in Python, C++, Java, or pseudo-code where relevant), step-by-step algorithms, or specific formulas instead of vague generalities.
   - For example, if explaining Big O notation, explain what happens to operation counts when input size n doubles (e.g. O(n) goes from 1,000 to 2,000 operations, whereas O(n^2) leaps from 1,000,000 to 4,000,000 operations).
4. HUMAN SENTENCE RHYTHM (BURSTINESS):
   - Vary your sentence structures. Combine short punchy observations with well-reasoned explanations. Avoid monotone paragraphs of identical length.
5. ACADEMIC STRUCTURE:
   - Direct, informative title.
   - Introduction that directly defines the core problem or concept.
   - Detailed explanatory sections with descriptive headings.
   - Practical real-world or computational example.
   - Key takeaways highlighting actual practical trade-offs.
   - Thoughtful concluding paragraph.
6. OUTPUT: Return strictly valid JSON matching the requested schema.`;

  return await callGeminiWithResilience('generateAssignmentContent', async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.35,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: 'The exact question being answered' },
                  title: { type: Type.STRING, description: 'Clear, authentic academic title' },
                  introduction: { type: Type.STRING, description: 'Direct, clear introductory explanation' },
                  sections: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        heading: { type: Type.STRING, description: 'Descriptive sub-heading' },
                        content: { type: Type.STRING, description: 'Detailed, concrete explanation with examples or logic' },
                      },
                      required: ['heading', 'content'],
                    },
                  },
                  conclusion: { type: Type.STRING, description: 'Natural conclusion and practical implications' },
                  keyPoints: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Bullet points highlighting core takeaways and trade-offs',
                  },
                },
                required: ['question', 'title', 'sections'],
              },
            },
          },
          required: ['questions'],
        },
      },
    });

    const rawText = response.text || '';
    if (!rawText.trim()) {
      throw new Error('Empty response received from AI model.');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const cleaned = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    const validated = StructuredResponseSchema.safeParse(parsed);
    if (!validated.success) {
      console.warn('Zod validation warning, normalizing questions:', validated.error);
      const fallbackQuestions = (parsed?.questions || options.questions).map((q: any, idx: number) => ({
        question: q.question || options.questions[idx]?.question || `Question ${idx + 1}`,
        title: q.title || `Solution to Question ${idx + 1}`,
        introduction: q.introduction || '',
        sections: Array.isArray(q.sections)
          ? q.sections
          : [{ heading: 'Conceptual Overview', content: typeof q.answer === 'string' ? q.answer : JSON.stringify(q) }],
        conclusion: q.conclusion || '',
        keyPoints: Array.isArray(q.keyPoints) ? q.keyPoints : [],
      }));
      const structuredFallback: StructuredAssignmentResponse = { questions: fallbackQuestions };
      const html = buildEditorContentFromStructured(options, structuredFallback);
      return { structured: structuredFallback, html };
    }

    const structured = validated.data as StructuredAssignmentResponse;
    const html = buildEditorContentFromStructured(options, structured);

    return { structured, html };
  });
}

/**
 * Execute AI editing actions on selected or provided text
 */
export async function executeAiEdit(params: {
  action: AiEditAction;
  text: string;
  context?: string;
}): Promise<string> {
  const ai = getGeminiClient();

  const actionPrompts: Record<AiEditAction, string> = {
    humanize:
      'Rewrite this text to sound completely human, natural, and student-written. Remove all AI cliches, robotic transitions (like furthermore, moreover, delve into, testament to, in the realm of), and passive corporate phrasing. Use direct, clear, genuine student language with varied sentence rhythm.',
    improve:
      'Improve the clarity, logical structure, and academic quality of this text while maintaining an authentic, natural student voice.',
    simplify:
      'Explain this concept in plain, student-friendly terms with an intuitive real-world analogy, cutting unnecessary jargon.',
    expand:
      'Add substantial academic depth, concrete step-by-step mechanics, and a realistic technical example or calculation.',
    shorten:
      'Condense this to its core essential takeaway without losing technical accuracy or clarity.',
    grammar:
      'Fix all grammar, spelling, punctuation, and phrasing issues while keeping the student voice authentic.',
    formal:
      'Rewrite in a polished, scholarly academic tone suitable for university submission, avoiding casual colloquialisms.',
    example:
      'Add a concrete, realistic real-world or algorithmic example that illustrates the concept with exact numbers or code.',
    regenerate:
      'Rewrite this section completely fresh with an engaging, original, human academic perspective.',
  };

  const instruction = actionPrompts[params.action] || 'Revise this academic text to sound authentic and clear.';

  const prompt = `
Task: ${instruction}

Original Text:
"""
${params.text}
"""

${params.context ? `Context of Assignment: ${params.context}\n` : ''}

CRITICAL RULES:
- Output ONLY the revised text.
- Do NOT include conversational filler like "Here is your revised text:" or quotes around the result.
- Strictly avoid robotic AI clichés ("delve into", "testament to", "furthermore", "moreover").
- Maintain authentic academic quality.
`;

  return await callGeminiWithResilience('executeAiEdit', async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.35,
      },
    });

    const result = response.text?.trim() || '';
    if (!result) {
      throw new Error('AI returned an empty response for editing.');
    }

    return result.replace(/^"+|"+$/g, '').trim();
  });
}
