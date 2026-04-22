
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-black text-slate-100 flex items-center gap-3">
                <i className="fa-solid fa-triangle-exclamation text-orange-500"></i>
                {title}
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-400 leading-relaxed">
                {message}
              </p>
            </div>
            <div className="p-6 bg-[#020617]/50 flex gap-3 justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={onConfirm}
                className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-red-600/20"
              >
                確認執行
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
