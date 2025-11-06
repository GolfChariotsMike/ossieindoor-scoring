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
  const [setDuration, setSetDuration] = useState(14);
  const [breakDuration, setBreakDuration] = useState(60);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setSetDuration(settings.set_duration_minutes);
      setBreakDuration(settings.break_duration_seconds);
    }
  }, [settings]);

  useEffect(() => {
    const changed = 
      setDuration !== settings.set_duration_minutes ||
      breakDuration !== settings.break_duration_seconds;
    setHasChanges(changed);
  }, [setDuration, breakDuration, settings]);

  const handleSave = () => {
    setShowConfirmDialog(true);
  };

  const confirmSave = () => {
    updateSettings({
      setDuration,
      breakDuration,
    });
    setShowConfirmDialog(false);
  };

  const handleReset = () => {
    setShowResetDialog(true);
  };

  const confirmReset = () => {
    setSetDuration(14);
    setBreakDuration(60);
    updateSettings({
      setDuration: 14,
      breakDuration: 60,
    });
    setShowResetDialog(false);
  };

  const isValid = 
    setDuration >= 5 && setDuration <= 30 &&
    breakDuration >= 30 && breakDuration <= 180;

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
                onChange={(e) => setSetDuration(parseInt(e.target.value) || 5)}
                className="max-w-[200px]"
              />
              <p className="text-sm text-muted-foreground">
                Valid range: 5-30 minutes
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="breakDuration">Break Duration (seconds)</Label>
              <Input
                id="breakDuration"
                type="number"
                min={30}
                max={180}
                value={breakDuration}
                onChange={(e) => setBreakDuration(parseInt(e.target.value) || 30)}
                className="max-w-[200px]"
              />
              <p className="text-sm text-muted-foreground">
                Valid range: 30-180 seconds
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
                <p><strong>Break Duration:</strong> {breakDuration} seconds</p>
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
                <p><strong>Break Duration:</strong> 60 seconds</p>
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
