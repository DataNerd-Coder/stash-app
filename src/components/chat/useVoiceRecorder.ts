import { useCallback, useEffect, useRef, useState } from "react";

const MAX_SECONDS = 120; // keeps uploads well under Vercel's 4.5 MB body limit

/**
 * Microphone capture via getUserMedia + MediaRecorder. `onFinish` receives the
 * recorded audio (usually webm/opus, mp4 on Safari) when the owner taps send.
 */
export function useVoiceRecorder({ onFinish, onError }: { onFinish: (audio: Blob) => void; onError: () => void }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | undefined>(undefined);
  const finishRef = useRef<() => void>(() => {});

  /** Stops everything; resolves with the recorded audio (empty if none). */
  const stop = useCallback(async (): Promise<Blob> => {
    window.clearInterval(timerRef.current);
    const recorder = recorderRef.current;
    recorderRef.current = null;
    let audio = new Blob();
    if (recorder && recorder.state !== "inactive") {
      // the last chunk only arrives with the "stop" event
      audio = await new Promise<Blob>((resolve) => {
        recorder.addEventListener("stop", () => resolve(new Blob(chunksRef.current, { type: recorder.mimeType })), { once: true });
        try {
          recorder.stop();
        } catch {
          resolve(new Blob(chunksRef.current, { type: recorder.mimeType }));
        }
      });
    }
    chunksRef.current = [];
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setRecording(false);
    return audio;
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) return;
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(streamRef.current);
      recorder.addEventListener("dataavailable", (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      });
      recorder.start(1000);
      recorderRef.current = recorder;
    } catch {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      onError();
      return;
    }
    setSeconds(0);
    setRecording(true);
    timerRef.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_SECONDS) finishRef.current();
        return s + 1;
      });
    }, 1000);
  }, [onError]);

  const cancel = useCallback(() => {
    if (streamRef.current) void stop();
  }, [stop]);

  const finish = useCallback(async () => {
    if (!streamRef.current) return;
    const audio = await stop();
    if (audio.size > 0) onFinish(audio);
    else onError();
  }, [stop, onFinish, onError]);

  useEffect(() => {
    finishRef.current = () => void finish();
  }, [finish]);

  // release the microphone if the chat unmounts mid-recording
  useEffect(() => () => void stop(), [stop]);

  const timer = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return { recording, timer, start, cancel, finish: () => void finish() };
}
