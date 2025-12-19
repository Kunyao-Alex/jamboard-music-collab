import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Save, RotateCcw, Activity } from 'lucide-react';
import { RecorderState } from '../types';

interface RecorderProps {
  onSave: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

const Recorder: React.FC<RecorderProps> = ({ onSave, onCancel }) => {
  const [state, setState] = useState<RecorderState>(RecorderState.IDLE);
  const [duration, setDuration] = useState(0);
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(30).fill(10));
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const chunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false); // Ref to track recording state avoiding closure staleness

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup Audio Context for visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 64;
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Setup Media Recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(100); // Collect chunks every 100ms
      startTimeRef.current = Date.now();
      isRecordingRef.current = true;
      setState(RecorderState.RECORDING);
      
      drawVisualizer();
      
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please ensure you have granted permissions.");
    }
  };

  const drawVisualizer = () => {
    if (!analyserRef.current || !isRecordingRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Normalize and pick a subset for the bars
    const bars = [];
    const step = Math.floor(bufferLength / 30);
    for (let i = 0; i < 30; i++) {
      const val = dataArray[i * step] || 0;
      bars.push(Math.max(10, (val / 255) * 100));
    }
    setVisualizerData(bars);

    setDuration((Date.now() - startTimeRef.current) / 1000);
    animationFrameRef.current = requestAnimationFrame(drawVisualizer);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === RecorderState.RECORDING) {
      isRecordingRef.current = false;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        // Clean up tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        onSave(blob, duration);
      };
      setState(RecorderState.IDLE);
    }
  };

  const handleCancel = () => {
    isRecordingRef.current = false;
    if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    onCancel();
  };

  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="text-orange-600 dark:text-orange-500" />
          Recording New Idea
        </h3>
        <div className="text-2xl font-mono text-blue-600 dark:text-blue-400 font-semibold">
          {formatTime(duration)}
        </div>
      </div>

      {/* Visualizer */}
      <div className="h-32 bg-slate-50 dark:bg-slate-900 rounded-lg mb-6 flex items-end justify-center gap-1 p-4 overflow-hidden relative border border-slate-100 dark:border-slate-800">
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-xs text-red-500 font-medium">REC</span>
        </div>
        {visualizerData.map((height, i) => (
          <div 
            key={i}
            className="w-2 bg-blue-500 rounded-t-sm transition-all duration-75 ease-linear"
            style={{ height: `${height}%`, opacity: 0.6 + (height/200) }}
          />
        ))}
      </div>

      <div className="flex justify-center gap-4">
        {state === RecorderState.IDLE && (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold shadow-lg shadow-red-600/20 transition-all hover:scale-105"
          >
            <Mic size={20} />
            Start Recording
          </button>
        )}

        {state === RecorderState.RECORDING && (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-8 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-full font-bold transition-all"
          >
            <Square size={20} fill="currentColor" />
            Stop & Finish
          </button>
        )}

        <button 
          onClick={handleCancel}
          className="px-6 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default Recorder;