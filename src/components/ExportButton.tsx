import React, { useState } from 'react';
import { Download, Loader2, FileCheck } from 'lucide-react';
import { AssignmentData } from '../types/assignment.js';

interface ExportButtonProps {
  assignment: AssignmentData;
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ assignment, className = '' }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setError(null);
    setDownloadSuccess(false);

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignment),
      });

      if (!response.ok) {
        let errMessage = 'Failed to generate Word document';
        try {
          const errData = await response.json();
          errMessage = errData.error || errMessage;
        } catch {
          // ignore json parse error on binary endpoint
        }
        throw new Error(errMessage);
      }

      // Read blob and trigger download
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition');
      let filename = `${(assignment.subject || 'Assignment').replace(/[^a-zA-Z0-9_-]/g, '_')}-Assignment-${assignment.assignmentNumber || '01'}.docx`;

      if (disposition && disposition.includes('filename=')) {
        const matches = /filename="?([^"]+)"?/g.exec(disposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err: any) {
      console.error('Export error:', err);
      setError(err.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative inline-flex flex-col items-start">
      <button
        type="button"
        onClick={handleExport}
        disabled={isExporting}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm ${
          downloadSuccess
            ? 'bg-emerald-600 text-white'
            : isExporting
            ? 'bg-blue-400 text-white cursor-wait'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
        } ${className}`}
        title="Download academic Microsoft Word (.docx) file"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating DOCX...</span>
          </>
        ) : downloadSuccess ? (
          <>
            <FileCheck className="w-4 h-4 text-emerald-100" />
            <span>Downloaded!</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>Export DOCX</span>
          </>
        )}
      </button>

      {error && (
        <span className="absolute -bottom-5 left-0 text-[11px] text-red-600 font-medium whitespace-nowrap">
          {error}
        </span>
      )}
    </div>
  );
};
