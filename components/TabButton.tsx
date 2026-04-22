
import React from 'react';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

export const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 font-bold transition-all duration-300 border-b-2 whitespace-nowrap ${
        active 
          ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
          : 'border-transparent text-slate-500 hover:text-slate-100 hover:bg-slate-800'
      }`}
    >
      <i className={`${icon} ${active ? 'text-blue-500' : 'text-slate-600'}`}></i>
      <span>{label}</span>
    </button>
  );
};
