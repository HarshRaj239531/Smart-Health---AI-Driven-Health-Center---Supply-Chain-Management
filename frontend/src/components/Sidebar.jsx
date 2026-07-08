import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  ArrowLeftRight, 
  BedDouble, 
  Users, 
  Activity, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  const menuItems = [
    { id: 'overview', label: t('navOverview'), icon: LayoutDashboard, roles: ['ADMIN', 'STAFF', 'DOCTOR'] },
    { id: 'inventory', label: t('navInventory'), icon: Package, roles: ['ADMIN', 'STAFF'] },
    { id: 'forecast', label: t('navForecast'), icon: TrendingUp, roles: ['ADMIN', 'STAFF', 'DOCTOR'] },
    { id: 'redistribution', label: t('navRedistribute'), icon: ArrowLeftRight, roles: ['ADMIN', 'STAFF'] },
    { id: 'beds', label: t('navBedsPatients'), icon: BedDouble, roles: ['ADMIN', 'STAFF', 'DOCTOR'] },
    { id: 'staff', label: t('navStaff'), icon: Users, roles: ['ADMIN', 'STAFF', 'DOCTOR'] },
    { id: 'lab', label: t('navLabAudits'), icon: Activity, roles: ['ADMIN', 'STAFF', 'DOCTOR'] },
    { id: 'simulation', label: t('navSimulation'), icon: Sparkles, roles: ['ADMIN'] }
  ];

  // Filter items based on user role
  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <motion.div 
      className={`glass-panel border-r ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'} flex flex-col justify-between h-screen fixed left-0 top-0 z-30 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        {/* Brand Logo Header */}
        <div className={`p-6 flex items-center justify-between border-b ${theme === 'light' ? 'border-slate-200/50' : 'border-slate-800/50'}`}>
          {!isCollapsed && (
            <motion.div 
              className="flex items-center space-x-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950 text-xl">
                N
              </div>
              <span className="text-xl font-bold tracking-wider text-gradient-emerald">
                {t('brandName')}
              </span>
            </motion.div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950 text-xl mx-auto">
              N
            </div>
          )}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-emerald-400 transition"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="mt-8 px-3 space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center py-3 px-4 rounded-xl transition-all duration-200 group relative ${isActive ? (theme === 'light' ? 'bg-emerald-500/10 text-emerald-700 font-semibold' : 'bg-emerald-500/10 text-emerald-400 font-semibold') : (theme === 'light' ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200')}`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-emerald-400 rounded-r"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-4'} ${isActive ? (theme === 'light' ? 'text-emerald-700' : 'text-emerald-400') : (theme === 'light' ? 'text-slate-500 group-hover:text-slate-800' : 'text-slate-400 group-hover:text-slate-200')}`} size={20} />
                {!isCollapsed && <span>{item.label}</span>}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 border border-slate-800 text-xs rounded opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Profile Block */}
      <div className={`p-4 border-t ${theme === 'light' ? 'border-slate-200/50' : 'border-slate-800/50'} space-y-3`}>
        {!isCollapsed && (
          <div className="flex items-center space-x-3 px-2 py-1">
            <div className={`w-10 h-10 rounded-full ${theme === 'light' ? 'bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 border-slate-700 text-emerald-400'} border flex items-center justify-center font-semibold text-lg`}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={`w-full flex items-center py-3 px-4 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all duration-200 group relative`}
        >
          <LogOut className={`flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-4'}`} size={20} />
          {!isCollapsed && <span>{t('navLogout')}</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 border border-slate-800 text-xs text-rose-400 rounded opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none whitespace-nowrap z-50">
              {t('navLogout')}
            </div>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
