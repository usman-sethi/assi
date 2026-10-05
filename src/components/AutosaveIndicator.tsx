import React from 'react';
import { CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';

interface AutosaveIndicatorProps {
  status: 'saved' | 'saving' | 'unsaved' | 'error';
  lastSavedAt: Date | null;
  errorMessage?: string;
  onRetry?: () => void;
}

export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({
  status,
  lastSavedAt,
  errorMessage,
  onRetry,
}) => {
  if (status === 'saving') {
    return (
      <div className="flex items-center text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
        <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
        <span>Saving changes...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded border border-red-200">
        <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
        <span>{errorMessage || 'Unable to save'}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-2 underline font-medium hover:text-red-700"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (status === 'unsaved') {
    return (
      <div className="flex items-center text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
        <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
        <span>Unsaved edits</span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
      <span>
        Saved {lastSavedAt ? `at ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : ''}
      </span>
    </div>
  );
};
