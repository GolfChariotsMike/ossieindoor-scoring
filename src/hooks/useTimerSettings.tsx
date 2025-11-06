import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTimerSettings, updateTimerSettings, TimerSettings } from "@/services/timerSettings";
import { toast } from "@/hooks/use-toast";

export const useTimerSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['timer-settings'],
    queryFn: getTimerSettings,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  const updateMutation = useMutation({
    mutationFn: ({ 
      setDuration, 
      breakDuration, 
      updatedBy 
    }: { 
      setDuration: number; 
      breakDuration: number; 
      updatedBy?: string;
    }) => updateTimerSettings(setDuration, breakDuration, updatedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timer-settings'] });
      toast({
        title: "Settings updated",
        description: "Timer settings have been saved successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating timer settings:', error);
      toast({
        title: "Error",
        description: "Failed to update timer settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    settings: settings || {
      id: 'default',
      set_duration_minutes: 14,
      break_duration_seconds: 60,
      updated_at: new Date().toISOString(),
    },
    isLoading,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};
