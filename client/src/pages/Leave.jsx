import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  CalendarDays, Plus, X, Check, Trash2, Clock,
  ChevronDown, Loader2, FileText, AlertCircle,
  Filter, Pencil, RotateCcw, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BASE = '/api/leaves';
const LEAVE_TYPES = ['Annual', 'Sick', 'Casual', 'Maternity', 'Paternity', 'Unpaid', 'Other'];

const getToken = () => localStorage.getItem('token');
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

const STATUS_STYLE = {
  Pending:  'badge badge-warning',
  Approved: 'badge badge-success',
  Rejected: 'badge badge-danger',
};

const calcDays = (s, e) => {
  if (!s || !e) return 0;
  const diff = new Date(e) - new Date(s);
  return Math.max(1, Math.round(diff / 86400000) + 1);
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const toInputDate = (d) =>
  d ? new Date(d).toISOString().split('T')[0] : '';

// ─── Shared Modal Shell ─────────────────────────────────────────
const Modal = ({ title, subtitle, icon: Icon, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <Icon size={20} className="text-indigo-600" />
            </div>
          )}
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  </div>
);

// ─── Apply / Edit Leave Form Modal ─────────────────────────────
const LeaveFormModal = ({ existing, isAdminEdit, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    leaveType : existing?.leaveType  || '',
    startDate : toInputDate(existing?.startDate) || '',
    endDate   : toInputDate(existing?.endDate)   || '',
    reason    : existing?.reason     || '',
    status    : existing?.status     || 'Pending',
    adminNote : existing?.adminNote  || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.leaveType || !form.startDate || !form.endDate || !form.reason.trim()) {
      return toast.error('All fields are required');
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      return toast.error('End date cannot be before start date');
    }
    setSaving(true);
    try {
      if (existing && isAdminEdit) {
        // Full update (admin)
        await axios.put(`${BASE}/${existing._id}`, form, { headers: authHeader() });
        toast.success('Leave request updated');
      } else {
        // Create (employee)
        await axios.post(BASE, form, { headers: authHeader() });
        toast.success('Leave request submitted');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const isEdit = Boolean(existing);

  return (
    <Modal
      title={isEdit ? 'Edit Leave Request' : 'Apply for Leave'}
      subtitle={isEdit ? 'Modify the leave details below' : 'Submit a new leave request'}
      icon={CalendarDays}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        {/* Leave Type */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Leave Type</label>
          <div className="relative">
            <select
              value={form.leaveType}
              onChange={e => set('leaveType', e.target.value)}
              className="appearance-none pr-9"
              required
            >
              <option value="">Select type</option>
              {LEAVE_TYPES.map(t => <option key={t} value={t}>{t} Leave</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Start Date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={e => set('startDate', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">End Date</label>
            <input
              type="date"
              value={form.endDate}
              min={form.startDate}
              onChange={e => set('endDate', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Duration */}
        {form.startDate && form.endDate && new Date(form.endDate) >= new Date(form.startDate) && (
          <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
            <Clock size={13} />
            <span>Duration: <strong>{calcDays(form.startDate, form.endDate)} day{calcDays(form.startDate, form.endDate) !== 1 ? 's' : ''}</strong></span>
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Reason</label>
          <textarea
            value={form.reason}
            onChange={e => set('reason', e.target.value)}
            placeholder="Briefly describe the reason for your leave..."
            rows={3}
            required
          />
        </div>

        {/* Admin-only fields */}
        {isAdminEdit && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
              <div className="relative">
                <select value={form.status} onChange={e => set('status', e.target.value)} className="appearance-none pr-9">
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Admin Note</label>
              <textarea
                value={form.adminNote}
                onChange={e => set('adminNote', e.target.value)}
                placeholder="Optional note for the employee..."
                rows={2}
              />
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving
              ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
              : isEdit
                ? <><Check size={14} /> Save Changes</>
                : <><Plus size={14} /> Submit Request</>
            }
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Admin Review Modal (quick approve/reject) ──────────────────
const ReviewModal = ({ leave, onClose, onSuccess }) => {
  const [note, setNote]     = useState(leave.adminNote || '');
  const [saving, setSaving] = useState(false);

  const act = async (status) => {
    setSaving(true);
    try {
      await axios.patch(
        `${BASE}/${leave._id}/status`,
        { status, adminNote: note },
        { headers: authHeader() }
      );
      toast.success(`Leave ${status.toLowerCase()} successfully`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Review Leave Request" onClose={onClose}>
      {/* Summary */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-2.5 text-sm mb-4">
        {[
          ['Employee',   leave.employee?.name],
          ['Department', leave.employee?.department || '—'],
          ['Leave Type', leave.leaveType],
          ['Duration',   `${fmtDate(leave.startDate)} → ${fmtDate(leave.endDate)} (${calcDays(leave.startDate, leave.endDate)}d)`],
          ['Reason',     leave.reason],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <span className="text-slate-500 shrink-0">{k}</span>
            <span className="font-medium text-slate-800 text-right">{v}</span>
          </div>
        ))}
      </div>

      {/* Admin note */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Admin Note (optional)</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a note for the employee..."
          rows={2}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => act('Rejected')}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-60"
        >
          <X size={14} /> Reject
        </button>
        <button
          onClick={() => act('Approved')}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Approve
        </button>
      </div>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN LEAVE PAGE
// ═══════════════════════════════════════════════════════════════
const Leave = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [leaves,       setLeaves]       = useState([]);
  const [fetching,     setFetching]     = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [deleting,     setDeleting]     = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const confirmTimerRef = useRef(null);

  // modal states
  const [showApply,    setShowApply]    = useState(false);  // employee apply
  const [editLeave,    setEditLeave]    = useState(null);   // admin edit
  const [reviewLeave,  setReviewLeave]  = useState(null);   // admin approve/reject

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchLeaves = useCallback(async () => {
    setFetching(true);
    try {
      const url = isAdmin ? BASE : `${BASE}/my`;
      const res = await axios.get(url, { headers: authHeader() });
      setLeaves(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to load leave requests');
    } finally {
      setFetching(false);
    }
  }, [isAdmin]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  // ── Delete ─────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    clearTimeout(confirmTimerRef.current);
    setConfirmDeleteId(null);
    setDeleting(id);
    try {
      await axios.delete(`${BASE}/${id}`, { headers: authHeader() });
      toast.success('Leave request deleted');
      setLeaves(prev => prev.filter(l => l._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────
  const stats = {
    total   : leaves.length,
    pending : leaves.filter(l => l.status === 'Pending').length,
    approved: leaves.filter(l => l.status === 'Approved').length,
    rejected: leaves.filter(l => l.status === 'Rejected').length,
  };

  const filtered = filterStatus === 'All'
    ? leaves
    : leaves.filter(l => l.status === filterStatus);

  return (
    <div className="animate-fade-in pb-10">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Leave Management</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {isAdmin
              ? 'Review and manage all employee leave requests'
              : 'Apply for leave and track your request history'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLeaves}
            className="btn-secondary flex items-center gap-2 px-3"
            title="Refresh"
          >
            <RotateCcw size={15} />
          </button>
          {!isAdmin && (
            <button
              onClick={() => setShowApply(true)}
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={15} /> Apply for Leave
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total',    value: stats.total,    color: 'text-slate-700',   bg: 'bg-slate-100',   icon: FileText  },
          { label: 'Pending',  value: stats.pending,  color: 'text-amber-700',   bg: 'bg-amber-100',   icon: Clock     },
          { label: 'Approved', value: stats.approved, color: 'text-emerald-700', bg: 'bg-emerald-100', icon: Check     },
          { label: 'Rejected', value: stats.rejected, color: 'text-rose-700',    bg: 'bg-rose-100',    icon: X         },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{label} Requests</p>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Card ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">
            {isAdmin ? 'All Leave Requests' : 'My Leave Requests'}
            <span className="ml-2 text-xs font-normal text-slate-400">({filtered.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    filterStatus === s
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Body */}
        {fetching ? (
          <div className="flex items-center justify-center h-56">
            <Loader2 className="animate-spin text-indigo-500" size={30} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <AlertCircle size={22} className="text-slate-400" />
            </div>
            <p className="text-slate-600 text-sm font-medium">No leave requests found</p>
            <p className="text-slate-400 text-xs mt-1">
              {filterStatus !== 'All'
                ? `No ${filterStatus.toLowerCase()} requests`
                : !isAdmin
                  ? 'Click "Apply for Leave" to submit your first request'
                  : 'No requests have been submitted yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  {isAdmin && <th>Employee</th>}
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  {isAdmin && <th>Admin Note</th>}
                  <th>Applied On</th>
                  <th className="text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(leave => (
                  <tr key={leave._id}>
                    {isAdmin && (
                      <td>
                        <div>
                          <p className="font-medium text-slate-800 whitespace-nowrap">{leave.employee?.name || '—'}</p>
                          <p className="text-xs text-slate-400">{leave.employee?.department || '—'}</p>
                        </div>
                      </td>
                    )}
                    <td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium ring-1 ring-indigo-600/10 whitespace-nowrap">
                        {leave.leaveType}
                      </span>
                    </td>
                    <td className="text-slate-600 whitespace-nowrap">{fmtDate(leave.startDate)}</td>
                    <td className="text-slate-600 whitespace-nowrap">{fmtDate(leave.endDate)}</td>
                    <td>
                      <span className="font-semibold text-slate-800">{calcDays(leave.startDate, leave.endDate)}</span>
                    </td>
                    <td>
                      <p className="text-slate-600 max-w-[160px] truncate" title={leave.reason}>{leave.reason}</p>
                    </td>
                    <td>
                      <span className={STATUS_STYLE[leave.status] || 'badge'}>{leave.status}</span>
                    </td>
                    {isAdmin && (
                      <td>
                        <p className="text-slate-500 text-xs max-w-[120px] truncate" title={leave.adminNote}>
                          {leave.adminNote || '—'}
                        </p>
                      </td>
                    )}
                    <td className="text-slate-400 text-xs whitespace-nowrap">{fmtDate(leave.createdAt)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1 pr-2">
                        {/* Admin: quick review (approve/reject) */}
                        {isAdmin && leave.status === 'Pending' && (
                          <button
                            onClick={() => setReviewLeave(leave)}
                            className="px-2.5 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1 whitespace-nowrap"
                          >
                            <Check size={11} /> Review
                          </button>
                        )}
                        {/* Admin: full edit */}
                        {isAdmin && (
                          <button
                            onClick={() => setEditLeave(leave)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                        )}
                        {/* Delete (admin always, employee only pending) */}
                        {(isAdmin || leave.status === 'Pending') && (
                          <button
                            onClick={() => handleDelete(leave._id)}
                            disabled={deleting === leave._id}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
                              confirmDeleteId === leave._id
                                ? 'bg-rose-600 text-white animate-pulse rounded-lg'
                                : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'
                            }`}
                            title={confirmDeleteId === leave._id ? 'Click again to confirm' : 'Delete'}
                          >
                            {deleting === leave._id
                              ? <Loader2 size={13} className="animate-spin" />
                              : confirmDeleteId === leave._id
                                ? <AlertTriangle size={13} />
                                : <Trash2 size={13} />
                            }
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
            Showing {filtered.length} of {leaves.length} request{leaves.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────── */}
      {showApply && (
        <LeaveFormModal
          onClose={() => setShowApply(false)}
          onSuccess={fetchLeaves}
        />
      )}
      {editLeave && (
        <LeaveFormModal
          existing={editLeave}
          isAdminEdit={isAdmin}
          onClose={() => setEditLeave(null)}
          onSuccess={fetchLeaves}
        />
      )}
      {reviewLeave && (
        <ReviewModal
          leave={reviewLeave}
          onClose={() => setReviewLeave(null)}
          onSuccess={fetchLeaves}
        />
      )}
    </div>
  );
};

export default Leave;