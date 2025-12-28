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
      className="max-w-6xl mx-auto w-full pt-8 md:pt-16 px-4 pb-20"
    >
      {/* Header Section */}
      <div className="text-center mb-16 space-y-3">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-b from-white via-white to-white/40 text-transparent bg-clip-text tracking-tight pb-2">Visual Chapter Planner</h1>
        <p className="text-white/40 text-lg font-light">Turn narrative text, PDFs, or images into a structured visual sequence.</p>
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
    isThinking: false,
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contextFileInputRef = useRef<HTMLInputElement>(null);

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
        { title: state.bookTitle, author: state.bookAuthor, genre: state.bookGenre }
      );

      setState(prev => ({
        ...prev,
        step: 'planning',
        isThinking: false,
        mood: plan.chapter_mood,
        characters: plan.characters,
        visuals: plan.visuals.map((v, idx) => ({
          ...v,
          id: idx.toString(),
          status: 'pending',
          reuse: v.reuse || false
        }))
      }));
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
      const url = await generateImageForItem(item, state.selectedProfile, state.mood, state.characters);
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
                    className="max-w-7xl mx-auto px-4 py-8 space-y-8"
                >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-left">
                            <button 
                              onClick={() => setState(prev => ({ ...prev, step: 'input' }))}
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
                        <div className="flex gap-3">
                             <Button 
                               onClick={generateAllImages}
                               icon={<Sparkles className="w-4 h-4" />}
                               className="shadow-xl shadow-purple-900/20"
                             >
                                 Generate All Images
                             </Button>
                        </div>
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
                </motion.div>
            )}
           </AnimatePresence>
        </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);