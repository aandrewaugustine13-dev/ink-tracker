import { supabase } from './supabase';
import { Project } from '../types';

export interface SyncStatus {
  status: 'idle' | 'loading' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  error?: string;
}

// Helper to extract error message from various error types
const getErrorMessage = (err: unknown): string => {
  if (err && typeof err === 'object') {
    // Supabase errors have a message property
    if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
      return (err as { message: string }).message;
    }
    // PostgrestError has details
    if ('details' in err && typeof (err as { details: unknown }).details === 'string') {
      return (err as { details: string }).details;
    }
    // Check for code property (common in Supabase errors)
    if ('code' in err && typeof (err as { code: unknown }).code === 'string') {
      const code = (err as { code: string }).code;
      // Map common error codes to user-friendly messages
      if (code === '42P01') return 'Projects table not found. Please run the SQL setup script.';
      if (code === '42501') return 'Permission denied. Check Row Level Security policies.';
      if (code === 'PGRST301') return 'Projects table not found. Please create it in Supabase.';
      return `Database error: ${code}`;
    }
  }
  if (typeof err === 'string') return err;
  return 'An unknown error occurred';
};

export const saveProjectToCloud = async (
  userId: string,
  project: Project
): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: false, error: 'Supabase not configured' };

  try {
    const { error } = await supabase
      .from('projects')
      .upsert(
        {
          user_id: userId,
          project_id: project.id,
          project_data: project,
        },
        {
          onConflict: 'user_id,project_id',
        }
      );

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Cloud save error:', err);
    return { success: false, error: getErrorMessage(err) };
  }
};

export const loadProjectsFromCloud = async (
  userId: string
): Promise<{ projects: Project[]; error?: string }> => {
  if (!supabase) return { projects: [], error: 'Supabase not configured' };

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('project_data')
      .eq('user_id', userId);

    if (error) throw error;

    const projects = (data || []).map((row) => row.project_data as Project);
    return { projects };
  } catch (err) {
    console.error('Cloud load error:', err);
    return { projects: [], error: getErrorMessage(err) };
  }
};

export const deleteProjectFromCloud = async (
  userId: string,
  projectId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: false, error: 'Supabase not configured' };

  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('user_id', userId)
      .eq('project_id', projectId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Cloud delete error:', err);
    return { success: false, error: getErrorMessage(err) };
  }
};
