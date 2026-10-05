import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { EditorToolbar } from './EditorToolbar.js';
import { AIControls } from './AIControls.js';
import { AutosaveIndicator } from './AutosaveIndicator.js';
import { ExportButton } from './ExportButton.js';
import { AssignmentData } from '../types/assignment.js';
import { ArrowLeft, Save, Building2, User, BookOpen, Calendar } from 'lucide-react';

interface AssignmentEditorProps {
  initialAssignment: AssignmentData;
  onBack: () => void;
  onUpdate: (updated: AssignmentData) => void;
}

export const AssignmentEditor: React.FC<AssignmentEditorProps> = ({
  initialAssignment,
  onBack,
  onUpdate,
}) => {
  const [assignment, setAssignment] = useState<AssignmentData>(initialAssignment);
  const [selectedText, setSelectedText] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(new Date(initialAssignment.updatedAt));
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Underline,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: assignment.editorContent || '',
    editorProps: {
      attributes: {
        class:
          'prose prose-slate max-w-none focus:outline-none min-h-[480px] p-8 text-slate-800 leading-relaxed',
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      const html = activeEditor.getHTML();
      setSaveStatus('unsaved');

      // Update local assignment state
      setAssignment((prev) => ({
        ...prev,
        editorContent: html,
      }));

      // Trigger debounced autosave
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        handleSave(html);
      }, 1500);
    },
    onSelectionUpdate: ({ editor: activeEditor }) => {
      const { from, to } = activeEditor.state.selection;
      if (from !== to) {
        const text = activeEditor.state.doc.textBetween(from, to, ' ');
        setSelectedText(text);
      } else {
        setSelectedText('');
      }
    },
  });

  // Save changes to API
  const handleSave = useCallback(
    async (contentToSave?: string) => {
      const currentId = assignment.id || assignment._id;
      if (!currentId) return;

      const html = contentToSave !== undefined ? contentToSave : editor ? editor.getHTML() : assignment.editorContent;

      setSaveStatus('saving');
      setSaveError(undefined);

      try {
        const res = await fetch(`/api/assignments/${currentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            editorContent: html,
            studentName: assignment.studentName,
            rollNumber: assignment.rollNumber,
            assignmentNumber: assignment.assignmentNumber,
            subject: assignment.subject,
            submittedTo: assignment.submittedTo,
            department: assignment.department,
            semester: assignment.semester,
            universityName: assignment.universityName,
            logoUrl: assignment.logoUrl,
          }),
        });

        const rawText = await res.text();
        let updatedData: any = null;
        try {
          updatedData = JSON.parse(rawText);
        } catch {
          if (!res.ok) {
            throw new Error(`Autosave failed (${res.status})`);
          }
        }

        if (!res.ok) {
          throw new Error(updatedData?.error || 'Failed to autosave');
        }

        if (updatedData) {
          setAssignment(updatedData);
          onUpdate(updatedData);
        }
        setSaveStatus('saved');
        setLastSavedAt(new Date());
      } catch (err: any) {
        console.error('Save error:', err);
        setSaveStatus('error');
        setSaveError(err.message || 'Saving failed');
      }
    },
    [assignment, editor, onUpdate]
  );

  // Apply AI replacement back to the editor selection
  const handleApplyReplacement = (newText: string) => {
    if (!editor) return;

    if (selectedText) {
      editor.chain().focus().insertContent(newText).run();
      setSelectedText('');
    } else {
      // Append at current cursor position
      editor.chain().focus().insertContent(`<p>${newText}</p>`).run();
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top action bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={onBack}
              className="flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <AutosaveIndicator
              status={saveStatus}
              lastSavedAt={lastSavedAt}
              errorMessage={saveError}
              onRetry={() => handleSave()}
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => handleSave()}
              disabled={saveStatus === 'saving'}
              className="flex items-center space-x-1.5 px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>Save Now</span>
            </button>

            <ExportButton assignment={assignment} />
          </div>
        </div>
      </div>

      {/* Editor & AI Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Paper / Document Area (Left 8 cols) */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="bg-white border border-slate-300 rounded-t-lg shadow-sm">
              <EditorToolbar editor={editor} />
            </div>

            {/* Document "Paper" sheet */}
            <div className="bg-white border-x border-b border-slate-300 rounded-b-lg shadow-md min-h-[700px] flex flex-col">
              {/* Visual Cover/Header info card */}
              <div className="p-6 bg-slate-50/60 border-b border-slate-200 text-xs text-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <img
                      src={assignment.logoUrl || '/university-logo.png'}
                      alt="University Crest"
                      className="w-12 h-12 object-contain rounded-md border border-slate-300 bg-white p-1"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm tracking-wide uppercase">
                        {assignment.universityName || 'University / Institution'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {assignment.department || 'Academic Department'} &bull; Semester {assignment.semester || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-blue-700 text-xs px-2.5 py-1 bg-blue-100/70 rounded border border-blue-200">
                    Assignment #{assignment.assignmentNumber}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/80">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Student</span>
                    <span className="font-medium text-slate-800">{assignment.studentName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Roll No</span>
                    <span className="font-medium text-slate-800">{assignment.rollNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Subject</span>
                    <span className="font-medium text-slate-800">{assignment.subject}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Submitted To</span>
                    <span className="font-medium text-slate-800">{assignment.submittedTo}</span>
                  </div>
                </div>
              </div>

              {/* Tiptap Editor Canvas */}
              <div className="flex-1 bg-white">
                <EditorContent editor={editor} />
              </div>
            </div>
          </div>

          {/* Right Sidebar: AI Controls & Quick Context (Right 4 cols) */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-36">
            <AIControls
              selectedText={selectedText}
              onApplyReplacement={handleApplyReplacement}
              assignmentContext={`Subject: ${assignment.subject}, Topic: ${assignment.questions?.map((q) => q.question).join('; ')}`}
            />

            {/* Assignment Questions List Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs text-xs">
              <h4 className="font-semibold text-slate-800 mb-2 flex items-center">
                <BookOpen className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                Assignment Questions ({assignment.questions?.length || 0})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {assignment.questions?.map((q, idx) => (
                  <div key={q.id || idx} className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="font-bold text-blue-700 block mb-0.5">Q{idx + 1}:</span>
                    <p className="text-slate-700 leading-snug">{q.question}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
