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
}

export interface SeriesBible {
  summary: string;
  characters: Character[];
  locations: { name: string; visual_description: string }[];
  art_style_guide: string;
}

export interface VisualPlanResponse {
  chapter_mood: ChapterMood;
  characters: Character[];
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
  step: 'input' | 'planning' | 'gallery';
  chapterText: string;
  contextText: string;
  
  // New Metadata Fields
  bookTitle: string;
  bookAuthor: string;
  bookGenre: string;

  selectedProfile: VideoProfile;
  mood: ChapterMood | null;
  characters: Character[];
  visuals: VisualItem[];
  files: UploadedFile[];
  contextFiles: UploadedFile[];
  
  // RAG / Agent State
  bible: SeriesBible | null;
  isAnalyzingBible: boolean;
  isThinking: boolean;
}