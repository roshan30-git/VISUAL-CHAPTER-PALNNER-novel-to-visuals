import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { AppState, VideoProfile, VisualItem, VisualType, UploadedFile, SeriesBible, Character, ChapterMood, EmotionPoint } from './types';
import { generateVisualPlan, generateImageForItem, regenerateVisualDescription, generateSeriesBible, generateCharacterPortrait, editVisualImage } from './services/gemini';
import { Button } from './components/Button';
import { VisualCard } from './components/VisualCard';
import { Heatmap } from './components/Heatmap';
import { CharacterBible } from './components/CharacterBible';
import { Sparkles, FileText, ChevronRight, Settings2, Download, Image as ImageIcon, BookOpen, AlertCircle, Users, Paperclip, X, FileType, MonitorPlay, ScrollText, ChevronDown, Star, Database, Check, Loader2, Edit2, Save, ArrowRight, Trash2, Globe, LayoutGrid, Palette, Forward, PowerOff } from 'lucide-react';

// --- Sub-Components ---

const FileList = ({ files, isContext = false, onRemove }: { files: UploadedFile[], isContext?: boolean, onRemove: (id: string, isContext?: boolean) => void }) => (
  <AnimatePresence>
    {files.length > 0 && (
      <motion.div 
         initial={{ height: 0, opacity: 0 }}
         animate={{ height: 'auto', opacity: 1 }}
         exit={{ height: 0, opacity: 0 }}
         className={`flex flex-wrap gap-2 overflow-hidden ${isContext ? 'mt-2' : 'absolute bottom-4 left-4 right-4 z-20 pointer-events-none pr-8'}`}
      >
        {files.map(file => (
          <motion.div 
           key={file.id} 
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           exit={{ scale: 0.9, opacity: 0 }}
           className="relative pointer-events-auto group flex items-center gap-2 bg-black/60 backdrop-blur-md pl-2 pr-6 py-1.5 rounded-md border border-white/10 max-w-[200px]"
          >
            <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center shrink-0 text-white/60">
              {file.type.includes('image') ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
            </div>
            <span className="text-[10px] text-white/80 truncate block max-w-[100px]">{file.name}</span>
            <button 
             onClick={(e) => { e.stopPropagation(); onRemove(file.id, isContext); }}
             className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white rounded-full transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
      </motion.div>
    )}
  </AnimatePresence>
);

interface InputViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  contextFileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContextFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (id: string, isContext?: boolean) => void;
  onGenerate: () => void;
  onAnalyzeBible: () => void;
  onLoadDemo: () => void;
  isContextOpen: boolean;
  setIsContextOpen: (v: boolean) => void;
  errorMsg: string | null;
}

const InputView: React.FC<InputViewProps> = ({
  state,
  setState,
  fileInputRef,
  contextFileInputRef,
  onFileSelect,
  onContextFileSelect,
  onRemoveFile,
  onGenerate,
  onAnalyzeBible,
  onLoadDemo,
  isContextOpen,
  setIsContextOpen,
  errorMsg
}) => {
  const profiles: { id: VideoProfile, icon: any, label: string, tag: string, color: string }[] = [
    { id: 'Novel Explanation', icon: BookOpen, label: 'Novel Explanation', tag: 'CINEMATIC', color: 'blue' },
    { id: 'Anime Recap', icon: MonitorPlay, label: 'Anime Recap', tag: 'CEL SHADED', color: 'purple' },
    { id: 'Manhwa Summary', icon: ScrollText, label: 'Manhwa Summary', tag: 'WEBTOON', color: 'green' }
  ];

  const aspectRatios = ['16:9', '1:1', '4:3', '9:16', '3:4'];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="max-w-6xl mx-auto w-full pt-8 md:pt-16 px-4 pb-20"
    >
      {/* Header Section */}
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-b from-white via-white to-white/40 text-transparent bg-clip-text tracking-tight pb-2">Visual Chapter Planner</h1>
        <p className="text-white/40 text-lg font-light">Turn narrative text, PDFs, or images into a structured visual sequence.</p>
        <button 
          onClick={onLoadDemo} 
          className="text-accent/80 hover:text-accent text-sm font-medium transition-colors flex items-center gap-1.5 mx-auto py-2"
        >
          <Sparkles className="w-4 h-4" />
          See a Demo Project
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Column: Source Material */}
        <div className="lg:col-span-8 space-y-6">
          <h2 className="text-lg font-medium text-white/90 pl-1">Source Material</h2>
          
          {/* Main Source Input */}
          <div className={`relative group bg-gradient-to-b from-white/[0.05] to-transparent hover:from-white/[0.07] hover:to-white/[0.01] border rounded-2xl h-[360px] transition-all duration-300 backdrop-blur-sm ${errorMsg ? 'border-red-500/50' : 'border-white/10 hover:border-white/20'}`}>
             
             {/* Floating Attach Button */}
             <div className="absolute top-4 right-4 z-10">
                <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 multiple 
                 accept="application/pdf,image/png,image/jpeg,image/webp,.txt,.md,.csv,text/plain"
                 onChange={onFileSelect}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-900/30 transition-all hover:scale-105 active:scale-95"
                >
                   <Paperclip className="w-3.5 h-3.5" />
                   Attach PDF / Image
                </button>
             </div>

             <textarea
               value={state.chapterText}
               onChange={(e) => setState(prev => ({ ...prev, chapterText: e.target.value }))}
               placeholder="Paste chapter content here..."
               // Added overflow-y-auto and pr-36 (padding-right) to avoid overlap with the button and ensure scrollability
               className="w-full h-full bg-transparent p-6 pr-36 text-base text-white/90 focus:outline-none resize-none placeholder-white/20 font-light scrollbar-thin rounded-2xl overflow-y-auto"
             />
             
             <FileList files={state.files} onRemove={onRemoveFile} />

             {errorMsg && (
                <div className="absolute inset-x-0 -bottom-12 flex justify-center">
                   <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm px-4 py-2 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2 fade-in">
                      <AlertCircle className="w-4 h-4" />
                      {errorMsg}
                   </div>
                </div>
             )}
          </div>

          {/* Context Section */}
          <div className={`bg-gradient-to-b from-white/[0.05] to-transparent border rounded-xl overflow-hidden transition-all duration-300 ${state.bible ? 'border-green-500/30 bg-green-500/[0.05]' : 'border-white/10'}`}>
             <button 
               onClick={() => setIsContextOpen(!isContextOpen)}
               className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
             >
               <div className="flex items-center gap-2">
                 <span className={`transition-transform duration-200 ${isContextOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4 text-white/60" />
                 </span>
                 <span className="text-sm font-medium text-white/70">Add Book-level Context (Optional)</span>
               </div>
               {state.bible && <div className="flex items-center gap-1 text-green-400 text-xs font-medium"><Check className="w-3 h-3" /> Active</div>}
             </button>

             <AnimatePresence>
               {isContextOpen && (
                 <motion.div 
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 'auto', opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   className="px-4 pb-6 space-y-4"
                 >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                         <label className="text-[10px] uppercase tracking-wider text-white/30 font-semibold pl-1">Book Title</label>
                         <input 
                           value={state.bookTitle}
                           onChange={(e) => setState(prev => ({...prev, bookTitle: e.target.value}))}
                           placeholder="Book Title" 
                           className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors focus:bg-black/40"
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] uppercase tracking-wider text-white/30 font-semibold pl-1">Author</label>
                         <input 
                           value={state.bookAuthor}
                           onChange={(e) => setState(prev => ({...prev, bookAuthor: e.target.value}))}
                           placeholder="Author" 
                           className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors focus:bg-black/40"
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] uppercase tracking-wider text-white/30 font-semibold pl-1">Genre</label>
                         <input 
                           value={state.bookGenre}
                           onChange={(e) => setState(prev => ({...prev, bookGenre: e.target.value}))}
                           placeholder="Genre" 
                           className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors focus:bg-black/40"
                         />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex-1 w-full">
                         <div className="flex items-center justify-between mb-2">
                           <span className="text-[10px] uppercase tracking-wider text-white/30 font-semibold pl-1">Background Files</span>
                           <button 
                             onClick={() => contextFileInputRef.current?.click()}
                             className="text-[10px] flex items-center gap-1.5 text-accent hover:text-accent/80 transition-colors"
                           >
                              <Paperclip className="w-3 h-3" /> Attach Full PDF/TXT
                              <input 
                               type="file" 
                               ref={contextFileInputRef} 
                               className="hidden" 
                               multiple 
                               accept="application/pdf,text/plain,.txt,.md" 
                               onChange={onContextFileSelect}
                             />
                           </button>
                         </div>
                         <div className="min-h-[40px]">
                            <FileList files={state.contextFiles} isContext onRemove={onRemoveFile} />
                            {!state.contextFiles.length && !state.bible && <p className="text-white/20 text-xs italic pl-1">Optional: Attach full books for AI analysis.</p>}
                         </div>
                      </div>

                      {/* Analysis Button */}
                      {!state.bible && (state.contextFiles.length > 0 || state.bookTitle.trim()) && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={onAnalyzeBible}
                          disabled={state.isAnalyzingBible}
                          className={`mt-2 md:mt-0 px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap flex items-center gap-2 ${
                            state.contextFiles.length === 0 
                              ? "bg-white/10 text-white border border-white/10 hover:bg-white/15" 
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                          }`}
                        >
                           {state.isAnalyzingBible ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                              state.contextFiles.length === 0 ? <Globe className="w-3 h-3" /> : <Database className="w-3 h-3" />
                           )}
                           {state.isAnalyzingBible 
                             ? "Processing..." 
                             : (state.contextFiles.length === 0 ? "Enable Web Research" : "Process File")
                           }
                        </motion.button>
                      )}
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Style & Actions */}
        <div className="lg:col-span-4 space-y-6">
          <h2 className="text-lg font-medium text-white/90 pl-1">Output Style</h2>
          
          <div className="grid grid-cols-3 gap-3">
             {profiles.map((p) => {
               const isSelected = state.selectedProfile === p.id;
               const Icon = p.icon;
               return (
                 <button
                   key={p.id}
                   onClick={() => setState(prev => ({ ...prev, selectedProfile: p.id }))}
                   className={`relative flex flex-col items-center justify-center p-3 rounded-xl border aspect-square gap-2 transition-all duration-300 group overflow-hidden ${
                     isSelected 
                       ? 'bg-gradient-to-br from-purple-500/20 via-purple-900/10 to-transparent border-purple-500 shadow-[0_0_20px_-5px_rgba(168,85,247,0.5)]' 
                       : 'bg-gradient-to-br from-white/[0.05] to-transparent border-white/10 hover:border-white/20 hover:from-white/[0.08] hover:to-white/[0.01]'
                   }`}
                 >
                    <div className={`
                       absolute top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold tracking-widest uppercase flex items-center gap-1 whitespace-nowrap
                       ${isSelected ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/30'}
                    `}>
                       {p.id === 'Anime Recap' && <Star className="w-2 h-2 fill-current" />}
                       {p.tag}
                    </div>

                    <div className={`mt-3 p-2.5 rounded-full transition-colors ${isSelected ? 'bg-purple-500/20 text-purple-200' : 'bg-white/5 text-white/20 group-hover:text-white/40'}`}>
                       <Icon className="w-5 h-5" />
                    </div>
                    
                    <span className={`text-[10px] text-center font-medium leading-tight ${isSelected ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}>
                      {p.label.split(' ').map((word, i) => (
                        <span key={i} className="block">{word}</span>
                      ))}
                    </span>
                 </button>
               )
             })}
          </div>

          {/* New: Image Aspect Ratio Selection */}
          <div className="space-y-3">
            <h2 className="text-lg font-medium text-white/90 pl-1">Image Aspect Ratio</h2>
            <div className="grid grid-cols-3 gap-3">
              {aspectRatios.map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setState(prev => ({ ...prev, imageAspectRatio: ratio }))}
                  className={`flex items-center justify-center p-3 rounded-xl border aspect-square transition-all duration-300 group ${
                    state.imageAspectRatio === ratio
                      ? 'bg-gradient-to-br from-indigo-500/20 via-indigo-900/10 to-transparent border-indigo-500 shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)]'
                      : 'bg-gradient-to-br from-white/[0.05] to-transparent border-white/10 hover:border-white/20 hover:from-white/[0.08] hover:to-white/[0.01]'
                  }`}
                >
                  <span className={`text-sm font-semibold ${state.imageAspectRatio === ratio ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}>
                    {ratio}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Established Cast Visualization (Shown when retaining context) */}
          {state.characters.length > 0 && (
             <div className="space-y-2 pt-2 border-t border-white/5 animate-in fade-in slide-in-from-right-4">
                 <h2 className="text-xs font-bold text-green-400 uppercase tracking-widest flex items-center gap-2">
                    <Users className="w-3 h-3" /> Established Cast
                 </h2>
                 <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {state.characters.map((char, idx) => (
                        <div key={idx} className="shrink-0 w-10 h-10 rounded-full bg-white/10 overflow-hidden border border-white/10 relative group" title={char.name}>
                            {char.imageUrl ? (
                                <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[8px]">{char.name.substring(0,2)}</div>
                            )}
                        </div>
                    ))}
                    <div className="text-[10px] text-white/30 italic whitespace-nowrap px-2">
                        + Context retained
                    </div>
                 </div>
             </div>
          )}

          <Button 
            onClick={onGenerate} 
            isLoading={state.isThinking}
            disabled={!state.chapterText.trim() && state.files.length === 0}
            icon={!state.isThinking && <Sparkles className="w-4 h-4" />}
            className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white py-3.5 text-sm font-semibold shadow-lg shadow-purple-900/20 border-0 rounded-xl"
          >
            {state.isThinking ? "Generating Plan..." : "Generate Visual Plan"}
          </Button>
        </div>

      </div>
    </motion.div>
  );
};

// --- Sample Data for Demonstration ---
const sampleChapterText = `
Chapter 1: The Whispering Woods

Elara, a young enchantress with eyes the color of twilight, ventured into the Whispering Woods, her staff tapping rhythmically against the gnarled roots. A cloak of emerald leaves, woven by her grandmother, kept her hidden from the forest's watchful gaze. Her mission was perilous: retrieve the Sunstone from the ancient grotto, a relic said to mend the broken heart of the kingdom.

The air grew heavy with an ethereal hum as she delved deeper. Ancient trees, their branches laden with glowing moss, formed a living cathedral. Suddenly, a shadow detached itself from the gloom. It was Kael, the rogue knight, his armor scuffed, a mischievous glint in his amber eyes. He'd been tracking her, a silent guardian, sworn to protect the Sunstone from falling into the wrong hands – even if those hands belonged to a well-intentioned enchantress.

"Elara," he rumbled, his voice low, "the grotto's wards are strong. You cannot pass."

Elara sighed, a wisp of frustration escaping her lips. "Kael, I must. The kingdom withers without it."

A gentle breeze stirred the leaves, carrying whispers of forgotten magic. Kael stood firm, a silent challenge in his stance. The path to the grotto, shimmering with faint, protective runes, lay between them.
`;

const sampleMood: ChapterMood = {
  tone: 'Mysterious, Adventurous, and Slightly Tense',
  palette_hint: 'Deep greens, ethereal blues, and soft golds'
};

const sampleCharacters: Character[] = [
  {
    name: 'Elara',
    physical_description: 'Young enchantress, twilight-colored eyes, emerald leaf cloak, wooden staff with a glowing crystal.',
    imageUrl: 'https://via.placeholder.com/150/6A5ACD/FFFFFF?text=Elara', // Sample Image URL
    status: 'done'
  },
  {
    name: 'Kael',
    physical_description: 'Rogue knight, scuffed dark armor, amber eyes, short dark hair, stoic expression, weathered leather gauntlets.',
    imageUrl: 'https://via.placeholder.com/150/4682B4/FFFFFF?text=Kael', // Sample Image URL
    status: 'done'
  }
];

const sampleEmotionArc: EmotionPoint[] = [
  { beat_description: 'Journey Begins', emotion_label: 'Anticipation', intensity: 6, color_hex: '#6A5ACD' },
  { beat_description: 'Into the Woods', emotion_label: 'Mystery', intensity: 7, color_hex: '#483D8B' },
  { beat_description: 'Ethereal Hum', emotion_label: 'Wonder', intensity: 8, color_hex: '#7B68EE' },
  { beat_description: 'Kael Appears', emotion_label: 'Tension', intensity: 9, color_hex: '#B22222' },
  { beat_description: 'Confrontation', emotion_label: 'Conflict', intensity: 8, color_hex: '#FF4500' },
  { beat_description: 'Plea for Help', emotion_label: 'Desperation', intensity: 7, color_hex: '#FF8C00' },
  { beat_description: 'Kael\'s Resolve', emotion_label: 'Determination', intensity: 8, color_hex: '#228B22' },
  { beat_description: 'Path Blocked', emotion_label: 'Frustration', intensity: 6, color_hex: '#DAA520' }
];

const sampleVisuals: VisualItem[] = [
  {
    id: '1',
    type: VisualType.Character,
    description: 'Elara, a young enchantress in an emerald cloak, stands at the edge of a dense, ancient forest, sunlight filtering through tall trees onto her.',
    reuse: false,
    status: 'done',
    imageUrl: 'https://via.placeholder.com/640x360/6A5ACD/FFFFFF?text=Elara+in+Woods' // Sample Image URL
  },
  {
    id: '2',
    type: VisualType.Location,
    description: 'A close-up of Elara\'s wooden staff, its crystal tip glowing softly, as it taps against moss-covered gnarled tree roots.',
    reuse: false,
    status: 'done',
    imageUrl: 'https://via.placeholder.com/640x360/483D8B/FFFFFF?text=Elara%27s+Staff' // Sample Image URL
  },
  {
    id: '3',
    type: VisualType.Mood,
    description: 'Ethereal glowing moss covers ancient, towering trees, forming a natural cathedral within a mysterious forest, heavy with a faint hum.',
    reuse: false,
    status: 'done',
    imageUrl: 'https://via.placeholder.com/640x360/7B68EE/FFFFFF?text=Ethereal+Woods' // Sample Image URL
  },
  {
    id: '4',
    type: VisualType.Character,
    description: 'Kael, a rogue knight in scuffed dark armor, emerges from deep shadows, his amber eyes glinting mischievously.',
    reuse: false,
    status: 'done',
    imageUrl: 'https://via.placeholder.com/640x360/B22222/FFFFFF?text=Kael+Emerges' // Sample Image URL
  },
  {
    id: '5',
    type: VisualType.Action,
    description: 'Elara and Kael stand facing each other on a shimmering forest path, glowing runes visible on the ground between them, a silent challenge in their stances.',
    reuse: false,
    status: 'done',
    imageUrl: 'https://via.placeholder.com/640x360/FF4500/FFFFFF?text=Elara+and+Kael+Confront' // Sample Image URL
  },
  {
    id: '6',
    type: VisualType.Symbolic,
    description: 'A gentle breeze stirs emerald leaves, carrying faint, almost unheard whispers, symbolizing forgotten magic.',
    reuse: false,
    status: 'done',
    imageUrl: 'https://via.placeholder.com/640x360/DAA520/FFFFFF?text=Whispering+Leaves' // Sample Image URL
  }
];

const initialAppState: AppState = {
  step: 'input',
  planningTab: 'storyboard',
  chapterText: '',
  contextText: '',
  bookTitle: '',
  bookAuthor: '',
  bookGenre: '',
  selectedProfile: 'Novel Explanation',
  imageAspectRatio: '16:9', // Default aspect ratio
  mood: null,
  characters: [],
  emotionArc: [],
  visuals: [],
  files: [],
  contextFiles: [],
  bible: null,
  isAnalyzingBible: false,
  isThinking: false,
};

const LOCAL_STORAGE_KEY = 'visualChapterPlannerState';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        const parsedState: AppState = JSON.parse(savedState);
        // Ensure transient states are reset on load
        return {
          ...parsedState,
          isAnalyzingBible: false,
          isThinking: false,
          // errorMsg is managed by local state, not part of AppState
        };
      }
    } catch (e) {
      console.error("Failed to parse state from localStorage", e);
      // Fallback to initial state if parsing fails
    }
    return initialAppState;
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contextFileInputRef = useRef<HTMLInputElement>(null);

  // Effect to save state to localStorage whenever it changes
  useEffect(() => {
    // Destructure to omit transient properties before saving
    const { isThinking, isAnalyzingBible, ...stateToSave } = state;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
  }, [state]); // Dependency array includes the entire state object

  const readFile = (file: File): Promise<UploadedFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        type: file.type,
        data: reader.result as string
      });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, isContext: boolean) => {
    if (e.target.files?.length) {
      const newFiles = await Promise.all(Array.from(e.target.files).map(readFile));
      setState(prev => ({
        ...prev,
        [isContext ? 'contextFiles' : 'files']: [...prev[isContext ? 'contextFiles' : 'files'], ...newFiles]
      }));
      if (e.target.value) e.target.value = '';
    }
  };

  const onRemoveFile = (id: string, isContext?: boolean) => {
    setState(prev => ({
      ...prev,
      [isContext ? 'contextFiles' : 'files']: prev[isContext ? 'contextFiles' : 'files'].filter(f => f.id !== id)
    }));
  };

  const onGenerate = async () => {
    setErrorMsg(null);
    setState(prev => ({ ...prev, isThinking: true }));
    try {
      const plan = await generateVisualPlan(
        state.chapterText,
        state.files,
        state.selectedProfile,
        state.contextText,
        state.bible,
        { title: state.bookTitle, author: state.bookAuthor, genre: state.bookGenre },
        state.characters // Pass existing characters for consistency
      );

      setState(prev => {
        // Merge characters logic: Keep existing ones (with portraits) if name matches
        const existingCharsMap = new Map<string, Character>();
        prev.characters.forEach(c => existingCharsMap.set(c.name.toLowerCase(), c));

        const newChars = plan.characters.map(c => {
           const existing = existingCharsMap.get(c.name.toLowerCase());
           if (existing) {
               return { ...c, imageUrl: existing.imageUrl || c.imageUrl, status: existing.status === 'done' ? 'done' : c.status };
           }
           return c;
        });
        
        // Add preserved characters not in current plan (for bible completeness)
        const newNames = new Set(newChars.map(c => c.name.toLowerCase()));
        const preserved = prev.characters.filter(c => !newNames.has(c.name.toLowerCase()));

        return {
          ...prev,
          step: 'planning',
          isThinking: false,
          mood: plan.chapter_mood,
          characters: [...newChars, ...preserved],
          emotionArc: plan.emotion_arc || [],
          visuals: plan.visuals.map((v, idx) => ({
            ...v,
            id: idx.toString(),
            status: 'pending',
            reuse: v.reuse || false
          }))
        };
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to generate plan");
      setState(prev => ({ ...prev, isThinking: false }));
    }
  };

  const onAnalyzeBible = async () => {
    setState(prev => ({ ...prev, isAnalyzingBible: true }));
    try {
      const bible = await generateSeriesBible(
        state.contextFiles,
        { title: state.bookTitle, author: state.bookAuthor, genre: state.bookGenre }
      );
      setState(prev => ({ ...prev, bible, isAnalyzingBible: false, isContextOpen: false }));
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to analyze context");
      setState(prev => ({ ...prev, isAnalyzingBible: false }));
    }
  };

  const handleLoadDemo = () => {
    setState({
      ...initialAppState, // Start with a clean slate for transient states
      step: 'planning',
      chapterText: sampleChapterText,
      bookTitle: 'The Sunstone Quest',
      bookAuthor: 'A.I. Author',
      bookGenre: 'Fantasy Adventure',
      mood: sampleMood,
      characters: sampleCharacters,
      emotionArc: sampleEmotionArc,
      visuals: sampleVisuals,
      imageAspectRatio: '16:9',
    });
    // The useEffect will handle saving this new demo state.
  };

  const handleGoToInputView = () => {
    setState(prev => ({ ...prev, step: 'input' }));
  };

  const handleStartNextChapter = () => {
    setState(prev => ({
        ...prev,
        step: 'input', // Go back to input for the next chapter
        planningTab: 'storyboard', // Reset tab for next chapter
        chapterText: '', // Clear chapter text for the next chapter
        files: [], // Clear current chapter files
        visuals: [], // Clear visuals for the next chapter
        mood: null, // Clear mood for the next chapter
        emotionArc: [], // Clear emotion arc for the next chapter
        // *** Retain Project-level context ***
        // bookTitle, bookAuthor, bookGenre, selectedProfile, characters, contextFiles, bible are retained
    }));
  };

  const handleEndProject = () => {
    setState(initialAppState); // Reset everything to the initial blank state
    localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear saved state as well
  };


  const handleRegenerateItem = async (id: string) => {
    const item = state.visuals.find(v => v.id === id);
    if (!item) return;

    setState(prev => ({
      ...prev,
      visuals: prev.visuals.map(v => v.id === id ? { ...v, status: 'generating' } : v)
    }));

    try {
      const result = await regenerateVisualDescription(item.type, state.chapterText, item.description, state.bookTitle);
      setState(prev => ({
        ...prev,
        visuals: prev.visuals.map(v => v.id === id ? { ...v, ...result, status: 'pending' } : v)
      }));
    } catch (e) {
      setState(prev => ({
        ...prev,
        visuals: prev.visuals.map(v => v.id === id ? { ...v, status: 'error' } : v)
      }));
    }
  };

  const handleEditImage = async (id: string, prompt: string) => {
      const item = state.visuals.find(v => v.id === id);
      if (!item || !item.imageUrl) return;

      setState(prev => ({
          ...prev,
          visuals: prev.visuals.map(v => v.id === id ? { ...v, status: 'generating' } : v)
      }));

      try {
          const url = await editVisualImage(item.imageUrl, prompt);
          setState(prev => ({
              ...prev,
              visuals: prev.visuals.map(v => v.id === id ? { ...v, imageUrl: url, status: 'done' } : v)
          }));
      } catch (e) {
          console.error(e);
          setState(prev => ({
              ...prev,
              visuals: prev.visuals.map(v => v.id === id ? { ...v, status: 'error' } : v)
          }));
      }
  };

  const handleDeleteItem = (id: string) => {
    setState(prev => ({ ...prev, visuals: prev.visuals.filter(v => v.id !== id) }));
  };

  const handleDescriptionChange = (id: string, desc: string) => {
    setState(prev => ({
      ...prev,
      visuals: prev.visuals.map(v => v.id === id ? { ...v, description: desc } : v)
    }));
  };
  
  const handleTypeChange = (id: string, type: string) => {
      setState(prev => ({
        ...prev,
        visuals: prev.visuals.map(v => v.id === id ? { ...v, type: type } : v)
      }));
  };

  const generateSingleImage = async (id: string) => {
    const item = state.visuals.find(v => v.id === id);
    if (!item || !state.mood) return;

    setState(prev => ({
      ...prev,
      visuals: prev.visuals.map(v => v.id === id ? { ...v, status: 'generating' } : v)
    }));

    try {
      const url = await generateImageForItem(item, state.selectedProfile, state.mood, state.characters, state.imageAspectRatio);
      setState(prev => ({
        ...prev,
        visuals: prev.visuals.map(v => v.id === id ? { ...v, imageUrl: url, status: 'done' } : v)
      }));
    } catch (e) {
      console.error(e);
      setState(prev => ({
        ...prev,
        visuals: prev.visuals.map(v => v.id === id ? { ...v, status: 'error' } : v)
      }));
    }
  };

  const generateAllImages = () => {
    state.visuals.forEach(v => {
      if (v.status !== 'done' && v.status !== 'generating') {
        generateSingleImage(v.id);
      }
    });
  };

  // New handler for character portraits
  const handleGeneratePortrait = async (char: Character) => {
      setState(prev => ({
          ...prev,
          characters: prev.characters.map(c => c.name === char.name ? { ...c, status: 'generating' } : c)
      }));
      try {
          const url = await generateCharacterPortrait(char, state.selectedProfile);
          setState(prev => ({
              ...prev,
              characters: prev.characters.map(c => c.name === char.name ? { ...c, imageUrl: url, status: 'done' } : c)
          }));
      } catch (e) {
          console.error(e);
          setState(prev => ({
              ...prev,
              characters: prev.characters.map(c => c.name === char.name ? { ...c, status: 'error' } : c)
          }));
      }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30">
        <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-[#050505] to-[#050505] pointer-events-none" />
        
        <div className="relative z-10">
           <AnimatePresence mode='wait'>
            {state.step === 'input' ? (
                <InputView 
                    key="input"
                    state={state}
                    setState={setState}
                    fileInputRef={fileInputRef}
                    contextFileInputRef={contextFileInputRef}
                    onFileSelect={(e) => handleFileSelect(e, false)}
                    onContextFileSelect={(e) => handleFileSelect(e, true)}
                    onRemoveFile={onRemoveFile}
                    onGenerate={onGenerate}
                    onAnalyzeBible={onAnalyzeBible}
                    onLoadDemo={handleLoadDemo}
                    isContextOpen={isContextOpen}
                    setIsContextOpen={setIsContextOpen}
                    errorMsg={errorMsg}
                />
            ) : (
                <motion.div 
                    key="planning"
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-32"
                >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-left">
                            <button 
                              onClick={handleGoToInputView}
                              className="text-white/40 hover:text-white text-xs font-medium mb-3 flex items-center gap-1 transition-colors"
                            >
                                <ArrowRight className="w-3 h-3 rotate-180" /> Back to Input
                            </button>
                            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-b from-white via-white to-white/40 text-transparent bg-clip-text pb-1">Visual Plan</h2>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-white/10 text-white/60">
                                    {state.selectedProfile}
                                </span>
                                {state.mood && (
                                    <span className="flex items-center gap-1.5 text-xs text-white/40">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                        {state.mood.tone}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
                             <button
                               onClick={() => setState(prev => ({ ...prev, planningTab: 'storyboard' }))}
                               className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${state.planningTab === 'storyboard' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
                             >
                                <LayoutGrid className="w-3.5 h-3.5" /> Storyboard
                             </button>
                             <button
                               onClick={() => setState(prev => ({ ...prev, planningTab: 'characters' }))}
                               className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all ${state.planningTab === 'characters' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
                             >
                                <Users className="w-3.5 h-3.5" /> Characters
                             </button>
                        </div>
                    </div>

                    {/* Heatmap Visualization */}
                    <div className="animate-in slide-in-from-top-4 fade-in duration-700">
                        <Heatmap data={state.emotionArc} />
                    </div>

                    {/* Main Content Area */}
                    <AnimatePresence mode='wait'>
                        {state.planningTab === 'storyboard' ? (
                            <motion.div 
                                key="storyboard"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                <div className="flex justify-end">
                                    <Button 
                                    onClick={generateAllImages}
                                    icon={<Sparkles className="w-4 h-4" />}
                                    className="shadow-xl shadow-purple-900/20"
                                    >
                                        Generate All Scenes
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {state.visuals.map(item => (
                                        <div key={item.id} className="relative group">
                                            <VisualCard 
                                                item={item}
                                                chapterText={state.chapterText}
                                                onDelete={handleDeleteItem}
                                                onRegenerate={handleRegenerateItem}
                                                onTypeChange={handleTypeChange}
                                                onDescriptionChange={handleDescriptionChange}
                                                onEditImage={handleEditImage}
                                                showImage={true} 
                                            />
                                            {(item.status === 'pending' || item.status === 'error') && (
                                                <button
                                                    onClick={() => generateSingleImage(item.id)}
                                                    className="absolute top-3 right-3 z-20 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100"
                                                    title="Generate This Image"
                                                >
                                                    <ImageIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Action Buttons for Project Workflow */}
                                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-12 pb-8 border-t border-white/5 mt-12">
                                    <Button 
                                        onClick={handleStartNextChapter}
                                        className="bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30 w-full sm:w-auto min-w-[200px]"
                                        icon={<Forward className="w-4 h-4" />}
                                    >
                                        Start Next Chapter
                                    </Button>
                                    <Button 
                                        onClick={handleEndProject}
                                        className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 w-full sm:w-auto min-w-[200px]"
                                        icon={<PowerOff className="w-4 h-4" />}
                                    >
                                        End Project
                                    </Button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="characters"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <div className="bg-gradient-to-r from-purple-900/20 to-transparent p-6 rounded-2xl border border-purple-500/10 mb-8">
                                    <h3 className="text-xl font-bold text-white mb-2">Character Visual Bible</h3>
                                    <p className="text-sm text-white/50 max-w-2xl">
                                        Establish a consistent visual identity for your cast. Generating reference portraits here helps define the "Ground Truth" for all subsequent scene generations.
                                    </p>
                                </div>
                                <CharacterBible 
                                    characters={state.characters} 
                                    onGeneratePortrait={handleGeneratePortrait}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
           </AnimatePresence>
        </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);