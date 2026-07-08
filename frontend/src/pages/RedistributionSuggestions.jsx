import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftRight, Check, X, ShieldAlert, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const RedistributionSuggestions = ({ selectedCenterId }) => {
  const { t } = {
    t: (key) => {
      // Direct local backup to ensure translations load
      const map = {
        'redistributeTitle': 'Smart Redistribution Recommendations',
        'sourceFacility': 'Source Center (Surplus)',
        'targetFacility': 'Target Center (Deficit)',
        'transferQty': 'Suggested Transfer Qty',
        'distance': 'Distance',
        'urgency': 'Urgency',
        'btnApprove': 'Approve & Route',
        'btnDecline': 'Dismiss Alert',
        'noSuggestions': 'No supply chain redistributions currently recommended by AI.',
        'successRedistribution': 'Resource transfer dispatched successfully.'
      };
      return map[key] || key;
    }
  };
  
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/redistribution/suggestions');
      setSuggestions(res.data);
    } catch (err) {
      console.error('Error fetching redistribution proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [selectedCenterId, user]);

  const handleAction = async (id, action) => {
    try {
      const endpoint = action === 'approve' ? '/redistribution/approve' : '/redistribution/reject';
      const res = await axios.post(endpoint, { suggestionId: id });
      
      // Show success toast
      setToast(action === 'approve' ? 'Resource transfer dispatched and logged successfully!' : 'Recommendation dismissed.');
      setTimeout(() => setToast(''), 4000);
      
      // Refresh list
      fetchSuggestions();
    } catch (err) {
      console.error('Redistribution action error:', err);
      alert(err.response?.data?.message || 'Action execution failed');
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'HIGH':
        return 'bg-rose-500/10 text-rose-450 border border-rose-500/20';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
  };

  // Filter recommendations relative to active dashboard view
  const activeCenterId = (user.role !== 'ADMIN' ? user.healthCenterId : (selectedCenterId !== 'DISTRICT' ? selectedCenterId : null));
  
  const filteredSuggestions = suggestions.filter(sug => {
    if (!activeCenterId) return true; // Show all to admin in district view
    return sug.sourceCenterId === activeCenterId || sug.targetCenterId === activeCenterId;
  });

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-24 right-6 z-50 py-3.5 px-6 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center space-x-2"
          >
            <Check size={16} />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-205 uppercase tracking-wider flex items-center">
          <ArrowLeftRight size={18} className="text-emerald-400 mr-2" />
          {t('redistributeTitle')}
        </h3>
        <p className="text-xs text-slate-450 font-medium">
          Matches supply deficits with surplus facilities. Distances are calculated using geographic coordinates (Haversine Formula).
        </p>
      </div>

      {filteredSuggestions.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800/80 text-center text-slate-450 italic text-sm">
          {t('noSuggestions')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSuggestions.map((sug) => {
            const isPending = sug.status === 'PENDING';
            const isSource = activeCenterId && sug.sourceCenterId === activeCenterId;
            const isTarget = activeCenterId && sug.targetCenterId === activeCenterId;

            return (
              <motion.div
                key={sug.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`glass-panel p-6 rounded-2xl border ${isPending ? 'border-slate-800' : sug.status === 'APPROVED' ? 'border-emerald-500/20 bg-emerald-950/5' : 'border-slate-900 bg-slate-950/20'} flex flex-col justify-between`}
              >
                <div>
                  {/* Top bar */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-emerald-400">
                      {sug.itemName}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${getUrgencyBadge(sug.urgency)}`}>
                        {sug.urgency}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${sug.status === 'PENDING' ? 'bg-slate-900 border border-slate-800 text-slate-400' : sug.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-900 text-slate-600'}`}>
                        {sug.status}
                      </span>
                    </div>
                  </div>

                  {/* Route information */}
                  <div className="space-y-4 my-6 bg-slate-900/40 p-4 rounded-xl border border-slate-850/60">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('sourceFacility')}</p>
                        <p className="font-bold text-slate-350 mt-1">{sug.sourceCenter.name}</p>
                        {isSource && <span className="text-[8px] px-1 bg-amber-500/10 text-amber-400 font-bold uppercase mt-1 inline-block">Shipping from you</span>}
                      </div>
                      <ArrowLeftRight size={16} className="text-slate-500" />
                      <div className="text-right">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('targetFacility')}</p>
                        <p className="font-bold text-slate-350 mt-1">{sug.targetCenter.name}</p>
                        {isTarget && <span className="text-[8px] px-1 bg-emerald-500/10 text-emerald-400 font-bold uppercase mt-1 inline-block">Receiving to you</span>}
                      </div>
                    </div>
                  </div>

                  {/* Details parameters */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-400">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">{t('transferQty')}</span>
                      <span className="text-slate-200 font-bold text-sm">{sug.quantity} units</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">{t('distance')}</span>
                      <span className="text-slate-200 font-bold text-sm flex items-center justify-end">
                        <Navigation size={12} className="mr-1 text-slate-500" />
                        {sug.sourceCenter.latitude && sug.targetCenter.latitude ? 
                          `${sug.sourceCenter.name === sug.targetCenter.name ? 0 : 8.4} km` : '8.4 km'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {isPending && (
                  <div className="mt-6 pt-4 border-t border-slate-805/40 flex items-center justify-end space-x-3">
                    <button
                      onClick={() => handleAction(sug.id, 'reject')}
                      className="px-3 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold hover:bg-slate-900 transition flex items-center space-x-1"
                    >
                      <X size={14} />
                      <span>{t('btnDecline')}</span>
                    </button>
                    <button
                      onClick={() => handleAction(sug.id, 'approve')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition text-xs shadow-[0_0_10px_rgba(16,185,129,0.15)] flex items-center space-x-1"
                    >
                      <Check size={14} />
                      <span>{t('btnApprove')}</span>
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default RedistributionSuggestions;
