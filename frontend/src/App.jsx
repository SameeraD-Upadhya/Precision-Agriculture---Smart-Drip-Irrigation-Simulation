// src/App.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, TableProperties, BrainCircuit,
  FolderOpen, Download, Sun, Moon, Droplet
} from 'lucide-react';

import useNetworkStore from './stores/networkStore.js';
import useUIStore      from './stores/uiStore.js';

import { computeHydraulics, computeNetworkStats } from './algorithms/dijkstra.js';
import { useKeyboardShortcuts }   from './hooks/useKeyboardShortcuts.js';
import { useSimulation }          from './hooks/useSimulation.js';

import CanvasView      from './components/canvas/CanvasView.jsx';
import ToolbarPanel    from './components/panels/ToolbarPanel.jsx';
import InspectorPanel  from './components/panels/InspectorPanel.jsx';
import StatsDashboard  from './components/panels/StatsDashboard.jsx';
import TelemetryLog    from './components/panels/TelemetryLog.jsx';
import HydrationChart  from './components/charts/HydrationChart.jsx';

import MatrixView    from './views/MatrixView.jsx';
import AlgorithmView from './views/AlgorithmView.jsx';

import ProjectManager from './components/modals/ProjectManager.jsx';
import ExportModal    from './components/modals/ExportModal.jsx';

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="glass-card rounded-3xl p-10 max-w-lg text-center border border-rose-500/20">
          <div className="text-rose-400 text-4xl mb-4">⚠</div>
          <h2 className="text-xl font-black text-white mb-2">Render Error</h2>
          <p className="text-zinc-500 text-sm mb-6">{this.state.error.message}</p>
          <button onClick={() => window.location.reload()}
            className="px-6 py-2 bg-cyan-500 text-black font-black rounded-xl text-sm uppercase tracking-wider">
            Reset Canvas
          </button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

const NavItem = ({ icon: Icon, label, active, colorClass, onClick }) => (
  <button
    onClick={onClick}
    title={label}
    className={`w-full flex items-center gap-3 h-12 rounded-2xl px-4 transition-all relative group/nav ${
      active ? 'bg-white/5 border border-white/5' : 'text-zinc-600 hover:bg-white/[0.02] hover:text-zinc-400'
    }`}
  >
    {active && <div className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full ${colorClass}`} />}
    <Icon size={18} className={active ? colorClass.replace('bg-', 'text-') : 'text-zinc-600 group-hover/nav:text-zinc-400'} />
    <span className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap overflow-hidden transition-all duration-300 opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-xs">
      {label}
    </span>
  </button>
);

function App() {
  const { nodes, edges, isDirty, markSaved, projectName } = useNetworkStore();
  const {
    view, setView,
    isSimulating, scaleMultiplier,
    theme, setTheme,
    setProjectManagerOpen, setExportModalOpen,
  } = useUIStore();

  const [hydrationHistory, setHydrationHistory] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('agroflow-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  useKeyboardShortcuts();

  const hydraulics = useMemo(
    () => computeHydraulics(nodes, edges, scaleMultiplier, isSimulating),
    [nodes, edges, scaleMultiplier, isSimulating]
  );

  const stats = useMemo(
    () => computeNetworkStats(nodes, edges, hydraulics, scaleMultiplier),
    [nodes, edges, hydraulics, scaleMultiplier]
  );

  useSimulation(hydraulics, isSimulating, setHydrationHistory);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirty) {
        try {
          const proj = { id: 'autosave', name: projectName, nodes, edges, savedAt: new Date().toISOString() };
          const arr  = JSON.parse(localStorage.getItem('agroflow-projects') || '[]');
          const filt = arr.filter(p => p.id !== 'autosave');
          localStorage.setItem('agroflow-projects', JSON.stringify([proj, ...filt].slice(0, 20)));
          markSaved();
        } catch {}
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isDirty, nodes, edges, projectName, markSaved]);

  const cropNodes = nodes.filter(n => n.type === 'crop');

  return (
    <div className="flex min-h-screen select-none" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* Sidebar */}
      <nav className="fixed left-0 top-0 h-full w-[72px] hover:w-[220px] bg-[#040404] border-r border-white/4 flex flex-col py-8 z-40 transition-all duration-300 group shadow-2xl overflow-x-hidden">
        <div className="flex items-center px-4 mb-10">
          <div className="min-w-[44px] h-11 bg-gradient-to-tr from-cyan-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(34,211,238,0.2)] shrink-0">
            <Droplet size={20} className="text-black" />
          </div>
          <div className="ml-3 overflow-hidden">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300">AGROFLOW</div>
            <div className="text-[8px] font-mono text-zinc-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300">PRO v2.0</div>
          </div>
        </div>

        <div className="flex-1 space-y-2 px-3">
          <NavItem icon={LayoutDashboard} label="Canvas"    active={view==='dashboard'} colorClass="bg-cyan-400 text-cyan-400"    onClick={() => setView('dashboard')} />
          <NavItem icon={TableProperties} label="Matrix"    active={view==='matrix'}    colorClass="bg-purple-400 text-purple-400" onClick={() => setView('matrix')} />
          <NavItem icon={BrainCircuit}    label="Algorithm" active={view==='algorithm'} colorClass="bg-emerald-400 text-emerald-400" onClick={() => setView('algorithm')} />
        </div>

        <div className="px-3 space-y-1.5">
          <button onClick={() => setProjectManagerOpen(true)} title="Project Manager"
            className="w-full flex items-center gap-3 h-10 rounded-xl px-3 text-zinc-600 hover:bg-white/4 hover:text-zinc-300 transition-all">
            <FolderOpen size={16} />
            <span className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300">Projects</span>
          </button>
          <button onClick={() => setExportModalOpen(true)} title="Export"
            className="w-full flex items-center gap-3 h-10 rounded-xl px-3 text-zinc-600 hover:bg-white/4 hover:text-zinc-300 transition-all">
            <Download size={16} />
            <span className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300">Export</span>
          </button>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme"
            className="w-full flex items-center gap-3 h-10 rounded-xl px-3 text-zinc-600 hover:bg-white/4 hover:text-zinc-300 transition-all">
            <motion.div key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </motion.div>
            <span className="text-[9px] font-bold uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 ml-[72px] min-h-screen flex flex-col">
        <main className="flex-1 p-6 lg:p-8 max-w-[1800px] w-full mx-auto">
          {/* Header */}
          <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
            <div>
              <div className="inline-flex px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[8px] font-black tracking-widest uppercase rounded-md mb-2">
                Dijkstra Hydraulic Mesh Solver · Online
              </div>
              <h1 className="text-2xl xl:text-3xl font-black uppercase tracking-tight text-gradient-cyan">AgroFlow Pro</h1>
              <p className="text-zinc-600 text-[10px] font-mono uppercase tracking-[0.25em] mt-0.5">Precision Irrigation Network Designer v2.0</p>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono">
              <div className={`w-1.5 h-1.5 rounded-full ${isDirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className={isDirty ? 'text-amber-400' : 'text-emerald-400'}>{isDirty ? 'Unsaved changes' : 'All saved'}</span>
              <span className="text-zinc-700 ml-2">{projectName}</span>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div key="dashboard"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <StatsDashboard stats={stats} hydraulics={hydraulics} />
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  <div className="xl:col-span-3 space-y-4">
                    <ToolbarPanel />
                    <InspectorPanel hydraulics={hydraulics} scaleMultiplier={scaleMultiplier} />
                    <TelemetryLog />
                  </div>
                  <div className="xl:col-span-9 space-y-4">
                    <div id="main-canvas-area"
                      className="glass-card rounded-3xl p-5 relative overflow-hidden border border-white/4"
                      style={{ minHeight: 620 }}>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-400">Blueprint CAD Workspace</h3>
                          <p className="text-[9px] text-zinc-600 font-mono mt-0.5 uppercase tracking-wider">
                            {nodes.length} nodes · {edges.length} pipes · {isSimulating ? '▶ Live' : '⏸ Paused'}
                          </p>
                        </div>
                      </div>
                      <div style={{ height: 560 }}>
                        <CanvasView hydraulics={hydraulics} />
                      </div>
                    </div>
                    <HydrationChart hydrationHistory={hydrationHistory} cropNodes={cropNodes} />
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'matrix' && (
              <motion.div key="matrix"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}>
                <MatrixView hydraulics={hydraulics} />
              </motion.div>
            )}

            {view === 'algorithm' && (
              <motion.div key="algorithm"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}>
                <AlgorithmView />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 text-[8px] font-mono text-zinc-700 flex flex-wrap gap-3">
            {[['S','Select'],['P','Pipe'],['J','Junction'],['R','Pump'],['C','Crop'],['Ctrl+Z','Undo'],['Ctrl+⇧+Z','Redo'],['Del','Remove'],['Esc','Cancel']].map(([k, v]) => (
              <span key={k}><kbd className="bg-white/4 border border-white/8 px-1.5 py-0.5 rounded text-zinc-500">{k}</kbd> {v}</span>
            ))}
          </div>
        </main>
      </div>

      <ProjectManager />
      <ExportModal />
    </div>
  );
}

export default function AppWithBoundary() {
  return <ErrorBoundary><App /></ErrorBoundary>;
}
