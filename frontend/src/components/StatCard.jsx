import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, description, trend, status = 'neutral' }) => {
  
  const getStatusBorder = () => {
    switch (status) {
      case 'success':
        return 'border-emerald-500/30 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]';
      case 'warning':
        return 'border-amber-500/30 shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]';
      case 'danger':
        return 'border-rose-500/30 shadow-[0_0_15px_-3px_rgba(244,63,94,0.1)]';
      default:
        return 'border-slate-800/80';
    }
  };

  const getStatusIconColor = () => {
    switch (status) {
      case 'success':
        return 'text-emerald-400 bg-emerald-500/10';
      case 'warning':
        return 'text-amber-400 bg-amber-500/10';
      case 'danger':
        return 'text-rose-400 bg-rose-500/10';
      default:
        return 'text-slate-400 bg-slate-800/80';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`glass-panel p-6 rounded-2xl border ${getStatusBorder()} flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-400 tracking-wide uppercase">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${getStatusIconColor()}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-3xl font-bold text-slate-100 tracking-tight">
          {value}
        </h3>
        {description && (
          <p className="text-xs text-slate-400 mt-2 font-medium">
            {trend && <span className={`${trend.positive ? 'text-emerald-400' : 'text-rose-400'} font-semibold mr-1`}>{trend.label}</span>}
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
