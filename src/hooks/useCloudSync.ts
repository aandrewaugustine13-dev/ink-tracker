import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveProjectToCloud, loadProjectsFromCloud, SyncStatus, deleteProjectFromCloud } from '../services/cloudSync';
import { Project, AppState } from '../types';

const DEBOUNCE_MS = 2000; // Wait 2 seconds after last change before syncing

export const useCloudSync = (
  state: AppState | null,
  onProjectsLoaded: (projects: Project[]) => void
) => {
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ status: 'idle' });
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedProjectsRef = useRef<string>('');
  const hasLoadedRef = useRef(false);

  // Load projects from cloud on login
  useEffect(() => {
    if (!user || hasLoadedRef.current) return;

    const loadFromCloud = async () => {
      setSyncStatus({ status: 'loading' });
      const { projects, error } = await loadProjectsFromCloud(user.id);
      
      if (error) {
        setSyncStatus({ status: 'error', error });
      } else if (projects.length > 0) {
        onProjectsLoaded(projects);
        setSyncStatus({ status: 'saved', lastSaved: new Date() });
        // Store the initial state to avoid re-saving immediately
        lastSavedProjectsRef.current = JSON.stringify(projects);
      } else {
        setSyncStatus({ status: 'idle' });
      }
      hasLoadedRef.current = true;
    };

    loadFromCloud();
  }, [user, onProjectsLoaded]);

  // Reset loaded state when user logs out
  useEffect(() => {
    if (!user) {
      hasLoadedRef.current = false;
      lastSavedProjectsRef.current = '';
    }
  }, [user]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (!user || !state) return;

    const currentProjectsJson = JSON.stringify(state.projects);
    
    // Skip if nothing changed
    if (currentProjectsJson === lastSavedProjectsRef.current) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSyncStatus({ status: 'saving' });

    saveTimeoutRef.current = setTimeout(async () => {
      // Save each project that has changed
      let hasError = false;
      
      for (const project of state.projects) {
        const { success, error } = await saveProjectToCloud(user.id, project);
        
        if (!success) {
          setSyncStatus({ status: 'error', error });
          hasError = true;
          break;
        }
      }

      if (!hasError) {
        lastSavedProjectsRef.current = currentProjectsJson;
        setSyncStatus({ status: 'saved', lastSaved: new Date() });
      }
    }, DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [user, state?.projects]);

  // Force save all projects
  const saveAllProjects = useCallback(async () => {
    if (!user || !state) return;

    setSyncStatus({ status: 'saving' });

    for (const project of state.projects) {
      const { success, error } = await saveProjectToCloud(user.id, project);
      if (!success) {
        setSyncStatus({ status: 'error', error });
        return;
      }
    }

    lastSavedProjectsRef.current = JSON.stringify(state.projects);
    setSyncStatus({ status: 'saved', lastSaved: new Date() });
  }, [user, state]);

  // Delete project from cloud
  const deleteProject = useCallback(async (projectId: string) => {
    if (!user) return;

    const { success, error } = await deleteProjectFromCloud(user.id, projectId);
    if (!success) {
      console.error('Failed to delete project from cloud:', error);
    }
  }, [user]);

  return { syncStatus, saveAllProjects, deleteProject };
};
