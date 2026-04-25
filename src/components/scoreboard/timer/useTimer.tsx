import { useState, useEffect, useRef, useCallback } from "react";
import { MatchPhase } from "./types";
import { parse } from "date-fns";

interface UseTimerProps {
  initialMinutes: number;
  breakDurationSeconds?: number;
  onComplete: () => void;
  onSwitchTeams: () => void;
  isBreak: boolean;
  isMatchComplete: boolean;
  fixture?: { Id: string; DateTime?: string };
}

// Parse the fixture DateTime "dd/MM/yyyy HH:mm" into a JS Date
const parseFixtureStart = (dateTimeStr: string): Date | null => {
  try {
    return parse(dateTimeStr, 'dd/MM/yyyy HH:mm', new Date());
  } catch (e) {
    console.error('Failed to parse fixture DateTime:', dateTimeStr, e);
    return null;
  }
};

// Given elapsed seconds since fixture start, return the current phase and seconds remaining in that phase
const computePhaseFromElapsed = (
  elapsedSeconds: number,
  setDurationSeconds: number,
  breakDurationSeconds: number,
  timeOffset: number
): { phase: MatchPhase; timeLeft: number; phaseStart: number; phaseEnd: number } => {
  const adjusted = elapsedSeconds + timeOffset;

  const s1Start = 0;
  const s1End = setDurationSeconds;
  const b1Start = s1End;
  const b1End = b1Start + breakDurationSeconds;
  const s2Start = b1End;
  const s2End = s2Start + setDurationSeconds;
  const b2Start = s2End;
  const b2End = b2Start + breakDurationSeconds;
  const s3Start = b2End;
  const s3End = s3Start + setDurationSeconds;
  const b3Start = s3End;
  const b3End = b3Start + breakDurationSeconds;

  if (adjusted < s1End) {
    return { phase: "set1", timeLeft: Math.ceil(s1End - adjusted), phaseStart: s1Start, phaseEnd: s1End };
  } else if (adjusted < b1End) {
    return { phase: "break1", timeLeft: Math.ceil(b1End - adjusted), phaseStart: b1Start, phaseEnd: b1End };
  } else if (adjusted < s2End) {
    return { phase: "set2", timeLeft: Math.ceil(s2End - adjusted), phaseStart: s2Start, phaseEnd: s2End };
  } else if (adjusted < b2End) {
    return { phase: "break2", timeLeft: Math.ceil(b2End - adjusted), phaseStart: b2Start, phaseEnd: b2End };
  } else if (adjusted < s3End) {
    return { phase: "set3", timeLeft: Math.ceil(s3End - adjusted), phaseStart: s3Start, phaseEnd: s3End };
  } else if (adjusted < b3End) {
    return { phase: "final_break", timeLeft: Math.ceil(b3End - adjusted), phaseStart: b3Start, phaseEnd: b3End };
  } else {
    return { phase: "complete", timeLeft: 0, phaseStart: b3End, phaseEnd: b3End };
  }
};

export const useTimer = ({
  initialMinutes,
  breakDurationSeconds = 60,
  onComplete,
  onSwitchTeams,
  isBreak,
  isMatchComplete,
  fixture
}: UseTimerProps) => {
  const setDurationSeconds = initialMinutes * 60;

  // timeOffset shifts all future phase boundaries when user skips or resets
  const timeOffsetRef = useRef<number>(0);
  const prevPhaseRef = useRef<MatchPhase | null>(null);
  const isPhaseChangingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fallback manual timer state (used when no fixture DateTime)
  const [manualTimeLeft, setManualTimeLeft] = useState(setDurationSeconds);
  const [manualIsRunning, setManualIsRunning] = useState(false);
  const [manualPhase, setManualPhase] = useState<MatchPhase>("not_started");
  const manualIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const manualIsPhaseChangingRef = useRef(false);

  // Wall-clock state
  const [wallTimeLeft, setWallTimeLeft] = useState(setDurationSeconds);
  const [wallPhase, setWallPhase] = useState<MatchPhase>("not_started");

  // Determine whether we are in wall-clock mode
  const hasFixtureDateTime = !!(fixture?.DateTime);
  const fixtureStart = hasFixtureDateTime ? parseFixtureStart(fixture!.DateTime!) : null;
  const isWallClock = hasFixtureDateTime && fixtureStart !== null && !isNaN(fixtureStart.getTime());

  // ─── Wall-clock tick ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isWallClock || isMatchComplete) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const tick = () => {
      const now = Date.now();
      const elapsedSeconds = (now - fixtureStart!.getTime()) / 1000;

      // Before the match starts, count down to kickoff
      if (elapsedSeconds < 0) {
        setWallTimeLeft(Math.ceil(-elapsedSeconds)); // seconds until game starts
        setWallPhase("not_started");
        prevPhaseRef.current = "not_started";
        return;
      }

      const { phase, timeLeft } = computePhaseFromElapsed(
        elapsedSeconds,
        setDurationSeconds,
        breakDurationSeconds,
        timeOffsetRef.current
      );

      const prev = prevPhaseRef.current;

      // Stop ticking once complete
      if (phase === "complete" && prev === "complete") {
        return;
      }

      // Phase transition detected
      if (prev !== null && prev !== phase && !isPhaseChangingRef.current) {
        isPhaseChangingRef.current = true;
        console.log(`Wall-clock phase change: ${prev} → ${phase}`);
        setWallPhase(phase);

        // Always call onComplete on transition (including to complete) — drives results screen
        onComplete();

        setTimeout(() => {
          isPhaseChangingRef.current = false;
        }, 100);
      } else if (prev === null) {
        // First tick — set phase without calling onComplete
        setWallPhase(phase);
      }

      prevPhaseRef.current = phase;
      setWallTimeLeft(Math.max(0, timeLeft));
    };

    tick(); // run immediately
    intervalRef.current = setInterval(tick, 500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isWallClock, isMatchComplete, fixtureStart, setDurationSeconds, breakDurationSeconds]);

  // ─── Manual timer (fallback) ───────────────────────────────────────────────
  const manualProgressToNextPhase = useCallback(() => {
    if (manualIsPhaseChangingRef.current) return;
    manualIsPhaseChangingRef.current = true;

    setManualPhase(prev => {
      const phases: MatchPhase[] = [
        "not_started",
        "set1",
        "break1",
        "set2",
        "break2",
        "set3",
        "final_break",
        "complete"
      ];
      const currentIndex = phases.indexOf(prev);
      const nextPhase = phases[currentIndex + 1];

      if (!nextPhase) {
        manualIsPhaseChangingRef.current = false;
        return prev;
      }

      console.log(`Manual phase: ${prev} → ${nextPhase}`);

      if (nextPhase === 'complete') {
        setManualIsRunning(false);
        onComplete();
      } else {
        const phaseTime = nextPhase.includes('break') ? breakDurationSeconds : setDurationSeconds;
        setManualTimeLeft(phaseTime);
        setManualIsRunning(true);
        if (currentIndex > 0) {
          onComplete();
        }
      }

      setTimeout(() => {
        manualIsPhaseChangingRef.current = false;
      }, 100);

      return nextPhase;
    });
  }, [breakDurationSeconds, setDurationSeconds, onComplete]);

  // Manual interval
  useEffect(() => {
    if (isWallClock) return;

    if (manualIntervalRef.current) {
      clearInterval(manualIntervalRef.current);
      manualIntervalRef.current = null;
    }

    if (manualIsRunning && manualTimeLeft > 0 && !isMatchComplete) {
      manualIntervalRef.current = setInterval(() => {
        setManualTimeLeft(prev => {
          if (prev <= 1) {
            if (manualIntervalRef.current) {
              clearInterval(manualIntervalRef.current);
              manualIntervalRef.current = null;
            }
            setTimeout(() => {
              if (!manualIsPhaseChangingRef.current) {
                manualProgressToNextPhase();
              }
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (manualIsRunning && manualTimeLeft === 0 && !isMatchComplete && !manualIsPhaseChangingRef.current) {
      manualProgressToNextPhase();
    }

    return () => {
      if (manualIntervalRef.current) {
        clearInterval(manualIntervalRef.current);
        manualIntervalRef.current = null;
      }
    };
  }, [isWallClock, manualIsRunning, manualTimeLeft, isMatchComplete, manualProgressToNextPhase]);

  // ─── Public handlers ───────────────────────────────────────────────────────

  const handleStartStop = () => {
    if (isWallClock) return; // wall-clock: no manual start/stop
    if (manualPhase === "not_started") {
      setManualPhase("set1");
      setManualIsRunning(true);
    } else if (!isMatchComplete) {
      setManualIsRunning(r => !r);
    }
  };

  const handleReset = () => {
    if (isWallClock) {
      // Shift offset so current phase restarts from now
      if (fixtureStart) {
        const now = Date.now();
        const elapsedSeconds = (now - fixtureStart.getTime()) / 1000;
        const { phaseStart } = computePhaseFromElapsed(
          elapsedSeconds,
          setDurationSeconds,
          breakDurationSeconds,
          timeOffsetRef.current
        );
        // We want: adjusted = elapsedSeconds + newOffset to equal phaseStart
        // So: newOffset = phaseStart - elapsedSeconds
        timeOffsetRef.current = phaseStart - elapsedSeconds;
        isPhaseChangingRef.current = false;
        console.log('Wall-clock reset: new offset', timeOffsetRef.current);
      }
    } else {
      if (!isMatchComplete) {
        setManualTimeLeft(setDurationSeconds);
        setManualIsRunning(false);
      }
    }
  };

  const handleSkipPhase = () => {
    if (isWallClock) {
      if (fixtureStart) {
        const now = Date.now();
        const elapsedSeconds = (now - fixtureStart.getTime()) / 1000;
        const { phaseEnd } = computePhaseFromElapsed(
          elapsedSeconds,
          setDurationSeconds,
          breakDurationSeconds,
          timeOffsetRef.current
        );
        // Jump to end of current phase: adjusted = phaseEnd => newOffset = phaseEnd - elapsedSeconds
        timeOffsetRef.current = phaseEnd - elapsedSeconds;
        isPhaseChangingRef.current = false;
        console.log('Wall-clock skip: jumping to offset', timeOffsetRef.current);
      }
    } else {
      if (manualIntervalRef.current) {
        clearInterval(manualIntervalRef.current);
        manualIntervalRef.current = null;
      }
      setManualTimeLeft(0);
      if (!manualIsPhaseChangingRef.current) {
        manualProgressToNextPhase();
      }
    }
  };

  const progressToNextPhase = () => {
    if (isWallClock) {
      handleSkipPhase();
    } else {
      manualProgressToNextPhase();
    }
  };

  // ─── Expose unified state ──────────────────────────────────────────────────
  const timeLeft = isWallClock ? wallTimeLeft : manualTimeLeft;
  const isRunning = isWallClock ? (wallPhase !== "not_started" && wallPhase !== "complete" && wallPhase !== "final_break") : manualIsRunning;
  const matchPhase = isWallClock ? wallPhase : manualPhase;

  return {
    timeLeft,
    isRunning,
    matchPhase,
    handleStartStop,
    handleReset,
    handleSkipPhase,
    progressToNextPhase
  };
};
