
import { supabase } from "@/integrations/supabase/client";

export const updateCourtStatus = async (
  courtNumber: number,
  isConnected: boolean,
  lastError?: string
) => {
  try {
    const { error } = await supabase
      .from("court_status")
      .upsert(
        {
          court_number: courtNumber,
          is_connected: isConnected,
          last_heartbeat: new Date().toISOString(),
          last_error: lastError,
        },
        { onConflict: "court_number" }
      );

    if (error) {
      console.error("Error updating court status:", error);
    }
  } catch (error) {
    console.error("Failed to update court status:", error);
  }
};

export const updateCourtSync = async (courtNumber: number) => {
  try {
    const { error } = await supabase
      .from("court_status")
      .upsert(
        {
          court_number: courtNumber,
          last_sync_time: new Date().toISOString(),
        },
        { onConflict: "court_number" }
      );

    if (error) {
      console.error("Error updating court sync time:", error);
    }
  } catch (error) {
    console.error("Failed to update court sync time:", error);
  }
};
