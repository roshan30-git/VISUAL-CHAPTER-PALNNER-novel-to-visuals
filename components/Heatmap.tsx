
import React from 'react';
import { motion } from 'framer-motion';
import { EmotionPoint } from '../types';

interface HeatmapProps {
  data: EmotionPoint[];
}

export const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-6 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                Emotional Pacing Heatmap
            </h3>
        </div>

        <div className="relative h-24 w-full flex items-end justify-between gap-1">
            {data.map((point, index) => (
                <div key={index} className="relative flex-1 h-full flex items-end group/bar">
                     {/* Bar */}
                     <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${point.intensity * 10}%` }}
                        transition={{ delay: index * 0.05, duration: 0.5, ease: "backOut" }}
                        className="w-full rounded-t-sm relative z-10 opacity-80 hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: point.color_hex }}
                     />
                     
                     {/* Tooltip */}
                     <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-black/90 backdrop-blur-md border border-white/10 p-2 rounded-lg text-center opacity-0 group-hover/bar:opacity-100 pointer-events-none transition-opacity z-20">
                         <div className="text-[10px] font-bold text-white mb-0.5" style={{ color: point.color_hex }}>{point.emotion_label}</div>
                         <div className="text-[9px] text-white/60 leading-tight">{point.beat_description}</div>
                         <div className="mt-1 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                             <div className="h-full bg-white" style={{ width: `${point.intensity * 10}%` }}></div>
                         </div>
                     </div>
                </div>
            ))}
            
            {/* Background Lines */}
            <div className="absolute inset-0 pointer-events-none z-0 flex flex-col justify-between py-1">
                <div className="w-full h-px bg-white/[0.02]"></div>
                <div className="w-full h-px bg-white/[0.02]"></div>
                <div className="w-full h-px bg-white/[0.02]"></div>
            </div>
        </div>
        
        {/* X-Axis Labels (Timeline) */}
        <div className="flex justify-between mt-2 pt-2 border-t border-white/5">
            <span className="text-[9px] text-white/20">START</span>
            <span className="text-[9px] text-white/20">CHAPTER PROGRESSION</span>
            <span className="text-[9px] text-white/20">END</span>
        </div>
    </div>
  );
};
