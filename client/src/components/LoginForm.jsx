import React, { useState } from 'react';
import LoginLeftSide from './LoginLeftSide';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LoginForm = ({ role, title, subtitle }) => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(email, password, role);
      if (response.success) {
        toast.success(`Successfully logged in to ${title}!`);
        navigate('/dashboard');
      } else {
        setError(response.message || 'Login failed. Please check your credentials.');
        toast.error(response.message || 'Login failed.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      toast.error('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <LoginLeftSide />
      <div className="flex-1 flex items-center justify-center p-6 bg-white sm:p-12">
        <div className="w-full max-w-md animate-fade-in">
          <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm mb-8 transition-colors">
            <ArrowLeftIcon size={16} />
            Back to portals
          </Link>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <svg viewBox="0 0 64 64" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="14" r="8" fill="white"/>
                <line x1="32" y1="22" x2="32" y2="32" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
                <line x1="32" y1="32" x2="16" y2="32" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
                <line x1="32" y1="32" x2="48" y2="32" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
                <line x1="16" y1="32" x2="16" y2="40" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
                <line x1="48" y1="32" x2="48" y2="40" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
                <circle cx="16" cy="48" r="8" fill="white"/>
                <circle cx="48" cy="48" r="8" fill="white"/>
              </svg>
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">Quick</span>
              <span className="text-xl font-bold text-indigo-600 tracking-tight">EMS</span>
            </div>
          </div>
          <div className="mb-8">
            <h1 className='text-2xl sm:text-3xl font-semibold text-zinc-800'>{title}</h1>
            <p className='text-slate-500 text-sm sm:text-base mt-2'>{subtitle}</p>
          </div>
          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0" />
              {error}
            </div>
          )}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-11 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <button type="button" className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors' onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>

            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-indigo-600 to-indigo-500 text-white rounded-md text-sm font-semibold py-3 hover:from-indigo-700 hover:to-indigo-600 transition-all disabled:opacity-50 shadow-lg duration-200 shadow-indigo-500/25 active:scale-[0.98] flex items-center justify-center"
            >
              {loading && <Loader2Icon className='animate-spin h-4 w-4 mr-2'/>} Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginForm