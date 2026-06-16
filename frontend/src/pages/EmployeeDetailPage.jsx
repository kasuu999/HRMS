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
    <div className="space-y-6">
      {/* Back Button Header */}
      <div className="flex items-center">
        <button 
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 shadow-sm transition-colors" 
          onClick={() => navigate('/employees')}
        >
          ← Back to directory
        </button>
      </div>

      {/* Profile Card Header */}
      <div className="bg-white border border-slate-200/60 p-6 md:p-8 rounded-2xl shadow-premium">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <Avatar name={fullName} photo={employee.photo} size="xl" />
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight font-heading">{fullName}</h2>
              <Badge status={employee.status} />
              <Badge status={employee.employmentType} />
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 text-xs text-slate-550 font-medium">
              <span>🆔 {employee.employeeId}</span>
              <span>💼 {employee.designation?.name || '—'}</span>
              <span>🏢 {employee.department?.name || '—'}</span>
              <span>📍 {employee.location?.name || '—'}</span>
            </div>
            <div className="text-xs text-slate-500 font-medium pt-1">
              📧 {employee.officialEmail}
              {employee.phone && <span className="ml-4 pl-4 border-l border-slate-200">📞 {employee.phone}</span>}
            </div>
          </div>
          {hasRole('hr_admin') && (
            <button 
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 shadow-sm md:ml-auto transition-colors" 
              onClick={() => setShowEdit(true)}
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl">
        {TABS.map((t, i) => (
          <div 
            key={t} 
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${tab === i ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} 
            onClick={() => setTab(i)}
          >
            {t}
          </div>
        ))}
      </div>

      {/* Tab Contents */}
      {tab === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      {tab === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoCard title="Employment Details" rows={[
            ['Employee ID', employee.employeeId],
            ['Date of Joining', employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString() : '—'],
            ['Employment Type', employee.employmentType?.replace('_', ' ') || '—'],
            ['Department', employee.department?.name || '—'],
            ['Designation', employee.designation?.name || '—'],
            ['Grade', employee.grade || '—'],
            ['Location', employee.location?.name || '—'],
          ]} />
          <div className="space-y-6">
            <InfoCard title="Reporting & Shift" rows={[
              ['Reporting Manager', employee.reportingManager ? `${employee.reportingManager.firstName} ${employee.reportingManager.lastName}` : '—'],
              ['Shift', employee.shift?.name || '—'],
              ['Confirmation Date', employee.confirmationDate ? new Date(employee.confirmationDate).toLocaleDateString() : '—'],
            ]} />
            {employee.skills?.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium">
                <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase tracking-wider mb-4 border-b border-slate-100 pb-3 font-heading">
                  Key Skills & Competencies
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {employee.skills.map(s => (
                    <span key={s} className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10 capitalize">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {employee.bankDetails && (
            <InfoCard title="Bank Details" rows={[
              ['Bank Name', employee.bankDetails.bankName || '—'],
              ['Account Number', employee.bankDetails.accountNumber ? '••••' + employee.bankDetails.accountNumber.slice(-4) : '—'],
              ['IFSC', employee.bankDetails.ifscCode || '—'],
              ['Account Type', employee.bankDetails.accountType || '—'],
            ]} />
          )}
          <InfoCard title="Statutory Identity" rows={[
            ['PAN Card', employee.pan || '—'],
            ['Aadhaar Card', employee.aadhaar ? '••••••••' + employee.aadhaar.slice(-4) : '—'],
            ['UAN', employee.uan || '—'],
            ['PF Number', employee.pfNumber || '—'],
          ]} />
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium md:col-span-2">
            <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase tracking-wider mb-4 border-b border-slate-100 pb-3 font-heading">
              Uploaded Documents
            </h3>
            {employee.documents?.length === 0 || !employee.documents ? (
              <p className="text-xs text-slate-400 font-medium py-4">No documents uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {employee.documents.map((doc, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-slate-50/70 border border-slate-200/60 rounded-2xl hover:bg-slate-100/30 transition-all duration-200">
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-800 truncate">📄 {doc.name}</div>
                      <div className="text-[10px] text-slate-400 capitalize mt-0.5">{doc.type?.replace(/_/g, ' ')}</div>
                    </div>
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-750 shadow-sm rounded-xl transition-colors ml-4 shrink-0"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-premium">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 font-heading">This Month's Attendance</h2>
          </div>
          {attendance.length === 0 ? (
            <div className="text-center py-12"><p className="text-sm text-slate-450 font-medium">No attendance records found</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Punch In</th>
                    <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Punch Out</th>
                    <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Hours</th>
                    <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Late Info</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendance.map(a => (
                    <tr key={a._id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-650 font-semibold">{new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{a.punchIn ? new Date(a.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{a.punchOut ? new Date(a.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{a.totalHours ? `${a.totalHours}h` : '—'}</td>
                      <td className="px-6 py-4 text-sm"><Badge status={a.status} /></td>
                      <td className="px-6 py-4 text-sm">
                        {a.isLate ? (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/15">
                            {a.lateMinutes}m late
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/10">
                            On time
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 4 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight font-heading border-b border-slate-100 pb-3 mb-4 flex items-center gap-1.5">
            🤖 AI-Generated Employee Summary
          </h2>
          {aiLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="spinner" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 text-sm text-slate-700 leading-relaxed font-normal shadow-inner whitespace-pre-wrap">
                {aiSummary}
              </div>
              <button 
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-650 rounded-xl shadow-sm transition-colors" 
                onClick={loadAISummary}
              >
                🔄 Refresh Summary
              </button>
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
    <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium">
      <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase tracking-wider mb-4 border-b border-slate-100 pb-3 font-heading">
        {title}
      </h3>
      <div className="divide-y divide-slate-100/80">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between items-center py-3 text-xs">
            <span className="text-slate-450 font-medium">{label}</span>
            <span className="font-semibold text-slate-800 text-right max-w-[60%] truncate capitalize">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}