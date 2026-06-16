import React, { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, width = 520 }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 transition-all"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl p-8 w-full shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100"
        style={{ maxWidth: width }} 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold font-heading text-slate-900">{title}</h3>
          <button 
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg w-8 h-8 flex items-center justify-center transition-all text-2xl font-light" 
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="text-slate-600 text-sm">
          {children}
        </div>
      </div>
    </div>
  );
}