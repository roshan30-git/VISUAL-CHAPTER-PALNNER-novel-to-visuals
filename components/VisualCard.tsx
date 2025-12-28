import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VisualItem, VisualType } from '../types';
import { RefreshCw, Trash2, Repeat, MapPin, User, Zap, Sparkles, Image as ImageIcon, CheckCircle, AlertCircle, Eye, Download, ChevronDown, Edit2, Save, X, FileText } from 'lucide-react';

interface VisualCardProps {
  item: VisualItem;
  chapterText?: string;
  onDelete: (id: string) => void;
  onRegenerate: (id: string) => void;
  onTypeChange?: (id: string, newType: string) => void;
  onDescriptionChange?: (id: string, newDesc: string) => void;
  showImage?: boolean;
}

const TypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case VisualType.Character: return <User className="w-4 h-4 text-blue-400" />;
    case VisualType.Location: return <MapPin className="w-4 h-4 text-green-400" />;
    case VisualType.Action: return <Zap className="w-4 h-4 text-yellow-400" />;
    case VisualType.Mood: return <Sparkles className="w-4 h-4 text-purple-400" />;
    case VisualType.Symbolic: return <ImageIcon className="w-4 h-4 text-pink-400" />;
    default: return <Eye className="w-4 h-4 text-gray-400" />;
  }
};

const formatType = (type: string) => {
  return type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
};

export const VisualCard: React.FC<VisualCardProps> = ({ 
  item, 
  chapterText,
  onDelete, 
  onRegenerate, 
  onTypeChange, 
  onDescriptionChange,
  showImage 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.description);
  const [showContext, setShowContext] = useState(false);

  // Sync edit value when item updates externally (e.g. regeneration)
  useEffect(() => {
    setEditValue(item.description);
  }, [item.description]);

  const isGenerating = item.status === 'generating';
  const isDone = item.status === 'done';
  const isError = item.status === 'error';

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.imageUrl) {
      const a = document.createElement('a');
      a.href = item.imageUrl;
      a.download = `image_${item.type}_${item.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleSave = () => {
    if (onDescriptionChange) {
      onDescriptionChange(item.id, editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(item.description);
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`relative group flex flex-col rounded-xl overflow-hidden border transition-all duration-300 ${
        isGenerating 
          ? 'border-accent/50 bg-gradient-to-b from-accent/10 to-transparent' 
          : 'border-white/10 bg-gradient-to-b from-white/[0.08] to-transparent hover:border-white/20 hover:shadow-2xl hover:shadow-purple-900/10'
      }`}
    >
      {/* Image Section */}
      <AnimatePresence mode='wait'>
        {showImage && (
          <motion.div 
            className="aspect-video w-full bg-black/40 relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {isDone && item.imageUrl ? (
              <motion.img 
                src={item.imageUrl} 
                alt={item.description}
                className="w-full h-full object-cover"
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                {isGenerating && (
                  <div className="flex flex-col items-center gap-3">
                     <motion.div 
                       className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent"
                       animate={{ rotate: 360 }}
                       transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                     />
                     <span className="text-xs text-accent/80 font-medium tracking-wide">GENERATING</span>
                  </div>
                )}
                {isError && (
                  <div className="flex flex-col items-center gap-2 text-red-400">
                    <AlertCircle className="w-6 h-6" />
                    <span className="text-xs">FAILED</span>
                  </div>
                )}
                {item.status === 'pending' && (
                   <span className="text-xs text-white/20 font-mono">WAITING FOR GENERATION</span>
                )}
              </div>
            )}
            
            {/* Reuse Badge Overlay on Image */}
            {item.reuse && isDone && (
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-white/80 border border-white/10 flex items-center gap-1">
                <Repeat className="w-3 h-3" /> REUSE
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        {/* Header: Type and Metadata */}
        <div className="flex items-center justify-between">
          <div className="relative flex items-center gap-2 group/type">
            <div className={`p-1.5 rounded-md bg-white/5 pointer-events-none`}>
              <TypeIcon type={item.type} />
            </div>
            
            {onTypeChange && !showImage && !isGenerating && !isEditing ? (
              <>
                <select
                  value={item.type}
                  onChange={(e) => onTypeChange(item.id, e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                >
                  {Object.values(VisualType).map((t) => (
                    <option key={t} value={t} className="text-black bg-white">
                      {formatType(t)}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                   <span className="text-xs font-semibold text-white/60 uppercase tracking-wider group-hover/type:text-white transition-colors">
                     {formatType(item.type)}
                   </span>
                   <ChevronDown className="w-3 h-3 text-white/20 group-hover/type:text-white/60 transition-colors" />
                </div>
              </>
            ) : (
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                {formatType(item.type)}
              </span>
            )}
          </div>
          
          {/* Reuse Badge (if no image shown or not generated yet) */}
          {(!showImage || !isDone) && item.reuse && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/5">
              <Repeat className="w-3 h-3 text-white/40" />
              <span className="text-[10px] font-medium text-white/40">EXISTING ASSET</span>
            </div>
          )}
        </div>

        {/* Description / Edit Mode */}
        {isEditing ? (
          <div className="space-y-3 animate-in fade-in duration-200">
             <textarea
               value={editValue}
               onChange={(e) => setEditValue(e.target.value)}
               className="w-full h-32 bg-black/20 border border-accent/30 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent/50 resize-none leading-relaxed"
               placeholder="Describe the scene..."
               autoFocus
             />
             
             {chapterText && (
               <div className="border border-white/5 rounded-lg overflow-hidden">
                 <button 
                   onClick={() => setShowContext(!showContext)}
                   className="w-full flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/10 transition-colors text-xs text-white/60"
                 >
                    <span className="flex items-center gap-2"><FileText className="w-3 h-3" /> Show Original Context</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showContext ? 'rotate-180' : ''}`} />
                 </button>
                 {showContext && (
                   <div className="p-3 bg-black/20 max-h-40 overflow-y-auto text-xs text-white/40 leading-relaxed whitespace-pre-wrap border-t border-white/5">
                     {chapterText}
                   </div>
                 )}
               </div>
             )}

             <div className="flex items-center justify-end gap-2 pt-2">
                <button 
                  onClick={handleCancel}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
                >
                  <X className="w-3 h-3" /> Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-accent text-white hover:bg-accent/80 transition-colors flex items-center gap-1.5 shadow-lg shadow-accent/20"
                >
                  <Save className="w-3 h-3" /> Save Changes
                </button>
             </div>
          </div>
        ) : (
          <p className="text-sm text-text/90 leading-relaxed font-light">
            {item.description}
          </p>
        )}

        {/* Footer Actions */}
        {!isEditing && (
          <div className="mt-auto pt-3 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
            {!isGenerating && (
              <>
                {onDescriptionChange && !showImage && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                    title="Edit Description"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}

                {isDone && item.imageUrl && showImage && (
                  <button
                    onClick={handleDownload}
                    className="p-2 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                    title="Download Image"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => onRegenerate(item.id)}
                  className="p-2 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                  title="Regenerate Plan Item"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onDelete(item.id)}
                  className="p-2 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                  title="Remove Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};