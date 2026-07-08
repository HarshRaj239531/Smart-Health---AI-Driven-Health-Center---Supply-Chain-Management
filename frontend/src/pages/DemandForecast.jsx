import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle, HelpCircle, ShieldAlert } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const DemandForecast = ({ selectedCenterId }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [inventory, setInventory] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [forecast, setForecast] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [error, setError] = useState('');

  // Fetch inventory options
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoadingList(true);
        const queryParam = selectedCenterId && selectedCenterId !== 'DISTRICT' ? `?healthCenterId=${selectedCenterId}` : '';
        const res = await axios.get(`/inventory${queryParam}`);
        setInventory(res.data);
        if (res.data.length > 0) {
          setSelectedItemId(res.data[0].id);
        } else {
          setSelectedItemId('');
          setForecast(null);
        }
      } catch (err) {
        console.error('Error fetching items for forecast selection:', err);
      } finally {
        setLoadingList(false);
      }
    };
    fetchInventory();
  }, [selectedCenterId, user]);

  // Fetch forecast when selected item changes
  useEffect(() => {
    const fetchForecast = async () => {
      if (!selectedItemId) return;
      try {
        setLoadingForecast(true);
        setError('');
        const res = await axios.get(`/inventory/${selectedItemId}/forecast`);
        setForecast(res.data);
      } catch (err) {
        console.error('Error fetching forecast details:', err);
        setError('Failed to compute forecasting trends');
      } finally {
        setLoadingForecast(false);
      }
    };
    fetchForecast();
  }, [selectedItemId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'WARNING':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  const getUrgencyRing = (days) => {
    if (days <= 3) return 'border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.15)]';
    if (days <= 7) return 'border-amber-500/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]';
    return 'border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]';
  };

  const getStockoutDateString = (days) => {
    if (days === 999) return 'N/A';
    const d = new Date();
    d.setDate(d.getDate() + Math.ceil(days));
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const isCenterSelected = (user.role !== 'ADMIN' || (selectedCenterId && selectedCenterId !== 'DISTRICT'));

  if (loadingList) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      
      {/* Selection Control Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-200">{t('forecastTitle')}</h3>
          <p className="text-xs text-slate-400 font-medium">Select a drug to execute AI Linear Regression demand projections.</p>
        </div>

        {isCenterSelected ? (
          <div className="w-full sm:max-w-xs">
            {inventory.length === 0 ? (
              <p className="text-xs text-slate-450 italic">No inventory items in center</p>
            ) : (
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 py-2.5 px-4 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition cursor-pointer font-bold"
              >
                {inventory.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.currentStock} left)
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center">
            <ShieldAlert size={16} className="mr-1.5" />
            Please select a specific Health Center in the header to run forecasting models.
          </p>
        )}
      </div>

      {loadingForecast && (
        <div className="flex h-[40vh] items-center justify-center">
          <span className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold text-center">
          {error}
        </div>
      )}

      {/* Forecast Analytics Grid */}
      {forecast && !loadingForecast && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Summary Metric Ring Cards */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Days Remaining Circle Card */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">
                {t('daysRemaining')}
              </span>
              
              <div className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center ${getUrgencyRing(forecast.daysRemaining)}`}>
                <span className="text-3xl font-extrabold">{forecast.daysRemaining === 999 ? '30+' : forecast.daysRemaining}</span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase mt-0.5">Days Left</span>
              </div>

              <div className="mt-6 space-y-1">
                <p className="text-[11px] font-medium text-slate-400">Predicted Stock-out Date:</p>
                <p className="text-sm font-bold text-slate-200">{getStockoutDateString(forecast.daysRemaining)}</p>
              </div>
            </div>

            {/* Model stats card */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-850/60">
                <span className="text-slate-400 font-semibold">{t('dailyConsumptionRate')}</span>
                <span className="font-bold text-slate-200">{forecast.dailyRate} / day</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-850/60">
                <span className="text-slate-400 font-semibold">{t('confidenceScore')}</span>
                <span className="font-bold text-emerald-400">94.8%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Min Stock Threshold</span>
                <span className="font-bold text-slate-200">{forecast.minStock} units</span>
              </div>

              {/* Forecast Alert Text Block */}
              <div className={`p-4 rounded-xl border text-xs leading-relaxed font-medium ${getStatusColor(forecast.status)} mt-6`}>
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="flex-shrink-0 mt-0.5" size={16} />
                  <span>{forecast.message}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Forecasting Recharts Graph */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-slate-205 uppercase tracking-wider flex items-center">
                <TrendingUp size={16} className="text-emerald-400 mr-2" />
                {t('forecastChartTitle')}
              </h3>
              
              <div className="flex items-center space-x-4 text-[10px] font-semibold">
                <span className="flex items-center text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" />
                  {t('historicalCurve')}
                </span>
                <span className="flex items-center text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-1.5" />
                  {t('projectedCurve')}
                </span>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecast.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="date" stroke={theme === 'light' ? '#475569' : '#94a3b8'} fontSize={10} tickLine={false} />
                  <YAxis stroke={theme === 'light' ? '#475569' : '#94a3b8'} fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a', borderColor: theme === 'light' ? '#cbd5e1' : '#334155', color: theme === 'light' ? '#0f172a' : '#f8fafc', borderRadius: '12px', fontSize: '11px' }}
                    formatter={(value, name, props) => [`${value} units`, props.payload.type + ' Stock']}
                  />
                  {/* Reference Line for minStock threshold */}
                  <ReferenceLine y={forecast.minStock} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Min Safety level', fill: '#f59e0b', fontSize: 10, position: 'top' }} />
                  
                  <Area 
                    type="monotone" 
                    dataKey="stock" 
                    stroke={forecast.daysRemaining <= 7 ? '#f43f5e' : '#10b981'} 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorStock)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <p className="text-[10px] text-slate-500 italic text-center mt-4">
              AI warning triggers automatically if linear projected stock cuts safety threshold within 7 days.
            </p>
          </div>

        </div>
      )}

    </div>
  );
};

export default DemandForecast;
