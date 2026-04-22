
import React, { useState } from 'react';
import { Technique } from '../types';

interface TechniqueSheetProps {
  techniques: Technique[];
  onSave: (techniques: Technique[]) => void;
  isRestricted?: boolean;
}

export const TechniqueSheet: React.FC<TechniqueSheetProps> = ({ techniques, onSave, isRestricted }) => {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const handleUpdate = (index: number, content: string) => {
    if (isRestricted) return;
    const updated = [...techniques];
    updated[index].content = content;
    onSave(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black flex items-center gap-3 text-slate-100 uppercase tracking-tighter">
          <i className="fa-solid fa-dna text-amber-500"></i>
          各武學流派戰術指南
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {techniques.map((tech, idx) => (
          <div key={idx} className={`bg-[#0f172a] rounded-2xl shadow-xl border border-slate-800 overflow-hidden flex flex-col group/tech ${isRestricted ? 'opacity-80' : ''}`}>
            <div className="bg-[#020617] px-5 py-3 border-b border-slate-800 font-black text-blue-400 flex justify-between items-center tracking-widest text-xs">
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                {tech.genre}
              </div>
              {!isRestricted && <i className="fa-solid fa-pen-to-square text-slate-700 group-hover/tech:text-amber-500/50 transition-all"></i>}
            </div>
            <div className="p-5 flex-1">
              {(editingIdx === idx && !isRestricted) ? (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                  <textarea
                    autoFocus
                    value={tech.content}
                    onChange={(e) => handleUpdate(idx, e.target.value)}
                    onBlur={() => setEditingIdx(null)}
                    className="w-full h-48 p-4 bg-[#020617] text-slate-300 border border-amber-500/30 rounded-xl outline-none shadow-[0_0_15px_rgba(245,158,11,0.05)] font-mono text-xs leading-relaxed"
                    placeholder="輸入戰術指南內容..."
                  />
                  <div className="text-[8px] text-amber-500 font-bold mt-2 text-right uppercase tracking-widest">
                    點擊外部以儲存
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => !isRestricted && setEditingIdx(idx)}
                  className={`whitespace-pre-wrap text-slate-400 leading-loose text-xs font-medium transition-colors min-h-[100px] ${!isRestricted ? 'cursor-pointer hover:text-slate-200' : 'cursor-not-allowed'}`}
                >
                  {tech.content || 'ACCESS DENIED: NO DATA'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
