// src/views/AlgorithmView.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';
import useNetworkStore from '../stores/networkStore.js';
import { buildAdjacencyList, dijkstraSingleSource } from '../algorithms/dijkstra.js';

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4];

export default function AlgorithmView() {
  const { nodes, edges } = useNetworkStore();
  const [steps, setSteps]       = useState([]);
  const [stepIdx, setStepIdx]   = useState(-1);
  const [playing, setPlaying]   = useState(false);
  const [speed, setSpeed]       = useState(1);
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const timerRef = useRef(null);

  const pumps = nodes.filter(n => n.type === 'pump');
  const crops  = nodes.filter(n => n.type === 'crop');

  // Auto-select defaults
  useEffect(() => {
    if (!sourceId && pumps.length) setSourceId(pumps[0].id);
    if (!targetId && crops.length)  setTargetId(crops[0].id);
  }, [pumps.length, crops.length]);

  const generateSteps = useCallback(() => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    const adj = buildAdjacencyList(nodes, edges, 1);
    const result = dijkstraSingleSource(adj, nodes.map(n => n.id), sourceId, targetId);
    setSteps(result.steps);
    setStepIdx(-1);
    setPlaying(false);
  }, [nodes, edges, sourceId, targetId]);

  useEffect(() => { generateSteps(); }, [generateSteps]);

  useEffect(() => {
    if (!playing) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setStepIdx(prev => {
        if (prev >= steps.length - 1) { setPlaying(false); return prev; }
        return prev + 1;
      });
    }, 900 / speed);
    return () => clearInterval(timerRef.current);
  }, [playing, speed, steps.length]);

  // State derived from steps up to stepIdx
  const visitedNodes  = new Set();
  const settledNodes  = new Set();
  const relaxedEdges  = new Set();
  const optimalPath   = new Set();
  const distTable     = {};
  nodes.forEach(n => { distTable[n.id] = Infinity; });
  if (sourceId) distTable[sourceId] = 0;

  let currentNode = null;

  for (let i = 0; i <= stepIdx && i < steps.length; i++) {
    const s = steps[i];
    if (s.type === 'visit')   { visitedNodes.add(s.nodeId);  currentNode = s.nodeId; distTable[s.nodeId] = s.dist; }
    if (s.type === 'relax')   { relaxedEdges.add(s.edgeId);  distTable[s.nodeId] = s.newDist; }
    if (s.type === 'settle')  { settledNodes.add(s.nodeId); }
  }

  const nodeMap = {};
  nodes.forEach(n => (nodeMap[n.id] = n));

  const getNodeColor = (id) => {
    if (id === currentNode)       return '#22d3ee';
    if (settledNodes.has(id))     return '#6ee7b7';
    if (visitedNodes.has(id))     return '#fbbf24';
    return '#27272a';
  };

  const getEdgeColor = (eid) => relaxedEdges.has(eid) ? '#6366f1' : 'rgba(255,255,255,0.08)';

  const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
  const minX = Math.min(...xs, 0), maxX = Math.max(...xs, 0);
  const minY = Math.min(...ys, 0), maxY = Math.max(...ys, 0);
  const SVG_W = 600, SVG_H = 260;
  const scX = (x) => ((x - minX) / ((maxX - minX) || 1)) * (SVG_W - 80) + 40;
  const scY = (y) => ((y - minY) / ((maxY - minY) || 1)) * (SVG_H - 60) + 30;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-black uppercase text-gradient-cyan mb-1">Dijkstra's Algorithm Visualizer</h2>
        <p className="text-zinc-500 text-sm max-w-3xl">
          Dijkstra's algorithm computes hydraulically optimal pathways from pressure supply reservoirs to crop sectors.
          Graph edges are weighted by pipe length × friction coefficient × elevation head — modeling real-world pressure resistance.
        </p>
      </div>

      {/* Formula */}
      <div className="glass-card rounded-2xl p-5 border border-white/5">
        <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-wider mb-3">Hydraulic Weight Formula</h4>
        <pre className="text-[11px] text-zinc-300 leading-relaxed" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
{`weight(u→v) = (euclidean_length × friction × 0.05)
            + elevation_cost

elevation_cost = {
  Δz > 0 (uphill):   Δz × 3.0   // high resistance
  Δz < 0 (downhill): |Δz| × 0.2  // low resistance
}`}
        </pre>
      </div>

      {/* Pseudocode */}
      <div className="glass-card rounded-2xl p-5 border border-white/5">
        <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-wider mb-3">Algorithm Pseudocode</h4>
        <pre className="text-[10px] text-zinc-400 leading-relaxed" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
{`DIJKSTRA(Graph, source, target):
  dist[source] = 0; dist[v] = ∞ for all others
  MinHeap H = {(0, source)}

  while H not empty:
    (d, u) = H.extractMin()
    if d > dist[u]: continue      // stale
    if u == target: break          // early stop

    for each (v, w) in adj[u]:
      alt = dist[u] + w
      if alt < dist[v]:
        dist[v] = alt
        parent[v] = u
        H.insert((alt, v))

  return reconstructPath(parent, target)`}
        </pre>
      </div>

      {/* Interactive visualizer */}
      <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Interactive Step Visualizer</h4>

        {/* Source/Target selectors */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Source:</span>
            <select value={sourceId} onChange={e => { setSourceId(e.target.value); setStepIdx(-1); setPlaying(false); }}
              className="bg-black border border-white/8 rounded-lg px-2 py-1 text-[10px] text-emerald-400 font-mono focus:outline-none focus:border-emerald-500/40">
              {pumps.map(p => <option key={p.id} value={p.id}>{p.id}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Target:</span>
            <select value={targetId} onChange={e => { setTargetId(e.target.value); setStepIdx(-1); setPlaying(false); }}
              className="bg-black border border-white/8 rounded-lg px-2 py-1 text-[10px] text-cyan-400 font-mono focus:outline-none focus:border-cyan-500/40">
              {crops.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
            </select>
          </div>
        </div>

        {/* SVG network */}
        <div className="bg-black/50 rounded-xl overflow-hidden border border-white/5">
          <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ maxHeight: 280 }}>
            {edges.map(e => {
              const f = nodeMap[e.from], t = nodeMap[e.to];
              if (!f || !t) return null;
              return (
                <line key={e.id}
                  x1={scX(f.x)} y1={scY(f.y)} x2={scX(t.x)} y2={scY(t.y)}
                  stroke={getEdgeColor(e.id)} strokeWidth={relaxedEdges.has(e.id) ? 2.5 : 1}
                />
              );
            })}
            {nodes.map(n => {
              const color = getNodeColor(n.id);
              const isCurr = n.id === currentNode;
              return (
                <g key={n.id} transform={`translate(${scX(n.x)}, ${scY(n.y)})`}>
                  {isCurr && <circle r="18" fill="rgba(34,211,238,0.1)" className="animate-pulse" />}
                  <circle r={n.type === 'pump' ? 12 : n.type === 'junction' ? 9 : 10}
                    fill={color} stroke="#18181b" strokeWidth="1.5" />
                  <text textAnchor="middle" y="22" style={{ fill: '#71717a', fontSize: 8, fontFamily: '"DM Mono", monospace' }}>
                    {n.id.length > 10 ? n.id.slice(0, 9) + '…' : n.id}
                  </text>
                  {distTable[n.id] !== Infinity && (
                    <text textAnchor="middle" y="-16" style={{ fill: '#22d3ee', fontSize: 8, fontFamily: '"DM Mono", monospace', fontWeight: 700 }}>
                      {distTable[n.id].toFixed(1)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Playback controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => { setStepIdx(-1); setPlaying(false); }} className="p-2 rounded-lg border border-white/8 text-zinc-500 hover:text-white hover:border-white/15 transition-all">
            <RotateCcw size={14} />
          </button>
          <button onClick={() => setStepIdx(i => Math.max(-1, i - 1))} disabled={stepIdx < 0}
            className="p-2 rounded-lg border border-white/8 text-zinc-500 hover:text-white hover:border-white/15 transition-all disabled:opacity-30">
            <SkipBack size={14} />
          </button>
          <button onClick={() => setPlaying(p => !p)}
            className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${playing ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-emerald-500 text-black'}`}>
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button onClick={() => setStepIdx(i => Math.min(steps.length - 1, i + 1))} disabled={stepIdx >= steps.length - 1}
            className="p-2 rounded-lg border border-white/8 text-zinc-500 hover:text-white hover:border-white/15 transition-all disabled:opacity-30">
            <SkipForward size={14} />
          </button>

          <div className="flex items-center gap-2 ml-2">
            <span className="text-[9px] font-mono text-zinc-500">Speed:</span>
            {SPEED_OPTIONS.map(s => (
              <button key={s} onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded text-[9px] font-mono font-bold transition-all ${speed === s ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'text-zinc-600 hover:text-zinc-400'}`}>
                {s}×
              </button>
            ))}
          </div>

          <span className="text-[9px] font-mono text-zinc-600 ml-auto">
            Step {stepIdx + 1} / {steps.length}
          </span>
        </div>

        {/* Distance table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] font-mono border border-white/5 rounded-xl overflow-hidden">
            <thead className="bg-white/3">
              <tr>
                <th className="px-3 py-2 text-left text-[9px] text-zinc-500 uppercase tracking-wider">Node</th>
                <th className="px-3 py-2 text-left text-[9px] text-zinc-500 uppercase tracking-wider">Type</th>
                <th className="px-3 py-2 text-left text-[9px] text-zinc-500 uppercase tracking-wider">Distance</th>
                <th className="px-3 py-2 text-left text-[9px] text-zinc-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {nodes.map(n => (
                <tr key={n.id} className={`transition-colors ${n.id === currentNode ? 'bg-cyan-500/5' : ''}`}>
                  <td className="px-3 py-1.5 font-bold text-white">{n.id}</td>
                  <td className="px-3 py-1.5 text-zinc-500">{n.type}</td>
                  <td className={`px-3 py-1.5 font-bold ${distTable[n.id] === Infinity ? 'text-zinc-700' : 'text-cyan-400'}`}>
                    {distTable[n.id] === Infinity ? '∞' : distTable[n.id].toFixed(2)}
                  </td>
                  <td className="px-3 py-1.5">
                    <span className={`text-[8px] uppercase font-black px-1.5 py-0.5 rounded-md ${
                      n.id === currentNode ? 'bg-cyan-500/15 text-cyan-400' :
                      settledNodes.has(n.id) ? 'bg-emerald-500/10 text-emerald-400' :
                      visitedNodes.has(n.id) ? 'bg-amber-500/10 text-amber-400' :
                      'text-zinc-700'
                    }`}>
                      {n.id === currentNode ? 'Current' : settledNodes.has(n.id) ? 'Settled' : visitedNodes.has(n.id) ? 'Visited' : 'Unvisited'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-[9px] font-mono text-zinc-500">
          {[['#22d3ee','Current'], ['#fbbf24','Visited'], ['#6ee7b7','Settled'], ['#6366f1','Edge Relaxed']].map(([c, l]) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
              {l}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
