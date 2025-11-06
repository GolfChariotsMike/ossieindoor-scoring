import { supabase } from "@/integrations/supabase/client";

export interface TimerSettings {
  id: string;
  set_duration_minutes: number;
  break_duration_seconds: number;
  results_duration_seconds: number;
  updated_at: string;
  updated_by?: string;
}

const DEFAULT_SETTINGS = {
  set_duration_minutes: 14,
  break_duration_seconds: 60,
  results_duration_seconds: 50,
};

export const getTimerSettings = async (): Promise<TimerSettings> => {
  try {
    const { data, error } = await supabase
      .from('timer_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching timer settings:', error);
    // Return defaults if fetch fails
    return {
      id: 'default',
      ...DEFAULT_SETTINGS,
      updated_at: new Date().toISOString(),
    };
  }
};

export const updateTimerSettings = async (
  setDurationMinutes: number,
  breakDurationSeconds: number,
  resultsDurationSeconds: number,
  updatedBy?: string
): Promise<TimerSettings> => {
  // Get the existing settings first
  const { data: existingSettings } = await supabase
    .from('timer_settings')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const updateData = {
    set_duration_minutes: setDurationMinutes,
    break_duration_seconds: breakDurationSeconds,
    results_duration_seconds: resultsDurationSeconds,
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  };

  if (existingSettings?.id) {
    // Update existing settings
    const { data, error } = await supabase
      .from('timer_settings')
      .update(updateData)
      .eq('id', existingSettings.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Insert new settings if none exist
    const { data, error } = await supabase
      .from('timer_settings')
      .insert(updateData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
