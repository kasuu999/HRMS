import React, { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../../utils/api';

export default function HRChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your HR assistant 👋 Ask me about leave policies, attendance, payroll, or anything HR-related." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const history = newMessages.slice(1).map(m => ({ role: m.role, content: m.content }));
      const { data } = await aiAPI.chat(msg, history.slice(0, -1));
      setMessages(prev => [...prev, { role: 'assistant', content: data.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting. Please try again." }]);
    } finally { setLoading(false); }
  };

  const QUICK = ['What is my leave balance?', 'How to apply for leave?', 'What is the attendance policy?', 'How to request regularization?'];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-7 right-7 w-13 h-13 rounded-full bg-brand-600 text-white shadow-glow-strong hover:shadow-brand-300 hover:scale-110 active:scale-95 flex items-center justify-center text-xl transition-all duration-200 z-[1000] cursor-pointer"
        title="HR Assistant"
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-22 right-7 w-88 h-[480px] bg-white rounded-2xl shadow-2xl flex flex-col z-[999] border border-slate-250/70 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-brand-600 text-white p-4 flex items-center gap-3 shadow-sm">
            <span className="text-xl">🤖</span>
            <div>
              <div className="font-extrabold text-sm font-heading tracking-wide">HR Assistant</div>
              <div className="text-[10px] text-brand-200 font-semibold tracking-wide uppercase">AI Assistant</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40 flex flex-col">
            {messages.map((m, i) => (
              <div 
                key={i} 
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-brand-600 text-white self-end rounded-br-sm shadow-sm' 
                    : 'bg-white text-slate-800 self-start rounded-bl-sm border border-slate-200/80 shadow-sm'
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="bg-white text-slate-800 self-start rounded-2xl rounded-bl-sm border border-slate-200/80 shadow-sm px-3.5 py-2.5 flex items-center justify-center">
                <span className="spinner" style={{ width: 14, height: 14 }} />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {messages.length <= 1 && (
            <div className="px-4 pb-3 pt-1 bg-slate-50/40 flex flex-wrap gap-1.5">
              {QUICK.map(q => (
                <button 
                  key={q} 
                  onClick={() => { setInput(q); }}
                  className="text-[10px] px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-brand-600 hover:bg-slate-50 transition-colors font-semibold shadow-sm cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 border-t border-slate-100 bg-white flex gap-2 items-center">
            <input
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-xs"
              placeholder="Ask anything about HR..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
            />
            <button 
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-colors disabled:opacity-50 shrink-0" 
              onClick={send} 
              disabled={loading || !input.trim()}
            >
              Send ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}