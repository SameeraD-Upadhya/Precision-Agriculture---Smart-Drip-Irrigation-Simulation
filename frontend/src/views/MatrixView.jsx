// src/views/MatrixView.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import useNetworkStore from '../stores/networkStore.js';

const BADGE = {
  pump:     'bg-emerald-950 text-emerald-400 border-emerald-900',
  crop:     'bg-blue-950 text-blue-400 border-blue-900',
  junction: 'bg-purple-950 text-purple-400 border-purple-900',
};

export default function MatrixView({ hydraulics }) {
  const { nodes } = useNetworkStore();
  const [search,  setSearch]  = useState('');
  const [sortKey, setSortKey] = useState('id');
  const [sortDir, setSortDir] = useState('asc');

  const sortedNodes = useMemo(() => {
    const filtered = nodes.filter(n =>
      n.id.toLowerCase().includes(search.toLowerCase()) ||
      (n.name || '').toLowerCase().includes(search.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      let av = a[sortKey] ?? '', bv = b[sortKey] ?? '';
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [nodes, search, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ k }) => {
    if (sortKey !== k) return null;
    return sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
  };

  const Th = ({ k, label }) => (
    <th
      onClick={() => toggleSort(k)}
      className="p-4 text-left text-[9px] font-black uppercase tracking-widest text-zinc-500 cursor-pointer hover:text-zinc-300 select-none"
    >
      <div className="flex items-center gap-1">{label}<SortIcon k={k} /></div>
    </th>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black uppercase text-gradient-cyan">Routing Analysis Sheet</h2>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            type="text" placeholder="Search nodes..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="bg-black/50 border border-white/8 rounded-xl pl-8 pr-3 py-2 text-[11px] text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-cyan-500/50 w-52"
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[11px]">
            <thead className="bg-white/3 border-b border-white/5">
              <tr>
                <Th k="id"   label="Node ID" />
                <Th k="type" label="Type" />
                <Th k="name" label="Name" />
                <Th k="z"    label="Elevation" />
                <th className="p-4 text-left text-[9px] font-black uppercase tracking-widest text-zinc-500">Status / Metrics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              <AnimatePresence mode="popLayout">
                {sortedNodes.map(n => {
                  const flow = hydraulics.nodeAllocatedInputs?.[n.id] || 0;
                  return (
                    <motion.tr
                      key={n.id}
                      layout
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="hover:bg-white/[0.015] transition-colors"
                    >
                      <td className="p-4 font-bold text-white">{n.id}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${BADGE[n.type] || 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>
                          {n.type}
                        </span>
                      </td>
                      <td className="p-4 text-zinc-400 max-w-[200px] truncate">{n.name}</td>
                      <td className="p-4 text-amber-400 font-bold">{n.z}m</td>
                      <td className="p-4">
                        {n.type === 'crop' ? (
                          <div className="flex items-center gap-3">
                            <div className="flex-1 max-w-[120px]">
                              <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${n.hydration || 0}%`, background: (n.hydration||0) > 70 ? '#10b981' : (n.hydration||0) > 35 ? '#f59e0b' : '#f43f5e' }} />
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold ${(n.hydration||0) > 70 ? 'text-emerald-400' : (n.hydration||0) > 35 ? 'text-amber-400' : 'text-rose-400'}`}>
                              {(n.hydration||0).toFixed(0)}%
                            </span>
                            <span className="text-zinc-600">{flow}/{n.flowDemand} GPM</span>
                          </div>
                        ) : n.type === 'pump' ? (
                          <span className="text-emerald-400">{n.pressurePSI} PSI · {n.maxFlow} GPM cap</span>
                        ) : (
                          <span className="text-purple-400 italic">Distribution junction</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {sortedNodes.length === 0 && (
          <div className="text-center py-12 text-zinc-600 text-xs italic">No nodes match your filter.</div>
        )}
      </div>
    </motion.div>
  );
}
