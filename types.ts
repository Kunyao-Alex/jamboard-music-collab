export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  email: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: number;
}

export type ClipCategory = 'Riffs' | 'Vocals' | 'Drums' | 'Synths' | 'Other';

export interface JamClip {
  id: string;
  title: string;
  audioUrl: string; // Blob URL
  audioBlob?: Blob; // The actual blob for analysis
  duration: number;
  tags: string[];
  category?: ClipCategory;
  createdAt: number;
  userId: string;
  user: User;
  comments: Comment[];
  aiAnalysis?: string;
  isAnalyzing?: boolean;
}

export enum RecorderState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PAUSED = 'PAUSED',
}

export type Theme = 'light' | 'dark';