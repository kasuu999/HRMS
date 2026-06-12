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
      const { data } = await aiAPI.search(searchQuery);
      setResults(data.data);
      if (q) setQuery(q);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🤖 AI-Powered HR Tools</h1>
          <p className="page-subtitle">Natural language employee search and HR assistant</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        <div className={`tab ${tab === 0 ? 'active' : ''}`} onClick={() => setTab(0)}>🔍 Smart Search</div>
        <div className={`tab ${tab === 1 ? 'active' : ''}`} onClick={() => setTab(1)}>💬 HR Chat Assistant</div>
      </div>

      {/* Smart Search Tab */}
      {tab === 0 && (
        <div>
          {/* Search bar */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Search employees using natural language — no filters needed
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                className="form-input"
                style={{ flex: 1, fontSize: 15 }}
                placeholder='e.g. "Find all senior developers in Bangalore on probation"'
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button className="btn btn-primary" style={{ padding: '0 24px' }} onClick={() => handleSearch()} disabled={loading}>
                {loading ? <span className="spinner" /> : '🔍 Search'}
              </button>
            </div>

            {/* Example queries */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Try these examples:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {EXAMPLE_QUERIES.map(q => (
                  <button key={q} onClick={() => handleSearch(q)}
                    style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', color: 'var(--primary)', fontWeight: 500 }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          {loading && (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>AI is searching...</p>
            </div>
          )}

          {results && !loading && (
            <div>
              {/* AI Summary */}
              <div className="card" style={{ marginBottom: 16, background: 'var(--primary-light)', border: '1px solid rgba(59,91,219,0.2)' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20 }}>🤖</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)', marginBottom: 4 }}>AI Summary</div>
                    <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>{results.summary}</div>
                  </div>
                </div>
              </div>

              {results.employees.length === 0 ? (
                <div className="card">
                  <div className="empty-state">
                    <p>No employees matched your query</p>
                    <span style={{ fontSize: 13 }}>Try different search terms</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Found <strong>{results.total} employee{results.total !== 1 ? 's' : ''}</strong>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                    {results.employees.map(emp => (
                      <Link key={emp._id} to={`/employees/${emp._id}`} style={{ textDecoration: 'none' }}>
                        <div className="card" style={{ padding: '16px 18px', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                          onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <Avatar name={`${emp.firstName} ${emp.lastName}`} photo={emp.photo} size="md" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{emp.firstName} {emp.lastName}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{emp.designation?.name || '—'}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emp.department?.name} • {emp.location?.city || emp.location?.name}</div>
                            </div>
                          </div>
                          <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
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
        <div className="card" style={{ padding: 0, overflow: 'hidden', maxWidth: 700 }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', height: 560 }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }}>🤖</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>HR Assistant</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Powered by Claude AI • Knows your attendance & leave data</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            maxWidth: '80%', padding: '10px 14px', borderRadius: 12, fontSize: 14, lineHeight: 1.6,
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? 'var(--primary)' : 'var(--bg)',
            color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
            borderBottomRightRadius: m.role === 'user' ? 4 : 12,
            borderBottomLeftRadius: m.role === 'assistant' ? 4 : 12,
          }}>
            {m.content}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '10px 14px', background: 'var(--bg)', borderRadius: 12, borderBottomLeftRadius: 4 }}>
            <span className="spinner" style={{ width: 14, height: 14 }} />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div style={{ padding: '0 18px 10px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {QUICK.map(q => (
            <button key={q} onClick={() => setInput(q)}
              style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', color: 'var(--primary)', fontWeight: 500 }}>
              {q}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
        <input className="form-input" style={{ flex: 1 }}
          placeholder="Ask anything about HR policies, leave, attendance..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button className="btn btn-primary" onClick={send} disabled={loading || !input.trim()}>Send ➤</button>
      </div>
    </div>
  );
}