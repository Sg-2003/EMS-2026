import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Users, Building2, UserCheck, Clock, CalendarDays,
  TrendingUp, DollarSign, AlertCircle, CheckCircle2,
  XCircle, Loader2, ArrowRight, CalendarCheck,
  Layers, FileText, UserX, Timer, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BASE = '/api/dashboard';
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_COLORS = {
  Present : 'text-emerald-600 bg-emerald-50',
  Absent  : 'text-rose-600 bg-rose-50',
  Late    : 'text-amber-600 bg-amber-50',
  Pending : 'text-amber-600 bg-amber-50',
  Approved: 'text-emerald-600 bg-emerald-50',
  Rejected: 'text-rose-600 bg-rose-50',
  Active  : 'text-emerald-600 bg-emerald-50',
  Inactive: 'text-slate-500 bg-slate-100',
};

// ─── Metric Card ───────────────────────────────────────────────
const MetricCard = ({ title, value, sub, icon: Icon, color, bg, trend }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start gap-4 hover:shadow-lg transition-all duration-300 group">
    <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
      <Icon size={24} className={color} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <h3 className="text-3xl font-bold text-slate-900 mt-0.5">{value ?? <span className="text-slate-300">—</span>}</h3>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
    {trend !== undefined && (
      <div className={`text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
        {trend >= 0 ? '+' : ''}{trend}%
      </div>
    )}
  </div>
);

// ─── Section heading ────────────────────────────────────────────
const SectionHead = ({ title, link, linkLabel = 'View all' }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-base font-semibold text-slate-800">{title}</h2>
    {link && (
      <Link to={link} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors">
        {linkLabel} <ArrowRight size={12} />
      </Link>
    )}
  </div>
);

// ─── Simple Bar Chart (pure CSS) ───────────────────────────────
const BarChart = ({ data, colorClass = 'bg-indigo-500' }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-24 mt-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
            <div
              className={`w-full ${colorClass} rounded-t-md transition-all duration-700 opacity-80 hover:opacity-100`}
              style={{ height: `${Math.max((d.value / max) * 80, 4)}px` }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
          <p className="text-[10px] text-slate-400 truncate w-full text-center">{d.label}</p>
        </div>
      ))}
    </div>
  );
};

// ─── Donut Ring ─────────────────────────────────────────────────
const DonutRing = ({ value, label, color }) => {
  const r = 30, circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 40 40)" style={{ transition: 'stroke-dasharray 1s ease' }} />
        <text x="40" y="44" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1e293b">{value}%</text>
      </svg>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════
const AdminDashboard = ({ user }) => {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${BASE}/stats`, { headers: authH() })
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-indigo-500" size={36} />
    </div>
  );

  if (!stats) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
      <AlertCircle size={32} className="mb-2" />
      <p>Failed to load dashboard data</p>
    </div>
  );

  const { employees, attendance, leaves, payslips, charts } = stats;

  // Dept chart data
  const deptData = (charts.deptBreakdown || []).map(d => ({ label: d._id || 'N/A', value: d.count }));

  // Leave type chart
  const leaveColors = { Annual: '#6366f1', Sick: '#f59e0b', Casual: '#10b981', Other: '#8b5cf6' };

  return (
    <div className="space-y-8">

      {/* ── Greeting ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Here's what's happening at your organization today — {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* ── Key Metrics ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard title="Total Employees"    value={employees?.total ?? 0}       sub={`${employees?.active ?? 0} active`}                   icon={Users}        color="text-indigo-600" bg="bg-indigo-50" />
        <MetricCard title="Departments"        value={employees?.departments ?? 0}  sub="Active departments"                              icon={Building2}    color="text-violet-600" bg="bg-violet-50" />
        <MetricCard title="Present Today"      value={attendance?.today?.present ?? 0} sub={`of ${employees?.total ?? 0} employees`}            icon={UserCheck}    color="text-emerald-600" bg="bg-emerald-50" />
        <MetricCard title="Pending Leaves"     value={leaves?.pending ?? 0}        sub="Awaiting approval"                               icon={Clock}        color="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* ── Row 2 ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard title="Absent Today"       value={attendance?.today?.absent ?? 0}  sub="Not checked in"                              icon={UserX}        color="text-rose-600" bg="bg-rose-50" />
        <MetricCard title="Late Today"         value={attendance?.today?.late ?? 0}    sub="Came in late"                                icon={Timer}        color="text-orange-600" bg="bg-orange-50" />
        <MetricCard title="Monthly Payout"     value={fmt(payslips?.totalPayout ?? 0)} sub={`${MONTHS[(payslips?.month ?? 1) - 1]} ${payslips?.year ?? ''}`} icon={DollarSign} color="text-teal-600" bg="bg-teal-50" />
        <MetricCard title="Payslips Issued"    value={payslips?.paid ?? 0}           sub={`${payslips?.draft ?? 0} still draft`}              icon={FileText}     color="text-blue-600" bg="bg-blue-50" />
      </div>

      {/* ── Charts + Recent Leaves ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Attendance rings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <SectionHead title="Today's Attendance" link="/attendance" />
          <div className="flex justify-around mt-2">
            <DonutRing
              value={employees.total > 0 ? Math.round(((attendance.today?.present ?? 0) / employees.total) * 100) : 0}
              label="Present" color="#10b981"
            />
            <DonutRing
              value={employees.total > 0 ? Math.round(((attendance.today?.absent ?? 0) / employees.total) * 100) : 0}
              label="Absent" color="#f43f5e"
            />
            <DonutRing
              value={attendance.month?.rate ?? 0}
              label="Month Rate" color="#6366f1"
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Present', value: attendance.today?.present ?? 0, color: 'text-emerald-600' },
              { label: 'Absent',  value: attendance.today?.absent  ?? 0, color: 'text-rose-600'    },
              { label: 'Late',    value: attendance.today?.late    ?? 0, color: 'text-amber-600'   },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-2">
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Department chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <SectionHead title="Employees by Department" link="/employees" />
          {deptData.length > 0
            ? <BarChart data={deptData} colorClass="bg-indigo-400" />
            : <p className="text-slate-400 text-sm text-center py-8">No department data</p>
          }
        </div>

        {/* Recent Leaves */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <SectionHead title="Recent Leave Requests" link="/leave" />
          <div className="space-y-3">
            {leaves.recent.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-6">No leave requests</p>
            )}
            {leaves.recent.map(l => (
              <div key={l._id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                    {l.employee?.name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{l.employee?.name || '—'}</p>
                    <p className="text-xs text-slate-400">{l.leaveType} · {l.employee?.department || '—'}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[l.status]}`}>
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Employees + Leave type breakdown ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Employees */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Recent Employees</h2>
            <Link to="/employees" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {employees.recent.map(emp => (
              <div key={emp._id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                    {emp.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{emp.name}</p>
                    <p className="text-xs text-slate-400">{emp.position || emp.department || '—'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[emp.status === 'active' ? 'Active' : 'Inactive']}`}>
                    {emp.status}
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">{emp.joinDate ? fmtDate(emp.joinDate) : 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Stats + Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <SectionHead title="Leave Overview" link="/leave" />
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Pending',  value: leaves.pending,  icon: Clock,        cls: 'text-amber-600 bg-amber-50' },
              { label: 'Approved', value: leaves.approved, icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50' },
              { label: 'Rejected', value: leaves.rejected, icon: XCircle,      cls: 'text-rose-600 bg-rose-50' },
            ].map(({ label, value, icon: Icon, cls }) => (
              <div key={label} className={`rounded-xl p-4 flex flex-col items-center gap-2 ${cls.split(' ')[1]}`}>
                <Icon size={20} className={cls.split(' ')[0]} />
                <p className={`text-2xl font-bold ${cls.split(' ')[0]}`}>{value}</p>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
              </div>
            ))}
          </div>

          {/* Leave type breakdown */}
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">By Leave Type</p>
          <div className="space-y-2">
            {(charts.leaveTypeBreakdown || []).slice(0, 5).map(item => {
              const total = (charts.leaveTypeBreakdown || []).reduce((s, i) => s + i.count, 0);
              const pct   = total > 0 ? Math.round((item.count / total) * 100) : 0;
              return (
                <div key={item._id} className="flex items-center gap-3">
                  <p className="text-xs text-slate-600 w-20 shrink-0">{item._id}</p>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 w-10 text-right font-medium">{item.count}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// EMPLOYEE DASHBOARD
// ═══════════════════════════════════════════════════════════════
const EmployeeDashboard = ({ user }) => {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${BASE}/my-stats`, { headers: authH() })
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-indigo-500" size={36} />
    </div>
  );

  if (!stats) return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
      <AlertCircle size={32} className="mb-2" /> <p>Failed to load stats</p>
    </div>
  );

  const { attendance, leaves, payslips } = stats;
  const latest = payslips.latest;

  return (
    <div className="space-y-8">

      {/* ── Greeting ────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── My Stats ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard title="Days Present"  value={attendance.present} sub={`This month`}        icon={UserCheck}    color="text-emerald-600" bg="bg-emerald-50" />
        <MetricCard title="Days Absent"   value={attendance.absent}  sub="This month"           icon={UserX}        color="text-rose-600"    bg="bg-rose-50" />
        <MetricCard title="Times Late"    value={attendance.late}    sub="This month"           icon={Timer}        color="text-amber-600"   bg="bg-amber-50" />
        <MetricCard title="Pending Leaves" value={leaves.pending}   sub={`${leaves.approved} approved`} icon={Clock} color="text-violet-600" bg="bg-violet-50" />
      </div>

      {/* ── Attendance rate + Latest Payslip ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Attendance card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <SectionHead title="This Month's Attendance" link="/attendance" />
          <div className="flex items-center gap-8 mt-2">
            <DonutRing value={attendance.rate} label="Attendance Rate" color="#6366f1" />
            <div className="grid grid-cols-2 gap-3 flex-1">
              {[
                { label: 'Present',  value: attendance.present,  color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Absent',   value: attendance.absent,   color: 'text-rose-600 bg-rose-50'       },
                { label: 'Late',     value: attendance.late,     color: 'text-amber-600 bg-amber-50'     },
                { label: 'Half Day', value: attendance.halfDay,  color: 'text-blue-600 bg-blue-50'       },
              ].map(({ label, value, color }) => (
                <div key={label} className={`rounded-xl p-3 ${color.split(' ')[1]}`}>
                  <p className={`text-xl font-bold ${color.split(' ')[0]}`}>{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Latest Payslip */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <SectionHead title="Latest Payslip" link="/payslips" />
          {latest ? (
            <>
              <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-5 text-white mt-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider">Net Salary</p>
                    <p className="text-3xl font-bold mt-1">{fmt(latest.netSalary)}</p>
                    <p className="text-indigo-200 text-sm mt-1">
                      {MONTHS[(latest.month || 1) - 1]} {latest.year}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    latest.status === 'Paid' ? 'bg-emerald-400/20 text-emerald-100' : 'bg-amber-400/20 text-amber-100'
                  }`}>{latest.status}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: 'Basic',       value: fmt(latest.basicSalary) },
                  { label: 'Allowances',  value: fmt(latest.allowances)  },
                  { label: 'Deductions',  value: fmt(latest.deductions)  },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400">
              <FileText size={28} className="mb-2 text-slate-300" />
              <p className="text-sm">No payslips issued yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Leaves ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">My Recent Leave Requests</h2>
          <Link to="/leave" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {leaves.recent.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <CalendarDays size={28} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No leave requests yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {leaves.recent.map(l => (
              <div key={l._id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-10 rounded-full ${
                    l.status === 'Approved' ? 'bg-emerald-400' :
                    l.status === 'Rejected' ? 'bg-rose-400' : 'bg-amber-400'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{l.leaveType} Leave</p>
                    <p className="text-xs text-slate-400">{fmtDate(l.startDate)} → {fmtDate(l.endDate)} · {l.reason}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[l.status]}`}>
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ROOT DASHBOARD — switches between Admin & Employee
// ═══════════════════════════════════════════════════════════════
const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="animate-fade-in pb-10">
      {isAdmin
        ? <AdminDashboard user={user} />
        : <EmployeeDashboard user={user} />
      }
    </div>
  );
};

export default Dashboard;