import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTimerSettings } from "@/hooks/useTimerSettings";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const TimerSettings = () => {
  const { settings, isLoading, updateSettings, isUpdating } = useTimerSettings();
  const [setDuration, setSetDuration] = useState<number | "">(14);
  const [breakDuration, setBreakDuration] = useState<number | "">(1);
  const [resultsDuration, setResultsDuration] = useState<number | "">(0.83);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setSetDuration(settings.set_duration_minutes);
      setBreakDuration(settings.break_duration_minutes);
      setResultsDuration(settings.results_duration_minutes);
    }
  }, [settings]);

  useEffect(() => {
    const changed = 
      (typeof setDuration === "number" && setDuration !== settings.set_duration_minutes) ||
      (typeof breakDuration === "number" && breakDuration !== settings.break_duration_minutes) ||
      (typeof resultsDuration === "number" && resultsDuration !== settings.results_duration_minutes);
    setHasChanges(changed);
  }, [setDuration, breakDuration, resultsDuration, settings]);

  const handleSave = () => {
    setShowConfirmDialog(true);
  };

  const confirmSave = () => {
    updateSettings({
      setDuration: typeof setDuration === "number" ? setDuration : 14,
      breakDuration: typeof breakDuration === "number" ? breakDuration : 1,
      resultsDuration: typeof resultsDuration === "number" ? resultsDuration : 0.83,
    });
    setShowConfirmDialog(false);
  };

  const handleReset = () => {
    setShowResetDialog(true);
  };

  const confirmReset = () => {
    setSetDuration(14);
    setBreakDuration(1);
    setResultsDuration(0.83);
    updateSettings({
      setDuration: 14,
      breakDuration: 1,
      resultsDuration: 0.83,
    });
    setShowResetDialog(false);
  };

  const isValid = 
    typeof setDuration === "number" && setDuration >= 5 && setDuration <= 30 &&
    typeof breakDuration === "number" && breakDuration >= 0.5 && breakDuration <= 3 &&
    typeof resultsDuration === "number" && resultsDuration >= 0.33 && resultsDuration <= 3;

  if (isLoading) {
    return <div className="text-center p-8">Loading settings...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Timer Settings</CardTitle>
          <CardDescription>
            Configure the duration for set timers and break periods. Changes will apply to new matches only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Timer changes only affect NEW matches. Matches currently in progress will continue with their original timer values.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="setDuration">Set Duration (minutes)</Label>
              <Input
                id="setDuration"
                type="number"
                min={5}
                max={30}
                value={setDuration}
                onChange={(e) => setSetDuration(e.target.value === "" ? "" : parseInt(e.target.value))}
                className="max-w-[200px]"
              />
              <p className="text-sm text-muted-foreground">
                Valid range: 5-30 minutes
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="breakDuration">Break Duration (minutes)</Label>
              <Input
                id="breakDuration"
                type="number"
                min={0.5}
                max={3}
                step={0.1}
                value={breakDuration}
                onChange={(e) => setBreakDuration(e.target.value === "" ? "" : parseFloat(e.target.value))}
                className="max-w-[200px]"
              />
              <p className="text-sm text-muted-foreground">
                Valid range: 0.5-3 minutes
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resultsDuration">Results Display Duration (minutes)</Label>
              <Input
                id="resultsDuration"
                type="number"
                min={0.33}
                max={3}
                step={0.01}
                value={resultsDuration}
                onChange={(e) => setResultsDuration(e.target.value === "" ? "" : parseFloat(e.target.value))}
                className="max-w-[200px]"
              />
              <p className="text-sm text-muted-foreground">
                Valid range: 0.33-3 minutes. Controls auto-start timer on results screen.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={!isValid || !hasChanges || isUpdating}
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isUpdating}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>

          {settings.updated_at && (
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date(settings.updated_at).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Timer Settings</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update the timer settings?
              <div className="mt-4 space-y-2">
                <p><strong>Set Duration:</strong> {setDuration} minutes</p>
                <p><strong>Break Duration:</strong> {breakDuration} minutes</p>
                <p><strong>Results Duration:</strong> {resultsDuration} minutes</p>
              </div>
              <p className="mt-4 text-sm">
                These changes will only apply to new matches. Matches in progress will continue with their current timer values.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSave}>Save Settings</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Defaults</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the timer settings to the default values:
              <div className="mt-4 space-y-2">
                <p><strong>Set Duration:</strong> 14 minutes</p>
                <p><strong>Break Duration:</strong> 1 minute</p>
                <p><strong>Results Duration:</strong> 0.83 minutes</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
