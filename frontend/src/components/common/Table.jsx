import React from 'react';

export default function Table({ columns, data, loading, pagination, onPageChange, emptyMessage = 'No data found' }) {
  if (loading) return (
    <div className="flex justify-center items-center py-16">
      <div className="spinner" />
    </div>
  );

  if (!data?.length) return (
    <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl bg-white">
      <p className="text-slate-500 font-medium text-base">{emptyMessage}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-slate-200/60 rounded-2xl shadow-premium bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              {columns.map(col => (
                <th key={col.key} className="px-6 py-4.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, i) => (
              <tr key={row._id || i} className="hover:bg-slate-50/50 transition-colors duration-150">
                {columns.map(col => (
                  <td key={col.key} className="px-6 py-4 text-sm text-slate-600">
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-3 px-4 py-2 text-sm">
          <span className="text-slate-500 text-center sm:text-left">
            Showing <strong className="font-semibold text-slate-700">{((pagination.page - 1) * 20) + 1}</strong>–
            <strong className="font-semibold text-slate-700">{Math.min(pagination.page * 20, pagination.total)}</strong> of{" "}
            <strong className="font-semibold text-slate-700">{pagination.total}</strong>
          </span>
          <div className="flex gap-2">
            <button 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors" 
              disabled={pagination.page === 1} 
              onClick={() => onPageChange(pagination.page - 1)}
            >
              ← Prev
            </button>
            <button 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-colors" 
              disabled={pagination.page === pagination.pages} 
              onClick={() => onPageChange(pagination.page + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}