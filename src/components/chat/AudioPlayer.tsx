import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  durationSeconds?: number;
  isOutgoing?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  durationSeconds = 0,
  isOutgoing = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const handleLoaded = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(Math.round(audio.duration));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(Math.round(audio.currentTime));
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoaded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoaded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio playback prevented:', err);
      });
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-2xl min-w-[200px] sm:min-w-[240px] ${
        isOutgoing ? 'bg-indigo-700/80 text-white' : 'bg-slate-100 text-slate-800'
      }`}
    >
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center shadow-xs transition-transform active:scale-95 ${
          isOutgoing
            ? 'bg-white text-indigo-700 hover:bg-slate-100'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 space-y-1">
        {/* Fake waveform / progress bar */}
        <div className="flex items-center gap-0.5 h-4">
          {[40, 75, 55, 90, 60, 85, 30, 95, 70, 45, 80, 60, 90, 40, 70, 50, 80].map((h, idx) => {
            const barProgress = (idx / 17) * 100;
            const isFilled = barProgress <= progress;
            return (
              <span
                key={idx}
                style={{ height: `${h}%` }}
                className={`w-1 rounded-full transition-colors ${
                  isFilled
                    ? isOutgoing
                      ? 'bg-amber-300'
                      : 'bg-indigo-600'
                    : isOutgoing
                    ? 'bg-indigo-400/50'
                    : 'bg-slate-300'
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono opacity-85">
          <span>{formatTime(currentTime)}</span>
          <span className="flex items-center gap-1">
            <Volume2 className="w-2.5 h-2.5" />
            {formatTime(duration || durationSeconds)}
          </span>
        </div>
      </div>
    </div>
  );
};
