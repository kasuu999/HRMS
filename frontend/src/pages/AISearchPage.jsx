import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { aiAPI } from '../utils/api';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import HRChatbot from '../components/ai/HRChatbot';
import toast from 'react-hot-toast';

const EXAMPLE_QUERIES = [
  'Find all engineers in Bangalore',
  'Show probation employees who joined this year',
  'List all interns in development department',
  'Find female employees in HR department',
  'Show full time employees with status active',
];

export default function AISearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0); // 0=Search, 1=Chat

  const handleSearch = async (q) => {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return toast.error('Enter a search query');
    setLoading(true);
    setResults(null);
    try {
      const response = await aiAPI.search(searchQuery);
      setResults(response.data.data);
      if (q) setQuery(q);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200/50">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-heading">🤖 AI-Powered HR Tools</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Natural language employee search and HR assistant</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl">
        <div 
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${tab === 0 ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} 
          onClick={() => setTab(0)}
        >
          🔍 Smart Search
        </div>
        <div 
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${tab === 1 ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} 
          onClick={() => setTab(1)}
        >
          💬 HR Chat Assistant
        </div>
      </div>

      {/* Smart Search Tab */}
      {tab === 0 && (
        <div className="space-y-6">
          {/* Search bar card */}
          <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-premium space-y-4">
            <div className="text-xs text-slate-400 font-bold tracking-wide uppercase">
              Search employees using natural language — no filters needed
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all placeholder:text-slate-400 text-sm"
                placeholder='e.g. "Find all senior developers in Bangalore on probation"'
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button 
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg focus:ring-4 focus:ring-brand-500/20 transition-all flex items-center justify-center text-sm disabled:opacity-70 shrink-0" 
                onClick={() => handleSearch()} 
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : '🔍 Search'}
              </button>
            </div>

            {/* Example queries */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Try these examples:</div>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_QUERIES.map(q => (
                  <button 
                    key={q} 
                    onClick={() => handleSearch(q)}
                    className="text-xs px-3.5 py-1.5 rounded-full border border-slate-205 bg-slate-50/50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors font-medium shadow-sm cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Loading panel */}
          {loading && (
            <div className="bg-white border border-slate-200/60 p-12 rounded-2xl shadow-premium text-center space-y-4">
              <div className="flex justify-center"><div className="spinner" /></div>
              <p className="text-slate-450 text-sm font-medium">AI is searching organizational directory...</p>
            </div>
          )}

          {/* Results panel */}
          {results && !loading && (
            <div className="space-y-6">
              {/* AI Summary Banner */}
              <div className="bg-brand-50/45 border border-brand-200/25 p-5 rounded-2xl shadow-sm flex items-start gap-4">
                <span className="text-2xl shrink-0">🤖</span>
                <div className="space-y-1">
                  <div className="font-extrabold text-xs text-brand-700 tracking-tight font-heading uppercase tracking-wide">AI Search Summary</div>
                  <div className="text-slate-700 text-sm leading-relaxed font-normal">{results.summary}</div>
                </div>
              </div>

              {!results?.employees?.length ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-150 rounded-2xl bg-white">
                  <p className="text-slate-500 font-medium text-base">No employees matched your query</p>
                  <span className="text-xs text-slate-400 font-medium mt-1 block">Try using different skills, designations, locations, or statuses</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs text-slate-450 font-bold tracking-wide uppercase px-2">
                    Found <strong>{results.total} employee{results.total !== 1 ? 's' : ''}</strong>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {results?.employees?.map(emp => (
                      <Link key={emp._id} to={`/employees/${emp._id}`} className="block">
                        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-premium-hover hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between h-full gap-4">
                          <div className="flex gap-4 items-center">
                            <Avatar name={`${emp.firstName} ${emp.lastName}`} photo={emp.photo} size="md" />
                            <div className="min-w-0 flex-1">
                              <div className="font-extrabold text-sm text-slate-800 tracking-tight font-heading truncate">{emp.firstName} {emp.lastName}</div>
                              <div className="text-xs text-slate-450 font-semibold truncate mt-0.5">{emp.designation?.name || '—'}</div>
                              <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{emp.department?.name} • {emp.location?.city || emp.location?.name}</div>
                            </div>
                          </div>
                          <div className="flex gap-1.5 pt-2 border-t border-slate-50">
                            <Badge status={emp.status} />
                            <Badge status={emp.employmentType} />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Chat Tab - full page embedded */}
      {tab === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-premium max-w-2xl mx-auto">
          <EmbeddedChat />
        </div>
      )}
    </div>
  );
}

function EmbeddedChat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI HR assistant 👋 I can help you with leave policies, attendance rules, HR queries, and more. What would you like to know?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = React.useRef(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK = ['What is my leave balance?', 'How do I apply for sick leave?', 'What happens if I forget to punch in?', 'Explain the attendance policy', 'How is overtime calculated?'];

  return (
    <div className="flex flex-col h-[520px]">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <span className="text-2xl">🤖</span>
        <div>
          <div className="font-extrabold text-sm text-slate-800 font-heading">HR Assistant</div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Powered by AI • Knows attendance & leave</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/40 flex flex-col">
        {messages.map((m, i) => (
          <div 
            key={i} 
            className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
              m.role === 'user' 
                ? 'bg-brand-600 text-white self-end rounded-br-sm shadow-sm' 
                : 'bg-white text-slate-800 self-start rounded-bl-sm border border-slate-205/85 shadow-sm'
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="bg-white text-slate-850 self-start rounded-2xl rounded-bl-sm border border-slate-205/85 shadow-sm px-3.5 py-2.5 flex items-center justify-center">
            <span className="spinner" style={{ width: 14, height: 14 }} />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="px-5 pb-3 pt-1 bg-slate-50/40 flex flex-wrap gap-1.5">
          {QUICK.map(q => (
            <button 
              key={q} 
              onClick={() => setInput(q)}
              className="text-[10px] px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-brand-650 hover:bg-slate-50 transition-colors font-semibold shadow-sm cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="p-3.5 border-t border-slate-100 bg-white flex gap-2 items-center">
        <input 
          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-xs"
          placeholder="Ask anything about HR policies, leave, attendance..."
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
  );
}