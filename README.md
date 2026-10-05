# AI Academic Assignment Generator & DOCX Exporter

A full-stack web application designed for students and educators to generate structured, curriculum-aligned academic assignments using Google Gemini AI, refine them within an interactive rich-text editor with AI assistance, and export complete, publication-ready Microsoft Word (`.docx`) documents.

---

## 1. What the Project Does

- **Academic Assignment Generation**: Enter student profile details (Name, Roll Number, Assignment Number, Department, Semester, University, Subject, Instructor) and one or more assignment questions.
- **Configurable AI Generation**: Tailor answers by length (Short, Medium, Long) and academic difficulty (Simple, Normal, Advanced).
- **Structured Academic Answers**: Gemini AI produces clean, structured solutions with Introductions, Sub-sections, Key Points, Comparisons, and Conclusions.
- **Interactive Document Editor**: Powered by Tiptap with full formatting toolbar (Headings H1-H3, Bold, Italic, Underline, Bullet Lists, Numbered Lists, Blockquotes, and Tables).
- **AI-Powered Inline Editing**: Select or provide text to apply targeted revisions:
  - *Improve Flow*
  - *Simplify*
  - *Expand Details*
  - *Shorten*
  - *Fix Grammar*
  - *Make Formal*
  - *Add Example*
  - *Regenerate*
  With safe **Accept / Reject** review before applying changes.
- **Autosave & Persistence**: Continuously saves edits to MongoDB (with zero-config local storage fallback). Preserves edits across page reloads.
- **Professional DOCX Export**: Converts the assignment—including institutional header, university logo, student metadata table, formatted questions, lists, and tables—into a genuine `.docx` Word document.

---

## 2. Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Document Editor**: Tiptap (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-table`, `@tiptap/extension-underline`)
- **Backend & Server**: Node.js, Express, TSX
- **AI Model**: Google Gemini API via official `@google/genai` TypeScript SDK (`gemini-3.8-flash`)
- **Document Generation**: `docx` npm library (binary `.docx` packaging)
- **Validation**: Zod (runtime validation for API requests and AI structured JSON)
- **Database / Persistence**: MongoDB with Mongoose + automatic local file fallback

---

## 3. Installation

Clone or open the project directory and install all dependencies:

```bash
npm install
```

---

## 4. Environment Variables

Create a `.env` file in the root directory:

```env
# Gemini API Key (Required for AI generation)
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB Connection String (Optional - falls back to local data store if omitted or offline)
MONGODB_URI=mongodb://localhost:27017/assignment_generator

# Port (Defaults to 3000)
PORT=3000
```

Refer to `.env.example` for details.

---

## 5. MongoDB Setup

1. If you have MongoDB installed locally or an Atlas connection string, set `MONGODB_URI` in `.env`.
2. **Resilient Fallback**: If MongoDB is unavailable, disconnected, or unconfigured, the system automatically uses a persistent local JSON store in `./data/assignments.json` without failing or crashing.

---

## 6. Gemini API Setup

1. Obtain an API key from Google AI Studio: [https://aistudio.google.com/](https://aistudio.google.com/)
2. Assign it to `GEMINI_API_KEY` in `.env`. In Google AI Studio Build, this key is automatically injected via the Secrets panel.
3. The server uses the modern `@google/genai` SDK with the fast, capable `gemini-3.8-flash` model. All keys remain strictly on the backend.

---

## 7. Running Locally

Start the full-stack development server:

```bash
npm run dev
```

The application will be accessible at:
```
http://localhost:3000
```

---

## 8. Building for Production

Compile client assets and run the production server:

```bash
npm run build
npm start
```

---

## 9. Project Architecture

```text
├── .env.example              # Example environment configuration
├── server.ts                 # Full-stack Express server + API endpoints
├── public/
│   └── university-logo.png   # Academic institutional crest for DOCX & cover
├── data/
│   └── assignments.json      # Resilient local persistence store
└── src/
    ├── types/
    │   └── assignment.ts     # Assignment, question, and AI data models
    ├── lib/
    │   ├── ai.ts             # Gemini SDK client, generation, and AI edits
    │   ├── docx.ts           # Native Word (.docx) document generator
    │   ├── mongodb.ts        # Database connection & fallback storage manager
    │   └── validation.ts     # Zod validation schemas
    ├── models/
    │   └── Assignment.ts     # Mongoose schema + unified repository methods
    ├── components/
    │   ├── Navbar.tsx            # Navigation header & active status
    │   ├── Dashboard.tsx         # Recent assignments & summary statistics
    │   ├── AssignmentForm.tsx    # Multi-section creation form with questions
    │   ├── AssignmentEditor.tsx  # Tiptap rich-text editor + autosave
    │   ├── EditorToolbar.tsx     # Rich text & table formatting controls
    │   ├── AIControls.tsx        # AI editing suite with Accept/Reject preview
    │   ├── ExportButton.tsx      # Native DOCX downloader
    │   └── AutosaveIndicator.tsx # Visual save status indicator
    ├── App.tsx               # Main routing & state coordinator
    ├── main.tsx              # React DOM entry point
    └── index.css             # Tailwind CSS & academic typography styles
```

---

## 10. DOCX Export Implementation

The Word export is implemented in `src/lib/docx.ts`:

1. **Header & Logo**: Reads `public/university-logo.png` into an `ImageRun` maintaining aspect ratio, paired with the uppercase institutional title.
2. **Academic Metadata Grid**: Generates a two-column bordered table containing Student Name, Roll Number, Subject, Instructor, Semester, and Submission Date.
3. **HTML to DOCX AST Parser**: Recursively extracts elements from Tiptap's HTML:
   - `<h1>` - `<h4>` mapped to Word `HeadingLevel.HEADING_1` through `HEADING_4`
   - `<ul>` / `<ol>` / `<li>` converted into native bullet points
   - `<blockquote>` converted into indented italicized quote paragraphs
   - `<table>`, `<tr>`, `<td>`, `<th>` converted into native Word `Table` structures with shaded headers
   - Inline formatting (`<b>`, `<strong>`, `<i>`, `<em>`, `<u>`) preserved inside `TextRun`s
4. **Header/Footer & Pagination**: Injects dynamic page numbering (`Page X of Y`) into document footers.
5. **Direct Binary Stream**: Returns a valid `.docx` OpenXML package buffer with `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`.

---

## Verification Test Scenario

1. **Student Details**:
   - Name: `Usman Sethi`
   - Roll No: `23`
   - Assignment No: `01`
   - Subject: `Data Structures`
   - Submitted To: `Dr. Ahmed`
   - Department: `Software Engineering`
   - Semester: `3rd`
2. **Question**:
   - `Explain Big O notation and why it is important in algorithm analysis.`
3. **Click Generate**:
   - Gemini produces structured sections (Definition, Time vs. Space, Big O Classes, Practical Example, Conclusion).
4. **Edit & Refine**:
   - Highlight any sentence, click **Fix Grammar** or **Add Example**, review the suggested text, and click **Accept & Replace**.
5. **Autosave & Refresh**:
   - Changes automatically save. Refresh the page to verify persistence.
6. **Export**:
   - Click **Export DOCX** to download `Data_Structures-Assignment-01.docx`.
