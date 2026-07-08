import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThreeBg from '../components/ThreeBg';
import { 
  ArrowRight, 
  Package, 
  TrendingUp, 
  ArrowLeftRight, 
  BedDouble, 
  Users, 
  Activity,
  Globe,
  Sun,
  Moon,
  Mail,
  User,
  Building,
  CheckCircle2,
  PhoneCall,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const LandingPage = ({ onNavigate }) => {
  const { t, toggleLanguage } = useLanguage();
  const { token } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Scroll listener for sticky header
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Contact Form States
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    center: 'PHC Pipariya',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [centers, setCenters] = useState([]);

  // Fetch health centers dynamically for contact dropdown
  useEffect(() => {
    axios.get('/auth/health-centers')
      .then(res => setCenters(res.data))
      .catch(err => console.error('Error loading centers for landing contact page:', err));
  }, []);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', center: 'PHC Pipariya', message: '' });
    }, 4000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  const features = [
    { icon: Package, title: t('featureStockTitle'), desc: t('featureStockDesc'), color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { icon: TrendingUp, title: t('featureAITitle'), desc: t('featureAIDesc'), color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { icon: ArrowLeftRight, title: t('featureRedistributeTitle'), desc: t('featureRedistributeDesc'), color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    { icon: BedDouble, title: t('featureResourcesTitle'), desc: t('featureResourcesDesc'), color: 'text-amber-400 bg-emerald-500/10 border-amber-500/20' }, // Soft theme
    { icon: Users, title: t('featureAttendanceTitle'), desc: t('featureAttendanceDesc'), color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    { icon: Activity, title: t('featureAuditTitle'), desc: t('featureAuditDesc'), color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' }
  ];

  return (
    <div className={`min-h-screen relative overflow-hidden flex flex-col justify-between font-sans transition-colors duration-500 ${theme === 'light' ? 'bg-[#f1f5f9]' : 'bg-[#060913]'}`}>
      
      {/* 3D Wave Interactive Background */}
      <ThreeBg />

      {/* Decorative glows */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 dark:bg-emerald-500/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 dark:bg-indigo-500/5 blur-[130px] pointer-events-none z-0" />

      {/* Sticky Glassmorphic Navbar */}
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 border-b ${isScrolled ? (theme === 'light' ? 'bg-white/80 backdrop-blur-md border-slate-200/80 shadow-sm' : 'bg-[#060913]/85 backdrop-blur-md border-slate-800/80 shadow-md') : 'bg-transparent border-transparent'}`}>
        <nav className={`w-full max-w-7xl mx-auto px-6 flex items-center justify-between transition-all duration-300 ${isScrolled ? 'py-4' : 'py-6'}`}>
          {/* Logo brand */}
          <div 
            className="flex items-center space-x-2.5 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950 text-2xl shadow-md">
              N
            </div>
            <span className="text-2xl font-bold tracking-wider text-gradient-emerald">
              {t('brandName')}
            </span>
          </div>

          {/* Nav Items */}
          <div className="hidden md:flex items-center space-x-8">
            <a 
              href="#features" 
              className={`font-bold text-xs uppercase tracking-wider transition ${theme === 'light' ? 'text-slate-600 hover:text-indigo-650' : 'text-slate-450 hover:text-emerald-400'}`}
            >
              {t('navFeatures')}
            </a>
            <a 
              href="#stats" 
              className={`font-bold text-xs uppercase tracking-wider transition ${theme === 'light' ? 'text-slate-600 hover:text-indigo-650' : 'text-slate-455 hover:text-emerald-400'}`}
            >
              {t('navStats')}
            </a>
            <a 
              href="#contact" 
              className={`font-bold text-xs uppercase tracking-wider transition ${theme === 'light' ? 'text-slate-600 hover:text-indigo-650' : 'text-slate-455 hover:text-emerald-400'}`}
            >
              {t('navContact')}
            </a>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-4">
            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:text-emerald-400 text-slate-400 transition shadow-md"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'light' ? <Moon size={18} className="text-indigo-400" /> : <Sun size={18} className="text-amber-400" />}
            </button>

            {/* Language switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm hover:border-emerald-500/50 hover:text-emerald-400 text-slate-300 transition shadow-md"
            >
              <Globe size={15} className="text-emerald-400" />
              <span className="font-semibold">{t('langSwitch')}</span>
            </button>

            {/* Portal action */}
            {token ? (
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 text-sm font-bold hover:bg-emerald-400 transition shadow-[0_4px_15px_rgba(16,185,129,0.35)] flex items-center"
              >
                {t('landingGetStarted')} <ArrowRight size={15} className="ml-1.5" />
              </button>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="px-5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-sm font-semibold hover:border-emerald-500/40 hover:text-emerald-400 transition shadow-md"
              >
                {t('landingAdminLogin')}
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Header Presentation */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 md:py-20 flex-grow space-y-28">
        
        {/* Title block */}
        <motion.div 
          className="text-center max-w-3xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm"
          >
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Real-time District Command Registry</span>
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
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => onNavigate(token ? 'dashboard' : 'login')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-[0_4px_25px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_30px_rgba(16,185,129,0.45)] transition duration-200 flex items-center justify-center text-sm"
            >
              {t('landingGetStarted')} <ArrowRight size={17} className="ml-2" />
            </button>
            
            {!token && (
              <button
                onClick={() => onNavigate('signup')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold hover:bg-slate-800/80 hover:text-slate-100 transition duration-200 text-sm shadow-md"
              >
                {t('signUpNow')}
              </button>
            )}
          </motion.div>
        </motion.div>

        {/* Feature Grid with scroll fade-in */}
        <div id="features" className="space-y-12 scroll-mt-24">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100">{t('landingFeaturesTitle')}</h2>
            <p className="text-xs text-slate-455 max-w-lg mx-auto font-medium">Modern modules built on high-fidelity mathematical optimization algorithms.</p>
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8 }}
          >
            {features.map((feat, index) => {
              const IconComponent = feat.icon;
              return (
                <motion.div 
                  key={index}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="glass-panel p-8 rounded-2xl border border-slate-850 hover:border-slate-800 transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:shadow-lg"
                >
                  <div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-6 transition-all duration-300 group-hover:scale-110 ${feat.color}`}>
                      <IconComponent size={22} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-100 mb-3">{feat.title}</h3>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">{feat.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Dynamic Telemetry Stats Grid */}
        <div id="stats" className="space-y-6 scroll-mt-24">
          <div className="text-center">
            <h3 className="text-xl md:text-2xl font-extrabold text-slate-100">{t('statsTitle')}</h3>
            <p className="text-xs text-slate-455 mt-1">{t('statsSub')}</p>
          </div>
          
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="glass-panel p-6 rounded-2xl border border-slate-800/60 text-center flex flex-col justify-between items-center relative overflow-hidden group hover:border-emerald-500/20 transition">
              <span className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <Building size={20} />
              </span>
              <h4 className="text-2xl font-bold text-slate-100">5</h4>
              <p className="text-[10px] font-bold text-slate-455 uppercase mt-1">Health Facilities Active</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800/60 text-center flex flex-col justify-between items-center relative overflow-hidden group hover:border-emerald-500/20 transition">
              <span className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
                <BedDouble size={20} />
              </span>
              <h4 className="text-2xl font-bold text-slate-100">48</h4>
              <p className="text-[10px] font-bold text-slate-455 uppercase mt-1">{t('statTotalBeds')}</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800/60 text-center flex flex-col justify-between items-center relative overflow-hidden group hover:border-emerald-500/20 transition">
              <span className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3">
                <Users size={20} />
              </span>
              <h4 className="text-2xl font-bold text-slate-100">10+</h4>
              <p className="text-[10px] font-bold text-slate-455 uppercase mt-1">{t('statActiveDoctors')}</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800/60 text-center flex flex-col justify-between items-center relative overflow-hidden group hover:border-emerald-500/20 transition">
              <span className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
                <Package size={20} />
              </span>
              <h4 className="text-2xl font-bold text-slate-100">9</h4>
              <p className="text-[10px] font-bold text-slate-455 uppercase mt-1">{t('statSupplyItems')}</p>
            </div>
          </motion.div>
        </div>

        {/* Dynamic Contact Us Support Section */}
        <div id="contact" className="space-y-6 scroll-mt-24">
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-5 gap-12 pt-6"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
          >
            {/* Info Details Column */}
            <div className="lg:col-span-2 space-y-6 flex flex-col justify-center">
              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100">{t('contactUsTitle')}</h2>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  {t('contactUsSubtitle')}
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center space-x-3.5 text-xs text-slate-355">
                  <span className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
                    <PhoneCall size={15} />
                  </span>
                  <div>
                    <p className="font-bold text-slate-200">Chief Medical Officer (CMO) Hotline</p>
                    <p className="text-[10px] text-slate-455 mt-0.5">+91 7574-2983-01 (Mon-Sat 9AM-5PM)</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 text-xs text-slate-355">
                  <span className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400">
                    <Mail size={15} />
                  </span>
                  <div>
                    <p className="font-bold text-slate-200">Official Helpdesk Support</p>
                    <p className="text-[10px] text-slate-455 mt-0.5">cmo-support@niramayai.gov.in</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 text-xs text-slate-355">
                  <span className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400">
                    <Clock size={15} />
                  </span>
                  <div>
                    <p className="font-bold text-slate-200">Incident Turn-Around Time</p>
                    <p className="text-[10px] text-slate-455 mt-0.5">Deficits matched instantly; support queries resolved inside 24h.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Form Panel */}
            <div className="lg:col-span-3 glass-panel p-8 rounded-3xl border border-slate-800/80 relative">
              <AnimatePresence>
                {isSubmitted && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-30 rounded-3xl flex flex-col items-center justify-center text-center p-6"
                  >
                    <motion.div 
                      initial={{ scale: 0.5, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4"
                    >
                      <CheckCircle2 size={32} />
                    </motion.div>
                    <h4 className="text-lg font-bold text-slate-100 mb-2">Request Transmitted</h4>
                    <p className="text-xs text-slate-400 max-w-sm font-medium leading-relaxed">
                      {t('contactSuccess')}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Official Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t('contactFormName')}
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-450" size={16} />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Officer Name"
                        className="w-full glass-input py-3 pl-11 pr-4 rounded-xl text-xs placeholder:text-slate-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t('contactFormEmail')}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-455" size={16} />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="officer@niramayai.gov.in"
                        className="w-full glass-input py-3 pl-11 pr-4 rounded-xl text-xs placeholder:text-slate-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Health Center Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {t('contactFormCenter')}
                  </label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-455" size={16} />
                    <select
                      value={formData.center}
                      onChange={(e) => setFormData({ ...formData, center: e.target.value })}
                      className="w-full glass-input py-3 pl-11 pr-4 rounded-xl text-xs focus:outline-none cursor-pointer appearance-none font-semibold"
                    >
                      {centers.map(center => (
                        <option key={center.id} value={center.name}>
                          {center.name} ({center.type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Query message */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {t('contactFormMessage')}
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="State your question, logistics query or center configuration updates here..."
                    rows={4}
                    className="w-full glass-input p-4 rounded-xl text-xs placeholder:text-slate-500 leading-relaxed resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-[0_4px_15px_rgba(16,185,129,0.2)] transition flex items-center justify-center space-x-2 text-xs"
                >
                  <span>{t('contactFormSubmit')}</span>
                </button>
              </form>
            </div>
          </motion.div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} {t('brandName')} - District Medical Command Registry & supply chain orchestration. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
