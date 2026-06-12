import React, { useState, useEffect } from 'react';
import { reportAPI } from '../utils/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3B5BDB', '#0CA678', '#F59F00', '#F03E3E', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function ReportsPage() {
  const [headcount, setHeadcount] = useState(null);
  const [attSummary, setAttSummary] = useState([]);
  const [leaveUtil, setLeaveUtil] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    Promise.all([
      reportAPI.headcount(),
      reportAPI.attendanceSummary({ fromDate: from.toISOString(), toDate: now.toISOString() }),
      reportAPI.leaveUtilization({ year: now.getFullYear() }),
    ]).then(([h, a, l]) => {
      setHeadcount(h.data.data);
      setAttSummary(a.data.data);
      setLeaveUtil(l.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;

  const deptData = headcount?.byDepartment?.map((d, i) => ({
    name: d.dept?.[0]?.name || 'Unknown', value: d.count
  })) || [];

  const attData = attSummary.map(a => ({
    name: a._id?.replace('_', ' ') || 'Unknown',
    count: a.count,
    avgHours: Math.round((a.avgHours || 0) * 10) / 10,
  }));

  const statusData = headcount?.byStatus?.map(s => ({ name: s._id, value: s.count })) || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Organization-wide workforce insights</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="label">Total Employees</div>
          <div className="value" style={{ color: '#3B5BDB' }}>{headcount?.total || 0}</div>
          <div className="change" style={{ color: '#9CA3AF' }}>Active headcount</div>
        </div>
        {headcount?.byEmploymentType?.map((e, i) => (
          <div key={e._id} className="stat-card">
            <div className="label">{e._id?.replace('_', ' ') || '—'}</div>
            <div className="value" style={{ color: COLORS[i + 1] }}>{e.count}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {['Headcount', 'Attendance', 'Leave Utilization'].map((t, i) => (
          <div key={t} className={`tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>{t}</div>
        ))}
      </div>

      {/* Headcount Tab */}
      {tab === 0 && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title">By Department</div>
            {deptData.length === 0 ? (
              <div className="empty-state"><p>No department data</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={deptData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                    {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="card">
            <div className="card-title">By Status</div>
            {statusData.length === 0 ? (
              <div className="empty-state"><p>No status data</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {tab === 1 && (
        <div className="card">
          <div className="card-title">Attendance Summary — This Month</div>
          {attData.length === 0 ? (
            <div className="empty-state"><p>No attendance data for this month</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]}>
                  {attData.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Leave Utilization Tab */}
      {tab === 2 && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>Leave Utilization — {new Date().getFullYear()}</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Employee</th><th>Leave Type</th><th>Entitled</th><th>Taken</th><th>Balance</th><th>Utilization</th></tr></thead>
              <tbody>
                {leaveUtil.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>No data</td></tr>
                ) : leaveUtil.map(b => {
                  const pct = b.totalEntitled > 0 ? Math.round((b.taken / b.totalEntitled) * 100) : 0;
                  return (
                    <tr key={b._id}>
                      <td style={{ fontWeight: 600 }}>
                        {b.employeeId?.firstName} {b.employeeId?.lastName}
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{b.employeeId?.employeeId}</div>
                      </td>
                      <td>{b.leaveType?.name} <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>({b.leaveType?.code})</span></td>
                      <td>{b.totalEntitled}</td>
                      <td>{b.taken}</td>
                      <td><strong style={{ color: b.balance > 0 ? '#15803D' : '#DC2626' }}>{b.balance}</strong></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, background: 'var(--border)', borderRadius: 4, height: 6 }}>
                            <div style={{ width: `${pct}%`, background: pct > 80 ? '#F03E3E' : '#3B5BDB', height: 6, borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, minWidth: 32 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}