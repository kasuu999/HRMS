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
        style={{
          position: 'fixed', bottom: 28, right: 28, width: 52, height: 52, borderRadius: '50%',
          background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer',
          fontSize: 22, boxShadow: '0 4px 20px rgba(59,91,219,0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s',
        }}
        title="HR Assistant"
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 90, right: 28, width: 360, height: 480,
          background: 'var(--bg-card)', borderRadius: 16, boxShadow: 'var(--shadow-md)',
          display: 'flex', flexDirection: 'column', zIndex: 999, border: '1px solid var(--border)', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ background: 'var(--primary)', color: '#fff', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🤖</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>HR Assistant</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Powered by Claude AI</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role === 'user' ? 'user' : 'bot'}`}
                style={{ fontSize: 13, lineHeight: 1.6 }}>{m.content}</div>
            ))}
            {loading && (
              <div className="chat-msg bot" style={{ fontSize: 13 }}>
                <span className="spinner" style={{ width: 14, height: 14 }} />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {messages.length <= 1 && (
            <div style={{ padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {QUICK.map(q => (
                <button key={q} onClick={() => { setInput(q); }}
                  style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', color: 'var(--primary)', fontWeight: 500 }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              className="form-input" style={{ flex: 1, fontSize: 13, padding: '7px 10px' }}
              placeholder="Ask anything about HR..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
            />
            <button className="btn btn-primary btn-sm" onClick={send} disabled={loading || !input.trim()}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}