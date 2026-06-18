import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { employeeAPI } from '../utils/api';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import EmployeeForm from '../components/employee/EmployeeForm';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function EmployeesPage() {
  const { hasRole } = useAuthStore();
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ department: '', status: 'active', employmentType: '' });
  const [depts, setDepts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await employeeAPI.list({ page, search, ...filters });
      setEmployees(data.data);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load employees'); }
    finally { setLoading(false); }
  }, [page, search, filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    employeeAPI.departments().then(r => setDepts(r.data.data)).catch(() => {});
  }, []);

  const columns = [
    {
      key: 'firstName', label: 'Employee',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name={`${row.firstName} ${row.lastName}`} photo={row.photo} size="sm" />
          <div>
            <Link to={`/employees/${row._id}`} style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>
              {row.firstName} {row.lastName}
            </Link>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{row.employeeId}</div>
          </div>
        </div>
      )
    },
    { key: 'department', label: 'Department', render: (val) => val?.name || '—' },
    { key: 'designation', label: 'Designation', render: (val) => val?.name || '—' },
    { key: 'location', label: 'Location', render: (val) => val ? `${val.name}, ${val.city}` : '—' },
    { key: 'employmentType', label: 'Type', render: (val) => <Badge status={val} /> },
    { key: 'status', label: 'Status', render: (val) => <Badge status={val} /> },
    {
      key: '_id', label: '',
      render: (_, row) => (
        <Link to={`/employees/${row._id}`} className="btn btn-secondary btn-sm">View</Link>
      )
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header /* Responsive Change: stack on mobile */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-4 border-b border-slate-200/50">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-heading">Employees</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">{pagination.total || 0} total employees</p>
        </div>
        {hasRole('hr_admin') && (
          <button 
            className="inline-flex justify-center w-full sm:w-auto items-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-xs font-bold text-white rounded-xl shadow-md transition-all hover:shadow-lg" 
            onClick={() => setShowForm(true)}
          >
            ➕ Add Employee
          </button>
        )}
      </div>

      {/* Filters bar */}
      <div className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-premium">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center">
          <input
            className="px-4 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all placeholder:text-slate-400 text-sm flex-1 min-w-[220px] max-w-full sm:max-w-xs"
            placeholder="🔍 Search by name, ID, email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <select 
            className="px-4 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 bg-white transition-all text-sm w-full sm:w-44"
            value={filters.department} 
            onChange={e => { setFilters(f => ({ ...f, department: e.target.value })); setPage(1); }}
          >
            <option value="">All Departments</option>
            {depts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <select 
            className="px-4 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 bg-white transition-all text-sm w-full sm:w-40"
            value={filters.status} 
            onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="resigned">Resigned</option>
          </select>
          <select 
            className="px-4 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 bg-white transition-all text-sm w-full sm:w-40"
            value={filters.employmentType} 
            onChange={e => { setFilters(f => ({ ...f, employmentType: e.target.value })); setPage(1); }}
          >
            <option value="">All Types</option>
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="intern">Intern</option>
            <option value="probation">Probation</option>
          </select>
          
          <div className="flex gap-0.5 bg-slate-100 p-0.5 rounded-xl self-start sm:self-auto sm:ml-auto">
            <div 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${viewMode === 'table' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-650 hover:text-slate-905'}`} 
              onClick={() => setViewMode('table')}
            >
              ☰ Table
            </div>
            <div 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${viewMode === 'grid' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-650 hover:text-slate-905'}`} 
              onClick={() => setViewMode('grid')}
            >
              ⊞ Grid
            </div>
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          <Table
            columns={columns} 
            data={employees} 
            loading={loading}
            pagination={pagination} 
            onPageChange={setPage}
            emptyMessage="No employees found"
          />
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="spinner" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {employees.map(emp => (
              <Link key={emp._id} to={`/employees/${emp._id}`} className="block">
                <div className="bg-white rounded-2xl border border-slate-205/65 p-6 text-center hover:shadow-premium-hover hover:-translate-y-0.5 transition-all duration-200">
                  <Avatar name={`${emp.firstName} ${emp.lastName}`} photo={emp.photo} size="lg" style={{ margin: '0 auto 12px' }} />
                  <div className="font-extrabold text-sm text-slate-800 tracking-tight font-heading">{emp.firstName} {emp.lastName}</div>
                  <div className="text-xs text-slate-400 font-semibold mt-1">{emp.designation?.name || '—'}</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">{emp.department?.name || '—'}</div>
                  <div className="mt-4"><Badge status={emp.status} /></div>
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      {/* Add Employee Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add New Employee" width={600}>
        <EmployeeForm
          onSuccess={() => { setShowForm(false); load(); }}
          onClose={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}