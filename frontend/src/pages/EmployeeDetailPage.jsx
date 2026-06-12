import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeAPI, attendanceAPI, aiAPI } from '../utils/api';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import EmployeeForm from '../components/employee/EmployeeForm';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Employment', 'Bank & Documents', 'Attendance History', 'AI Summary'];

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuthStore();
  const [employee, setEmployee] = useState(null);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    employeeAPI.get(id).then(r => { setEmployee(r.data.data); setLoading(false); }).catch(() => { toast.error('Employee not found'); navigate('/employees'); });
  }, [id]);

  useEffect(() => {
    if (tab === 3) {
      const from = new Date(); from.setDate(1);
      attendanceAPI.list({ employeeId: id, fromDate: from.toISOString(), limit: 31 })
        .then(r => setAttendance(r.data.data)).catch(() => {});
    }
    if (tab === 4 && !aiSummary) loadAISummary();
  }, [tab]);

  const loadAISummary = async () => {
    setAiLoading(true);
    try {
      const { data } = await aiAPI.summary(id);
      setAiSummary(data.data.summary);
    } catch { setAiSummary('AI summary unavailable. Please check your API key.'); }
    finally { setAiLoading(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;
  if (!employee) return null;

  const fullName = `${employee.firstName} ${employee.lastName}`;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/employees')}>← Back</button>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <Avatar name={fullName} photo={employee.photo} size="xl" />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>{fullName}</h2>
              <Badge status={employee.status} />
              <Badge status={employee.employmentType} />
            </div>
            <div style={{ marginTop: 6, fontSize: 14, color: 'var(--text-secondary)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <span>🆔 {employee.employeeId}</span>
              <span>💼 {employee.designation?.name || '—'}</span>
              <span>🏢 {employee.department?.name || '—'}</span>
              <span>📍 {employee.location?.name || '—'}</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
              📧 {employee.officialEmail}
              {employee.phone && <span style={{ marginLeft: 16 }}>📞 {employee.phone}</span>}
            </div>
          </div>
          {hasRole('hr_admin') && (
            <button className="btn btn-secondary" onClick={() => setShowEdit(true)}>✏️ Edit</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {TABS.map((t, i) => (
          <div key={t} className={`tab ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>{t}</div>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 0 && (
        <div className="grid-2">
          <InfoCard title="Personal Details" rows={[
            ['Full Name', fullName],
            ['Date of Birth', employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : '—'],
            ['Gender', employee.gender || '—'],
            ['Marital Status', employee.maritalStatus || '—'],
            ['Nationality', employee.nationality || '—'],
          ]} />
          <InfoCard title="Contact Details" rows={[
            ['Official Email', employee.officialEmail],
            ['Personal Email', employee.personalEmail || '—'],
            ['Phone', employee.phone || '—'],
            ['City', employee.currentAddress?.city || '—'],
            ['Emergency Contact', employee.emergencyContact?.name ? `${employee.emergencyContact.name} (${employee.emergencyContact.relation})` : '—'],
          ]} />
        </div>
      )}

      {/* Tab: Employment */}
      {tab === 1 && (
        <div className="grid-2">
          <InfoCard title="Employment Details" rows={[
            ['Employee ID', employee.employeeId],
            ['Date of Joining', employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : '—'],
            ['Employment Type', employee.employmentType?.replace('_', ' ') || '—'],
            ['Department', employee.department?.name || '—'],
            ['Designation', employee.designation?.name || '—'],
            ['Grade', employee.grade || '—'],
            ['Location', employee.location?.name || '—'],
          ]} />
          <InfoCard title="Reporting & Shift" rows={[
            ['Reporting Manager', employee.reportingManager ? `${employee.reportingManager.firstName} ${employee.reportingManager.lastName}` : '—'],
            ['Shift', employee.shift?.name || '—'],
            ['Confirmation Date', employee.confirmationDate ? new Date(employee.confirmationDate).toLocaleDateString() : '—'],
          ]} />
          {employee.skills?.length > 0 && (
            <div className="card">
              <div className="card-title">Skills</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {employee.skills.map(s => <span key={s} className="badge badge-blue">{s}</span>)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Bank & Documents */}
      {tab === 2 && (
        <div className="grid-2">
          {employee.bankDetails && (
            <InfoCard title="Bank Details" rows={[
              ['Bank Name', employee.bankDetails.bankName || '—'],
              ['Account Number', employee.bankDetails.accountNumber ? '••••' + employee.bankDetails.accountNumber.slice(-4) : '—'],
              ['IFSC', employee.bankDetails.ifscCode || '—'],
              ['Account Type', employee.bankDetails.accountType || '—'],
            ]} />
          )}
          <InfoCard title="Statutory" rows={[
            ['PAN', employee.pan || '—'],
            ['Aadhaar', employee.aadhaar ? '••••••••' + employee.aadhaar.slice(-4) : '—'],
            ['UAN', employee.uan || '—'],
            ['PF Number', employee.pfNumber || '—'],
          ]} />
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <div className="card-title">Documents</div>
            {employee.documents?.length === 0 || !employee.documents ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No documents uploaded yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {employee.documents.map((doc, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg)', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>📄 {doc.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{doc.type?.replace('_', ' ')}</div>
                    </div>
                    <a href={doc.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">View</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Attendance History */}
      {tab === 3 && (
        <div className="card">
          <div className="card-title">This Month's Attendance</div>
          {attendance.length === 0 ? (
            <div className="empty-state"><p>No attendance records found</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Punch In</th><th>Punch Out</th><th>Hours</th><th>Status</th><th>Late</th></tr></thead>
                <tbody>
                  {attendance.map(a => (
                    <tr key={a._id}>
                      <td>{new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                      <td>{a.punchIn ? new Date(a.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td>{a.punchOut ? new Date(a.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td>{a.totalHours ? `${a.totalHours}h` : '—'}</td>
                      <td><Badge status={a.status} /></td>
                      <td>{a.isLate ? <span className="badge badge-yellow">{a.lateMinutes}m late</span> : <span className="badge badge-green">On time</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: AI Summary */}
      {tab === 4 && (
        <div className="card">
          <div className="card-title">🤖 AI-Generated Employee Summary</div>
          {aiLoading ? (
            <div style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : (
            <div>
              <p style={{ lineHeight: 1.8, fontSize: 14, color: 'var(--text-primary)' }}>{aiSummary}</p>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={loadAISummary}>🔄 Refresh Summary</button>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Employee" width={620}>
        <EmployeeForm
          existing={employee}
          onSuccess={() => {
            setShowEdit(false);
            employeeAPI.get(id).then(r => setEmployee(r.data.data));
            toast.success('Updated!');
          }}
          onClose={() => setShowEdit(false)}
        />
      </Modal>
    </div>
  );
}

function InfoCard({ title, rows }) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all', textTransform: 'capitalize' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}