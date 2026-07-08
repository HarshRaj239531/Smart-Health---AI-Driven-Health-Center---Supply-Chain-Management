import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Minus, Search, Calendar, Tag, ShieldAlert, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const StockManagement = ({ selectedCenterId }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Dialog States
  const [showLogModal, setShowLogModal] = useState(false);
  const [showReplenishModal, setShowReplenishModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [error, setError] = useState('');

  const fetchInventoryAndTx = async () => {
    try {
      setLoading(true);
      const queryParam = selectedCenterId && selectedCenterId !== 'DISTRICT' ? `?healthCenterId=${selectedCenterId}` : '';
      const [invRes, txRes] = await Promise.all([
        axios.get(`/inventory${queryParam}`),
        axios.get(`/inventory/transactions${queryParam}`)
      ]);
      setInventory(invRes.data);
      setTransactions(txRes.data);
    } catch (err) {
      console.error('Error fetching inventory details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryAndTx();
  }, [selectedCenterId, user]);

  const handleLogConsumption = async (e) => {
    e.preventDefault();
    if (!selectedItem || !qty || qty <= 0) return setError('Valid details required');

    try {
      setError('');
      await axios.post('/inventory/consume', {
        inventoryId: selectedItem.id,
        quantity: parseInt(qty),
        notes
      });
      setShowLogModal(false);
      setQty('');
      setNotes('');
      fetchInventoryAndTx();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log consumption');
    }
  };

  const handleReplenish = async (e) => {
    e.preventDefault();
    if (!selectedItem || !qty || qty <= 0) return setError('Valid details required');

    try {
      setError('');
      await axios.post('/inventory/replenish', {
        inventoryId: selectedItem.id,
        quantity: parseInt(qty),
        batchNumber: batchNo || null,
        notes
      });
      setShowReplenishModal(false);
      setQty('');
      setBatchNo('');
      setNotes('');
      fetchInventoryAndTx();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to replenish stock');
    }
  };

  const getStockStatus = (current, min) => {
    if (current <= min * 0.2) return { text: t('stockStatusCritical'), color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
    if (current <= min) return { text: t('stockStatusWarning'), color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    return { text: t('stockStatusSafe'), color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.itemType.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <span className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const isCenterSelected = (user.role !== 'ADMIN' || (selectedCenterId && selectedCenterId !== 'DISTRICT'));

  return (
    <div className="space-y-8">
      
      {/* Search and Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search paracetamol, reagents..."
            className="w-full glass-input py-2 pl-10 pr-4 rounded-xl text-xs placeholder:text-slate-550"
          />
        </div>

        {user.role === 'ADMIN' && !isCenterSelected && (
          <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center">
            <ShieldAlert size={16} className="mr-1.5" />
            Please select a specific Health Center in the header to log daily usage or restock inventory.
          </p>
        )}
      </div>

      {/* Inventory table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">{t('itemName')}</th>
                <th className="py-4 px-6">{t('itemCategory')}</th>
                <th className="py-4 px-6">{t('currentStock')}</th>
                <th className="py-4 px-6">{t('minStock')}</th>
                <th className="py-4 px-6">{t('batchNo')}</th>
                <th className="py-4 px-6">{t('expiry')}</th>
                <th className="py-4 px-6">{t('status')}</th>
                {isCenterSelected && <th className="py-4 px-6 text-center">{t('action')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-xs">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-450 italic">No inventory matches found</td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const status = getStockStatus(item.currentStock, item.minStock);
                  return (
                    <tr key={item.id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-200">{item.name}</td>
                      <td className="py-4 px-6 font-medium text-slate-400 capitalize">{item.itemType.toLowerCase()}</td>
                      <td className="py-4 px-6 font-bold text-slate-200">
                        {item.currentStock} <span className="text-[10px] font-medium text-slate-500">{item.unit}</span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-400">{item.minStock}</td>
                      <td className="py-4 px-6 font-mono text-slate-450 text-[10px]">{item.batchNumber}</td>
                      <td className="py-4 px-6 font-semibold text-slate-400">
                        {new Date(item.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                      {isCenterSelected && (
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => { setSelectedItem(item); setShowLogModal(true); }}
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:text-rose-400 text-slate-400 transition"
                              title={t('btnLogConsumption')}
                            >
                              <Minus size={14} />
                            </button>
                            <button
                              onClick={() => { setSelectedItem(item); setShowReplenishModal(true); }}
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:text-emerald-400 text-slate-400 transition"
                              title={t('btnReplenish')}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center uppercase tracking-wider">
          <History size={16} className="text-emerald-400 mr-2" />
          Recent transaction logs (Last 50 changes)
        </h3>

        <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-850 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                <th className="pb-3 pr-4">Timestamp</th>
                <th className="pb-3 px-4">Item</th>
                <th className="pb-3 px-4">Change Type</th>
                <th className="pb-3 px-4">Quantity</th>
                <th className="pb-3 pl-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/50 text-[11px] text-slate-350">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500 italic">No transaction records generated yet</td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-900/10">
                    <td className="py-3 pr-4 font-medium text-slate-400">
                      {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} {new Date(tx.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-200">{tx.inventory.name}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${tx.type === 'IN' || tx.type === 'TRANSFER_IN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-200">{tx.quantity}</td>
                    <td className="py-3 pl-4 font-medium text-slate-400 italic">{tx.notes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog Modals */}
      <AnimatePresence>
        {/* LOG CONSUMPTION MODAL */}
        {showLogModal && selectedItem && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowLogModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" 
            />
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              className="w-full max-w-md glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl relative z-10"
            >
              <h3 className="text-lg font-bold text-slate-200 mb-2">{t('dialogLogTitle')}</h3>
              <p className="text-xs text-slate-400 mb-6 font-medium">Item: <span className="text-emerald-400 font-bold">{selectedItem.name}</span> (Avail: {selectedItem.currentStock} {selectedItem.unit})</p>

              {error && <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">{error}</div>}

              <form onSubmit={handleLogConsumption} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">{t('quantity')} ({selectedItem.unit})</label>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    max={selectedItem.currentStock}
                    min={1}
                    className="w-full glass-input py-2.5 px-4 rounded-xl text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">{t('notes')}</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Daily OPD patients distribution"
                    className="w-full glass-input py-2.5 px-4 rounded-xl text-xs h-20 resize-none"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setShowLogModal(false)} className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-semibold hover:bg-slate-900 transition">{t('btnCancel')}</button>
                  <button type="submit" className="px-4 py-2.5 rounded-xl bg-rose-500 text-slate-950 font-bold hover:bg-rose-400 transition text-xs shadow-[0_0_15px_rgba(244,63,94,0.2)]">{t('btnSubmit')}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* REPLENISH INVENTORY MODAL */}
        {showReplenishModal && selectedItem && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowReplenishModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" 
            />
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              className="w-full max-w-md glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl relative z-10"
            >
              <h3 className="text-lg font-bold text-slate-200 mb-2">{t('dialogReplenishTitle')}</h3>
              <p className="text-xs text-slate-400 mb-6 font-medium">Item: <span className="text-emerald-400 font-bold">{selectedItem.name}</span></p>

              {error && <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">{error}</div>}

              <form onSubmit={handleReplenish} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">{t('quantity')} ({selectedItem.unit})</label>
                    <input
                      type="number"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      min={1}
                      className="w-full glass-input py-2.5 px-4 rounded-xl text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">New Batch Number</label>
                    <input
                      type="text"
                      value={batchNo}
                      onChange={(e) => setBatchNo(e.target.value)}
                      placeholder="BAT-481920"
                      className="w-full glass-input py-2.5 px-4 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">{t('notes')}</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Received from Central District Store"
                    className="w-full glass-input py-2.5 px-4 rounded-xl text-xs h-20 resize-none"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setShowReplenishModal(false)} className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-semibold hover:bg-slate-900 transition">{t('btnCancel')}</button>
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

export default StockManagement;
