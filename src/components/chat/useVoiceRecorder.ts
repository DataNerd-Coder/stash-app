import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Real microphone capture via getUserMedia + MediaRecorder. The recorded audio
 * is currently discarded — when there's a speech-to-text backend, collect the
 * MediaRecorder chunks here and send the Blob.
 */
export function useVoiceRecorder({ onFinish, onError }: { onFinish: () => void; onError: () => void }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  const stopStream = useCallback(() => {
    window.clearInterval(timerRef.current);
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        /* already stopped */
      }
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setRecording(false);
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) return;
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      onError();
      return;
    }
    try {
      recorderRef.current = new MediaRecorder(streamRef.current);
      recorderRef.current.start();
    } catch {
      /* recorder is optional — the UI still works without it */
    }
    setSeconds(0);
    setRecording(true);
    timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
  }, [onError]);

  const cancel = useCallback(() => {
    if (streamRef.current) stopStream();
  }, [stopStream]);

  const finish = useCallback(() => {
    if (!streamRef.current) return;
    stopStream();
    onFinish();
  }, [stopStream, onFinish]);

  // release the microphone if the chat unmounts mid-recording
  useEffect(() => stopStream, [stopStream]);

  const timer = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return { recording, timer, start, cancel, finish };
}
