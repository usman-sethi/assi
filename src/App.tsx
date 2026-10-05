import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { Dashboard } from './components/Dashboard.js';
import { AssignmentForm } from './components/AssignmentForm.js';
import { AssignmentEditor } from './components/AssignmentEditor.js';
import { AssignmentData } from './types/assignment.js';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'editor'>('dashboard');
  const [activeAssignment, setActiveAssignment] = useState<AssignmentData | null>(null);
  const [isLoadingActive, setIsLoadingActive] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Sync state with URL hash
  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash.replace(/^#/, '');

      if (!hash || hash === 'dashboard') {
        setCurrentView('dashboard');
        setActiveAssignment(null);
      } else if (hash === 'create') {
        setCurrentView('create');
        setActiveAssignment(null);
      } else if (hash.startsWith('editor/')) {
        const id = hash.replace('editor/', '');
        if (id) {
          // If we don't already have this assignment active, fetch it
          if (!activeAssignment || (activeAssignment.id !== id && activeAssignment._id !== id)) {
            setIsLoadingActive(true);
            setLoadError(null);
            try {
              const res = await fetch(`/api/assignments/${id}`);
              if (!res.ok) {
                throw new Error('Assignment not found');
              }
              const data = await res.json();
              setActiveAssignment(data);
              setCurrentView('editor');
            } catch (err: any) {
              setLoadError(err.message || 'Failed to load assignment');
              setCurrentView('dashboard');
            } finally {
              setIsLoadingActive(false);
            }
          } else {
            setCurrentView('editor');
          }
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (view: 'dashboard' | 'create' | 'editor', id?: string) => {
    if (view === 'editor' && id) {
      window.location.hash = `editor/${id}`;
    } else if (view === 'create') {
      window.location.hash = 'create';
    } else {
      window.location.hash = 'dashboard';
    }
  };

  const handleGenerated = (assignment: AssignmentData) => {
    setActiveAssignment(assignment);
    const id = assignment.id || assignment._id;
    if (id) {
      window.location.hash = `editor/${id}`;
    } else {
      setCurrentView('editor');
    }
  };

  const handleOpenAssignment = (assignment: AssignmentData) => {
    setActiveAssignment(assignment);
    const id = assignment.id || assignment._id;
    if (id) {
      window.location.hash = `editor/${id}`;
    } else {
      setCurrentView('editor');
    }
  };

  const handleAssignmentUpdated = (updated: AssignmentData) => {
    setActiveAssignment(updated);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <Navbar
        currentView={currentView}
        onNavigate={navigateTo}
        activeAssignmentTitle={activeAssignment?.subject}
      />

      <main className="flex-1 flex flex-col">
        {isLoadingActive ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-600">Loading saved assignment...</p>
          </div>
        ) : currentView === 'dashboard' ? (
          <Dashboard
            onOpenCreate={() => navigateTo('create')}
            onOpenAssignment={handleOpenAssignment}
          />
        ) : currentView === 'create' ? (
          <AssignmentForm
            onGenerated={handleGenerated}
            onCancel={() => navigateTo('dashboard')}
          />
        ) : currentView === 'editor' && activeAssignment ? (
          <AssignmentEditor
            initialAssignment={activeAssignment}
            onBack={() => navigateTo('dashboard')}
            onUpdate={handleAssignmentUpdated}
          />
        ) : (
          <Dashboard
            onOpenCreate={() => navigateTo('create')}
            onOpenAssignment={handleOpenAssignment}
          />
        )}
      </main>
    </div>
  );
}
