import React from 'react';

const MAP = {
  active: 'green', present: 'green', approved: 'green', success: 'green',
  absent: 'red', rejected: 'red', terminated: 'red', danger: 'red',
  pending: 'yellow', late: 'yellow', half_day: 'yellow', warning: 'yellow',
  on_leave: 'blue', full_time: 'blue', info: 'blue',
  inactive: 'gray', cancelled: 'gray', withdrawn: 'gray',
  resigned: 'purple', contract: 'purple', intern: 'purple',
};

export default function Badge({ status, label, color }) {
  const cls = color || MAP[status] || 'gray';
  const text = label || (status ? status.replace(/_/g, ' ') : '');
  return <span className={`badge badge-${cls}`} style={{ textTransform: 'capitalize' }}>{text}</span>;
}