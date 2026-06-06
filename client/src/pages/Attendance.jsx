import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  CalendarCheck, ChevronDown, Loader2, AlertCircle,
  Check, X, Clock, UserCheck, UserX, Users,
  Pencil, Trash2, RotateCcw, Save, Filter,
  ChevronLeft, ChevronRight, Sun, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BASE = '/api/attendance';
const EMP_URL = '/api/employees';
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

const STATUS_CFG = {
  Present:   { cls: 'badge badge-success', dot: 'bg-emerald-500' },
  Absent:    { cls: 'badge badge-danger',  dot: 'bg-rose-500'    },
  Late:      { cls: 'badge badge-warning', dot: 'bg-amber-500'   },
  'Half Day':{ cls: 'inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-blue-50 text-blue-700 ring-1 ring-blue-600/10', dot: 'bg-blue-500' },
  'On Leave':{ cls: 'inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-purple-50 text-purple-700 ring-1 ring-purple-600/10', dot: 'bg-purple-500' },
};
const ALL_STATUSES = ['Present', 'Absent', 'Late', 'Half Day', 'On Leave'];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const toInputDate = (d) => d ? new Date(d).toISOString().split('T')[0] : '';
const todayStr = () => new Date().toISOString().split('T')[0];
const curMonth = new Date().getMonth() + 1;
const curYear  = new Date().getFullYear();

// ─── Edit Row inline modal ──────────────────────────────────────
const EditModal = ({ record, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    status  : record.status   || 'Present',
    checkIn : record.checkIn  || '',
    checkOut: record.checkOut || '',
    note    : record.note     || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${BASE}/${record._id}`, form, { headers: authH() });
      toast.success('Attendance updated');
      onSuccess(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Edit Attendance</h2>
            <p className="text-xs text-slate-400 mt-0.5">{record.employee?.name} — {fmtDate(record.date)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
            <div className="relative">
              <select value={form.status} onChange={e => set('status', e.target.value)} className="appearance-none pr-9">
                {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Check In</label>
              <input type="time" value={form.checkIn} onChange={e => set('checkIn', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Check Out</label>
              <input type="time" value={form.checkOut} onChange={e => set('checkOut', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Note</label>
            <input type="text" value={form.note} onChange={e => set('note', e.target.value)} placeholder="Optional note..." />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Bulk Mark Panel (admin marks all employees for a date) ──────
const BulkMarkPanel = ({ employees, onSuccess }) => {
  const [date, setDate]   = useState(todayStr());
  const [rows, setRows]   = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRows(employees.map(emp => ({
      employeeId: emp._id,
      name: emp.name,
      department: emp.department,
      status  : 'Present',
      checkIn : '09:00',
      checkOut: '18:00',
      note    : '',
    })));
  }, [employees]);

  const setRow = (i, k, v) =>
    setRows(r => r.map((row, idx) => idx === i ? { ...row, [k]: v } : row));

  const setAll = (k, v) =>
    setRows(r => r.map(row => ({ ...row, [k]: v })));

  const submit = async () => {
    if (!date) return toast.error('Select a date');
    setSaving(true);
    try {
      const records = rows.map(r => ({
        employeeId: r.employeeId,
        status    : r.status,
        checkIn   : r.checkIn,
        checkOut  : r.checkOut,
        note      : r.note,
      }));
      const res = await axios.post(`${BASE}/bulk`, { date, records }, { headers: authH() });
      toast.success(res.data.message || 'Attendance saved');
      onSuccess();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-3">
          <CalendarCheck size={18} className="text-indigo-500" />
          <span className="text-sm font-semibold text-slate-800">Mark Attendance</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="py-2 text-sm w-40" />
          {/* Quick set all */}
          <div className="flex gap-1.5">
            {['Present','Absent','Late'].map(s => (
              <button key={s} onClick={() => setAll('status', s)}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors">
                All {s}
              </button>
            ))}
          </div>
          <button onClick={submit} disabled={saving}
            className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table-modern">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Status</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.employeeId}>
                <td className="font-medium text-slate-800">{row.name}</td>
                <td className="text-slate-500 text-sm">{row.department || '—'}</td>
                <td>
                  <div className="relative w-32">
                    <select value={row.status} onChange={e => setRow(i, 'status', e.target.value)}
                      className={`appearance-none pr-7 py-1.5 text-xs font-medium ${
                        row.status === 'Present' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                        row.status === 'Absent'  ? 'text-rose-700 bg-rose-50 border-rose-200' :
                        row.status === 'Late'    ? 'text-amber-700 bg-amber-50 border-amber-200' :
                        'text-slate-700 bg-slate-50'
                      }`}>
                      {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </td>
                <td>
                  <input type="time" value={row.checkIn}
                    onChange={e => setRow(i, 'checkIn', e.target.value)}
                    className="py-1.5 text-xs w-28" />
                </td>
                <td>
                  <input type="time" value={row.checkOut}
                    onChange={e => setRow(i, 'checkOut', e.target.value)}
                    className="py-1.5 text-xs w-28" />
                </td>
                <td>
                  <input type="text" value={row.note} placeholder="Note..."
                    onChange={e => setRow(i, 'note', e.target.value)}
                    className="py-1.5 text-xs w-36" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN ATTENDANCE PAGE
// ═══════════════════════════════════════════════════════════════
const Attendance = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [records,   setRecords]   = useState([]);
  const [employees, setEmployees] = useState([]);
  const [fetching,  setFetching]  = useState(true);
  const [editRec,   setEditRec]   = useState(null);
  const [deleting,  setDeleting]  = useState(null);
  const [activeTab, setActiveTab] = useState('records'); // 'records' | 'mark'
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const confirmTimerRef = useRef(null);

  // Filters
  const [filterMonth,  setFilterMonth]  = useState(curMonth);
  const [filterYear,   setFilterYear]   = useState(curYear);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterEmp,    setFilterEmp]    = useState('');

  const YEARS = Array.from({ length: 5 }, (_, i) => curYear - i);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchRecords = useCallback(async () => {
    setFetching(true);
    try {
      const url = isAdmin
        ? `${BASE}?month=${filterMonth}&year=${filterYear}`
        : `${BASE}/my?month=${filterMonth}&year=${filterYear}`;
      const res = await axios.get(url, { headers: authH() });
      setRecords(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load attendance');
    } finally { setFetching(false); }
  }, [isAdmin, filterMonth, filterYear]);

  const fetchEmployees = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await axios.get(EMP_URL, { headers: authH() });
      setEmployees(res.data.data || []);
    } catch { /* silent */ }
  }, [isAdmin]);

  useEffect(() => { fetchRecords(); fetchEmployees(); }, [fetchRecords, fetchEmployees]);

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
      await axios.delete(`${BASE}/${id}`, { headers: authH() });
      toast.success('Record deleted');
      setRecords(prev => prev.filter(r => r._id !== id));
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
    finally { setDeleting(null); }
  };

  // ── Stats ──────────────────────────────────────────────────────
  const filtered = records.filter(r => {
    if (filterStatus !== 'All' && r.status !== filterStatus) return false;
    if (filterEmp && r.employee?._id !== filterEmp) return false;
    return true;
  });

  const stats = {
    total   : records.length,
    present : records.filter(r => r.status === 'Present').length,
    absent  : records.filter(r => r.status === 'Absent').length,
    late    : records.filter(r => r.status === 'Late').length,
    halfDay : records.filter(r => r.status === 'Half Day').length,
    onLeave : records.filter(r => r.status === 'On Leave').length,
  };

  const rate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  // ── Month nav ──────────────────────────────────────────────────
  const prevMonth = () => {
    if (filterMonth === 1) { setFilterMonth(12); setFilterYear(y => y - 1); }
    else setFilterMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (filterMonth === 12) { setFilterMonth(1); setFilterYear(y => y + 1); }
    else setFilterMonth(m => m + 1);
  };

  return (
    <div className="animate-fade-in pb-10">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Attendance</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {isAdmin ? 'Track and manage employee attendance records' : 'View your monthly attendance history'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchRecords} className="btn-secondary px-3" title="Refresh">
            <RotateCcw size={15} />
          </button>
          {isAdmin && (
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              {[{ id: 'records', label: 'Records' }, { id: 'mark', label: 'Mark Attendance' }].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Stats Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Total',    value: stats.total,   color: 'text-slate-700',   bg: 'bg-slate-100',   icon: Users },
          { label: 'Present',  value: stats.present, color: 'text-emerald-700', bg: 'bg-emerald-100', icon: UserCheck },
          { label: 'Absent',   value: stats.absent,  color: 'text-rose-700',    bg: 'bg-rose-100',    icon: UserX },
          { label: 'Late',     value: stats.late,    color: 'text-amber-700',   bg: 'bg-amber-100',   icon: Clock },
          { label: 'Half Day', value: stats.halfDay, color: 'text-blue-700',    bg: 'bg-blue-100',    icon: Sun },
          { label: 'On Leave', value: stats.onLeave, color: 'text-purple-700',  bg: 'bg-purple-100',  icon: CalendarCheck },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className="text-xl font-bold text-slate-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Mark Attendance Tab (Admin) ─────────────────────────── */}
      {isAdmin && activeTab === 'mark' && employees.length > 0 && (
        <BulkMarkPanel employees={employees} onSuccess={() => { fetchRecords(); setActiveTab('records'); }} />
      )}

      {/* ── Records Tab ────────────────────────────────────────── */}
      {(activeTab === 'records' || !isAdmin) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">

          {/* Filters bar */}
          <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
            {/* Month navigator */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5">
              <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded transition-colors">
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm font-medium text-slate-800 w-32 text-center">
                {MONTHS[filterMonth - 1]} {filterYear}
              </span>
              <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Employee filter (admin) */}
            {isAdmin && employees.length > 0 && (
              <div className="relative">
                <select value={filterEmp} onChange={e => setFilterEmp(e.target.value)}
                  className="py-2 pr-8 text-sm appearance-none min-w-[160px]">
                  <option value="">All Employees</option>
                  {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}

            {/* Status filter tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1 ml-auto">
              {['All', ...ALL_STATUSES].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    filterStatus === s ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Attendance % bar */}
          {stats.total > 0 && (
            <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-4">
              <span className="text-xs text-slate-500 whitespace-nowrap">Attendance Rate</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${rate}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap">{rate}%</span>
            </div>
          )}

          {/* Table / Empty */}
          {fetching ? (
            <div className="flex items-center justify-center h-56">
              <Loader2 className="animate-spin text-indigo-500" size={30} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <AlertCircle size={22} className="text-slate-400" />
              </div>
              <p className="text-slate-600 text-sm font-medium">No records for {MONTHS[filterMonth - 1]} {filterYear}</p>
              <p className="text-slate-400 text-xs mt-1">
                {isAdmin ? 'Use "Mark Attendance" tab to add records' : 'Contact HR if records are missing'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Date</th>
                    {isAdmin && <th>Employee</th>}
                    <th>Status</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours</th>
                    <th>Note</th>
                    {isAdmin && <th className="text-right pr-6">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(rec => (
                    <tr key={rec._id}>
                      <td className="font-medium text-slate-800 whitespace-nowrap">{fmtDate(rec.date)}</td>
                      {isAdmin && (
                        <td>
                          <div>
                            <p className="font-medium text-slate-800 whitespace-nowrap">{rec.employee?.name || '—'}</p>
                            <p className="text-xs text-slate-400">{rec.employee?.department || '—'}</p>
                          </div>
                        </td>
                      )}
                      <td>
                        <span className={STATUS_CFG[rec.status]?.cls || 'badge'}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${STATUS_CFG[rec.status]?.dot}`} />
                          {rec.status}
                        </span>
                      </td>
                      <td className="text-slate-600 font-mono text-sm">{rec.checkIn || '—'}</td>
                      <td className="text-slate-600 font-mono text-sm">{rec.checkOut || '—'}</td>
                      <td>
                        {rec.workHours > 0
                          ? <span className="font-semibold text-slate-800">{rec.workHours}h</span>
                          : <span className="text-slate-400">—</span>
                        }
                      </td>
                      <td>
                        <p className="text-slate-500 text-sm max-w-[140px] truncate" title={rec.note}>
                          {rec.note || '—'}
                        </p>
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="flex items-center justify-end gap-1 pr-2">
                            <button onClick={() => setEditRec(rec)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                              title="Edit">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => handleDelete(rec._id)} disabled={deleting === rec._id}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
                                confirmDeleteId === rec._id
                                  ? 'bg-rose-600 text-white animate-pulse'
                                  : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'
                              }`}
                              title={confirmDeleteId === rec._id ? 'Click again to confirm' : 'Delete'}>
                              {deleting === rec._id
                                ? <Loader2 size={13} className="animate-spin" />
                                : confirmDeleteId === rec._id
                                  ? <AlertTriangle size={13} />
                                  : <Trash2 size={13} />
                              }
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400 flex justify-between">
              <span>Showing {filtered.length} of {records.length} records</span>
              <span>{MONTHS[filterMonth - 1]} {filterYear}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Edit Modal ─────────────────────────────────────────── */}
      {editRec && (
        <EditModal record={editRec} onClose={() => setEditRec(null)} onSuccess={fetchRecords} />
      )}
    </div>
  );
};

export default Attendance;