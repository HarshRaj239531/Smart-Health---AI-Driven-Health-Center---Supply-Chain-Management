import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import { 
  Building2, 
  BedDouble, 
  AlertTriangle, 
  Users, 
  Activity, 
  TrendingUp, 
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const OverviewDashboard = ({ selectedCenterId, setSelectedCenterId }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [todayAttendance, setTodayAttendance] = useState([]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParam = selectedCenterId && selectedCenterId !== 'DISTRICT' ? `?healthCenterId=${selectedCenterId}` : '';
      const res = await axios.get(`/analytics/overview${queryParam}`);
      setData(res.data);

      // Fetch attendance if on single center view
      if (selectedCenterId && selectedCenterId !== 'DISTRICT' || user.role !== 'ADMIN') {
        const centerId = user.role === 'ADMIN' ? selectedCenterId : user.healthCenterId;
        const attRes = await axios.get(`/attendance?healthCenterId=${centerId}`);
        setTodayAttendance(attRes.data);
      }
    } catch (err) {
      console.error('Error fetching overview:', err);
      setError('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [selectedCenterId, user]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold text-center">
        {error}
      </div>
    );
  }

  const isDistrictView = data?.role === 'ADMIN' && (!selectedCenterId || selectedCenterId === 'DISTRICT');

  if (isDistrictView) {
    const summary = data.districtSummary;
    
    return (
      <div className="space-y-8">
        
        {/* District Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={t('totalCenters')}
            value={summary.totalCenters}
            icon={Building2}
            description="Active CHCs & PHCs"
            status="success"
          />
          <StatCard
            title={t('bedOccupancy')}
            value={`${summary.bedOccupancyPercentage}%`}
            icon={BedDouble}
            description={`${summary.occupiedBeds} of ${summary.totalBeds} beds in use`}
            status={summary.bedOccupancyPercentage >= 90 ? 'danger' : summary.bedOccupancyPercentage >= 70 ? 'warning' : 'success'}
          />
          <StatCard
            title={t('stockOuts')}
            value={summary.totalStockOuts}
            icon={AlertTriangle}
            description="Critical depleting items"
            status={summary.totalStockOuts > 0 ? 'danger' : 'success'}
          />
          <StatCard
            title={t('footfallToday')}
            value={summary.patientFootfallToday}
            icon={Users}
            description="Outpatients aggregated today"
            status="neutral"
          />
        </div>

        {/* Flagged Centers Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center">
                <AlertTriangle className="text-amber-500 mr-2" size={20} />
                {t('flaggedFacilities')}
              </h3>
              
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {data.flaggedCenters.length === 0 ? (
                  <p className="text-xs text-slate-405 italic py-8 text-center">{t('noFlaggedCenters')}</p>
                ) : (
                  data.flaggedCenters.map((center) => (
                    <div 
                      key={center.id}
                      onClick={() => setSelectedCenterId(center.id)}
                      className={`p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 bg-slate-900/40 transition cursor-pointer flex flex-col justify-between`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-200">{center.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${center.status === 'RED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                          {center.status}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1">
                        {center.reasons.map((r, i) => (
                          <p key={i} className="text-[10px] text-slate-400 font-medium flex items-center">
                            <span className="w-1 h-1 rounded-full bg-slate-500 mr-1.5" />
                            {r}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* District Map mock grid representation */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center justify-between">
              <span>District Facilities Topology Grid</span>
              <span className="text-xs font-semibold text-slate-450 uppercase">Hoshangabad District</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 h-[350px] overflow-y-auto pr-1">
              {data.centersList.map((center) => (
                <div
                  key={center.id}
                  onClick={() => setSelectedCenterId(center.id)}
                  className={`p-4 rounded-xl border border-slate-800 hover:border-emerald-500/30 bg-slate-905/30 transition cursor-pointer relative group flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300">{center.name}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${center.status === 'RED' ? 'bg-rose-500 glow-rose' : center.status === 'ORANGE' ? 'bg-amber-500' : 'bg-emerald-500 glow-emerald'}`} />
                  </div>
                  
                  <div className="space-y-1.5 mt-4">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Type:</span>
                      <span className="font-semibold text-slate-300">{center.type}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Bed occupancy:</span>
                      <span className="font-semibold text-slate-300">{center.bedOccupancy}%</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Stock Out items:</span>
                      <span className="font-semibold text-rose-400">{center.stockoutCount}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-2 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-500 group-hover:text-emerald-400 transition">
                    <span>Switch Perspective</span>
                    <ChevronRight size={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Local Facility View (Local or Admin switched to a specific center)
  const detail = data;
  const isDoctorAbsent = todayAttendance.some(staff => staff.role === 'DOCTOR' && staff.status === 'ABSENT');

  return (
    <div className="space-y-8">
      {/* Back to District view button if Admin */}
      {user.role === 'ADMIN' && (
        <button
          onClick={() => setSelectedCenterId('DISTRICT')}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:border-emerald-500/40 hover:text-emerald-400 transition"
        >
          &larr; Back to District Dashboard
        </button>
      )}

      {/* Doctor Absent alert banner */}
      {isDoctorAbsent && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start space-x-3 text-rose-400 glow-rose">
          <AlertTriangle className="flex-shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-sm font-bold">{t('doctorStatusAlert')}</h4>
            <p className="text-xs text-rose-400/80 mt-1 leading-relaxed">
              Biometric check-in logs show the scheduled Medical Officer (Doctor) is absent today. District administration has been auto-notified to verify shift coverage or dispatch emergency floaters.
            </p>
          </div>
        </div>
      )}

      {/* Local Center Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('bedOccupancy')}
          value={`${detail.bedSummary.occupancyRate}%`}
          icon={BedDouble}
          description={`${detail.bedSummary.occupiedBeds} of ${detail.bedSummary.totalBeds} beds occupied`}
          status={detail.bedSummary.occupancyRate >= 90 ? 'danger' : detail.bedSummary.occupancyRate >= 70 ? 'warning' : 'success'}
        />
        <StatCard
          title={t('stockOuts')}
          value={detail.inventorySummary.criticalItems}
          icon={AlertTriangle}
          description="Dangerous depleting stocks"
          status={detail.inventorySummary.criticalItems > 0 ? 'danger' : 'success'}
        />
        <StatCard
          title="Diagnostic Capacity"
          value={`${detail.testsSummary.availableTests}/${detail.testsSummary.totalTests}`}
          icon={Activity}
          description="Active tests with reagent stock"
          status={detail.testsSummary.availableTests < detail.testsSummary.totalTests ? 'warning' : 'success'}
        />
        <StatCard
          title="Staff Registered"
          value={todayAttendance.length}
          icon={UserCheck}
          description="Active rosters today"
          status="neutral"
        />
      </div>

      {/* Charts & Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Footfall trend chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800">
          <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center justify-between">
            <span>{t('patientFootfallHeader')}</span>
            <span className="text-xs font-semibold text-emerald-400 uppercase">Last 7 Days</span>
          </h3>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={detail.patientChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOPD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEmergency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorIPD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="date" stroke={theme === 'light' ? '#475569' : '#94a3b8'} fontSize={11} tickLine={false} />
                <YAxis stroke={theme === 'light' ? '#475569' : '#94a3b8'} fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a', borderColor: theme === 'light' ? '#cbd5e1' : '#334155', color: theme === 'light' ? '#0f172a' : '#f8fafc', borderRadius: '12px', fontSize: '12px' }} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" name={t('triageOPD')} dataKey="OPD" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorOPD)" />
                <Area type="monotone" name={t('triageEmergency')} dataKey="Emergency" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorEmergency)" />
                <Area type="monotone" name={t('triageIPD')} dataKey="IPD" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorIPD)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Local Attendance Summary panel */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-slate-800">
          <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center justify-between">
            <span>Daily Attendance logs</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 uppercase font-semibold">Today</span>
          </h3>

          <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
            {todayAttendance.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-8 text-center">No roster defined for today</p>
            ) : (
              todayAttendance.map((staff, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-850/60 bg-slate-900/20">
                  <div>
                    <p className="text-xs font-bold text-slate-200">{staff.name}</p>
                    <p className="text-[10px] text-slate-450 mt-0.5 capitalize">{staff.role.toLowerCase()}</p>
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${staff.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : staff.status === 'ABSENT' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                    {staff.status === 'PRESENT' ? t('statusPresent') : staff.status === 'ABSENT' ? t('statusAbsent') : t('statusLeave')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OverviewDashboard;
