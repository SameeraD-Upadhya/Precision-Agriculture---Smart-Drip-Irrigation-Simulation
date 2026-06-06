// src/stores/uiStore.js
import { create } from 'zustand';

const useUIStore = create((set, get) => ({
  view:                'dashboard',
  activeTool:          'select',
  selectedPipeType:    'mainline',
  selectedNodeId:      null,
  selectedEdgeId:      null,
  pipeSourceId:        null,
  draggingNodeId:      null,
  zoom:                1.0,
  panX:                0,
  panY:                0,
  isSimulating:        true,
  scaleMultiplier:     1.0,
  snapToGrid:          false,
  theme:               'dark',
  sidebarExpanded:     false,
  showHydrationChart:  false,
  projectManagerOpen:  false,
  exportModalOpen:     false,
  algorithmStep:       -1,
  algorithmSpeed:      1.0,
  logs:                [],

  // ── Setters ───────────────────────────────────────────────
  setView:               v  => set({ view: v }),
  setActiveTool:         t  => set({ activeTool: t }),
  setSelectedPipeType:   t  => set({ selectedPipeType: t }),
  setSelectedNodeId:     id => set({ selectedNodeId: id, selectedEdgeId: null }),
  setSelectedEdgeId:     id => set({ selectedEdgeId: id, selectedNodeId: null }),
  setPipeSourceId:       id => set({ pipeSourceId: id }),
  setDraggingNodeId:     id => set({ draggingNodeId: id }),
  setZoom:               z  => set({ zoom: Math.max(0.2, Math.min(4.0, z)) }),
  setPanX:               x  => set({ panX: x }),
  setPanY:               y  => set({ panY: y }),
  setPan:                (x, y) => set({ panX: x, panY: y }),
  setIsSimulating:       v  => set({ isSimulating: v }),
  setScaleMultiplier:    v  => set({ scaleMultiplier: v }),
  setSnapToGrid:         v  => set({ snapToGrid: v }),
  setSidebarExpanded:    v  => set({ sidebarExpanded: v }),
  setShowHydrationChart: v  => set({ showHydrationChart: v }),
  setProjectManagerOpen: v  => set({ projectManagerOpen: v }),
  setExportModalOpen:    v  => set({ exportModalOpen: v }),
  setAlgorithmStep:      v  => set({ algorithmStep: v }),
  setAlgorithmSpeed:     v  => set({ algorithmSpeed: v }),
  clearSelection:        ()  => set({ selectedNodeId: null, selectedEdgeId: null }),

  // ── Theme ─────────────────────────────────────────────────
  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('agroflow-theme', theme);
    set({ theme });
  },

  // ── Logs ──────────────────────────────────────────────────
  addLog: (msg, type = 'info') => {
    const entry = {
      id:   Date.now() + Math.random(),
      msg,
      type,
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    };
    set(s => ({ logs: [entry, ...s.logs.slice(0, 14)] }));
  },

  clearLogs: () => set({ logs: [] }),
}));

export default useUIStore;
