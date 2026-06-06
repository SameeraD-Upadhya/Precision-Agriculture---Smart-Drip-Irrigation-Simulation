// src/components/panels/ToolbarPanel.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MousePointer2, Hand, Zap, GitMerge, Sprout, Cable,
  Play, Pause, Grid3X3, Undo2, Redo2, LayoutTemplate, ChevronDown,
} from 'lucide-react';
import useUIStore      from '../../stores/uiStore.js';
import useNetworkStore from '../../stores/networkStore.js';

const DEMO_LAYOUTS = [
  { id: 'small',       label: '🌱 Small Network',    desc: '1 pump · 2 fields' },
  { id: 'dual-source', label: '💧 Dual Source',       desc: '2 pumps · 4 fields' },
  { id: 'large-farm',  label: '🌾 Large Farm',        desc: '3 pumps · 8 fields' },
  { id: 'congestion',  label: '🔴 High Congestion',   desc: '1 pump · 5 drought fields' },
  { id: 'cascade',     label: '⛲ Cascade Chain',     desc: 'Waterfall relay topology' },
  { id: 'ring',        label: '🔄 Ring / Redundant',  desc: '2 pumps · loop failover' },
];

const ToolBtn = ({ label, icon: Icon, active, color, onClick, fullWidth }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider
      transition-all duration-150 border
      ${fullWidth ? 'col-span-2 justify-center' : 'justify-start'}
      ${active
        ? `${color} shadow-sm`
        : 'bg-black/50 text-zinc-500 border-white/5 hover:border-white/10 hover:text-zinc-300'}
    `}
  >
    <Icon size={13} />
    <span className="truncate">{label}</span>
  </button>
);

export default function ToolbarPanel() {
  const {
    activeTool, setActiveTool,
    isSimulating, setIsSimulating,
    scaleMultiplier, setScaleMultiplier,
    snapToGrid, setSnapToGrid,
    setPipeSourceId,
    addLog,
  } = useUIStore();

  const { undo, redo, historyIndex, history, loadDemoLayout } = useNetworkStore();

  const [demoOpen, setDemoOpen] = useState(false);
  const containerRef            = useRef(null);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const setTool = (t) => { setActiveTool(t); setPipeSourceId(null); };

  const toggleSim = () => {
    const next = !isSimulating;
    setIsSimulating(next);
    addLog(next ? 'Simulation engaged — live hydraulics active.' : 'Simulation paused — flow suspended.', next ? 'success' : 'warning');
  };

  // Close when clicking outside
  useEffect(() => {
    if (!demoOpen) return;
    const onDown = (e) => {
      if (!containerRef.current?.contains(e.target)) {
        setDemoOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [demoOpen]);

  const handleLoadDemo = (layoutId, label) => {
    loadDemoLayout(layoutId);
    setDemoOpen(false);
    addLog(`Loaded demo: ${label}`, 'success');
  };

  return (
    <div className="space-y-5">

      {/* ── Blueprint Tools ─────────────────────── */}
      <div className={`glass-card rounded-2xl p-4 ${demoOpen ? 'relative z-[100]' : 'relative z-10'}`}>
        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-cyan-400 mb-3">Blueprint Tools</p>
        <div className="grid grid-cols-2 gap-2">
          <ToolBtn label="Select"          icon={MousePointer2} active={activeTool==='select'}   color="bg-cyan-500 text-black border-cyan-400"       onClick={() => setTool('select')} />
          <ToolBtn label="Pan"             icon={Hand}          active={activeTool==='pan'}      color="bg-zinc-700 text-white border-zinc-600"       onClick={() => setTool('pan')} />
          <ToolBtn label="+ Pump"          icon={Zap}           active={activeTool==='pump'}     color="bg-emerald-500 text-black border-emerald-400" onClick={() => setTool('pump')} />
          <ToolBtn label="+ Junction"      icon={GitMerge}      active={activeTool==='junction'} color="bg-purple-500 text-white border-purple-400"   onClick={() => setTool('junction')} />
          <ToolBtn label="+ Crop Field"    icon={Sprout}        active={activeTool==='crop'}     color="bg-amber-500 text-black border-amber-400"     onClick={() => setTool('crop')} fullWidth />
          <ToolBtn label="Connect Pipeline" icon={Cable}        active={activeTool==='pipe'}     color="bg-indigo-600 text-white border-indigo-400"   onClick={() => setTool('pipe')} fullWidth />
        </div>

        {/* Demo picker trigger — absolute positioned dropdown below trigger container */}
        <div className="mt-3 relative" ref={containerRef}>
          <button
            onClick={() => setDemoOpen(v => !v)}
            className={`w-full flex items-center justify-between gap-2 py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
              demoOpen
                ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300'
                : 'border-indigo-500/25 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'
            }`}
          >
            <span className="flex items-center gap-2"><LayoutTemplate size={13} /> Demo Layouts</span>
            <ChevronDown size={12} className={`transition-transform duration-200 ${demoOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Absolute-position dropdown — renders above everything within this panel */}
          <AnimatePresence>
            {demoOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scaleY: 0.95 }}
                animate={{ opacity: 1, y: 0,  scaleY: 1 }}
                exit={{    opacity: 0, y: 4, scaleY: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{ transformOrigin: 'top', zIndex: 50 }}
                className="absolute top-full left-0 w-full mt-1.5 bg-zinc-950 border border-white/10 rounded-xl overflow-hidden shadow-2xl"
              >
                {DEMO_LAYOUTS.map(({ id, label, desc }) => (
                  <button
                    key={id}
                    onClick={() => handleLoadDemo(id, label)}
                    className="w-full text-left px-3 py-2.5 border-b border-white/4 last:border-0 hover:bg-indigo-500/10 transition-colors group"
                  >
                    <div className="text-[10px] font-bold text-white group-hover:text-indigo-300 transition-colors">{label}</div>
                    <div className="text-[8px] text-zinc-600 group-hover:text-zinc-400 font-mono mt-0.5">{desc}</div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Simulation Controls ─────────────────── */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-1">Simulation</p>
        <button
          onClick={toggleSim}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
            isSimulating
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              : 'bg-emerald-500 text-black border-emerald-400'
          }`}
        >
          {isSimulating ? <Pause size={13} /> : <Play size={13} />}
          {isSimulating ? 'Pause Simulation' : 'Engage Simulation'}
        </button>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Scale</span>
            <span className="text-[10px] font-mono font-bold text-cyan-400">{scaleMultiplier}×</span>
          </div>
          <input
            type="range" min="0.5" max="3.0" step="0.5"
            value={scaleMultiplier}
            onChange={e => setScaleMultiplier(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-lg accent-cyan-500 cursor-pointer"
          />
        </div>
      </div>

      {/* ── History & Snap ──────────────────────── */}
      <div className="glass-card rounded-2xl p-4 space-y-2">
        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-1">History</p>
        <div className="flex gap-2">
          <button
            onClick={undo} disabled={!canUndo}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold border transition-all ${
              canUndo ? 'border-white/8 text-zinc-400 hover:text-white hover:border-white/15' : 'border-white/3 text-zinc-700 cursor-not-allowed'
            }`}
          >
            <Undo2 size={12} /> Undo
          </button>
          <button
            onClick={redo} disabled={!canRedo}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold border transition-all ${
              canRedo ? 'border-white/8 text-zinc-400 hover:text-white hover:border-white/15' : 'border-white/3 text-zinc-700 cursor-not-allowed'
            }`}
          >
            <Redo2 size={12} /> Redo
          </button>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold border transition-all ${
              snapToGrid ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'border-white/8 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Grid3X3 size={12} /> {snapToGrid ? 'Snap ON' : 'Snap OFF'}
          </button>
        </div>
      </div>

    </div>
  );
}
