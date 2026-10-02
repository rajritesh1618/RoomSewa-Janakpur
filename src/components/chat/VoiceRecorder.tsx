import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, AlertCircle } from 'lucide-react';

interface VoiceRecorderProps {
  onSendVoice: (audioDataUrl: string, durationSeconds: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSendVoice, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopCleanup();
    };
  }, []);

  const stopCleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  };

  const startRecording = async () => {
    setError(null);
    audioChunksRef.current = [];
    setSeconds(0);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone recording is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= 60) {
            handleFinishAndSend();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Mic Error:', err);
      setError(err.message || 'Microphone access denied or unavailable.');
    }
  };

  const handleFinishAndSend = () => {
    if (!mediaRecorderRef.current) return;

    const recordedSeconds = Math.max(1, seconds);
    const mediaRecorder = mediaRecorderRef.current;

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      if (audioBlob.size > 800 * 1024) {
        alert('Voice recording is too long for direct messaging. Please record a shorter voice note under 60 seconds.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        onSendVoice(base64data, recordedSeconds);
      };
      reader.readAsDataURL(audioBlob);
    };

    stopCleanup();
    setIsRecording(false);
  };

  const handleCancelRecording = () => {
    stopCleanup();
    setIsRecording(false);
    onCancel();
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (error) {
    return (
      <div className="flex items-center justify-between p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-slate-900 text-white rounded-2xl animate-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <span className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping absolute" />
          <span className="w-3.5 h-3.5 rounded-full bg-rose-600 relative" />
        </div>
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-bold tracking-wider">{formatTimer(seconds)}</span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">Recording voice note...</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCancelRecording}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          title="Delete voice note"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleFinishAndSend}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <span>Send Voice</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
