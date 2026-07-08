import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Bell, Globe, Building2, AlertTriangle, RefreshCw, Sun, Moon, Menu } from 'lucide-react';
import axios from 'axios';

const Header = ({ selectedCenterId, setSelectedCenterId, isSidebarCollapsed, setIsSidebarCollapsed }) => {
  const { t, language, toggleLanguage } = useLanguage();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [centers, setCenters] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch health centers for admin dropdown
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      axios.get('/auth/health-centers')
        .then(res => setCenters(res.data))
        .catch(err => console.error('Error fetching centers list:', err));
    }
  }, [user]);

  // Fetch alerts for notification center
  const fetchAlerts = async () => {
    try {
      const activeAlerts = [];
      
      // Fetch suggestions
      const suggRes = await axios.get('/redistribution/suggestions');
      const pendingSugg = suggRes.data.filter(s => s.status === 'PENDING');
      pendingSugg.forEach(sug => {
        activeAlerts.push({
          id: sug.id,
          type: 'REDISTRIBUTION',
          message: `AI recommends transfer of ${sug.quantity} ${sug.itemName} from ${sug.sourceCenter.name} to ${sug.targetCenter.name}`,
          urgency: sug.urgency
        });
      });

      // If local staff, check critical items
      if (user?.role !== 'ADMIN') {
        const invRes = await axios.get('/inventory');
        invRes.data.forEach(item => {
          if (item.currentStock <= item.minStock * 0.2) {
            activeAlerts.push({
              id: item.id,
              type: 'STOCKOUT',
              message: `CRITICAL: ${item.name} stock (${item.currentStock} ${item.unit}) is dangerously low!`,
              urgency: 'HIGH'
            });
          }
        });
      }

      setNotifications(activeAlerts);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user]);

  return (
    <header className="glass-panel border-b border-slate-800/50 h-20 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      
      {/* Title & Perspective Selector */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Mobile Hamburger Toggle Menu Button */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          className={`p-2 rounded-xl border transition md:hidden ${
            theme === 'light' 
              ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600' 
              : 'border-slate-800 bg-[#0b0f19] hover:bg-slate-900 text-slate-300'
          }`}
          title="Toggle Navigation Menu"
        >
          <Menu size={16} />
        </button>
        <div>
          {user?.role === 'ADMIN' ? (
            <div className="flex items-center space-x-2">
              <Building2 className="text-emerald-400 hidden sm:block" size={20} />
              <div className="relative">
                <select
                  value={selectedCenterId}
                  onChange={(e) => setSelectedCenterId(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-100 py-1.5 px-3 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-500 transition cursor-pointer max-w-[130px] sm:max-w-none"
                >
                  <option value="DISTRICT">{t('overviewTitle')}</option>
                  {centers.map(center => (
                    <option key={center.id} value={center.id}>
                      {center.name} ({center.type})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Building2 className="text-emerald-400 hidden sm:block" size={18} />
              <span className="font-semibold text-xs sm:text-sm text-slate-200 max-w-[130px] sm:max-w-none truncate block">
                {user?.healthCenter?.name} ({user?.healthCenter?.type})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Tray */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        
        {/* Language Toggler */}
        <button
          onClick={toggleLanguage}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm hover:border-emerald-500/50 hover:text-emerald-400 transition"
        >
          <Globe size={14} className="text-emerald-400" />
          <span className="hidden sm:inline font-medium">{t('langSwitch')}</span>
        </button>

        {/* Theme Toggler */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:text-emerald-400 text-slate-400 transition"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'light' ? <Moon size={15} className="text-indigo-400" /> : <Sun size={15} className="text-amber-400" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:text-emerald-400 text-slate-400 transition relative"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-white animate-pulse">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 glass-panel shadow-2xl rounded-2xl border border-slate-800 overflow-hidden z-50">
              <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-200">{t('activeAlerts')}</span>
                <span className="text-xs text-emerald-400 cursor-pointer hover:underline" onClick={fetchAlerts}>
                  <RefreshCw size={12} className="inline mr-1" /> Refresh
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/50">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No active warnings or suggestions
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="p-4 hover:bg-slate-800/20 transition flex items-start space-x-3">
                      <AlertTriangle className={`flex-shrink-0 mt-0.5 ${notif.urgency === 'HIGH' ? 'text-rose-500' : 'text-amber-500'}`} size={16} />
                      <div className="flex-1 text-xs text-slate-300 leading-relaxed">
                        {notif.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="hidden sm:flex items-center space-x-2.5 pl-2 border-l border-slate-800/80">
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-300">{user?.name}</p>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
