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

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="spinner" />
    </div>
  );

  const deptData = headcount?.byDepartment?.map((d, i) => ({
    name: d.dept?.[0]?.name || 'Unknown', value: d.count
  })) || [];

  const attData = attSummary.map(a => ({
    name: a._id?.replace('_', ' ') || 'Unknown',
    count: a.count,
    avgHours: Math.round((a.avgHours || 0) * 10) / 10,
  }));

  const statusData = headcount?.byStatus?.map(s => ({ name: s._id, value: s.count })) || [];

  // Updated modern theme colors
  const THEME_COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200/50">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-heading">Reports & Analytics</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Organization-wide workforce insights</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-205/65 shadow-premium hover:shadow-premium-hover transition-all duration-200 hover:-translate-y-0.5 flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Employees</span>
          <span className="text-3xl font-extrabold mt-1 font-heading text-brand-600">{headcount?.total || 0}</span>
          <span className="text-[11px] text-slate-500 font-medium mt-2">Active headcount</span>
        </div>
        {headcount?.byEmploymentType?.map((e, i) => (
          <div key={e._id} className="bg-white p-5 rounded-2xl border border-slate-205/65 shadow-premium hover:shadow-premium-hover transition-all duration-200 hover:-translate-y-0.5 flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider capitalize">{e._id?.replace('_', ' ') || '—'}</span>
            <span className="text-3xl font-extrabold mt-1 font-heading" style={{ color: THEME_COLORS[(i + 1) % THEME_COLORS.length] }}>{e.count}</span>
            <span className="text-[11px] text-slate-500 font-medium mt-2">Active workforce</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl">
        {['Headcount', 'Attendance', 'Leave Utilization'].map((t, i) => (
          <div 
            key={t} 
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${tab === i ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} 
            onClick={() => setTab(i)}
          >
            {t}
          </div>
        ))}
      </div>

      {/* Headcount Tab */}
      {tab === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight font-heading border-b border-slate-100 pb-3 mb-4">By Department</h3>
            {deptData.length === 0 ? (
              <div className="text-center py-12"><p className="text-sm text-slate-400 font-medium">No department data</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={deptData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, value }) => `${name}: ${value}`}>
                    {deptData.map((_, i) => <Cell key={i} fill={THEME_COLORS[i % THEME_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight font-heading border-b border-slate-100 pb-3 mb-4">By Status</h3>
            {statusData.length === 0 ? (
              <div className="text-center py-12"><p className="text-sm text-slate-400 font-medium">No status data</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} label>
                    {statusData.map((_, i) => <Cell key={i} fill={THEME_COLORS[i % THEME_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {tab === 1 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight font-heading border-b border-slate-100 pb-3 mb-4">Attendance Summary — This Month</h3>
          {attData.length === 0 ? (
            <div className="text-center py-12"><p className="text-sm text-slate-400 font-medium">No attendance data for this month</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Days Count" radius={[6, 6, 0, 0]}>
                  {attData.map((entry, i) => <Cell key={i} fill={THEME_COLORS[i % THEME_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Leave Utilization Tab */}
      {tab === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-premium">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 font-heading">Leave Utilization — {new Date().getFullYear()}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Leave Type</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Entitled</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Taken</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaveUtil.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-450 font-medium">No utilization records found</td>
                  </tr>
                ) : leaveUtil.map(b => {
                  const pct = b.totalEntitled > 0 ? Math.round((b.taken / b.totalEntitled) * 100) : 0;
                  return (
                    <tr key={b._id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 text-sm">
                        <div className="font-semibold text-slate-800">{b.employeeId?.firstName} {b.employeeId?.lastName}</div>
                        <div className="text-[10px] text-slate-400 font-bold tracking-wide mt-0.5">{b.employeeId?.employeeId}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-650 font-medium">
                        {b.leaveType?.name} <span className="text-xs text-slate-400 font-semibold">({b.leaveType?.code})</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{b.totalEntitled}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{b.taken}</td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        <span className={b.balance > 0 ? 'text-emerald-700' : 'text-rose-600'}>
                          {b.balance}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm min-w-[150px]">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-300 ${pct > 80 ? 'bg-rose-500' : 'bg-brand-500'}`} 
                              style={{ width: `${Math.min(pct, 100)}%` }} 
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-10 text-right">{pct}%</span>
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