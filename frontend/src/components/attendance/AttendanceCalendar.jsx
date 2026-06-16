import React from 'react';

const STATUS_COLOR = {
  present: { bg: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10', label: 'P' },
  absent: { bg: 'bg-rose-50 text-rose-700 ring-rose-600/10', label: 'A' },
  late: { bg: 'bg-amber-50 text-amber-850 ring-amber-600/20', label: 'L' },
  half_day: { bg: 'bg-blue-50 text-blue-700 ring-blue-600/10', label: 'H' },
  on_leave: { bg: 'bg-violet-50 text-violet-750 ring-violet-600/10', label: 'LV' },
  holiday: { bg: 'bg-rose-50 text-rose-700 ring-rose-600/10', label: 'H' },
  weekly_off: { bg: 'bg-slate-50 text-slate-600 ring-slate-500/10', label: 'W' },
  work_from_home: { bg: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10', label: 'WFH' },
};

export default function AttendanceCalendar({ records = [], year, month }) {
  const y = year || new Date().getFullYear();
  const m = month !== undefined ? month : new Date().getMonth();

  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const recordMap = {};
  records.forEach(r => {
    const d = new Date(r.date).getDate();
    recordMap[d] = r;
  });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const stats = {
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.isLate).length,
    on_leave: records.filter(r => r.status === 'on_leave').length,
  };

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(stats).map(([key, val]) => {
          const cfg = STATUS_COLOR[key] || STATUS_COLOR.weekly_off;
          return (
            <div key={key} className={`px-3 py-1.5 rounded-xl text-xs font-bold ring-1 ring-inset capitalize ${cfg.bg}`}>
              {key.replace('_', ' ')}: {val}
            </div>
          );
        })}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map(d => (
          <div key={d} className="text-center text-xs font-bold text-slate-450 py-2">{d}</div>
        ))}

        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} className="p-2" />)}

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const rec = recordMap[day];
          const cfg = rec ? (STATUS_COLOR[rec.status] || STATUS_COLOR.absent) : null;
          const isToday = new Date().getDate() === day && new Date().getMonth() === m && new Date().getFullYear() === y;
          const isFuture = new Date(y, m, day) > new Date();

          return (
            <div 
              key={day} 
              title={rec ? `${rec.status}${rec.isLate ? ` (${rec.lateMinutes}m late)` : ''}` : ''}
              className={`text-center py-2 px-1 rounded-xl text-xs font-semibold flex flex-col justify-between items-center h-12 ring-2 transition-all ${
                isToday 
                  ? 'ring-brand-500/80 bg-white text-brand-600' 
                  : 'ring-transparent'
              } ${
                cfg 
                  ? `${cfg.bg} cursor-pointer hover:opacity-90` 
                  : isFuture 
                    ? 'bg-transparent text-slate-400' 
                    : 'bg-slate-50/70 text-slate-500'
              }`}
            >
              <div className="text-xs">{day}</div>
              {cfg ? (
                <div className="text-[9px] font-bold tracking-tight opacity-90 mt-0.5">{cfg.label}</div>
              ) : (
                <div className="h-3.5" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 pt-3 border-t border-slate-100 mt-4">
        {Object.entries(STATUS_COLOR).slice(0, 5).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <div className={`w-3.5 h-3.5 rounded-lg ring-1 ring-inset ${cfg.bg}`} />
            <span className="capitalize">{key.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}