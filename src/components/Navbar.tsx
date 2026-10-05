import React from 'react';
import { FileText, PlusCircle, LayoutDashboard, Sparkles, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  currentView: 'dashboard' | 'create' | 'editor';
  onNavigate: (view: 'dashboard' | 'create' | 'editor', id?: string) => void;
  activeAssignmentTitle?: string;
  isSaving?: boolean;
  lastSaved?: Date | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  activeAssignmentTitle,
  isSaving,
  lastSaved,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight">AssignmentGen</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <Sparkles className="w-3 h-3 mr-1" /> AI + DOCX
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Academic Assignment Generator & Word Exporter</p>
            </div>
          </div>

          {/* Active document indicator (when in editor) */}
          {currentView === 'editor' && activeAssignmentTitle && (
            <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700 text-sm max-w-xs lg:max-w-sm truncate">
              <span className="text-slate-400">Editing:</span>
              <span className="font-medium text-slate-200 truncate">{activeAssignmentTitle}</span>
              {isSaving ? (
                <span className="text-xs text-amber-400 animate-pulse ml-2 font-mono">Saving...</span>
              ) : lastSaved ? (
                <span className="text-xs text-emerald-400 ml-2 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Saved
                </span>
              ) : null}
            </div>
          )}

          {/* Navigation Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Assignments</span>
            </button>

            <button
              onClick={() => onNavigate('create')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'create'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              <span>Create Assignment</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
