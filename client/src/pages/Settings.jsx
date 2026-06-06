import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  User, Lock, Bell, Shield, Building2, Palette,
  Save, Eye, EyeOff, Loader2, Check, ChevronRight,
  Mail, Phone, Briefcase, Calendar, FileText,
  Moon, Sun, Monitor, AlertTriangle, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppearance } from '../context/AppearanceContext';

const BASE = '/api/settings';
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

// ─── Helpers ─────────────────────────────────────────────────────
const getStoredPrefs = (key, defaults) => {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(key) || '{}') }; }
  catch { return defaults; }
};
const saveStoredPrefs = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// ─── Tab Sidebar Item ─────────────────────────────────────────────
const TabItem = ({ id, label, icon: Icon, active, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
      active ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
    }`}
  >
    <Icon size={17} className={active ? 'text-indigo-600' : 'text-slate-400'} />
    <span className="flex-1 text-left">{label}</span>
    {active && <ChevronRight size={14} className="text-indigo-400" />}
  </button>
);

// ─── Section Card ──────────────────────────────────────────────────
const Card = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div className="px-6 pt-6 pb-4 border-b border-slate-100">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// ─── Field Wrapper ─────────────────────────────────────────────────
const Field = ({ label, required, children, hint }) => (
  <div>
    <label className="block text-xs font-medium text-slate-600 mb-1.5">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
  </div>
);

// ─── Password Input (defined OUTSIDE PasswordTab to avoid remount) ─
const PwInput = ({ label, fieldKey, showKey, showState, onToggleShow, formState, onChangeForm, placeholder }) => (
  <Field label={label} required>
    <div className="relative">
      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        type={showState[showKey] ? 'text' : 'password'}
        value={formState[fieldKey]}
        onChange={e => onChangeForm(fieldKey, e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-10"
        autoComplete="new-password"
      />
      <button
        type="button"
        onClick={() => onToggleShow(showKey)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        tabIndex={-1}
      >
        {showState[showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  </Field>
);

// ═══════════════════════════════════════════════════════════════
// PROFILE TAB
// ═══════════════════════════════════════════════════════════════
const ProfileTab = ({ user, onUpdate }) => {
  const { setUser } = useAuth();
  const [form, setForm]     = useState({ name: '', phone: '', bio: '' });
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Always fetch fresh profile when tab mounts
  useEffect(() => {
    setFetching(true);
    axios.get(`${BASE}/profile`, { headers: authH() })
      .then(r => {
        const d = r.data.data;
        setForm({ name: d.name || '', phone: d.phone || '', bio: d.bio || '' });
      })
      .catch(() => {
        setForm({ name: user?.name || '', phone: user?.phone || '', bio: user?.bio || '' });
      })
      .finally(() => setFetching(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const res = await axios.put(`${BASE}/profile`, form, { headers: authH() });
      const data = res.data.data;
      toast.success('Profile updated successfully ✓');
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const updated = { ...stored, name: data.name, phone: data.phone, bio: data.bio };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);   // updates context → sidebar name updates immediately
      onUpdate(updated);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const initials = (form.name || user?.name || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  if (fetching) return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="animate-spin text-indigo-500" size={28} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <Card title="Profile Picture" subtitle="Your avatar shown across the system">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-200 shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{form.name || user?.name}</p>
            <p className="text-xs text-slate-400 mt-0.5 capitalize">{user?.role === 'admin' ? 'Administrator' : user?.role}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <p className="text-xs text-slate-400 mt-2 italic">Avatar auto-generated from your initials</p>
          </div>
        </div>
      </Card>

      {/* Personal Info */}
      <Card title="Personal Information" subtitle="Update your name, phone number, and bio">
        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Full Name" required>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Your full name"
                  className="pl-9"
                  required
                />
              </div>
            </Field>

            <Field label="Email Address" hint="Contact admin to change email">
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={user?.email || ''}
                  className="pl-9 bg-slate-50 text-slate-400 cursor-not-allowed"
                  readOnly
                />
              </div>
            </Field>

            <Field label="Phone Number">
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="pl-9"
                />
              </div>
            </Field>

            <Field label="Role" hint="Role is assigned by admin">
              <div className="relative">
                <Shield size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={user?.role === 'admin' ? 'Administrator' : user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
                  className="pl-9 bg-slate-50 text-slate-400 cursor-not-allowed capitalize"
                  readOnly
                />
              </div>
            </Field>
          </div>

          <Field label="Bio" hint="A short description about yourself (optional)">
            <textarea
              value={form.bio}
              onChange={e => set('bio', e.target.value)}
              placeholder="Tell us a little about yourself..."
              rows={3}
            />
          </Field>

          <div className="flex justify-end pt-1">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 px-6">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Card>

      {/* Work Info (read-only) */}
      <Card title="Work Information" subtitle="Your employment details — managed by admin">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { label: 'Department',     value: user?.department || '—', icon: Building2 },
            { label: 'Position',       value: user?.position   || '—', icon: Briefcase },
            { label: 'Join Date',      value: user?.joinDate ? new Date(user.joinDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—', icon: Calendar },
          ].map(({ label, value, icon: Icon }) => (
            <Field key={label} label={label}>
              <div className="relative">
                <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input type="text" value={value} className="pl-9 bg-slate-50 text-slate-500 cursor-not-allowed" readOnly />
              </div>
            </Field>
          ))}
          <Field label="Account Status">
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className={`w-2.5 h-2.5 rounded-full ${user?.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span className="text-sm text-slate-600 capitalize font-medium">{user?.status || 'active'}</span>
            </div>
          </Field>
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PASSWORD TAB
// ═══════════════════════════════════════════════════════════════
const PasswordTab = () => {
  const [form, setForm]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow]   = useState({ cur: false, new: false, con: false });
  const [saving, setSaving] = useState(false);

  const handleChange = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleShow   = (k)    => setShow(s => ({ ...s, [k]: !s[k] }));

  const strength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 6)            s++;
    if (pw.length >= 10)           s++;
    if (/[A-Z]/.test(pw))          s++;
    if (/[0-9]/.test(pw))          s++;
    if (/[^a-zA-Z0-9]/.test(pw))   s++;
    return s;
  };
  const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['', 'bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'];
  const textCl = ['', 'text-rose-500', 'text-orange-500', 'text-amber-500', 'text-emerald-600', 'text-emerald-700'];
  const pw = form.newPassword;
  const str = strength(pw);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword) return toast.error('Enter your current password');
    if (!form.newPassword)     return toast.error('Enter a new password');
    if (form.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (form.newPassword !== form.confirmPassword) return toast.error('Passwords do not match');
    setSaving(true);
    try {
      await axios.put(
        `${BASE}/change-password`,
        { currentPassword: form.currentPassword, newPassword: form.newPassword },
        { headers: authH() }
      );
      toast.success('Password changed successfully ✓');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Change Password" subtitle="Use a strong password to protect your account">
        <form onSubmit={submit} className="space-y-5 max-w-md" autoComplete="off">
          <PwInput
            label="Current Password"
            fieldKey="currentPassword" showKey="cur"
            showState={show} onToggleShow={toggleShow}
            formState={form} onChangeForm={handleChange}
            placeholder="Enter your current password"
          />
          <PwInput
            label="New Password"
            fieldKey="newPassword" showKey="new"
            showState={show} onToggleShow={toggleShow}
            formState={form} onChangeForm={handleChange}
            placeholder="Enter a new password"
          />

          {/* Strength meter */}
          {pw && (
            <div className="space-y-1.5 -mt-1">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= str ? colors[str] : 'bg-slate-200'}`} />
                ))}
              </div>
              <p className={`text-xs font-medium ${textCl[str]}`}>{labels[str]}</p>
            </div>
          )}

          <PwInput
            label="Confirm New Password"
            fieldKey="confirmPassword" showKey="con"
            showState={show} onToggleShow={toggleShow}
            formState={form} onChangeForm={handleChange}
            placeholder="Re-enter your new password"
          />

          {/* Match indicator */}
          {form.confirmPassword && (
            <div className={`flex items-center gap-2 text-xs font-medium ${form.newPassword === form.confirmPassword ? 'text-emerald-600' : 'text-rose-500'}`}>
              {form.newPassword === form.confirmPassword
                ? <><Check size={13} /> Passwords match</>
                : <><AlertTriangle size={13} /> Passwords do not match</>}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || (form.confirmPassword && form.newPassword !== form.confirmPassword)}
            className="btn-primary flex items-center gap-2 px-6 disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
            {saving ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </Card>

      <Card title="Password Tips" subtitle="Keep your account secure">
        <ul className="space-y-2.5">
          {[
            'Use at least 8 characters for a strong password',
            'Include uppercase letters, numbers, and special symbols',
            'Avoid using your name, email, or common words',
            'Never share your password with anyone',
            'Change your password regularly (every 3–6 months)',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
              <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS TAB  (persisted to localStorage)
// ═══════════════════════════════════════════════════════════════
const NOTIF_DEFAULTS = {
  leaveUpdates      : true,
  payslipGenerated  : true,
  attendanceReminder: false,
  systemAlerts      : true,
  emailDigest       : false,
  browserAlerts     : true,
};

const NotificationsTab = () => {
  const [prefs, setPrefs] = useState(() => getStoredPrefs('ems_notif_prefs', NOTIF_DEFAULTS));
  const [saved, setSaved] = useState(false);

  const toggle = (k) => setPrefs(p => ({ ...p, [k]: !p[k] }));

  const save = () => {
    saveStoredPrefs('ems_notif_prefs', prefs);
    setSaved(true);
    toast.success('Notification preferences saved ✓');
    setTimeout(() => setSaved(false), 2000);
  };

  const ITEMS = [
    { k: 'leaveUpdates',       label: 'Leave Status Updates',    desc: 'Get notified when your leave is approved or rejected',  icon: '🔔' },
    { k: 'payslipGenerated',   label: 'Payslip Generated',       desc: 'Receive alerts when your monthly payslip is ready',      icon: '💰' },
    { k: 'attendanceReminder', label: 'Attendance Reminder',     desc: 'Daily reminder to mark your attendance',                 icon: '📅' },
    { k: 'systemAlerts',       label: 'System Alerts',           desc: 'Important announcements from HR and admin',               icon: '📢' },
    { k: 'emailDigest',        label: 'Weekly Email Digest',     desc: 'Get a weekly summary of your activities by email',       icon: '📧' },
    { k: 'browserAlerts',      label: 'Browser Notifications',   desc: 'Push notifications directly in your browser',            icon: '🌐' },
  ];

  const enabledCount = Object.values(prefs).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <Card title="Notification Preferences" subtitle="Choose what you want to be notified about">
        <div className="divide-y divide-slate-50">
          {ITEMS.map(({ k, label, desc, icon }) => (
            <div key={k} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 gap-4">
              {/* Left */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="text-xl leading-none mt-0.5 shrink-0 select-none">{icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
              {/* Toggle — w-12 h-6 with a w-5 h-5 knob */}
              <button
                type="button"
                onClick={() => toggle(k)}
                role="switch"
                aria-checked={prefs[k]}
                title={prefs[k] ? 'Disable' : 'Enable'}
                style={{ outline: 'none' }}
                className={`relative shrink-0 w-12 h-6 rounded-full border-2 transition-colors duration-300 ease-in-out focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                  prefs[k] ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-200 border-slate-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 inline-block w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ease-in-out ${
                    prefs[k] ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Footer bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 px-6 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-700">
            {enabledCount} / {ITEMS.length} enabled
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Click Save to apply your changes</p>
        </div>
        <button
          onClick={save}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all duration-200 active:scale-95 ${
            saved
              ? 'bg-emerald-500 text-white shadow-emerald-200'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
          }`}
        >
          {saved ? <Check size={15} /> : <Save size={15} />}
          {saved ? 'Saved!' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// APPEARANCE TAB  (persisted to localStorage)
// ═══════════════════════════════════════════════════════════════
const APPEARANCE_DEFAULTS = { theme: 'light', accent: 'indigo', density: 'comfortable' };

const AppearanceTab = () => {
  const { prefs, updatePref } = useAppearance();

  const set = (k, v) => {
    updatePref(k, v);
    toast.success(`${v.charAt(0).toUpperCase() + v.slice(1)} ${k} applied`);
  };

  const ACCENTS = [
    { id: 'indigo',  label: 'Indigo',  cls: 'bg-indigo-500'  },
    { id: 'violet',  label: 'Violet',  cls: 'bg-violet-500'  },
    { id: 'blue',    label: 'Blue',    cls: 'bg-blue-500'     },
    { id: 'emerald', label: 'Emerald', cls: 'bg-emerald-500'  },
    { id: 'rose',    label: 'Rose',    cls: 'bg-rose-500'     },
    { id: 'amber',   label: 'Amber',   cls: 'bg-amber-500'    },
  ];

  return (
    <div className="space-y-6">
      {/* Theme */}
      <Card title="Theme" subtitle="Choose your preferred color scheme">
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'light',  label: 'Light',  icon: Sun,     style: { backgroundColor: '#ffffff', borderColor: '#e2e8f0' } },
            { id: 'dark',   label: 'Dark',   icon: Moon,    style: { backgroundColor: '#0f172a', borderColor: '#334155' } },
            { id: 'system', label: 'System', icon: Monitor, style: { background: 'linear-gradient(to bottom right, #ffffff, #0f172a)', borderColor: '#cbd5e1' } },
          ].map(({ id, label, icon: Icon, style }) => (
            <button
              key={id}
              onClick={() => set('theme', id)}
              className={`rounded-xl p-4 border-2 text-center transition-all ${prefs.theme === id ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="w-full h-14 rounded-lg mb-3 border-2" style={style} />
              <div className="flex items-center justify-center gap-2">
                <Icon size={14} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </div>
              {prefs.theme === id && <Check size={13} className="text-indigo-600 mx-auto mt-1.5" />}
            </button>
          ))}
        </div>
      </Card>

      {/* Accent */}
      <Card title="Accent Color" subtitle="Personalize the highlight color across the app">
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map(a => (
            <button
              key={a.id}
              onClick={() => set('accent', a.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all ${prefs.accent === a.id ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <span className={`w-4 h-4 rounded-full ${a.cls}`} />
              <span className="text-sm font-medium text-slate-700">{a.label}</span>
              {prefs.accent === a.id && <Check size={12} className="text-indigo-600" />}
            </button>
          ))}
        </div>
      </Card>

      {/* Density */}
      <Card title="Display Density" subtitle="Adjust the spacing and size of elements">
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'compact',     label: 'Compact',     desc: 'Tighter spacing' },
            { id: 'comfortable', label: 'Comfortable', desc: 'Balanced (default)' },
            { id: 'spacious',    label: 'Spacious',    desc: 'More breathing room' },
          ].map(({ id, label, desc }) => (
            <button
              key={id}
              onClick={() => set('density', id)}
              className={`rounded-xl p-4 border-2 text-left transition-all ${prefs.density === id ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <p className={`text-sm font-semibold ${prefs.density === id ? 'text-indigo-700' : 'text-slate-700'}`}>{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ACCOUNT TAB
// ═══════════════════════════════════════════════════════════════
const AccountTab = ({ user, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const confirmTimerRef = useRef(null);

  // Fetch fresh profile for accurate _id / createdAt
  useEffect(() => {
    axios.get(`${BASE}/profile`, { headers: authH() })
      .then(r => setProfile(r.data.data))
      .catch(() => setProfile(user));

    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOutClick = () => {
    if (confirmSignOut) {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      onLogout();
    } else {
      setConfirmSignOut(true);
      confirmTimerRef.current = setTimeout(() => {
        setConfirmSignOut(false);
      }, 3000);
    }
  };

  const info = profile || user;

  return (
    <div className="space-y-6">
      <Card title="Account Information" subtitle="Your account details">
        <div className="space-y-1">
          {[
            { label: 'Account ID',   value: info?._id      || info?.id || '—', icon: FileText  },
            { label: 'Email',        value: info?.email    || '—',              icon: Mail      },
            { label: 'Role',         value: info?.role === 'admin' ? 'Administrator' : info?.role ? info.role.charAt(0).toUpperCase() + info.role.slice(1) : '—', icon: Shield },
            { label: 'Department',   value: info?.department || '—',            icon: Building2 },
            { label: 'Position',     value: info?.position   || '—',            icon: Briefcase },
            { label: 'Member Since', value: info?.createdAt ? new Date(info.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—', icon: Calendar },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-4 py-3.5 border-b border-slate-50 last:border-0">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Icon size={15} className="text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">{label}</p>
                <p className="text-sm font-medium text-slate-800 break-all">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="System" subtitle="Application information">
        <div className="space-y-1">
          {[
            ['Application', 'QuickEMS — Employee Management System 2026'],
            ['Version',     'v1.0.0'],
            ['Backend',     'Node.js · Express · MongoDB'],
            ['Frontend',    'React · Vite · Tailwind CSS'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center text-sm py-3 border-b border-slate-50 last:border-0">
              <span className="text-slate-500">{k}</span>
              <span className="font-medium text-slate-800 text-right">{v}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Session" subtitle="Manage your current session">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-800">Sign Out</p>
            <p className="text-xs text-slate-400 mt-0.5">Sign out from your current session on this device</p>
          </div>
          <button
            onClick={handleSignOutClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 ${
              confirmSignOut
                ? 'bg-rose-600 text-white border border-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20'
                : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <LogOut size={14} />
            {confirmSignOut ? 'Confirm Sign Out' : 'Sign Out'}
          </button>
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════
const TABS = [
  { id: 'profile',       label: 'Profile',      icon: User    },
  { id: 'password',      label: 'Password',      icon: Lock    },
  { id: 'notifications', label: 'Notifications', icon: Bell    },
  { id: 'appearance',    label: 'Appearance',    icon: Palette },
  { id: 'account',       label: 'Account',       icon: Shield  },
];

const Settings = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab]   = useState('profile');
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => { setCurrentUser(user); }, [user]);

  const handleUserUpdate = (updated) =>
    setCurrentUser(prev => ({ ...prev, ...updated }));

  return (
    <div className="animate-fade-in pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your profile, security, and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="lg:w-56 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-1 sticky top-6">
            {/* Mini profile */}
            <div className="flex items-center gap-3 px-3 py-3 mb-2 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {(currentUser?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{currentUser?.name}</p>
                <p className="text-xs text-slate-400 capitalize">{currentUser?.role === 'admin' ? 'Administrator' : currentUser?.role}</p>
              </div>
            </div>
            {TABS.map(tab => (
              <TabItem key={tab.id} {...tab} active={activeTab === tab.id} onClick={setActiveTab} />
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'profile'       && <ProfileTab user={currentUser} onUpdate={handleUserUpdate} />}
          {activeTab === 'password'      && <PasswordTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'appearance'    && <AppearanceTab />}
          {activeTab === 'account'       && <AccountTab user={currentUser} onLogout={logout} />}
        </div>
      </div>
    </div>
  );
};

export default Settings;