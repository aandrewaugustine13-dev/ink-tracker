import { supabase } from './supabase';
import { Project } from '../types';

export interface SyncStatus {
  status: 'idle' | 'saving' | 'loading' | 'saved' | 'error';
  lastSaved?: Date;
  error?: string;
}

// Save a single project to the cloud
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
    return { success: false, error: String(err) };
  }
};

// Load all projects from the cloud
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
    return { projects: [], error: String(err) };
  }
};

// Delete a project from the cloud
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
    return { success: false, error: String(err) };
  }
};
