import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  FileText, Plus, Printer, Trash2, Pencil, X, ChevronDown,
  Loader2, AlertCircle, DollarSign, TrendingUp, TrendingDown,
  RotateCcw, Zap, Check, Search, Filter, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BASE = '/api/payslips';
const getToken = () => localStorage.getItem('token');
const authH = () => ({ Authorization: `Bearer ${getToken()}` });

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const curYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => curYear - i);

// ─── Modal Shell ────────────────────────────────────────────────
const Modal = ({ title, subtitle, onClose, maxW = 'max-w-lg', children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxW} animate-slide-up overflow-hidden max-h-[90vh] flex flex-col`}>
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={18} />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
    </div>
  </div>
);

// ─── Payslip Form Modal (Create / Edit) ─────────────────────────
const PayslipFormModal = ({ existing, employees, onClose, onSuccess }) => {
  const isEdit = Boolean(existing);
  const [form, setForm] = useState({
    employeeId:  existing?.employee?._id || existing?.employee || '',
    month:       existing?.month  || new Date().getMonth() + 1,
    year:        existing?.year   || curYear,
    basicSalary: existing?.basicSalary  ?? '',
    allowances:  existing?.allowances   ?? '',
    deductions:  existing?.deductions   ?? '',
    bonus:       existing?.bonus        ?? '',
    notes:       existing?.notes        || '',
    status:      existing?.status       || 'Draft',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-fill salary from selected employee
  const handleEmpChange = (id) => {
    set('employeeId', id);
    const emp = employees.find(e => e._id === id);
    if (emp && !isEdit) {
      setForm(f => ({
        ...f,
        employeeId: id,
        basicSalary: emp.basicSalary ?? '',
        allowances:  emp.allowances  ?? '',
        deductions:  emp.deductions  ?? '',
      }));
    }
  };

  const net = (Number(form.basicSalary) + Number(form.allowances || 0) + Number(form.bonus || 0)) - Number(form.deductions || 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!isEdit && !form.employeeId) return toast.error('Select an employee');
    if (!form.basicSalary) return toast.error('Basic salary is required');
    setSaving(true);
    try {
      if (isEdit) {
        await axios.put(`${BASE}/${existing._id}`, form, { headers: authH() });
        toast.success('Payslip updated');
      } else {
        await axios.post(BASE, form, { headers: authH() });
        toast.success('Payslip created');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? 'Edit Payslip' : 'Create Payslip'} subtitle={isEdit ? `${MONTHS[existing.month - 1]} ${existing.year}` : 'Fill in salary details'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {/* Employee */}
        {!isEdit && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Employee <span className="text-rose-500">*</span></label>
            <div className="relative">
              <select value={form.employeeId} onChange={e => handleEmpChange(e.target.value)} className="appearance-none pr-9" required>
                <option value="">Select employee</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name} — {emp.department || 'No Dept'}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Month / Year */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Month <span className="text-rose-500">*</span></label>
            <div className="relative">
              <select value={form.month} onChange={e => set('month', e.target.value)} className="appearance-none pr-9" disabled={isEdit}>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Year <span className="text-rose-500">*</span></label>
            <div className="relative">
              <select value={form.year} onChange={e => set('year', e.target.value)} className="appearance-none pr-9" disabled={isEdit}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Salary Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Basic Salary (₹) <span className="text-rose-500">*</span></label>
            <input type="number" min="0" value={form.basicSalary} onChange={e => set('basicSalary', e.target.value)} placeholder="0" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Allowances (₹)</label>
            <input type="number" min="0" value={form.allowances} onChange={e => set('allowances', e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Bonus (₹)</label>
            <input type="number" min="0" value={form.bonus} onChange={e => set('bonus', e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Deductions (₹)</label>
            <input type="number" min="0" value={form.deductions} onChange={e => set('deductions', e.target.value)} placeholder="0" />
          </div>
        </div>

        {/* Net preview */}
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium ${net >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          <span>Net Salary</span>
          <span className="text-lg font-bold">{fmt(net)}</span>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
          <div className="relative">
            <select value={form.status} onChange={e => set('status', e.target.value)} className="appearance-none pr-9">
              <option value="Draft">Draft</option>
              <option value="Paid">Paid</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes..." rows={2} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : isEdit ? <><Check size={14} /> Update</> : <><Plus size={14} /> Create</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Generate Monthly Modal ─────────────────────────────────────
const GenerateModal = ({ onClose, onSuccess }) => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year,  setYear]  = useState(curYear);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.post(`${BASE}/generate`, { month, year }, { headers: authH() });
      toast.success(res.data.message || 'Payslips generated');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Generate Monthly Payslips" subtitle="Auto-create payslips for all active employees" onClose={onClose} maxW="max-w-sm">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Month</label>
          <div className="relative">
            <select value={month} onChange={e => setMonth(e.target.value)} className="appearance-none pr-9">
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Year</label>
          <div className="relative">
            <select value={year} onChange={e => setYear(e.target.value)} className="appearance-none pr-9">
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="bg-amber-50 text-amber-700 rounded-lg px-3 py-2 text-xs">
          Payslips will be created using each employee's base salary. Existing payslips for this period will be skipped.
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            {saving ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN PAYSLIPS PAGE
// ═══════════════════════════════════════════════════════════════
const Payslips = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const [payslips,   setPayslips]   = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [fetching,   setFetching]   = useState(true);
  const [deleting,   setDeleting]   = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const confirmTimerRef = useRef(null);

  // filters
  const [search,      setSearch]      = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear,  setFilterYear]  = useState('');
  const [filterStatus,setFilterStatus]= useState('All');

  // modals
  const [showCreate,   setShowCreate]   = useState(false);
  const [editPayslip,  setEditPayslip]  = useState(null);
  const [showGenerate, setShowGenerate] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchPayslips = useCallback(async () => {
    setFetching(true);
    try {
      const url = isAdmin ? BASE : `${BASE}/my`;
      const res = await axios.get(url, { headers: authH() });
      setPayslips(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load payslips');
    } finally {
      setFetching(false);
    }
  }, [isAdmin]);

  const fetchEmployees = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await axios.get('/api/employees', { headers: authH() });
      setEmployees(res.data.data || []);
    } catch { /* silent */ }
  }, [isAdmin]);

  useEffect(() => { fetchPayslips(); fetchEmployees(); }, [fetchPayslips, fetchEmployees]);

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
      toast.success('Payslip deleted');
      setPayslips(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  // ── Filter ─────────────────────────────────────────────────────
  const filtered = payslips.filter(p => {
    const name = (p.employee?.name || '').toLowerCase();
    const dept = (p.employee?.department || '').toLowerCase();
    const q = search.toLowerCase();
    if (q && !name.includes(q) && !dept.includes(q)) return false;
    if (filterMonth && p.month !== Number(filterMonth)) return false;
    if (filterYear  && p.year  !== Number(filterYear))  return false;
    if (filterStatus !== 'All' && p.status !== filterStatus) return false;
    return true;
  });

  // ── Stats ──────────────────────────────────────────────────────
  const totalNet = filtered.reduce((s, p) => s + (p.netSalary || 0), 0);
  const paidCount  = filtered.filter(p => p.status === 'Paid').length;
  const draftCount = filtered.filter(p => p.status === 'Draft').length;

  return (
    <div className="animate-fade-in pb-10">

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Payslips</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {isAdmin ? 'Manage and generate employee payslips' : 'View and download your salary slips'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchPayslips} className="btn-secondary px-3 flex items-center gap-2" title="Refresh">
            <RotateCcw size={15} />
          </button>
          {isAdmin && (
            <>
              <button onClick={() => setShowGenerate(true)} className="btn-secondary flex items-center gap-2 whitespace-nowrap">
                <Zap size={15} className="text-amber-500" /> Auto Generate
              </button>
              <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 whitespace-nowrap">
                <Plus size={15} /> Add Payslip
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Payslips', value: filtered.length,    suffix: '',       icon: FileText,     color: 'text-slate-700',   bg: 'bg-slate-100' },
          { label: 'Paid',           value: paidCount,          suffix: '',       icon: Check,        color: 'text-emerald-700', bg: 'bg-emerald-100' },
          { label: 'Draft',          value: draftCount,         suffix: '',       icon: FileText,     color: 'text-amber-700',   bg: 'bg-amber-100' },
          { label: 'Total Payout',   value: fmt(totalNet),      suffix: '',       icon: DollarSign,   color: 'text-indigo-700',  bg: 'bg-indigo-100' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={20} className={color} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium truncate">{label}</p>
              <p className="text-xl font-bold text-slate-900 truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-wrap gap-3 items-center">
        {/* Search — admin only */}
        {isAdmin && (
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 py-2 text-sm"
            />
          </div>
        )}

        {/* Month */}
        <div className="relative">
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="py-2 pr-8 text-sm appearance-none min-w-[130px]">
            <option value="">All Months</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Year */}
        <div className="relative">
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="py-2 pr-8 text-sm appearance-none min-w-[90px]">
            <option value="">All Years</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 ml-auto">
          {['All', 'Draft', 'Paid'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                filterStatus === s ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">
            {isAdmin ? 'All Payslips' : 'My Payslips'}
            <span className="ml-2 text-xs font-normal text-slate-400">({filtered.length})</span>
          </h2>
        </div>

        {fetching ? (
          <div className="flex items-center justify-center h-56">
            <Loader2 className="animate-spin text-indigo-500" size={30} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <AlertCircle size={22} className="text-slate-400" />
            </div>
            <p className="text-slate-600 text-sm font-medium">No payslips found</p>
            <p className="text-slate-400 text-xs mt-1">
              {isAdmin ? 'Create a payslip or use Auto Generate' : 'No payslips have been issued yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  {isAdmin && <th>Employee</th>}
                  <th>Period</th>
                  <th>Basic Salary</th>
                  <th>Allowances</th>
                  <th>Bonus</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th>Paid On</th>
                  <th className="text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p._id}>
                    {isAdmin && (
                      <td>
                        <div>
                          <p className="font-medium text-slate-800 whitespace-nowrap">{p.employee?.name || '—'}</p>
                          <p className="text-xs text-slate-400">{p.employee?.department || '—'}</p>
                        </div>
                      </td>
                    )}
                    <td>
                      <span className="font-medium text-slate-800 whitespace-nowrap">
                        {MONTHS[p.month - 1]} {p.year}
                      </span>
                    </td>
                    <td className="text-slate-600 whitespace-nowrap">{fmt(p.basicSalary)}</td>
                    <td className="whitespace-nowrap">
                      <span className="text-emerald-600 font-medium">+{fmt(p.allowances)}</span>
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="text-emerald-600 font-medium">+{fmt(p.bonus)}</span>
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="text-rose-600 font-medium">-{fmt(p.deductions)}</span>
                    </td>
                    <td>
                      <span className="font-bold text-slate-900 whitespace-nowrap">{fmt(p.netSalary)}</span>
                    </td>
                    <td>
                      <span className={`badge ${p.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="text-slate-400 text-xs whitespace-nowrap">{fmtDate(p.paidOn)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1 pr-2">
                        {/* Print */}
                        <button
                          onClick={() => navigate(`/print/payslips/${p._id}`)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          title="Print Payslip"
                        >
                          <Printer size={14} />
                        </button>
                        {/* Edit (admin) */}
                        {isAdmin && (
                          <button
                            onClick={() => setEditPayslip(p)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {/* Delete (admin) */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(p._id)}
                            disabled={deleting === p._id}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
                              confirmDeleteId === p._id
                                ? 'bg-rose-600 text-white animate-pulse'
                                : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'
                            }`}
                            title={confirmDeleteId === p._id ? 'Click again to confirm' : 'Delete'}
                          >
                            {deleting === p._id
                              ? <Loader2 size={13} className="animate-spin" />
                              : confirmDeleteId === p._id
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

        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <span>Showing {filtered.length} of {payslips.length} payslip{payslips.length !== 1 ? 's' : ''}</span>
            <span className="font-medium text-slate-600">Total: {fmt(totalNet)}</span>
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────── */}
      {showCreate && (
        <PayslipFormModal employees={employees} onClose={() => setShowCreate(false)} onSuccess={fetchPayslips} />
      )}
      {editPayslip && (
        <PayslipFormModal existing={editPayslip} employees={employees} onClose={() => setEditPayslip(null)} onSuccess={fetchPayslips} />
      )}
      {showGenerate && (
        <GenerateModal onClose={() => setShowGenerate(false)} onSuccess={fetchPayslips} />
      )}
    </div>
  );
};

export default Payslips;