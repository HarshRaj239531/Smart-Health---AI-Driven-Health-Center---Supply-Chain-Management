import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Users, Fingerprint, Calendar, CheckCircle, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const StaffAttendance = ({ selectedCenterId }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const queryParam = selectedCenterId && selectedCenterId !== 'DISTRICT' ? `?healthCenterId=${selectedCenterId}` : '';
      const res = await axios.get(`/attendance${queryParam}`);
      setAttendance(res.data);
      if (res.data.length > 0) {
        setSelectedStaffId(res.data[0].userId);
      }
    } catch (err) {
      console.error('Error fetching attendance logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedCenterId, user]);

  const handleSimulatePunch = async () => {
    if (!selectedStaffId) return;
    try {
      setSimulating(true);
      const res = await axios.post('/attendance/simulate', { userId: selectedStaffId });
      
      const punchedMember = attendance.find(a => a.userId === selectedStaffId);
      const isCheckingOut = punchedMember?.checkIn && !punchedMember?.checkOut;

      setSuccessMsg(`${punchedMember?.name || 'Staff member'} successfully ${isCheckingOut ? 'Clocked Out' : 'Clocked In'}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      
      fetchAttendance();
    } catch (err) {
      console.error('Biometric punch error:', err);
      alert('Fingerprint scanning simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const isCenterSelected = (user.role !== 'ADMIN' || (selectedCenterId && selectedCenterId !== 'DISTRICT'));

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center">
          <Users size={18} className="text-emerald-400 mr-2" />
          {t('staffTitle')}
        </h3>
        <p className="text-xs text-slate-450 font-medium">Digital attendance log tracking daily doctor and staff check-ins.</p>
      </div>

      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-24 right-6 z-50 py-3.5 px-6 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center space-x-2"
          >
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Attendance Log Table */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center">
            <Calendar size={16} className="text-emerald-400 mr-2" />
            {t('attendanceLogTitle')}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-850 pb-2 text-[10px] font-bold text-slate-505 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Staff Member</th>
                  <th className="pb-3 px-4">{t('staffRole')}</th>
                  <th className="pb-3 px-4">{t('checkInTime')}</th>
                  <th className="pb-3 px-4">{t('checkOutTime')}</th>
                  <th className="pb-3 pl-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-slate-350">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-450 italic">No staff mapped to this facility</td>
                  </tr>
                ) : (
                  attendance.map((att) => (
                    <tr key={att.userId} className="hover:bg-slate-900/5 transition">
                      <td className="py-4 pr-4 font-bold text-slate-200">{att.name}</td>
                      <td className="py-4 px-4 font-semibold text-slate-400 capitalize">{att.role?.toLowerCase()}</td>
                      <td className="py-4 px-4 font-mono text-[11px] font-semibold text-slate-300">{formatTime(att.checkIn)}</td>
                      <td className="py-4 px-4 font-mono text-[11px] font-semibold text-slate-300">{formatTime(att.checkOut)}</td>
                      <td className="py-4 pl-4 text-center">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${att.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : att.status === 'ABSENT' ? 'bg-rose-500/10 text-rose-450 border border-rose-500/20 animate-pulse' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                          {att.status === 'PRESENT' ? t('statusPresent') : att.status === 'ABSENT' ? t('statusAbsent') : t('statusLeave')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Biometric punch simulator card */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center mb-2">
              <Fingerprint size={18} className="text-rose-500 mr-2" />
              {t('clockInSimTitle')}
            </h3>
            <p className="text-[11px] text-slate-450 leading-relaxed">
              Biometric integrations send REST triggers to record check-in punches. Use this panel to mock device hardware inputs.
            </p>
          </div>

          {isCenterSelected ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {t('selectStaffToSimulate')}
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-205 py-2.5 px-4 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition cursor-pointer font-bold"
                >
                  {attendance.map(a => (
                    <option key={a.userId} value={a.userId}>
                      {a.name} ({a.role})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSimulatePunch}
                disabled={simulating || !selectedStaffId}
                className="w-full py-3.5 rounded-xl bg-rose-550 hover:bg-rose-500 text-slate-950 font-bold hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] transition duration-200 disabled:opacity-50 flex items-center justify-center space-x-2 text-xs"
              >
                {simulating ? (
                  <span className="w-5 h-5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                ) : (
                  <>
                    <Fingerprint size={16} />
                    <span>{t('btnClockIn')}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-850 text-slate-450 text-[11px] font-medium leading-relaxed flex items-start space-x-2">
              <ShieldAlert size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <span>Select a specific Health Center in the header to use the punch simulator.</span>
            </div>
          )}

          <p className="text-[10px] text-slate-500 italic text-center">
            Punches toggle status: absent &rarr; present (in) &rarr; present (out) &rarr; re-punch.
          </p>
        </div>

      </div>

    </div>
  );
};

export default StaffAttendance;
