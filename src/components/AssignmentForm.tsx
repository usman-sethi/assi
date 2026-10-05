import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  BookOpen,
  User,
  GraduationCap,
  Sliders,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Upload,
  RotateCcw,
  Image as ImageIcon,
} from 'lucide-react';
import { AssignmentData, QuestionItem } from '../types/assignment.js';

interface AssignmentFormProps {
  onGenerated: (assignment: AssignmentData) => void;
  onCancel?: () => void;
}

export const AssignmentForm: React.FC<AssignmentFormProps> = ({ onGenerated, onCancel }) => {
  // Form fields
  const [studentName, setStudentName] = useState('Usman Sethi');
  const [rollNumber, setRollNumber] = useState('23');
  const [assignmentNumber, setAssignmentNumber] = useState('01');
  const [department, setDepartment] = useState('Department of Computer Science');
  const [semester, setSemester] = useState('3rd');

  const [universityName, setUniversityName] = useState('University of Peshawar');
  const [logoUrl, setLogoUrl] = useState<string>('/university-logo.png');
  const [subject, setSubject] = useState('Data Structures');
  const [submittedTo, setSubmittedTo] = useState('Dr. Ahmed');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [questions, setQuestions] = useState<QuestionItem[]>([
    {
      id: 'q_1',
      question: 'Explain Big O notation and why it is important in algorithm analysis.',
      answer: '',
    },
  ]);

  const [instructions, setInstructions] = useState('');
  const [answerLength, setAnswerLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [difficulty, setDifficulty] = useState<'simple' | 'normal' | 'advanced'>('normal');

  // Loading & status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Logo file size must be less than 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (typeof uploadEvent.target?.result === 'string') {
        setLogoUrl(uploadEvent.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setLogoUrl('/university-logo.png');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: `q_${Date.now().toString(36)}`,
        question: '',
        answer: '',
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, val: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], question: val };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);

    // Basic client validation
    if (!studentName.trim()) {
      setError('Please provide the student name.');
      return;
    }
    if (!rollNumber.trim()) {
      setError('Please provide the roll number.');
      return;
    }
    if (!assignmentNumber.trim()) {
      setError('Please provide the assignment number.');
      return;
    }
    if (!subject.trim()) {
      setError('Please provide the subject.');
      return;
    }
    if (!submittedTo.trim()) {
      setError('Please provide instructor name in "Submitted To".');
      return;
    }

    const validQuestions = questions.filter((q) => q.question.trim().length > 0);
    if (validQuestions.length === 0) {
      setError('Please enter at least one assignment question.');
      return;
    }

    setIsSubmitting(true);
    setCurrentStep('Sending prompt to Gemini AI...');

    try {
      // 1. Generate structured content with Gemini
      const genResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          rollNumber,
          assignmentNumber,
          department,
          semester,
          universityName,
          logoUrl,
          subject,
          submittedTo,
          questions: validQuestions,
          instructions,
          answerLength,
          difficulty,
        }),
      });

      const genData = await genResponse.json();
      if (!genResponse.ok) {
        throw new Error(genData.error || 'Failed to generate assignment answer');
      }

      setCurrentStep('Formatting academic document & saving...');

      // 2. Save new assignment to database / store
      const saveResponse = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          rollNumber,
          assignmentNumber,
          department,
          semester,
          universityName,
          logoUrl,
          subject,
          submittedTo,
          questions: validQuestions,
          instructions,
          answerLength,
          difficulty,
          editorContent: genData.html,
        }),
      });

      const savedAssignment = await saveResponse.json();
      if (!saveResponse.ok) {
        throw new Error(savedAssignment.error || 'Failed to persist assignment');
      }

      setCurrentStep('Opening interactive document editor...');
      setTimeout(() => {
        onGenerated(savedAssignment);
      }, 300);
    } catch (err: any) {
      console.error('Submission failed:', err);
      setError(err.message || 'An unexpected error occurred during generation.');
      setIsSubmitting(false);
      setCurrentStep('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8">
        {/* Title */}
        <div className="border-b border-slate-200 pb-5 mb-6">
          <div className="flex items-center space-x-2 text-blue-600 mb-1">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">New Academic Assignment</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Create &amp; Generate Assignment</h2>
          <p className="text-sm text-slate-500 mt-1">
            Fill in student details, questions, and parameters. Gemini AI generates a structured solution ready for editing and Word (.docx) export.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Generation Error:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Student Information */}
          <div className="bg-slate-50/70 p-4 sm:p-5 rounded-lg border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center mb-4">
              <User className="w-4 h-4 mr-2 text-blue-600" />
              1. Student Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Usman Sethi"
                  className="w-full text-sm p-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Roll Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. 23"
                  className="w-full text-sm p-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assignment No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={assignmentNumber}
                  onChange={(e) => setAssignmentNumber(e.target.value)}
                  placeholder="e.g. 01"
                  className="w-full text-sm p-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Department of Computer Science"
                  className="w-full text-sm p-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Semester
                </label>
                <input
                  type="text"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="e.g. 3rd Semester"
                  className="w-full text-sm p-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Academic Information & University Logo */}
          <div className="bg-slate-50/70 p-4 sm:p-5 rounded-lg border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center mb-4">
              <GraduationCap className="w-4 h-4 mr-2 text-blue-600" />
              2. Academic Course &amp; University Logo
            </h3>

            {/* University Logo Selector */}
            <div className="mb-5 p-3.5 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center p-1 overflow-hidden flex-shrink-0 shadow-2xs">
                <img
                  src={logoUrl || '/university-logo.png'}
                  alt="University Crest Preview"
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start space-x-2">
                  <span className="text-xs font-bold text-slate-800">University Crest / Logo</span>
                  {logoUrl === '/university-logo.png' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      University of Peshawar (Default)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  This logo will be embedded on the document cover page and in the exported Word (.docx) file.
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload-input"
                  />
                  <label
                    htmlFor="logo-upload-input"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium cursor-pointer transition-colors border border-slate-300"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upload Custom Logo</span>
                  </label>

                  {logoUrl !== '/university-logo.png' && (
                    <button
                      type="button"
                      onClick={handleResetLogo}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-medium transition-colors"
                      title="Reset back to University of Peshawar default logo"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      <span>Reset to Peshawar Logo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  University / College Name
                </label>
                <input
                  type="text"
                  value={universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                  placeholder="e.g. University of Peshawar"
                  className="w-full text-sm p-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject / Course <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms"
                  className="w-full text-sm p-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Submitted To (Instructor) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={submittedTo}
                  onChange={(e) => setSubmittedTo(e.target.value)}
                  placeholder="e.g. Dr. Ahmed"
                  className="w-full text-sm p-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Assignment Questions */}
          <div className="bg-slate-50/70 p-4 sm:p-5 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center">
                <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
                3. Assignment Questions ({questions.length})
              </h3>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md border border-blue-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div key={q.id || idx} className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Question {idx + 1} <span className="text-red-500">*</span>
                    </label>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded"
                        title="Remove question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={q.question}
                    onChange={(e) => handleQuestionChange(idx, e.target.value)}
                    placeholder="e.g. Explain Big O notation and why it is important in algorithm analysis."
                    className="w-full text-sm p-2.5 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: AI Parameters & Options */}
          <div className="bg-slate-50/70 p-4 sm:p-5 rounded-lg border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center mb-4">
              <Sliders className="w-4 h-4 mr-2 text-blue-600" />
              4. AI Answer Configuration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Desired Answer Length
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['short', 'medium', 'long'] as const).map((len) => (
                    <button
                      key={len}
                      type="button"
                      onClick={() => setAnswerLength(len)}
                      className={`py-2 px-3 text-xs font-semibold rounded-md border capitalize transition-all ${
                        answerLength === len
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {len}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {answerLength === 'short' && '200-350 words: core definitions & main points.'}
                  {answerLength === 'medium' && '400-650 words: comprehensive explanation & key examples.'}
                  {answerLength === 'long' && '700-1100 words: in-depth academic breakdown with sections.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Writing Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['simple', 'normal', 'advanced'] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-2 px-3 text-xs font-semibold rounded-md border capitalize transition-all ${
                        difficulty === diff
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {difficulty === 'simple' && 'Student-friendly language with straightforward terms.'}
                  {difficulty === 'normal' && 'Standard university undergraduate tone.'}
                  {difficulty === 'advanced' && 'Rigorous theoretical phrasing and analytical depth.'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Optional Instructor Instructions
              </label>
              <textarea
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Include a comparative table between time vs space complexity, and provide pseudo-code examples."
                className="w-full text-sm p-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:w-auto ml-auto flex items-center justify-center space-x-2 px-8 py-3 rounded-lg font-bold text-sm text-white transition-all shadow-md ${
                isSubmitting
                  ? 'bg-blue-400 cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{currentStep || 'Generating Assignment...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Assignment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
