import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Timer, SkipForward, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

type CourtStatus = {
  court_number: number;
  is_connected: boolean;
  last_heartbeat: string;
  last_sync_time: string | null;
  last_error: string | null;
};

type TimerState = {
  id: string;
  court_number: number;
  seconds_remaining: number;
  is_running: boolean;
  created_at: string;
  updated_at: string;
};

const DEFAULT_COURTS = Array.from({ length: 8 }, (_, i) => ({
  court_number: i + 1,
  is_connected: false,
  last_heartbeat: null,
  last_sync_time: null,
  last_error: null,
}));

export const CourtStatusSection = () => {
  const [courtStatuses, setCourtStatuses] = useState<CourtStatus[]>(DEFAULT_COURTS);
  const [timerStates, setTimerStates] = useState<TimerState[]>([]);

  const { data: initialStatuses } = useQuery({
    queryKey: ["court-statuses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("court_status")
        .select("*")
        .order("court_number");

      if (error) throw error;
      return data as CourtStatus[];
    },
  });

  const { data: initialTimerStates } = useQuery({
    queryKey: ["timer-states"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timer_state")
        .select("*")
        .order("court_number");

      if (error) throw error;
      return data as TimerState[];
    },
  });

  useEffect(() => {
    if (initialTimerStates) {
      setTimerStates(initialTimerStates);
    }
  }, [initialTimerStates]);

  useEffect(() => {
    if (initialStatuses) {
      const updatedStatuses = [...DEFAULT_COURTS];
      initialStatuses.forEach(status => {
        const index = updatedStatuses.findIndex(s => s.court_number === status.court_number);
        if (index >= 0) {
          updatedStatuses[index] = status;
        }
      });
      setCourtStatuses(updatedStatuses);
    }
  }, [initialStatuses]);

  const handleSkipPhase = async (courtNumber: number) => {
    try {
      const timerState = timerStates.find(t => t.court_number === courtNumber);
      if (!timerState) return;

      const { error } = await supabase
        .from('timer_state')
        .update({ seconds_remaining: 0 })
        .eq('court_number', courtNumber);

      if (error) throw error;

      toast({
        title: "Phase Skipped",
        description: `Timer phase skipped for Court ${courtNumber}`,
      });
    } catch (error) {
      console.error('Error skipping phase:', error);
      toast({
        title: "Error",
        description: "Failed to skip phase",
        variant: "destructive",
      });
    }
  };

  const handleStartStop = async (courtNumber: number, currentlyRunning: boolean) => {
    try {
      const { error } = await supabase
        .from('timer_state')
        .update({ is_running: !currentlyRunning })
        .eq('court_number', courtNumber);

      if (error) throw error;

      toast({
        title: currentlyRunning ? "Timer Paused" : "Timer Started",
        description: `Court ${courtNumber} timer ${currentlyRunning ? 'paused' : 'started'}`,
      });
    } catch (error) {
      console.error('Error toggling timer:', error);
      toast({
        title: "Error",
        description: "Failed to update timer state",
        variant: "destructive",
      });
    }
  };

  const handleReset = async (courtNumber: number) => {
    try {
      const { error } = await supabase
        .from('timer_state')
        .update({ 
          seconds_remaining: 14 * 60, // Reset to 14 minutes
          is_running: false 
        })
        .eq('court_number', courtNumber);

      if (error) throw error;

      toast({
        title: "Timer Reset",
        description: `Court ${courtNumber} timer has been reset`,
      });
    } catch (error) {
      console.error('Error resetting timer:', error);
      toast({
        title: "Error",
        description: "Failed to reset timer",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const courtChannel = supabase.channel("court-status-changes").on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'court_status',
      },
      (payload) => {
        setCourtStatuses((current) => {
          const updated = [...current];
          const index = updated.findIndex(
            (s) => s.court_number === (payload.new as CourtStatus).court_number
          );
          if (index >= 0) {
            updated[index] = payload.new as CourtStatus;
          } else {
            updated.push(payload.new as CourtStatus);
          }
          return updated.sort((a, b) => a.court_number - b.court_number);
        });
      }
    ).on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'court_status',
      },
      (payload) => {
        setCourtStatuses((current) => {
          const updated = [...current];
          const index = updated.findIndex(
            (s) => s.court_number === (payload.new as CourtStatus).court_number
          );
          if (index >= 0) {
            updated[index] = payload.new as CourtStatus;
          }
          return updated.sort((a, b) => a.court_number - b.court_number);
        });
      }
    );

    const timerChannel = supabase.channel("timer-state-changes").on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'timer_state',
      },
      (payload) => {
        setTimerStates((current) => {
          const newState = payload.new as TimerState;
          const existingIndex = current.findIndex(t => t.court_number === newState.court_number);
          
          if (existingIndex >= 0) {
            const updated = [...current];
            updated[existingIndex] = newState;
            return updated;
          } else {
            return [...current, newState];
          }
        });
      }
    );

    courtChannel.subscribe();
    timerChannel.subscribe();

    return () => {
      supabase.removeChannel(courtChannel);
      supabase.removeChannel(timerChannel);
    };
  }, []);

  const getStatusBadge = (status: CourtStatus) => {
    if (!status.last_heartbeat) {
      return <Badge variant="secondary">No Activity</Badge>;
    }

    const lastHeartbeat = new Date(status.last_heartbeat);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    if (lastHeartbeat > fiveMinutesAgo && status.is_connected) {
      return <Badge variant="default" className="bg-green-500">Connected</Badge>;
    } else if (lastHeartbeat > fiveMinutesAgo) {
      return <Badge variant="default" className="bg-yellow-500">Unstable</Badge>;
    }
    return <Badge variant="destructive">Disconnected</Badge>;
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "Never";
    return format(new Date(timestamp), "HH:mm:ss");
  };

  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {courtStatuses.map((status) => {
        const timerState = timerStates.find(t => t.court_number === status.court_number);
        
        return (
          <Card key={status.court_number}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Court {status.court_number}</span>
                {getStatusBadge(status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {timerState && (
                <div className="space-y-2">
                  <div className="text-sm flex items-center gap-2 font-semibold">
                    <Timer className="h-4 w-4" />
                    <span className={timerState.is_running ? "text-green-600" : "text-gray-600"}>
                      {formatTimer(timerState.seconds_remaining)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartStop(status.court_number, timerState.is_running)}
                    >
                      {timerState.is_running ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReset(status.court_number)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSkipPhase(status.court_number)}
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              <div className="text-sm">
                <span className="font-medium">Last Heartbeat: </span>
                {formatTime(status.last_heartbeat)}
              </div>
              <div className="text-sm">
                <span className="font-medium">Last Sync: </span>
                {formatTime(status.last_sync_time)}
              </div>
              {status.last_error && (
                <div className="text-sm text-destructive">
                  <span className="font-medium">Last Error: </span>
                  {status.last_error}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
