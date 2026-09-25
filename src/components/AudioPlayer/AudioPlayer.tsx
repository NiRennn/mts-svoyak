import React, { useState, useRef, useEffect } from "react";
import "./AudioPlayer.scss";

interface AudioPlayerProps {
  src: string;
  isPaused?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, isPaused }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [prevVolume, setPrevVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Pause when parent passes isPaused (e.g. modal opens or question finishes)
  useEffect(() => {
    if (isPaused && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isPaused]);

  // Clean up and reset when source changes or unmounts
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("Audio playback error:", err);
          setIsPlaying(false);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (!isDragging && audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (!isDragging && audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleSeekStart = () => {
    setIsDragging(true);
  };

  const handleSeekEnd = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setIsDragging(false);
    const target = e.currentTarget as HTMLInputElement;
    const val = Number(target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleToggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted || volume === 0) {
      const restored = prevVolume > 0 ? prevVolume : 0.8;
      audioRef.current.volume = restored;
      audioRef.current.muted = false;
      setVolume(restored);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      audioRef.current.volume = 0;
      audioRef.current.muted = true;
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
    setVolume(val);
    setIsMuted(val === 0);
    if (val > 0) {
      setPrevVolume(val);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
  };

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;
  const volumePercent = (isMuted ? 0 : volume) * 100;

  return (
    <div className="audio_player">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleMetadata}
        onDurationChange={handleMetadata}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />

      <button
        type="button"
        className="audio_player__play_btn"
        onClick={togglePlay}
        aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
      >
        {isPlaying ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div className="audio_player__main">
        <div className="audio_player__scrubber_wrap">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeekChange}
            onMouseDown={handleSeekStart}
            onTouchStart={handleSeekStart}
            onMouseUp={handleSeekEnd}
            onTouchEnd={handleSeekEnd}
            className="audio_player__slider audio_player__slider--scrub"
            style={{
              background: `linear-gradient(to right, #ff0032 0%, #ff0032 ${progressPercent}%, rgba(255, 255, 255, 1) ${progressPercent}%, rgba(255, 255, 255,1) 100%)`,
            }}
            aria-label="Перемотка аудио"
          />
        </div>

        <div className="audio_player__footer">
          <span className="audio_player__time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="audio_player__volume_wrap">
            <button
              type="button"
              className="audio_player__mute_btn"
              onClick={handleToggleMute}
              aria-label={isMuted || volume === 0 ? "Включить звук" : "Выключить звук"}
            >
              {isMuted || volume === 0 ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="audio_player__slider audio_player__slider--volume"
              style={{
                background: `linear-gradient(to right, #ff0032 0%, #ff0032 ${volumePercent}%, rgba(255, 255, 255, 1) ${volumePercent}%, rgba(255, 255, 255, 1) 100%)`,
              }}
              aria-label="Громкость"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
