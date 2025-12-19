import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause } from 'lucide-react';

interface WaveformProps {
  audioUrl: string;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  onReady?: () => void;
}

const Waveform: React.FC<WaveformProps> = ({ 
  audioUrl, 
  height = 64, 
  waveColor = '#64748b', 
  progressColor = '#818cf8',
  onReady
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: waveColor,
      progressColor: progressColor,
      url: audioUrl,
      height: height,
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      cursorWidth: 1,
      cursorColor: '#fff',
    });

    wavesurfer.current.on('ready', () => {
      setIsReady(true);
      if (onReady) onReady();
    });

    wavesurfer.current.on('finish', () => {
      setIsPlaying(false);
    });

    return () => {
      wavesurfer.current?.destroy();
    };
  }, [audioUrl, height, waveColor, progressColor, onReady]);

  const togglePlay = () => {
    if (wavesurfer.current) {
      if (isPlaying) {
        wavesurfer.current.pause();
      } else {
        wavesurfer.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex items-center gap-4 w-full">
      <button 
        onClick={togglePlay}
        disabled={!isReady}
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
      </button>
      <div className="flex-grow relative" ref={containerRef} />
    </div>
  );
};

export default Waveform;