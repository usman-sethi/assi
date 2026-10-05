import React, { useEffect, useState } from 'react';
import {
  FileText,
  PlusCircle,
  Clock,
  Trash2,
  Edit3,
  ExternalLink,
  BookOpen,
  User,
  GraduationCap,
  Sparkles,
  Download,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { AssignmentData } from '../types/assignment.js';
import { ExportButton } from './ExportButton.js';

interface DashboardProps {
  onOpenCreate: () => void;
  onOpenAssignment: (assignment: AssignmentData) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenCreate, onOpenAssignment }) => {
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAssignments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/assignments');
      const rawText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error('Server returned an invalid response format. Please click Retry.');
      }

      if (!res.ok) {
        throw new Error(data?.error || `Failed to fetch assignments (${res.status})`);
      }

      const list = Array.isArray(data) ? data : [];
      setAssignments(list);
      try {
        sessionStorage.setItem('cached_assignments', JSON.stringify(list));
      } catch {
        // Ignore storage errors
      }
    } catch (err: any) {
      console.error('Fetch assignments error:', err);
      // Try to recover from cached list
      try {
        const cached = sessionStorage.getItem('cached_assignments');
        if (cached) {
          const list = JSON.parse(cached);
          if (Array.isArray(list) && list.length > 0) {
            setAssignments(list);
            setError(null);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Ignore cache parse error
      }
      setError(err.message || 'Could not load assignments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete assignment');
      }
      setAssignments((prev) => prev.filter((a) => a.id !== id && a._id !== id));
    } catch (err: any) {
      alert(err.message || 'Deletion error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero / Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 sm:p-10 text-white shadow-lg mb-8 border border-slate-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-blue-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic Assignment Suite</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            AI Assignment Generator &amp; DOCX Exporter
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Enter your course details and assignment questions. Gemini AI structures academic solutions, lets you review and polish them in an interactive rich-text editor, and exports directly to formatted Microsoft Word (.docx) documents.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenCreate}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Assignment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold">Total Assignments</span>
            <p className="text-xl font-bold text-slate-900">{assignments.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold">AI Model</span>
            <p className="text-sm font-bold text-slate-900">Gemini 3.8 Flash</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold">Export Ready</span>
            <p className="text-sm font-bold text-slate-900">Native Word (.docx)</p>
          </div>
        </div>
      </div>

      {/* Recent Assignments Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Recent Assignments</h2>
          <p className="text-xs text-slate-500">View, edit, or download your generated coursework</p>
        </div>
        <button
          onClick={fetchAssignments}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
        >
          Refresh list
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-600 font-medium">Loading your assignments...</p>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start justify-between mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <div>
              <span className="font-semibold block">Failed to load coursework:</span>
              <span className="text-xs text-red-600">{error}</span>
            </div>
          </div>
          <button
            onClick={fetchAssignments}
            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-md font-medium text-xs transition-colors flex-shrink-0 cursor-pointer"
          >
            Retry Fetching
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && assignments.length === 0 && (
        <div className="text-center p-12 bg-white rounded-xl border border-dashed border-slate-300">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No assignments generated yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Click the button below to generate your first assignment with academic headers and structured answers.
          </p>
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create First Assignment</span>
          </button>
        </div>
      )}

      {/* Assignments Grid */}
      {!isLoading && !error && assignments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {assignments.map((item) => {
            const assignmentId = item.id || item._id || '';
            const isDeleting = deletingId === assignmentId;
            const updatedDate = new Date(item.updatedAt || item.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={assignmentId}
                onClick={() => onOpenAssignment(item)}
                className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all p-5 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      Assignment #{item.assignmentNumber || '1'}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {updatedDate}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-1 group-hover:text-blue-600 transition-colors">
                    {item.subject}
                  </h3>

                  <p className="text-xs text-slate-500 mb-3 truncate">
                    {item.universityName || 'Academic Coursework'} &bull; {item.department || 'Department'}
                  </p>

                  <div className="text-xs text-slate-600 space-y-1 mb-4 bg-slate-50 p-2.5 rounded border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Student:</span>
                      <span className="font-medium text-slate-700">{item.studentName} ({item.rollNumber})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Instructor:</span>
                      <span className="font-medium text-slate-700">{item.submittedTo}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Questions:</span>
                      <span className="font-medium text-slate-700">{item.questions?.length || 1}</span>
                    </div>
                  </div>
                </div>

                {/* Card footer actions */}
                <div
                  className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onOpenAssignment(item)}
                    className="flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Open Editor</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <ExportButton
                      assignment={item}
                      className="text-xs px-2.5 py-1.5"
                    />

                    <button
                      onClick={(e) => handleDelete(assignmentId, e)}
                      disabled={isDeleting}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                      title="Delete assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
