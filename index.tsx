import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { AppState, VideoProfile, VisualItem, VisualType, UploadedFile, SeriesBible, Character } from './types';
import { generateVisualPlan, generateImageForItem, regenerateVisualDescription, generateSeriesBible } from './services/gemini';
import { Button } from './components/Button';
import { VisualCard } from './components/VisualCard';
import { Sparkles, FileText, ChevronRight, Settings2, Download, Image as ImageIcon, BookOpen, AlertCircle, Users, Paperclip, X, FileType, MonitorPlay, ScrollText, ChevronDown, Star, Database, Check, Loader2, Edit2, Save, ArrowRight, Trash2, Globe } from 'lucide-react';

// --- Sub-Components ---

const FileList = ({ files, isContext = false, onRemove }: { files: UploadedFile[], isContext?: boolean, onRemove: (id: string, isContext?: boolean) => void }) => (
  <AnimatePresence>
    {files.length > 0 && (
      <motion.div 
         initial={{ height: 0, opacity: 0 }}
         animate={{ height: 'auto', opacity: 1 }}
         exit={{ height: 0, opacity: 0 }}
         className={`flex flex-wrap gap-2 overflow-hidden ${isContext ? 'mt-2' : 'absolute bottom-4 left-4 right-4 z-20 pointer-events-none'}`}
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
  isContextOpen,
  setIsContextOpen,
  errorMsg
}) => {
  const profiles: { id: VideoProfile, icon: any, label: string, tag: string, color: string }[] = [
    { id: 'Novel Explanation', icon: BookOpen, label: 'Novel Explanation', tag: 'CINEMATIC', color: 'blue' },
    { id: 'Anime Recap', icon: MonitorPlay, label: 'Anime Recap', tag: 'CEL SHADED', color: 'purple' },
    { id: 'Manhwa Summary', icon: ScrollText, label: 'Manhwa Summary', tag: 'WEBTOON', color: 'green' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="max-w-6xl mx-auto w-full pt-4 md:pt-12"
    >
      <div className="space-y-4 text-center mb-16">
        <h1 className="text-5xl font-bold tracking-tight text-white mb-2 bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">Visual Chapter Planner</h1>
        <p className="text-white/40 text-lg font-light">Turn narrative text or PDFs/TXTs into a structured visual sequence.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Source Material */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Source Input */}
          <div>
             <div className="flex justify-between items-center mb-3 px-1">
                <label className="text-lg font-medium text-white">Source Material (Specific Chapter)</label>
             </div>
             
             <div className={`relative group bg-gradient-to-br from-white/[0.07] to-white/[0.02] border rounded-2xl h-[420px] transition-all focus-within:ring-1 focus-within:ring-accent/30 focus-within:from-white/[0.09] focus-within:to-white/[0.04] backdrop-blur-sm ${errorMsg ? 'border-red-500/50' : 'border-white/10 hover:border-white/20'}`}>
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
                     className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-900/30 transition-all hover:scale-105"
                   >
                      <Paperclip className="w-3.5 h-3.5" />
                      Attach Chapter (PDF/TXT)
                   </button>
                </div>

                <textarea
                  value={state.chapterText}
                  onChange={(e) => setState(prev => ({ ...prev, chapterText: e.target.value }))}
                  placeholder="Paste specific chapter content here..."
                  className="w-full h-full bg-transparent p-6 text-base text-white/90 focus:outline-none resize-none placeholder-white/20 font-light scrollbar-thin rounded-2xl"
                />
                
                <FileList files={state.files} onRemove={onRemoveFile} />

                {errorMsg && (
                   <div className="absolute inset-x-0 -bottom-10 flex justify-center">
                      <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm px-4 py-2 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2 fade-in">
                         <AlertCircle className="w-4 h-4" />
                         {errorMsg}
                      </div>
                   </div>
                )}
             </div>
          </div>

          {/* Context Section (Renamed from Bible) */}
          <div className={`backdrop-blur-sm border rounded-xl overflow-hidden transition-all duration-300 ${state.bible ? 'border-green-500/30 bg-green-500/[0.05]' : 'border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01]'}`}>
             <button 
               onClick={() => setIsContextOpen(!isContextOpen)}
               className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
             >
               {isContextOpen ? <ChevronDown className="w-4 h-4 text-white/60" /> : <ChevronRight className="w-4 h-4 text-white/60" />}
               <div className="flex items-center gap-2">
                 <span className="text-sm font-medium text-white/80">Story Context / Background Info</span>
                 {state.bible && <Check className="w-3 h-3 text-green-400" />}
               </div>
             </button>

             <AnimatePresence>
               {isContextOpen && (
                 <motion.div 
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: 'auto', opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   className="px-4 pb-6 space-y-4"
                 >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                         <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold pl-1">Title (Required for Search)</label>
                         <input 
                           value={state.bookTitle}
                           onChange={(e) => setState(prev => ({...prev, bookTitle: e.target.value}))}
                           placeholder="e.g. Lord of the Mysteries" 
                           className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold pl-1">Author</label>
                         <input 
                           value={state.bookAuthor}
                           onChange={(e) => setState(prev => ({...prev, bookAuthor: e.target.value}))}
                           placeholder="e.g. Cuttlefish That Loves Diving" 
                           className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                         />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold pl-1">Genre</label>
                         <input 
                           value={state.bookGenre}
                           onChange={(e) => setState(prev => ({...prev, bookGenre: e.target.value}))}
                           placeholder="e.g. Chinese Web Novel" 
                           className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                         />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold pl-1">Background PDF/TXT (Optional)</label>
                        <button 
                          onClick={() => contextFileInputRef.current?.click()}
                          className="text-[10px] flex items-center gap-1.5 text-accent hover:text-accent/80 transition-colors"
                        >
                           <Paperclip className="w-3 h-3" /> Attach Full Book (PDF/TXT)
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
                      
                      <div className="min-h-[80px] bg-black/20 border border-white/10 rounded-lg p-3 relative">
                         <FileList files={state.contextFiles} isContext onRemove={onRemoveFile} />
                         {!state.contextFiles.length && !state.bible && <p className="text-white/20 text-xs italic">Attach a full book/script here ONLY if you want the AI to read it once and reuse it. <br/>Otherwise, just enter the Title above and the agent will search the web.</p>}
                         
                         {state.bible && (
                           <div className="mt-2 text-xs text-white/60 space-y-1">
                              <p className="flex items-center gap-2 text-green-400 font-medium"><Check className="w-3 h-3" /> Context Loaded</p>
                              <p>• {state.bible.characters.length} Characters Identified from context</p>
                           </div>
                         )}
                      </div>

                      {/* Analysis Button - Show if File Attached OR if Title present for Search */}
                      {!state.bible && (state.contextFiles.length > 0 || state.bookTitle.trim()) && (
                        <motion.button
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={onAnalyzeBible}
                          disabled={state.isAnalyzingBible}
                          className={`mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 ${
                            state.contextFiles.length === 0 
                              ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-900/20" 
                              : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/20"
                          }`}
                        >
                           {state.isAnalyzingBible ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                              state.contextFiles.length === 0 ? <Globe className="w-3 h-3" /> : <Database className="w-3 h-3" />
                           )}
                           {state.isAnalyzingBible 
                             ? (state.contextFiles.length === 0 ? "Searching Web for Context..." : "Processing Background File...") 
                             : (state.contextFiles.length === 0 ? "Research Story Context (Web)" : "Process Background File")
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
        <div className="lg:col-span-4 space-y-8 sticky top-8">
          <div>
             <label className="text-lg font-medium text-white mb-4 block">Output Style</label>
             <div className="grid grid-cols-3 lg:grid-cols-3 gap-3">
                {profiles.map((p) => {
                  const isSelected = state.selectedProfile === p.id;
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setState(prev => ({ ...prev, selectedProfile: p.id }))}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border aspect-[4/5] gap-3 transition-all duration-300 group overflow-hidden ${
                        isSelected 
                          ? 'bg-gradient-to-br from-purple-500/20 to-purple-900/20 border-purple-500 shadow-[0_0_30px_-10px_rgba(168,85,247,0.4)]' 
                          : 'bg-gradient-to-br from-white/[0.05] to-white/[0.01] border-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-white/5'
                      }`}
                    >
                       <div className={`
                          absolute top-2.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase flex items-center gap-1
                          ${isSelected ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/40 group-hover:bg-white/20'}
                       `}>
                          {p.id === 'Anime Recap' && <Star className="w-2 h-2 fill-current" />}
                          {p.tag}
                       </div>

                       <div className={`mt-2 p-3 rounded-full transition-colors ${isSelected ? 'bg-purple-500/20 text-purple-200' : 'bg-white/5 text-white/20 group-hover:text-white/40 group-hover:bg-white/10'}`}>
                          <Icon className="w-6 h-6" />
                       </div>
                       
                       <span className={`text-xs text-center font-medium leading-tight max-w-[80%] ${isSelected ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}>
                         {p.label.split(' ').map((word, i) => (
                           <span key={i} className="block">{word}</span>
                         ))}
                       </span>
                    </button>
                  )
                })}
             </div>
          </div>

          <Button 
            onClick={onGenerate} 
            isLoading={state.isThinking}
            disabled={!state.chapterText.trim() && state.files.length === 0}
            icon={!state.isThinking && <Sparkles className="w-5 h-5" />}
            className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white py-4 text-base font-semibold shadow-xl shadow-purple-900/30 border-0 rounded-xl"
          >
            {state.isThinking ? "Generating Plan..." : "Generate Visual Plan"}
          </Button>
        </div>

      </div>
    </motion.div>
  );
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: 'input',
    chapterText: '',
    contextText: '',
    bookTitle: '',
    bookAuthor: '',
    bookGenre: '',
    selectedProfile: 'Novel Explanation',
    mood: null,
    characters: [],
    visuals: [],
    files: [],
    contextFiles: [],
    bible: null,
    isAnalyzingBible: false,
    isThinking: false
  });

  const [isContextOpen, setIsContextOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contextFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isContext: boolean = false) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: UploadedFile[] = [];
      const files = Array.from(e.target.files);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            newFiles.push({
              id: Math.random().toString(36).substring(7),
              name: file.name,
              type: file.type,
              data: ev.target.result as string
            });
            if (newFiles.length === files.length) {
              setState(prev => ({
                ...prev,
                [isContext ? 'contextFiles' : 'files']: [...(isContext ? prev.contextFiles : prev.files), ...newFiles]
              }));
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveFile = (id: string, isContext: boolean = false) => {
    setState(prev => ({
      ...prev,
      [isContext ? 'contextFiles' : 'files']: (isContext ? prev.contextFiles : prev.files).filter(f => f.id !== id)
    }));
  };

  const handleGenerate = async () => {
    setState(prev => ({ ...prev, isThinking: true }));
    setErrorMsg(null);
    try {
      const plan = await generateVisualPlan(
        state.chapterText,
        state.files,
        state.selectedProfile,
        state.contextText,
        state.bible,
        { title: state.bookTitle, author: state.bookAuthor, genre: state.bookGenre }
      );
      
      setState(prev => ({
        ...prev,
        isThinking: false,
        step: 'planning',
        mood: plan.chapter_mood,
        characters: plan.characters,
        visuals: plan.visuals.map(v => ({
          ...v,
          id: Math.random().toString(36).substring(7),
          status: 'pending'
        }))
      }));
    } catch (e: any) {
      setErrorMsg(e.message);
      setState(prev => ({ ...prev, isThinking: false }));
    }
  };

  const handleAnalyzeBible = async () => {
    setState(prev => ({ ...prev, isAnalyzingBible: true }));
    setErrorMsg(null);
    try {
      const bible = await generateSeriesBible(state.contextFiles, {
        title: state.bookTitle,
        author: state.bookAuthor,
        genre: state.bookGenre
      });
      setState(prev => ({ ...prev, isAnalyzingBible: false, bible }));
      setIsContextOpen(false);
    } catch (e: any) {
      setErrorMsg(e.message);
      setState(prev => ({ ...prev, isAnalyzingBible: false }));
    }
  };

  const handleDeleteVisual = (id: string) => {
    setState(prev => ({
      ...prev,
      visuals: prev.visuals.filter(v => v.id !== id)
    }));
  };

  const handleRegenerateVisual = async (id: string) => {
    const visual = state.visuals.find(v => v.id === id);
    if (!visual) return;

    setState(prev => ({
      ...prev,
      visuals: prev.visuals.map(v => v.id === id ? { ...v, status: 'generating' } : v)
    }));

    try {
      const newDesc = await regenerateVisualDescription(
        visual.type,
        state.chapterText,
        visual.description,
        state.bookTitle
      );
      setState(prev => ({
        ...prev,
        visuals: prev.visuals.map(v => v.id === id ? { ...v, ...newDesc, status: 'pending', imageUrl: undefined } : v)
      }));
    } catch (e) {
      setState(prev => ({
        ...prev,
        visuals: prev.visuals.map(v => v.id === id ? { ...v, status: 'error' } : v)
      }));
    }
  };

  const handleTypeChange = (id: string, newType: string) => {
    setState(prev => ({
      ...prev,
      visuals: prev.visuals.map(v => v.id === id ? { ...v, type: newType } : v)
    }));
  };

  const handleDescriptionChange = (id: string, newDesc: string) => {
    setState(prev => ({
      ...prev,
      visuals: prev.visuals.map(v => v.id === id ? { ...v, description: newDesc } : v)
    }));
  };
  
  const handleGenerateAllImages = async () => {
    const itemsToGen = state.visuals.filter(v => !v.imageUrl && v.status !== 'generating');
    
    // Set status to generating
    setState(prev => ({
      ...prev,
      visuals: prev.visuals.map(v => (!v.imageUrl && v.status !== 'generating') ? { ...v, status: 'generating' } : v)
    }));

    // Generate individually
    itemsToGen.forEach(async (item) => {
      try {
        const imageUrl = await generateImageForItem(item, state.selectedProfile, state.mood!, state.characters);
        setState(prev => ({
          ...prev,
          visuals: prev.visuals.map(v => v.id === item.id ? { ...v, status: 'done', imageUrl } : v)
        }));
      } catch (e) {
        setState(prev => ({
          ...prev,
          visuals: prev.visuals.map(v => v.id === item.id ? { ...v, status: 'error' } : v)
        }));
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-purple-500/30 pb-20">
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

      {state.step === 'input' && (
        <InputView
          state={state}
          setState={setState}
          fileInputRef={fileInputRef}
          contextFileInputRef={contextFileInputRef}
          onFileSelect={(e) => handleFileSelect(e, false)}
          onContextFileSelect={(e) => handleFileSelect(e, true)}
          onRemoveFile={handleRemoveFile}
          onGenerate={handleGenerate}
          onAnalyzeBible={handleAnalyzeBible}
          isContextOpen={isContextOpen}
          setIsContextOpen={setIsContextOpen}
          errorMsg={errorMsg}
        />
      )}

      {state.step === 'planning' && (
        <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <button 
                onClick={() => setState(prev => ({ ...prev, step: 'input' }))}
                className="text-sm text-white/40 hover:text-white flex items-center gap-2 mb-2 transition-colors"
              >
                <ArrowRight className="w-4 h-4 rotate-180" /> Back to Input
              </button>
              <h2 className="text-3xl font-bold text-white">Visual Storyboard</h2>
              <p className="text-white/40 mt-1">Review the generated scenes. Edit descriptions or types before generating images.</p>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">{state.selectedProfile}</span>
               </div>
               <Button onClick={handleGenerateAllImages} icon={<Sparkles className="w-4 h-4" />}>
                 Generate Images
               </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.visuals.map((visual) => (
              <VisualCard
                key={visual.id}
                item={visual}
                chapterText={state.chapterText}
                onDelete={handleDeleteVisual}
                onRegenerate={handleRegenerateVisual}
                onTypeChange={handleTypeChange}
                onDescriptionChange={handleDescriptionChange}
                showImage={true}
              />
            ))}
            
            <motion.button
              onClick={() => {
                const newId = Math.random().toString(36).substring(7);
                setState(prev => ({
                  ...prev,
                  visuals: [...prev.visuals, {
                    id: newId,
                    type: VisualType.Action,
                    description: 'New scene description...',
                    reuse: false,
                    status: 'pending'
                  }]
                }));
              }}
              className="min-h-[300px] flex flex-col items-center justify-center gap-4 border-2 border-dashed border-white/10 rounded-xl hover:border-white/20 hover:bg-white/5 transition-all group text-white/20 hover:text-white/60"
            >
              <div className="p-4 rounded-full bg-white/5 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium">Add New Scene</span>
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);