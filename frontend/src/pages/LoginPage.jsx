import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Mail, Lock, LogIn, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const { theme } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please fill all fields');
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      onNavigate('dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden flex flex-col justify-center items-center px-6 ${theme === 'light' ? 'bg-[#f1f5f9]' : 'bg-[#060913]'}`}>
      
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

      {/* Back button */}
      <button 
        onClick={() => onNavigate('landing')}
        className="absolute top-8 left-8 flex items-center space-x-2 text-slate-400 hover:text-emerald-400 transition text-sm font-semibold"
      >
        <ArrowLeft size={16} />
        <span>Back to Home</span>
      </button>

      {/* Main glass panel */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-2xl relative border border-slate-800/80"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center font-bold text-slate-950 text-2xl mx-auto mb-4">
            N
          </div>
          <h2 className="text-2xl font-bold text-slate-100">{t('loginTitle')}</h2>
          <p className="text-xs text-slate-400 mt-2 font-medium">Smart District Command System</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              {t('emailLabel')}
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-450" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@smarthealth.gov.in"
                className="w-full glass-input py-3 pl-12 pr-4 rounded-xl text-sm placeholder:text-slate-500"
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              {t('passwordLabel')}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-450" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full glass-input py-3 pl-12 pr-4 rounded-xl text-sm placeholder:text-slate-500"
                required
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] disabled:opacity-50 flex items-center justify-center space-x-2 text-sm mt-8"
          >
            {loading ? (
              <span className="w-5 h-5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
            ) : (
              <>
                <LogIn size={18} />
                <span>{t('btnSignIn')}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs font-medium text-slate-450">
          <span>{t('noAccount')} </span>
          <button 
            onClick={() => onNavigate('signup')} 
            className="text-emerald-400 hover:underline font-semibold"
          >
            {t('signUpNow')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
