
import React from 'react';
import { motion } from 'framer-motion';
import { Character, VideoProfile } from '../types';
import { User, Sparkles, RefreshCw, AlertCircle, ImageIcon } from 'lucide-react';

interface CharacterBibleProps {
  characters: Character[];
  onGeneratePortrait: (character: Character) => void;
}

export const CharacterBible: React.FC<CharacterBibleProps> = ({ characters, onGeneratePortrait }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {characters.map((char, index) => (
        <motion.div 
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all group"
        >
           {/* Image Area */}
           <div className="aspect-square w-full bg-black/20 relative border-b border-white/5">
              {char.imageUrl ? (
                 <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
              ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20 gap-2">
                    {char.status === 'generating' ? (
                        <>
                          <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                          <span className="text-[10px]">CREATING REFERENCE...</span>
                        </>
                    ) : char.status === 'error' ? (
                        <>
                           <AlertCircle className="w-8 h-8 text-red-400/50" />
                           <span className="text-[10px] text-red-400/50">GENERATION FAILED</span>
                        </>
                    ) : (
                        <User className="w-12 h-12" />
                    )}
                 </div>
              )}
              
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                 <button 
                   onClick={() => onGeneratePortrait(char)}
                   disabled={char.status === 'generating'}
                   className="flex items-center gap-2 px-3 py-1.5 bg-accent hover:bg-accent/80 text-white rounded-lg text-xs font-medium shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    {char.imageUrl ? <RefreshCw className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                    {char.imageUrl ? 'Regenerate' : 'Create Reference'}
                 </button>
              </div>
           </div>

           {/* Info Area */}
           <div className="p-4 space-y-2">
              <h3 className="font-bold text-white text-lg leading-tight">{char.name}</h3>
              <div className="bg-black/20 rounded-md p-2 border border-white/5">
                  <p className="text-xs text-white/60 leading-relaxed line-clamp-4">
                      {char.physical_description}
                  </p>
              </div>
              <div className="pt-2 flex items-center gap-2 text-[10px] text-white/30">
                 <ImageIcon className="w-3 h-3" />
                 <span>Consistent Visual ID</span>
              </div>
           </div>
        </motion.div>
      ))}
      
      {/* Empty State Helper */}
      {characters.length === 0 && (
         <div className="col-span-full py-12 flex flex-col items-center justify-center text-white/30 border border-dashed border-white/10 rounded-xl">
            <User className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No characters identified in this chapter.</p>
         </div>
      )}
    </div>
  );
};
