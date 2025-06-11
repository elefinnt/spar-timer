"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";

export default function Component() {
  const [roundTime, setRoundTime] = useState(180); // 3 minutes in seconds
  const [restTime, setRestTime] = useState(60); // 1 minute in seconds
  const [totalRounds, setTotalRounds] = useState(5);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(180);
  const [isRunning, setIsRunning] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const [roundMinutes, setRoundMinutes] = useState(3);
  const [roundSeconds, setRoundSeconds] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);

  const playBeep = (frequency: number, duration: number) => {
    if (!audioEnabled) return;

    try {
      audioContextRef.current ??= new (window.AudioContext ??
        window.AudioContext)();

      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = "square";

      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContextRef.current.currentTime + duration,
      );

      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration);
    } catch (error) {
      console.log("Audio not supported");
    }
  };

  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch (error) {
      console.log("Wake lock not supported or failed:", error);
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      void wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  useEffect(() => {
    // Update roundTime when minutes or seconds change
    setRoundTime(roundMinutes * 60 + roundSeconds);
  }, [roundMinutes, roundSeconds]);

  useEffect(() => {
    if (isRunning && !isFinished) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time's up for current period - play alert
            if (isResting) {
              // Rest period ended, start next round
              playBeep(800, 0.5); // Higher pitch for round start
              if (currentRound < totalRounds) {
                setCurrentRound((prev) => prev + 1);
                setIsResting(false);
                return roundTime;
              } else {
                // All rounds completed
                playBeep(1000, 1); // Long beep for completion
                releaseWakeLock();
                setIsFinished(true);
                setIsRunning(false);
                return 0;
              }
            } else {
              // Round ended, start rest period
              playBeep(400, 0.5); // Lower pitch for rest start
              setIsResting(true);
              return restTime;
            }
          }

          // Warning beeps for last 3 seconds
          if (prev <= 3 && prev > 0) {
            playBeep(600, 0.1);
          }

          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    isRunning,
    isResting,
    currentRound,
    totalRounds,
    roundTime,
    restTime,
    isFinished,
    audioEnabled,
  ]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    if (showSettings) {
      setShowSettings(false);
      const totalRoundTime = roundMinutes * 60 + roundSeconds;
      setRoundTime(totalRoundTime);
      setTimeLeft(totalRoundTime);
    }
    setIsRunning(true);
    void requestWakeLock();
  };

  const handlePause = () => {
    setIsRunning(false);
    releaseWakeLock();
  };

  const handleReset = () => {
    setIsRunning(false);
    releaseWakeLock();
    setCurrentRound(1);
    const totalRoundTime = roundMinutes * 60 + roundSeconds;
    setRoundTime(totalRoundTime);
    setTimeLeft(totalRoundTime);
    setIsResting(false);
    setIsFinished(false);
    setShowSettings(true);
  };

  const getStatusColor = () => {
    if (isFinished) return "bg-green-500";
    if (isResting) return "bg-blue-500";
    return "bg-red-500";
  };

  const getStatusText = () => {
    if (isFinished) return "Training Complete!";
    if (isResting) return `Rest - Round ${currentRound} of ${totalRounds}`;
    return `Round ${currentRound} of ${totalRounds}`;
  };

  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, []);

  if (showSettings) {
    return (
      <div className="mx-auto w-full max-w-md p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Timer Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Round Time</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label
                    htmlFor="round-minutes"
                    className="text-muted-foreground text-sm"
                  >
                    Minutes
                  </Label>
                  <Input
                    id="round-minutes"
                    type="number"
                    min="0"
                    max="60"
                    value={roundMinutes}
                    onChange={(e) =>
                      setRoundMinutes(Number.parseInt(e.target.value) || 0)
                    }
                    className="text-center text-lg"
                  />
                </div>
                <div className="flex-1">
                  <Label
                    htmlFor="round-seconds"
                    className="text-muted-foreground text-sm"
                  >
                    Seconds
                  </Label>
                  <Input
                    id="round-seconds"
                    type="number"
                    min="0"
                    max="59"
                    value={roundSeconds}
                    onChange={(e) =>
                      setRoundSeconds(Number.parseInt(e.target.value) || 0)
                    }
                    className="text-center text-lg"
                  />
                </div>
              </div>
              <div className="text-muted-foreground text-center text-sm">
                Total: {Math.floor((roundMinutes * 60 + roundSeconds) / 60)}:
                {((roundMinutes * 60 + roundSeconds) % 60)
                  .toString()
                  .padStart(2, "0")}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rest-time">Rest Time (seconds)</Label>
              <Input
                id="rest-time"
                type="number"
                min="10"
                max="300"
                value={restTime}
                onChange={(e) => setRestTime(Number.parseInt(e.target.value))}
                className="text-center text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total-rounds">Total Rounds</Label>
              <Input
                id="total-rounds"
                type="number"
                min="1"
                max="20"
                value={totalRounds}
                onChange={(e) =>
                  setTotalRounds(Number.parseInt(e.target.value))
                }
                className="text-center text-lg"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="audio-enabled"
                checked={audioEnabled}
                onChange={(e) => setAudioEnabled(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="audio-enabled" className="text-sm">
                Enable audio alerts
              </Label>
            </div>

            <div className="text-muted-foreground mt-2 text-xs">
              📱 Screen will stay awake during training sessions
            </div>

            <Button
              onClick={handleStart}
              className="w-full"
              size="lg"
              disabled={roundMinutes === 0 && roundSeconds === 0}
            >
              <Play className="mr-2 h-5 w-5" />
              Start Training
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md p-4">
      <Card>
        <CardHeader className="text-center">
          <div
            className={`${getStatusColor()} mb-2 rounded-lg px-4 py-2 text-white`}
          >
            <CardTitle className="text-lg sm:text-xl">
              {getStatusText()}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="font-mono text-6xl font-bold tabular-nums sm:text-7xl">
              {formatTime(timeLeft)}
            </div>
            <div className="text-muted-foreground mt-2 text-sm">
              {isResting ? "Rest Time" : "Round Time"}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            {!isRunning ? (
              <Button
                onClick={handleStart}
                size="lg"
                className="max-w-32 flex-1"
              >
                <Play className="mr-2 h-5 w-5" />
                Start
              </Button>
            ) : (
              <Button
                onClick={handlePause}
                size="lg"
                variant="secondary"
                className="max-w-32 flex-1"
              >
                <Pause className="mr-2 h-5 w-5" />
                Pause
              </Button>
            )}
            <Button
              onClick={handleReset}
              size="lg"
              variant="outline"
              className="max-w-32 flex-1"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Reset
            </Button>
          </div>

          {!isFinished && (
            <div className="space-y-2">
              <div className="text-muted-foreground flex justify-between text-sm">
                <span>Progress</span>
                <span>
                  {currentRound} / {totalRounds} rounds
                </span>
              </div>
              <div className="bg-muted h-2 w-full rounded-full">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentRound - 1) / totalRounds) * 100 + (isResting ? 0 : ((roundTime - timeLeft) / roundTime) * (1 / totalRounds) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {isFinished && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
              <div className="font-semibold text-green-800">
                🥊 Great job! Training session complete!
              </div>
              <div className="mt-1 text-sm text-green-600">
                {totalRounds} rounds × {Math.floor(roundTime / 60)}:
                {(roundTime % 60).toString().padStart(2, "0")} each
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
