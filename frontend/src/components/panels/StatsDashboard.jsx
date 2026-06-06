// src/components/panels/StatsDashboard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Gauge, Activity, AlertTriangle, Zap } from 'lucide-react';
import useNetworkStore from '../../stores/networkStore.js';

const KPICard = ({ label, value, sub, icon: Icon, color, warn }) => (
  <motion.div
    className="glass-card rounded-2xl p-4 flex items-center gap-3 border border-white/4 hover:border-white/8 transition-colors"
    whileHover={{ scale: 1.01 }}
    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
  >
    <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
      <Icon size={18} className={color} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">{label}</p>
      <div className={`text-lg font-black font-mono leading-none ${warn ? 'text-rose-400' : color}`}>
        {value}
      </div>
      {sub && <p className="text-[9px] text-zinc-600 mt-0.5">{sub}</p>}
    </div>
  </motion.div>
);

export default function StatsDashboard({ stats, hydraulics }) {
  const { nodes } = useNetworkStore();
  const eff   = stats.efficiencyPct || 0;
  const effColor = eff >= 80 ? 'text-emerald-400' : eff >= 50 ? 'text-amber-400' : 'text-rose-400';

  const pumps         = nodes.filter(n => n.type === 'pump');
  const pumpRates     = hydraulics?.pumpOutputRates || {};
  const totalOutput   = pumps.reduce((s, p) => s + (pumpRates[p.id] || 0), 0);
  const totalCapacity = pumps.reduce((s, p) => s + (p.maxFlow || 0), 0);
  const sourceUtil    = totalCapacity > 0 ? Math.round((totalOutput / totalCapacity) * 100) : 0;

  // Estimate minutes until all crops reach capacity (very rough)
  const crops        = nodes.filter(n => n.type === 'crop');
  const cropsNeedWater = crops.filter(c => (c.isSupplyEnabled !== false) && ((c.hydration ?? 0) < (c.targetCapacity ?? 100)));
  const avgThirst    = cropsNeedWater.length > 0
    ? cropsNeedWater.reduce((s, c) => s + ((c.targetCapacity ?? 100) - (c.hydration ?? 0)), 0) / cropsNeedWater.length
    : 0;
  const etaMin       = avgThirst > 0 ? Math.ceil(avgThirst / 1.5 * (800 / 60000)) : 0; // ticks of 800ms at 1.5%/tick

  return (
    <div className="space-y-3 mb-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Total Delivery"
          value={`${stats.totalDelivered}/${stats.totalDemand}`}
          sub="GPM delivered vs demand"
          icon={Droplets}
          color="text-cyan-400"
        />
        <KPICard
          label="Network Efficiency"
          value={`${eff}%`}
          sub={eff >= 80 ? 'Optimal flow' : eff >= 50 ? 'Moderate strain' : 'Critical shortage'}
          icon={Gauge}
          color={effColor}
        />
        <KPICard
          label="Active Pipelines"
          value={`${stats.activePipesCount || 0}`}
          sub="Pipes carrying active flow"
          icon={Activity}
          color="text-purple-400"
        />
        <KPICard
          label="Overloaded Pipes"
          value={stats.overloadedPipes.length}
          sub={stats.overloadedPipes.length > 0 ? `IDs: ${stats.overloadedPipes.join(', ')}` : 'All pipes nominal'}
          icon={AlertTriangle}
          color="text-amber-400"
          warn={stats.overloadedPipes.length > 0}
        />
      </div>

      {/* Source Output Banner */}
      {pumps.length > 0 && (
        <div className="glass-card rounded-2xl px-4 py-3 border border-white/4 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-emerald-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Source Output</span>
          </div>
          {pumps.map(p => {
            const out   = pumpRates[p.id] || 0;
            const cap   = p.maxFlow || 1;
            const pct   = Math.min(100, Math.round((out / cap) * 100));
            const col   = pct >= 85 ? '#f43f5e' : pct >= 50 ? '#f59e0b' : '#10b981';
            return (
              <div key={p.id} className="flex items-center gap-2 min-w-[140px]">
                <div className="flex-1">
                  <div className="flex justify-between text-[8px] font-mono mb-0.5">
                    <span className="text-zinc-400 truncate max-w-[90px]">{p.name}</span>
                    <span style={{ color: col }} className="font-bold">{out}/{cap} GPM</span>
                  </div>
                  <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: col }}
                      animate={{ width: `${pct}%` }}
                      transition={{ type: 'spring', damping: 20 }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          <div className="ml-auto flex items-center gap-4 text-[9px] font-mono text-zinc-500">
            <span>Utilisation: <span className={sourceUtil >= 85 ? 'text-rose-400' : 'text-emerald-400'} style={{ fontWeight: 'bold' }}>{sourceUtil}%</span></span>
            {cropsNeedWater.length > 0 && (
              <span>Fields needing water: <span className="text-amber-400 font-bold">{cropsNeedWater.length}</span></span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
