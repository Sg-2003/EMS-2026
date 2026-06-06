import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  FileText,
  Settings,
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const confirmTimerRef = useRef(null);

  const handleLogoutClick = () => {
    if (confirmLogout) {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      logout();
    } else {
      setConfirmLogout(true);
      confirmTimerRef.current = setTimeout(() => {
        setConfirmLogout(false);
      }, 3000);
    }
  };

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  const navLinks = [
    { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ...(user?.role === 'admin' ? [{ title: 'Employees', path: '/employees', icon: Users }] : []),
    { title: 'Attendance', path: '/attendance', icon: CalendarCheck },
    { title: 'Leave', path: '/leave', icon: CalendarDays },
    { title: 'Payslips', path: '/payslips', icon: FileText },
    { title: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full shrink-0">
      {/* Branding */}
      <div className="h-20 flex items-center px-6 bg-slate-950/50 border-b border-slate-800/60">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          {/* Logo icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <svg viewBox="0 0 64 64" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="15" r="7" fill="white"/>
              <line x1="32" y1="22" x2="32" y2="31" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <line x1="32" y1="31" x2="17" y2="31" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <line x1="32" y1="31" x2="47" y2="31" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <line x1="17" y1="31" x2="17" y2="38" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <line x1="47" y1="31" x2="47" y2="38" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="17" cy="45" r="7" fill="white"/>
              <circle cx="47" cy="45" r="7" fill="white"/>
            </svg>
          </div>
          {/* Wordmark */}
          <div className="leading-none">
            <span className="text-white font-bold text-lg tracking-tight">Quick</span>
            <span className="text-indigo-400 font-bold text-lg tracking-tight">EMS</span>
          </div>
        </Link>
      </div>

      {/* Profile Section */}
      <div className="px-4 py-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/50 shadow-inner">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-lg shadow-indigo-500/20 shrink-0">
            {user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'}
          </div>
          <div className="min-w-0">
            <h2 className="text-white font-semibold text-sm truncate">{user?.name || 'User'}</h2>
            <p className="text-xs text-indigo-400 capitalize font-medium">{user?.role === 'admin' ? 'Administrator' : user?.role || 'Role'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1.5 px-3">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/25 translate-x-0.5'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:translate-x-0.5'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className="text-sm">{link.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800/60">
        <button
          onClick={handleLogoutClick}
          className={`flex items-center gap-3 px-3.5 py-3 w-full rounded-xl transition-all duration-200 group ${
            confirmLogout
              ? 'bg-rose-600 text-white font-semibold shadow-lg shadow-rose-600/25 translate-x-0.5'
              : 'text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 hover:translate-x-0.5'
          }`}
        >
          <LogOut className={`w-5 h-5 transition-colors duration-200 ${confirmLogout ? 'text-white' : 'group-hover:text-rose-400'}`} />
          <span className="text-sm">{confirmLogout ? 'Confirm Logout' : 'Logout'}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;