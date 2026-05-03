import React from 'react';
import { useState } from 'react';
import LoginLeftSide from './LoginLeftSide';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react'

const LoginForm = ({ role, title, subtitle }) => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // TODO: Implement login logic here
      console.log('Login attempt:', { email, password, role });
      // Add your authentication logic here
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <LoginLeftSide />
      <div className="flex-1 flex items-center justify-center p-6 bg-white sm:p-12">
        <div className="w-full max-w-md animate-fade-in">
          <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-700 text-sm mb-10 transition-colors">
            <ArrowLeftIcon size={16} />
            Back to Portals
          </Link>
          <div className="mb-8">
            <h1 className='text-2xl sm:text-3xl font-medium text-zinc-800'>{title}</h1>
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="developer@email.com"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                  placeholder="*********"
                  className='w-full px-4 py-3 pr-11 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
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
              {loading && <Loader2Icon className='animate-spin h-4 w-4 mr-2'/>} Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginForm