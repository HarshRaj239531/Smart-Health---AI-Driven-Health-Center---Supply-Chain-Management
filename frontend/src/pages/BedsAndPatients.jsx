import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { BedDouble, Users, Edit2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const BedsAndPatients = ({ selectedCenterId }) => {
  const { t } = {
    t: (key) => {
      const map = {
        'bedsPatientsTitle': 'Beds Logistics & Patient Traffic',
        'bedAvailabilityHeader': 'Bed Occupancy Levels',
        'bedType': 'Bed Class',
        'totalBeds': 'Capacity',
        'occupiedBeds': 'Occupied',
        'availableBeds': 'Available',
        'updateOccupancy': 'Update Bed Occupancy',
        'patientFootfallHeader': 'Patient Traffic Overview',
        'peakHours': 'Peak Rush Hour',
        'triageOPD': 'Outpatient (OPD)',
        'triageEmergency': 'Emergency',
        'triageIPD': 'Inpatient (IPD)',
        'btnCancel': 'Cancel',
        'btnSubmit': 'Save'
      };
      return map[key] || key;
    }
  };
  const { user } = useAuth();
  
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [newOccupied, setNewOccupied] = useState('');
  const [error, setError] = useState('');

  const fetchBeds = async () => {
    try {
      setLoading(true);
      const queryParam = selectedCenterId && selectedCenterId !== 'DISTRICT' ? `?healthCenterId=${selectedCenterId}` : '';
      const res = await axios.get(`/analytics/beds${queryParam}`);
      setBeds(res.data);
    } catch (err) {
      console.error('Error fetching bed logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeds();
  }, [selectedCenterId, user]);

  const handleUpdateOccupancy = async (e) => {
    e.preventDefault();
    if (!selectedBed || newOccupied === '') return;

    try {
      setError('');
      await axios.post('/analytics/beds/update', {
        bedId: selectedBed.id,
        occupiedBeds: parseInt(newOccupied)
      });
      setShowEditModal(false);
      setNewOccupied('');
      fetchBeds();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update beds occupancy');
    }
  };

  const getOccupancyColor = (occupied, total) => {
    const pct = total > 0 ? (occupied / total) * 100 : 0;
    if (pct >= 95) return 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]';
    if (pct >= 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const isCenterSelected = (user.role !== 'ADMIN' || (selectedCenterId && selectedCenterId !== 'DISTRICT'));

  return (
    <div className="space-y-8 font-sans">
      
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center">
          <BedDouble size={18} className="text-emerald-400 mr-2" />
          {t('bedsPatientsTitle')}
        </h3>
        <p className="text-xs text-slate-450 font-medium">Real-time status updates of hospital bed classes.</p>
      </div>

      {!isCenterSelected && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold flex items-center">
          <ShieldAlert size={16} className="mr-1.5 flex-shrink-0" />
          Please select a specific Health Center in the header to modify bed occupancy levels.
        </div>
      )}

      {/* Bed categories list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {beds.map((bed) => {
          const occupancyPercentage = bed.totalBeds > 0 ? Math.round((bed.occupiedBeds / bed.totalBeds) * 100) : 0;
          return (
            <div key={bed.id} className="glass-panel p-6 rounded-2xl border border-slate-805/80 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                    {bed.type} bed
                  </span>
                  {isCenterSelected && (
                    <button
                      onClick={() => { setSelectedBed(bed); setNewOccupied(bed.occupiedBeds); setShowEditModal(true); }}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:text-emerald-400 text-slate-450 transition"
                      title={t('updateOccupancy')}
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                </div>

                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-3xl font-extrabold text-slate-100">{bed.occupiedBeds}</span>
                  <span className="text-xs text-slate-500 font-semibold">/ {bed.totalBeds} beds in use</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${getOccupancyColor(bed.occupiedBeds, bed.totalBeds)}`}
                    style={{ width: `${occupancyPercentage}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                <span>Occupancy Rate</span>
                <span className={occupancyPercentage >= 95 ? 'text-rose-400 font-extrabold' : 'text-slate-305'}>{occupancyPercentage}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Occupancy Modal */}
      <AnimatePresence>
        {showEditModal && selectedBed && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" 
            />
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              className="w-full max-w-sm glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl relative z-10"
            >
              <h3 className="text-lg font-bold text-slate-200 mb-2">{t('updateOccupancy')}</h3>
              <p className="text-xs text-slate-400 mb-6 font-medium">Class: <span className="text-emerald-400 font-bold uppercase">{selectedBed.type}</span> (Total capacity: {selectedBed.totalBeds})</p>

              {error && <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">{error}</div>}

              <form onSubmit={handleUpdateOccupancy} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Occupied Beds Count</label>
                  <input
                    type="number"
                    value={newOccupied}
                    onChange={(e) => setNewOccupied(e.target.value)}
                    max={selectedBed.totalBeds}
                    min={0}
                    className="w-full glass-input py-2.5 px-4 rounded-xl text-xs font-bold"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-semibold hover:bg-slate-900 transition">{t('btnCancel')}</button>
                  <button type="submit" className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition text-xs shadow-[0_0_15px_rgba(16,185,129,0.2)]">{t('btnSubmit')}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default BedsAndPatients;
