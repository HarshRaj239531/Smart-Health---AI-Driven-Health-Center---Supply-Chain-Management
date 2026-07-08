import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowRight, 
  Package, 
  TrendingUp, 
  ArrowLeftRight, 
  BedDouble, 
  Users, 
  Activity,
  Globe
} from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = ({ onNavigate }) => {
  const { t, toggleLanguage } = useLanguage();
  const { token } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  const features = [
    { icon: Package, title: t('featureStockTitle'), desc: t('featureStockDesc'), color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { icon: TrendingUp, title: t('featureAITitle'), desc: t('featureAIDesc'), color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { icon: ArrowLeftRight, title: t('featureRedistributeTitle'), desc: t('featureRedistributeDesc'), color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    { icon: BedDouble, title: t('featureResourcesTitle'), desc: t('featureResourcesDesc'), color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { icon: Users, title: t('featureAttendanceTitle'), desc: t('featureAttendanceDesc'), color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    { icon: Activity, title: t('featureAuditTitle'), desc: t('featureAuditDesc'), color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' }
  ];

  return (
    <div className="min-h-screen bg-[#060913] relative overflow-hidden flex flex-col justify-between font-sans">
      
      {/* Background glowing decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      
      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      {/* Header / Navbar */}
      <nav className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950 text-2xl">
            N
          </div>
          <span className="text-2xl font-bold tracking-wider text-gradient-emerald">
            {t('brandName')}
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-sm hover:border-emerald-500/50 hover:text-emerald-400 transition"
          >
            <Globe size={16} className="text-emerald-400" />
            <span className="font-semibold">{t('langSwitch')}</span>
          </button>

          {token ? (
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 text-sm font-semibold hover:bg-emerald-400 transition shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center"
            >
              {t('landingGetStarted')} <ArrowRight size={16} className="ml-1.5" />
            </button>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="px-5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm font-semibold hover:border-emerald-500/40 hover:text-emerald-400 transition"
            >
              {t('landingAdminLogin')}
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 md:py-20 flex-grow">
        <motion.div 
          className="text-center max-w-3xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Real-time District Command Platform</span>
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-100 leading-[1.1] mb-6"
          >
            {t('landingTitle')}
          </motion.h1>

          <motion.p 
            variants={itemVariants}
            className="text-base md:text-lg text-slate-400 font-medium max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {t('landingSubtitle')}
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <button
              onClick={() => onNavigate(token ? 'dashboard' : 'login')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:shadow-[0_0_35px_rgba(16,185,129,0.4)] transition duration-200 flex items-center justify-center"
            >
              {t('landingGetStarted')} <ArrowRight size={18} className="ml-2" />
            </button>
            
            {!token && (
              <button
                onClick={() => onNavigate('signup')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold hover:bg-slate-800/50 hover:text-slate-100 transition duration-200"
              >
                {t('signUpNow')}
              </button>
            )}
          </motion.div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {features.map((feat, index) => {
            const IconComponent = feat.icon;
            return (
              <div 
                key={index}
                className="glass-panel p-8 rounded-2xl border border-slate-850 hover:border-slate-800 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-6 transition-all duration-300 group-hover:scale-110 ${feat.color}`}>
                    <IconComponent size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-100 mb-3">{feat.title}</h3>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} {t('brandName')} - District Medical Command Registry & supply chain orchestration. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
