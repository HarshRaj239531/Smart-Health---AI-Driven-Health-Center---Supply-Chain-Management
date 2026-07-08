import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Mail, Lock, User, Shield, Building2, UserPlus, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const SignupPage = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { signup } = useAuth();
  const { theme } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STAFF');
  const [healthCenterId, setHealthCenterId] = useState('');
  const [centers, setCenters] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch health centers for dropdown
  useEffect(() => {
    axios.get('/auth/health-centers')
      .then(res => {
        setCenters(res.data);
        if (res.data.length > 0) {
          setHealthCenterId(res.data[0].id);
        }
      })
      .catch(err => console.error('Error fetching centers:', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || (role !== 'ADMIN' && !healthCenterId)) {
      return setError('Please fill all required fields');
    }

    try {
      setError('');
      setLoading(true);
      await signup(name, email, password, role, role === 'ADMIN' ? null : healthCenterId);
      onNavigate('dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden flex flex-col justify-center items-center px-6 py-12 ${theme === 'light' ? 'bg-[#f1f5f9]' : 'bg-[#060913]'}`}>
      
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

      {/* Signup panel */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-2xl relative border border-slate-800/85"
      >
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center font-bold text-slate-950 text-2xl mx-auto mb-4">
            N
          </div>
          <h2 className="text-2xl font-bold text-slate-100">{t('signupTitle')}</h2>
          <p className="text-xs text-slate-400 mt-2 font-medium">Smart District Command System</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {t('nameLabel')}
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-450" size={18} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Sunita Sen"
                className="w-full glass-input py-3 pl-12 pr-4 rounded-xl text-sm placeholder:text-slate-500"
                required
              />
            </div>
          </div>

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {t('emailLabel')}
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-450" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sunita@smarthealth.gov.in"
                className="w-full glass-input py-3 pl-12 pr-4 rounded-xl text-sm placeholder:text-slate-500"
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
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

          {/* Role selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {t('roleLabel')}
            </label>
            <div className="relative">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-450" size={18} />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full glass-input py-3 pl-12 pr-4 rounded-xl text-sm focus:outline-none cursor-pointer appearance-none"
              >
                <option value="STAFF">Center Staff</option>
                <option value="DOCTOR">Medical Officer (Doctor)</option>
                <option value="ADMIN">District Administrator</option>
              </select>
            </div>
          </div>

          {/* Health center dropdown (only if not admin) */}
          {role !== 'ADMIN' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t('centerLabel')}
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-450" size={18} />
                <select
                  value={healthCenterId}
                  onChange={(e) => setHealthCenterId(e.target.value)}
                  className="w-full glass-input py-3 pl-12 pr-4 rounded-xl text-sm focus:outline-none cursor-pointer appearance-none"
                  required
                >
                  {centers.map(center => (
                    <option key={center.id} value={center.id}>
                      {center.name} ({center.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] disabled:opacity-50 flex items-center justify-center space-x-2 text-sm mt-6"
          >
            {loading ? (
              <span className="w-5 h-5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
            ) : (
              <>
                <UserPlus size={18} />
                <span>{t('btnSignUp')}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs font-medium text-slate-450">
          <span>{t('hasAccount')} </span>
          <button 
            onClick={() => onNavigate('login')} 
            className="text-emerald-400 hover:underline font-semibold"
          >
            {t('signInNow')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;
