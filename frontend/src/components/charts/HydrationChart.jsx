// src/components/charts/HydrationChart.jsx
import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import { ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import useUIStore from '../../stores/uiStore.js';

const CROP_COLORS = ['#22d3ee', '#a855f7', '#f59e0b', '#10b981', '#f43f5e', '#3b82f6'];

function HydrationChart({ hydrationHistory, cropNodes }) {
  const { showHydrationChart, setShowHydrationChart } = useUIStore();

  const chartData = hydrationHistory.map((h, i) => {
    const entry = { t: i };
    cropNodes.forEach(c => { entry[c.id] = h.values[c.id] ?? null; });
    return entry;
  });

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
      <button
        onClick={() => setShowHydrationChart(!showHydrationChart)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/2 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BarChart3 size={14} className="text-purple-400" />
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-purple-400">Hydration Trends</span>
          <span className="text-[8px] text-zinc-600">(live 60s)</span>
        </div>
        {showHydrationChart ? <ChevronDown size={14} className="text-zinc-600" /> : <ChevronUp size={14} className="text-zinc-600" />}
      </button>

      <AnimatePresence>
        {showHydrationChart && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 220, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4" style={{ height: 220 }}>
              {cropNodes.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-600 text-xs italic">
                  No crop nodes to chart.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="t" tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 8 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 10, fontFamily: '"DM Mono", monospace' }}
                      labelStyle={{ color: '#71717a' }}
                      itemStyle={{ color: '#f1f5f9' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 9, fontFamily: '"DM Mono", monospace' }} />
                    <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: '70%', fill: '#10b981', fontSize: 8 }} />
                    <ReferenceLine y={35} stroke="#f43f5e" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: '35%', fill: '#f43f5e', fontSize: 8 }} />
                    {cropNodes.map((c, i) => (
                      <Line
                        key={c.id}
                        type="monotone"
                        dataKey={c.id}
                        name={c.name || c.id}
                        stroke={CROP_COLORS[i % CROP_COLORS.length]}
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(HydrationChart);
