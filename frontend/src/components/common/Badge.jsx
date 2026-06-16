import React from 'react';

const MAP = {
  active: 'green', present: 'green', approved: 'green', success: 'green',
  absent: 'red', rejected: 'red', terminated: 'red', danger: 'red',
  pending: 'yellow', late: 'yellow', half_day: 'yellow', warning: 'yellow',
  on_leave: 'blue', full_time: 'blue', info: 'blue',
  inactive: 'gray', cancelled: 'gray', withdrawn: 'gray',
  resigned: 'purple', contract: 'purple', intern: 'purple',
};

const STYLES = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/10',
  yellow: 'bg-amber-50 text-amber-800 ring-amber-600/15',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/10',
  gray: 'bg-slate-50 text-slate-600 ring-slate-500/10',
  purple: 'bg-violet-50 text-violet-700 ring-violet-600/10',
};

export default function Badge({ status, label, color }) {
  const colorKey = color || MAP[status] || 'gray';
  const cls = STYLES[colorKey] || STYLES.gray;
  const text = label || (status ? status.replace(/_/g, ' ') : '');
  
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${cls}`}>
      {text}
    </span>
  );
}