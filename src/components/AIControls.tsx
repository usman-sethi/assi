import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  Wand2,
  Minimize2,
  Maximize2,
  CheckCircle,
  GraduationCap,
  Lightbulb,
  RotateCcw,
  Loader2,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import { AiEditAction } from '../types/assignment.js';

interface AIControlsProps {
  selectedText: string;
  onApplyReplacement: (newText: string) => void;
  assignmentContext?: string;
}

export const AIControls: React.FC<AIControlsProps> = ({
  selectedText,
  onApplyReplacement,
  assignmentContext,
}) => {
  const [customText, setCustomText] = useState('');
  const [activeAction, setActiveAction] = useState<AiEditAction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    action: AiEditAction;
    original: string;
    suggested: string;
  } | null>(null);

  const effectiveText = selectedText.trim() || customText.trim();

  const actions: { id: AiEditAction; label: string; icon: React.ReactNode; desc: string; highlight?: boolean }[] = [
    {
      id: 'humanize',
      label: 'Humanize (Anti-AI)',
      icon: <UserCheck className="w-4 h-4 text-emerald-600" />,
      desc: 'Strip AI cliches & sound like a genuine student',
      highlight: true,
    },
    {
      id: 'improve',
      label: 'Improve Flow',
      icon: <Wand2 className="w-4 h-4 text-blue-500" />,
      desc: 'Enhance academic clarity and tone',
    },
    {
      id: 'simplify',
      label: 'Simplify',
      icon: <Minimize2 className="w-4 h-4 text-emerald-500" />,
      desc: 'Make easier to understand',
    },
    {
      id: 'expand',
      label: 'Expand Details',
      icon: <Maximize2 className="w-4 h-4 text-purple-500" />,
      desc: 'Add depth, analysis & explanations',
    },
    {
      id: 'shorten',
      label: 'Shorten',
      icon: <Minimize2 className="w-4 h-4 text-amber-500" />,
      desc: 'Condense into concise key points',
    },
    {
      id: 'grammar',
      label: 'Fix Grammar',
      icon: <CheckCircle className="w-4 h-4 text-teal-500" />,
      desc: 'Correct spelling & phrasing',
    },
    {
      id: 'formal',
      label: 'Make Formal',
      icon: <GraduationCap className="w-4 h-4 text-indigo-500" />,
      desc: 'Academic scholarly vocabulary',
    },
    {
      id: 'example',
      label: 'Add Example',
      icon: <Lightbulb className="w-4 h-4 text-yellow-500" />,
      desc: 'Insert illustrative real-world example',
    },
    {
      id: 'regenerate',
      label: 'Regenerate',
      icon: <RotateCcw className="w-4 h-4 text-rose-500" />,
      desc: 'Rewrite completely fresh',
    },
  ];

  const handleExecute = async (action: AiEditAction) => {
    if (!effectiveText) {
      setError('Please highlight text in the document or type text below to edit.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setActiveAction(action);

    try {
      const response = await fetch('/api/ai-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          text: effectiveText,
          context: assignmentContext,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process AI edit');
      }

      setResult({
        action,
        original: effectiveText,
        suggested: data.resultText,
      });
    } catch (err: any) {
      setError(err.message || 'AI request failed');
    } finally {
      setIsLoading(false);
      setActiveAction(null);
    }
  };

  const handleAccept = () => {
    if (result) {
      onApplyReplacement(result.suggested);
      setResult(null);
      setCustomText('');
    }
  };

  const handleReject = () => {
    setResult(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-slate-800 text-sm">AI Academic Editor</h3>
        </div>
        {selectedText ? (
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            Text selected ({selectedText.length} chars)
          </span>
        ) : (
          <span className="text-xs text-slate-400">Select text in editor</span>
        )}
      </div>

      {/* If no text is selected in editor, give student an optional manual input box */}
      {!selectedText && (
        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Or type/paste text to refine:
          </label>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="e.g. A queue is data structure where first person come first served."
            rows={2}
            className="w-full text-xs p-2 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Action buttons grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {actions.map((act) => {
          const isCurrentLoading = isLoading && activeAction === act.id;
          return (
            <button
              key={act.id}
              onClick={() => handleExecute(act.id)}
              disabled={isLoading || !effectiveText}
              className={`flex items-center space-x-2 p-2 rounded-lg border text-left text-xs transition-all ${
                act.highlight
                  ? 'col-span-2 border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-950 font-semibold shadow-2xs cursor-pointer'
                  : effectiveText && !isLoading
                  ? 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-700 hover:text-blue-900 cursor-pointer'
                  : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
              }`}
              title={act.desc}
            >
              {isCurrentLoading ? (
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
              ) : (
                <span className="flex-shrink-0">{act.icon}</span>
              )}
              <span className="font-medium truncate">{act.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-start space-x-2 text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-200 mb-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Comparison Review Card (Accept / Reject) */}
      {result && (
        <div className="mt-4 border border-blue-200 bg-blue-50/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
              Review AI Revision ({result.action})
            </span>
          </div>

          <div className="space-y-2 mb-3">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block uppercase">Original:</span>
              <p className="text-xs text-slate-600 line-through bg-white/70 p-2 rounded border border-slate-200">
                {result.original}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-700 block uppercase">Suggested:</span>
              <p className="text-xs text-slate-900 font-medium bg-emerald-50/60 p-2 rounded border border-emerald-200 whitespace-pre-wrap">
                {result.suggested}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleAccept}
              className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium transition-colors shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept &amp; Replace</span>
            </button>
            <button
              onClick={handleReject}
              className="flex items-center justify-center space-x-1 py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-medium transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
