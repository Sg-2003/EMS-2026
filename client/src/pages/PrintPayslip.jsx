import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Printer, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const Row = ({ label, value, highlight, negative }) => (
  <div className={`flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0 ${highlight ? 'font-semibold' : ''}`}>
    <span className={`text-sm ${highlight ? 'text-slate-900' : 'text-slate-600'}`}>{label}</span>
    <span className={`text-sm font-medium ${negative ? 'text-rose-600' : highlight ? 'text-slate-900' : 'text-slate-800'}`}>
      {value}
    </span>
  </div>
);

const PrintPayslip = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/payslips/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPayslip(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load payslip');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-indigo-500" size={36} />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center">
        <AlertCircle size={28} className="text-rose-500" />
      </div>
      <p className="text-slate-700 font-medium">{error}</p>
      <button onClick={() => navigate(-1)} className="btn-secondary flex items-center gap-2">
        <ArrowLeft size={15} /> Go Back
      </button>
    </div>
  );

  const { employee: emp } = payslip;
  const gross = (payslip.basicSalary || 0) + (payslip.allowances || 0) + (payslip.bonus || 0);
  const period = `${MONTHS[payslip.month - 1]} ${payslip.year}`;

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">

      {/* Toolbar — hidden on print */}
      <div className="print:hidden bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="btn-secondary flex items-center gap-2 text-sm">
          <ArrowLeft size={15} /> Back
        </button>
        <span className="text-sm font-medium text-slate-700">
          Payslip — {emp?.name} — {period}
        </span>
        <button
          onClick={() => window.print()}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Printer size={15} /> Print / Save PDF
        </button>
      </div>

      {/* Payslip Document */}
      <div className="max-w-2xl mx-auto my-8 print:my-0 print:shadow-none">
        <div className="bg-white shadow-xl rounded-2xl print:rounded-none print:shadow-none overflow-hidden">

          {/* Header Band */}
          <div className="bg-indigo-600 text-white px-8 py-7 print:bg-indigo-600 print:text-white">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">QuickEMS</h1>
                <p className="text-indigo-200 text-sm mt-0.5">Employee Management System</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-indigo-300 uppercase tracking-widest font-semibold">Salary Slip</p>
                <p className="text-2xl font-bold mt-1">{period}</p>
                <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  payslip.status === 'Paid'
                    ? 'bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-400/30'
                    : 'bg-amber-400/20 text-amber-100 ring-1 ring-amber-400/30'
                }`}>
                  {payslip.status}
                </span>
              </div>
            </div>
          </div>

          {/* Employee Info */}
          <div className="px-8 py-6 bg-slate-50 border-b border-slate-200">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Employee Details</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {[
                ['Full Name',    emp?.name      || '—'],
                ['Email',        emp?.email     || '—'],
                ['Department',   emp?.department || '—'],
                ['Position',     emp?.position  || '—'],
                ['Phone',        emp?.phone     || '—'],
                ['Join Date',    fmtDate(emp?.joinDate)],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-slate-400 mb-0.5">{k}</p>
                  <p className="text-sm font-medium text-slate-800">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Salary Breakdown */}
          <div className="px-8 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Earnings */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Earnings
                </h3>
                <div className="bg-slate-50 rounded-xl px-4 py-1">
                  <Row label="Basic Salary"  value={fmt(payslip.basicSalary)} />
                  <Row label="Allowances"    value={fmt(payslip.allowances)} />
                  <Row label="Bonus"         value={fmt(payslip.bonus)} />
                  <Row label="Gross Salary"  value={fmt(gross)} highlight />
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                  Deductions
                </h3>
                <div className="bg-slate-50 rounded-xl px-4 py-1">
                  <Row label="Total Deductions" value={fmt(payslip.deductions)} negative />
                </div>
              </div>
            </div>

            {/* Net Salary */}
            <div className="mt-6 bg-indigo-600 rounded-xl px-6 py-5 flex items-center justify-between print:bg-indigo-600">
              <div>
                <p className="text-xs text-indigo-200 font-semibold uppercase tracking-wider">Net Salary</p>
                <p className="text-xs text-indigo-300 mt-0.5">After all deductions</p>
              </div>
              <p className="text-3xl font-bold text-white">{fmt(payslip.netSalary)}</p>
            </div>

            {/* Notes */}
            {payslip.notes && (
              <div className="mt-5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-amber-700 mb-1">Notes</p>
                <p className="text-sm text-amber-800">{payslip.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-end justify-between text-xs text-slate-400">
              <div>
                <p>Generated by QuickEMS</p>
                <p>{new Date().toLocaleString('en-GB')}</p>
              </div>
              <div className="text-right">
                {payslip.status === 'Paid' && payslip.paidOn && (
                  <p>Paid on: <span className="font-medium text-slate-600">{fmtDate(payslip.paidOn)}</span></p>
                )}
                <p className="mt-1 text-slate-300">This is a system-generated document.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default PrintPayslip;