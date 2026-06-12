import React from 'react';

const STATUS_COLOR = {
  present: { bg: '#DCFCE7', color: '#15803D', label: 'P' },
  absent: { bg: '#FEE2E2', color: '#DC2626', label: 'A' },
  late: { bg: '#FEF9C3', color: '#A16207', label: 'L' },
  half_day: { bg: '#DBEAFE', color: '#1D4ED8', label: 'H' },
  on_leave: { bg: '#EDE9FE', color: '#6D28D9', label: 'LV' },
  holiday: { bg: '#FEE2E2', color: '#9F1239', label: 'H' },
  weekly_off: { bg: '#F3F4F6', color: '#6B7280', label: 'W' },
  work_from_home: { bg: '#ECFDF5', color: '#065F46', label: 'WFH' },
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
    <div>
      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(stats).map(([key, val]) => {
          const cfg = STATUS_COLOR[key] || {};
          return (
            <div key={key} style={{ background: cfg.bg, color: cfg.color, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
              {key.replace('_', ' ').toUpperCase()}: {val}
            </div>
          );
        })}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {dayNames.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', padding: '4px 0' }}>{d}</div>
        ))}

        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const rec = recordMap[day];
          const cfg = rec ? (STATUS_COLOR[rec.status] || STATUS_COLOR.absent) : null;
          const isToday = new Date().getDate() === day && new Date().getMonth() === m && new Date().getFullYear() === y;
          const isFuture = new Date(y, m, day) > new Date();

          return (
            <div key={day} title={rec ? `${rec.status}${rec.isLate ? ` (${rec.lateMinutes}m late)` : ''}` : ''}
              style={{
                textAlign: 'center', padding: '6px 2px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                background: cfg ? cfg.bg : (isFuture ? 'transparent' : '#F9FAFB'),
                color: cfg ? cfg.color : (isFuture ? 'var(--text-muted)' : 'var(--text-secondary)'),
                border: isToday ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: rec ? 'pointer' : 'default',
              }}>
              <div style={{ fontSize: 12 }}>{day}</div>
              {cfg && <div style={{ fontSize: 9, marginTop: 1 }}>{cfg.label}</div>}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_COLOR).slice(0, 5).map(([key, cfg]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: cfg.bg, border: `1px solid ${cfg.color}` }} />
            <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}