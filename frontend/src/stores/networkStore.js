// src/stores/networkStore.js
import { create } from 'zustand';
import { INITIAL_NODES, INITIAL_EDGES } from '../utils/constants.js';

const deepClone = obj => JSON.parse(JSON.stringify(obj));

const useNetworkStore = create((set, get) => ({
  nodes:        deepClone(INITIAL_NODES),
  edges:        deepClone(INITIAL_EDGES),
  history:      [{ nodes: deepClone(INITIAL_NODES), edges: deepClone(INITIAL_EDGES) }],
  historyIndex: 0,
  projectId:    null,
  projectName:  'Untitled Project',
  isDirty:      false,
  lastSaved:    null,
  _isUndoRedo:  false,

  // ── History ──────────────────────────────────────────────
  pushHistory: () => {
    if (get()._isUndoRedo) return;
    const { nodes, edges, history, historyIndex } = get();
    const snap     = { nodes: deepClone(nodes), edges: deepClone(edges) };
    let newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(snap);
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1, isDirty: true });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const idx  = historyIndex - 1;
    const snap = deepClone(history[idx]);
    set({ _isUndoRedo: true, nodes: snap.nodes, edges: snap.edges, historyIndex: idx });
    set({ _isUndoRedo: false });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const idx  = historyIndex + 1;
    const snap = deepClone(history[idx]);
    set({ _isUndoRedo: true, nodes: snap.nodes, edges: snap.edges, historyIndex: idx });
    set({ _isUndoRedo: false });
  },

  // ── Node mutations ────────────────────────────────────────
  setNodes: (nodes) => {
    get().pushHistory();
    set({ nodes });
  },

  addNode: (node) => {
    get().pushHistory();
    set(s => ({ nodes: [...s.nodes, node] }));
  },

  removeNode: (id) => {
    get().pushHistory();
    set(s => ({
      nodes: s.nodes.filter(n => n.id !== id),
      edges: s.edges.filter(e => e.from !== id && e.to !== id),
    }));
  },

  updateNode: (id, changes) => {
    set(s => ({
      nodes: s.nodes.map(n => n.id === id ? { ...n, ...changes } : n),
      isDirty: true,
    }));
  },

  updateNodeWithHistory: (id, changes) => {
    get().pushHistory();
    set(s => ({
      nodes: s.nodes.map(n => n.id === id ? { ...n, ...changes } : n),
    }));
  },

  // ── Edge mutations ────────────────────────────────────────
  setEdges: (edges) => {
    get().pushHistory();
    set({ edges });
  },

  addEdge: (edge) => {
    get().pushHistory();
    set(s => ({ edges: [...s.edges, edge] }));
  },

  removeEdge: (id) => {
    get().pushHistory();
    set(s => ({ edges: s.edges.filter(e => e.id !== id) }));
  },

  // ── Project ──────────────────────────────────────────────
  setProject: (id, name) => set({ projectId: id, projectName: name }),
  markDirty:  ()         => set({ isDirty: true }),
  markSaved:  ()         => set({ isDirty: false, lastSaved: new Date() }),

  resetNetwork: () => {
    const nodes = deepClone(INITIAL_NODES);
    const edges = deepClone(INITIAL_EDGES);
    set({
      nodes,
      edges,
      history:      [{ nodes: deepClone(nodes), edges: deepClone(edges) }],
      historyIndex: 0,
      isDirty:      false,
    });
  },

  // ── Demo Layout Library ───────────────────────────────────
  loadDemoLayout: (layoutId = 'dual-source') => {
    const crop = (id, name, x, y, z, demand, hydra, cap, on = true, maxCap = 100) => ({
      id, name, type: 'crop', x, y, z,
      flowDemand: demand, currentReceived: 0,
      hydration: hydra, targetCapacity: cap, maxCapacity: maxCap,
      isSupplyEnabled: on, isWateringActive: true,
    });
    const pump = (id, name, x, y, z, maxFlow, psi) => ({
      id, name, type: 'pump', x, y, z, maxFlow, pressurePSI: psi,
    });
    const junc = (id, name, x, y, z) => ({ id, name, type: 'junction', x, y, z });
    const pipe = (id, from, to) => ({ id, from, to });

    const LAYOUTS = {

      // 1 ─ Small: single pump, 2 fields
      'small': {
        nodes: [
          pump('P1', 'Well Alpha', 120, 300, 20, 400, 65),
          junc('J1', 'Main Valve', 320, 300, 15),
          crop('C1', 'Tomato Bed A', 560, 180, 10, 120, 10, 90, true, 120),
          crop('C2', 'Pepper Row B', 560, 420, 8,  100, 20, 85, true, 100),
        ],
        edges: [
          pipe('PA-J1', 'P1', 'J1'),
          pipe('J1-C1', 'J1', 'C1'),
          pipe('J1-C2', 'J1', 'C2'),
        ],
      },

      // 2 ─ Dual-Source: classic two-reservoir layout
      'dual-source': {
        nodes: [
          pump('PUMP_A', 'Reservoir North',  150, 140, 30, 800, 80),
          pump('PUMP_B', 'Reservoir South',  200, 660, 10, 600, 70),
          junc('JUNC_1', 'Pressure Valve 1', 400, 230, 20),
          junc('JUNC_2', 'Pressure Valve 2', 420, 560, 14),
          junc('JUNC_3', 'Flow Divider',     580, 400, 12),
          crop('CROP_1', 'Maize Cultivar A', 760, 155, 18, 180, 15, 90, true, 130),
          crop('CROP_2', 'Soybean Plot 3B',  820, 345, 14, 160, 25, 88, true, 110),
          crop('CROP_3', 'Wheat Sector C',   780, 530, 10, 200, 30, 92, true, 140),
          crop('CROP_4', 'Barley Hydration', 550, 710,  8, 150, 20, 85, true, 95),
        ],
        edges: [
          pipe('PA-J1', 'PUMP_A', 'JUNC_1'),
          pipe('PB-J2', 'PUMP_B', 'JUNC_2'),
          pipe('J1-J3', 'JUNC_1', 'JUNC_3'),
          pipe('J2-J3', 'JUNC_2', 'JUNC_3'),
          pipe('J1-C1', 'JUNC_1', 'CROP_1'),
          pipe('J3-C2', 'JUNC_3', 'CROP_2'),
          pipe('J3-C3', 'JUNC_3', 'CROP_3'),
          pipe('J2-C4', 'JUNC_2', 'CROP_4'),
        ],
      },

      // 3 ─ Large Farm: 3 pumps, 8 crop fields
      'large-farm': {
        nodes: [
          pump('PA', 'Main Reservoir',   100, 200, 35, 1200, 90),
          pump('PB', 'East Well',        100, 500, 25, 900,  75),
          pump('PC', 'South Booster',    100, 750, 15, 700,  68),
          junc('J1', 'Zone A Splitter',  310, 130, 28),
          junc('J2', 'Zone B Splitter',  310, 420, 20),
          junc('J3', 'Zone C Splitter',  310, 720, 12),
          junc('J4', 'Central Hub',      520, 380, 16),
          crop('C1', 'Rice Paddy A1',    690, 80,  22, 220, 10, 90, true, 150),
          crop('C2', 'Rice Paddy A2',    690, 230, 20, 200, 15, 88, true, 130),
          crop('C3', 'Corn Block B1',    690, 380, 16, 180, 20, 85, true, 120),
          crop('C4', 'Corn Block B2',    690, 520, 12, 190, 25, 90, true, 110),
          crop('C5', 'Soya Zone C1',     830, 160, 18, 160, 12, 87, true, 100),
          crop('C6', 'Soya Zone C2',     830, 380, 14, 170, 30, 92, true, 140),
          crop('C7', 'Wheat Field D',    830, 570, 10, 150, 18, 80, true, 90),
          crop('C8', 'Barley Strip E',   520, 750,  8, 130, 22, 83, true, 100),
        ],
        edges: [
          pipe('PA-J1','PA','J1'), pipe('PB-J2','PB','J2'), pipe('PC-J3','PC','J3'),
          pipe('J1-J4','J1','J4'), pipe('J2-J4','J2','J4'), pipe('J3-J4','J4','J3'),
          pipe('J1-C1','J1','C1'), pipe('J1-C2','J1','C2'),
          pipe('J4-C3','J4','C3'), pipe('J4-C4','J4','C4'),
          pipe('J1-C5','J1','C5'), pipe('J4-C6','J4','C6'),
          pipe('J2-C7','J2','C7'), pipe('J3-C8','J3','C8'),
        ],
      },

      // 4 ─ High Congestion: one small pump, many thirsty crops
      'congestion': {
        nodes: [
          pump('P1', 'Overtaxed Well', 120, 370, 20, 350, 60),
          junc('J1', 'Distributor A',  310, 200, 14),
          junc('J2', 'Distributor B',  310, 540, 12),
          crop('C1', 'Drought Plot 1', 560, 100, 10, 220, 5,  90, true, 120),
          crop('C2', 'Drought Plot 2', 560, 270, 8,  200, 8,  88, true, 110),
          crop('C3', 'Drought Plot 3', 560, 430, 6,  210, 12, 85, true, 100),
          crop('C4', 'Drought Plot 4', 560, 590, 4,  180, 3,  92, true, 130),
          crop('C5', 'Drought Plot 5', 560, 720, 3,  190, 6,  90, true, 95),
        ],
        edges: [
          pipe('P1-J1','P1','J1'), pipe('P1-J2','P1','J2'),
          pipe('J1-C1','J1','C1'), pipe('J1-C2','J1','C2'),
          pipe('J1-C3','J1','C3'), pipe('J2-C4','J2','C4'),
          pipe('J2-C5','J2','C5'),
        ],
      },

      // 5 ─ Cascade: linear chain (waterfall topology)
      'cascade': {
        nodes: [
          pump('P1', 'Uphill Source',    100, 350, 45, 600, 80),
          junc('J1', 'Stage 1 Relay',    280, 280, 36),
          junc('J2', 'Stage 2 Relay',    460, 210, 28),
          junc('J3', 'Stage 3 Relay',    640, 280, 20),
          junc('J4', 'Stage 4 Relay',    640, 420, 14),
          junc('J5', 'Stage 5 Relay',    460, 490, 10),
          crop('C1', 'Highland Wheat',   280, 140, 38, 160, 20, 88, true, 110),
          crop('C2', 'Midland Maize',    460, 350, 28, 180, 15, 90, true, 120),
          crop('C3', 'Lowland Rice',     640, 490, 16, 200, 10, 85, true, 130),
          crop('C4', 'Valley Barley',    820, 350, 10, 150, 25, 80, true, 100),
        ],
        edges: [
          pipe('P1-J1','P1','J1'), pipe('J1-J2','J1','J2'),
          pipe('J2-J3','J2','J3'), pipe('J3-J4','J3','J4'),
          pipe('J4-J5','J4','J5'), pipe('J5-J2','J5','J2'),
          pipe('J1-C1','J1','C1'), pipe('J2-C2','J2','C2'),
          pipe('J4-C3','J4','C3'), pipe('J3-C4','J3','C4'),
        ],
      },

      // 6 ─ Ring (redundant paths): loop topology for failover
      'ring': {
        nodes: [
          pump('P1', 'Ring Source A',   120, 300, 30, 700, 78),
          pump('P2', 'Ring Source B',   880, 300, 28, 700, 75),
          junc('J1', 'North Node',      500, 100, 22),
          junc('J2', 'East Node',       800, 300, 18),
          junc('J3', 'South Node',      500, 500, 16),
          junc('J4', 'West Node',       200, 300, 20),
          crop('C1', 'NE Vineyard',     700, 130, 20, 170, 12, 88, true, 120),
          crop('C2', 'SE Orchard',      700, 470, 16, 160, 18, 85, true, 110),
          crop('C3', 'SW Nursery',      300, 470, 14, 150, 22, 90, true, 125),
          crop('C4', 'NW Greenhouse',   300, 130, 18, 140, 30, 82, true, 105),
        ],
        edges: [
          pipe('P1-J4','P1','J4'), pipe('P2-J2','P2','J2'),
          pipe('J4-J1','J4','J1'), pipe('J1-J2','J1','J2'),
          pipe('J2-J3','J2','J3'), pipe('J3-J4','J3','J4'),
          pipe('J1-C1','J1','C1'), pipe('J3-C2','J3','C2'),
          pipe('J3-C3','J3','C3'), pipe('J4-C4','J4','C4'),
        ],
      },
    };

    const layout = LAYOUTS[layoutId] || LAYOUTS['dual-source'];
    const nodes  = layout.nodes;
    const edges  = layout.edges;

    set({
      nodes: deepClone(nodes),
      edges: deepClone(edges),
      history:      [{ nodes: deepClone(nodes), edges: deepClone(edges) }],
      historyIndex: 0,
      isDirty:      true,
      projectName:  layoutId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + ' Demo',
    });
  },

  // Legacy alias for backward compat
  generateDemoNetwork: () => get().loadDemoLayout('dual-source'),

  loadSnapshot: (nodes, edges) => {
    const n = deepClone(nodes);
    const e = deepClone(edges);
    set({
      nodes: n,
      edges: e,
      history:      [{ nodes: deepClone(n), edges: deepClone(e) }],
      historyIndex: 0,
      isDirty:      false,
      lastSaved:    new Date(),
    });
  },
}));

export default useNetworkStore;
