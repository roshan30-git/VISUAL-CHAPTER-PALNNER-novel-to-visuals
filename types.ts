

export enum VisualType {
  Character = 'character_anchor',
  Mood = 'mood',
  Location = 'location',
  Action = 'action',
  Symbolic = 'symbolic',
}

export type VideoProfile = 'Novel Explanation' | 'Anime Recap' | 'Manhwa Summary';

export interface VisualItem {
  id: string;
  type: VisualType | string;
  description: string;
  reuse: boolean;
  status: 'pending' | 'generating' | 'done' | 'error';
  imageUrl?: string;
}

export interface ChapterMood {
  tone: string;
  palette_hint: string;
}

export interface Character {
  name: string;
  physical_description: string;
  imageUrl?: string; // For the visual reference sheet
  status?: 'pending' | 'generating' | 'done' | 'error';
}

export interface SeriesBible {
  summary: string;
  characters: Character[];
  locations: { name: string; visual_description: string }[];
  art_style_guide: string;
}

export interface EmotionPoint {
  beat_description: string;
  emotion_label: string; // e.g., "Tension", "Relief", "Romance"
  intensity: number; // 1 to 10
  color_hex: string; // e.g., "#FF0000"
}

export interface VisualPlanResponse {
  chapter_mood: ChapterMood;
  characters: Character[];
  emotion_arc: EmotionPoint[];
  visuals: {
    type: string;
    description: string;
    reuse: boolean;
  }[];
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  data: string; // Base64 data string including mime type prefix
}

export interface AppState {
  step: 'input' | 'planning';
  planningTab: 'storyboard' | 'characters'; // New tab state
  chapterText: string;
  contextText: string;
  
  // New Metadata Fields
  bookTitle: string;
  bookAuthor: string;
  bookGenre: string;

  selectedProfile: VideoProfile;
  imageAspectRatio: string; // New: Selected aspect ratio for generated images
  mood: ChapterMood | null;
  characters: Character[];
  emotionArc: EmotionPoint[]; // Store the heatmap data
  visuals: VisualItem[];
  files: UploadedFile[];
  contextFiles: UploadedFile[];
  
  // RAG / Agent State
  bible: SeriesBible | null;
  isAnalyzingBible: boolean;
  isThinking: boolean;
}