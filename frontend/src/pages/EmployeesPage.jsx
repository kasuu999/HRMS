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
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">{pagination.total || 0} total employees</p>
        </div>
        {hasRole('hr_admin') && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Employee</button>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="form-input" placeholder="🔍 Search by name, ID, email..."
            style={{ flex: '1 1 220px', maxWidth: 300 }}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <select className="form-input form-select" style={{ width: 180 }}
            value={filters.department} onChange={e => { setFilters(f => ({ ...f, department: e.target.value })); setPage(1); }}>
            <option value="">All Departments</option>
            {depts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <select className="form-input form-select" style={{ width: 160 }}
            value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="resigned">Resigned</option>
          </select>
          <select className="form-input form-select" style={{ width: 160 }}
            value={filters.employmentType} onChange={e => { setFilters(f => ({ ...f, employmentType: e.target.value })); setPage(1); }}>
            <option value="">All Types</option>
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="intern">Intern</option>
            <option value="probation">Probation</option>
          </select>
          <div className="tabs">
            <div className={`tab ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>☰ Table</div>
            <div className={`tab ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>⊞ Grid</div>
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="card" style={{ padding: 0 }}>
          <Table
            columns={columns} data={employees} loading={loading}
            pagination={pagination} onPageChange={setPage}
            emptyMessage="No employees found"
          />
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        loading ? <div style={{ textAlign: 'center', padding: 48 }}><div className="spinner" style={{ margin: '0 auto' }} /></div> :
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {employees.map(emp => (
            <Link key={emp._id} to={`/employees/${emp._id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ textAlign: 'center', padding: '24px 16px', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
                <Avatar name={`${emp.firstName} ${emp.lastName}`} photo={emp.photo} size="lg" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 700, fontSize: 14 }}>{emp.firstName} {emp.lastName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{emp.designation?.name || '—'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{emp.department?.name || '—'}</div>
                <div style={{ marginTop: 10 }}><Badge status={emp.status} /></div>
              </div>
            </Link>
          ))}
        </div>
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