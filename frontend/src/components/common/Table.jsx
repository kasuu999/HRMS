import React from 'react';

export default function Table({ columns, data, loading, pagination, onPageChange, emptyMessage = 'No data found' }) {
  if (loading) return (
    <div style={{ textAlign: 'center', padding: 48 }}>
      <div className="spinner" style={{ margin: '0 auto' }} />
    </div>
  );

  if (!data?.length) return (
    <div className="empty-state">
      <p>{emptyMessage}</p>
    </div>
  );

  return (
    <div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>{columns.map(col => <th key={col.key}>{col.label}</th>)}</tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row._id || i}>
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 4px 4px', fontSize: 13 }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Showing {((pagination.page - 1) * 20) + 1}–{Math.min(pagination.page * 20, pagination.total)} of {pagination.total}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" disabled={pagination.page === 1} onClick={() => onPageChange(pagination.page - 1)}>← Prev</button>
            <button className="btn btn-secondary btn-sm" disabled={pagination.page === pagination.pages} onClick={() => onPageChange(pagination.page + 1)}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}