import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldAlert, Check, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const LabAndTests = ({ selectedCenterId }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [isAvail, setIsAvail] = useState(true);
  const [stock, setStock] = useState('');
  const [error, setError] = useState('');

  const fetchTests = async () => {
    try {
      setLoading(true);
      const queryParam = selectedCenterId && selectedCenterId !== 'DISTRICT' ? `?healthCenterId=${selectedCenterId}` : '';
      const res = await axios.get(`/analytics/tests${queryParam}`);
      setTests(res.data);
    } catch (err) {
      console.error('Error fetching test audits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [selectedCenterId, user]);

  const handleUpdateAudit = async (e) => {
    e.preventDefault();
    if (!selectedTest) return;

    try {
      setError('');
      await axios.post('/analytics/tests/update', {
        auditId: selectedTest.id,
        isAvailable: isAvail,
        reagentStock: parseInt(stock)
      });
      setShowModal(false);
      setStock('');
      fetchTests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update test details');
    }
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
        <h3 className="text-sm font-bold text-slate-205 uppercase tracking-wider flex items-center">
          <Activity size={18} className="text-emerald-400 mr-2" />
          {t('labTitle')}
        </h3>
        <p className="text-xs text-slate-450 font-medium">Audits essential diagnostic tests availability based on reagent kit stocks.</p>
      </div>

      {!isCenterSelected && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold flex items-center">
          <ShieldAlert size={16} className="mr-1.5 flex-shrink-0" />
          Please select a specific Health Center in the header to run test diagnostics audits.
        </div>
      )}

      {/* Grid List of test diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tests.map((test) => (
          <div key={test.id} className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-slate-200 text-sm">{test.testName}</h4>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Diagnostic Test</span>
                </div>
                
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${test.isAvailable ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-450 border border-rose-500/20'}`}>
                  {test.isAvailable ? t('testAvailable') : t('testUnavailable')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 text-xs border-t border-slate-850/60 pt-4 text-slate-400 font-semibold">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">{t('reagentStockLabel')}</span>
                  <span className={`text-sm font-bold ${test.reagentStock <= 15 ? 'text-rose-455 font-extrabold' : 'text-slate-200'}`}>{test.reagentStock} kits</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">{t('dailyCapacityLabel')}</span>
                  <span className="text-sm font-bold text-slate-200">{test.dailyCapacity} tests</span>
                </div>
              </div>
            </div>

            {isCenterSelected && (
              <div className="mt-6 pt-4 border-t border-slate-850/40 flex justify-end">
                <button
                  onClick={() => { setSelectedTest(test); setIsAvail(test.isAvailable); setStock(test.reagentStock); setShowModal(true); }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/40 hover:text-emerald-400 text-slate-400 text-xs font-semibold transition"
                >
                  {t('updateReagents')}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Reagents Audit Modal */}
      <AnimatePresence>
        {showModal && selectedTest && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" 
            />
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              className="w-full max-w-sm glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl relative z-10"
            >
              <h3 className="text-lg font-bold text-slate-200 mb-2">{t('updateReagents')}</h3>
              <p className="text-xs text-slate-400 mb-6 font-medium">Test: <span className="text-emerald-400 font-bold">{selectedTest.testName}</span></p>

              {error && <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">{error}</div>}

              <form onSubmit={handleUpdateAudit} className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-slate-850">
                  <span className="text-xs text-slate-350 font-bold">{t('isAvailableLabel')}</span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsAvail(true)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${isAvail ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-500'}`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAvail(false)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${!isAvail ? 'bg-rose-550 text-slate-950' : 'bg-slate-900 text-slate-500'}`}
                    >
                      Suspended
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">{t('reagentStockLabel')} (kits)</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    min={0}
                    className="w-full glass-input py-2.5 px-4 rounded-xl text-xs font-bold"
                    required
                  />
                </div>
                
                {stock <= 10 && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] leading-relaxed flex items-start space-x-2">
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>Warning: Setting reagents count $\le 10$ kits will automatically flag this diagnostic test as suspended/unavailable.</span>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-semibold hover:bg-slate-900 transition">{t('btnCancel')}</button>
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

export default LabAndTests;
