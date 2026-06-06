// src/views/AlgorithmView.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

  const pumps = useMemo(() => nodes.filter(n => n.type === 'pump'), [nodes]);
  const crops = useMemo(() => nodes.filter(n => n.type === 'crop'), [nodes]);

  // Auto-select and validate sourceId when nodes change
  useEffect(() => {
    if (pumps.length > 0) {
      const exists = pumps.some(p => p.id === sourceId);
      if (!exists) {
        setSourceId(pumps[0].id);
        setStepIdx(-1);
        setPlaying(false);
      }
    } else {
      setSourceId('');
    }
  }, [pumps, sourceId]);

  // Auto-select and validate targetId when nodes change
  useEffect(() => {
    if (crops.length > 0) {
      const exists = crops.some(c => c.id === targetId);
      if (!exists) {
        setTargetId(crops[0].id);
        setStepIdx(-1);
        setPlaying(false);
      }
    } else {
      setTargetId('');
    }
  }, [crops, targetId]);

  const generateSteps = useCallback(() => {
    if (!sourceId || !targetId || sourceId === targetId) {
      setSteps([]);
      setStepIdx(-1);
      setPlaying(false);
      return;
    }
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

  // Handle empty state if no pumps or crops exist
  if (pumps.length === 0 || crops.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25 }}
        className="glass-card rounded-2xl p-8 border border-white/5 text-center max-w-xl mx-auto my-12 space-y-4"
      >
        <div className="text-amber-400 text-3xl">⚠</div>
        <h3 className="text-lg font-black uppercase text-white tracking-wider">Missing Required Nodes</h3>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Dijkstra's algorithm visualizer requires at least one <strong className="text-emerald-400">Pump Station (Source)</strong> and one <strong className="text-cyan-400">Crop Field (Target)</strong> in your network blueprint.
        </p>
        <p className="text-zinc-500 text-[11px] font-mono">
          Return to the Canvas tab to add these nodes and connect them using pipelines.
        </p>
      </motion.div>
    );
  }

  // State derived from steps up to stepIdx
  const visitedNodes  = new Set();
  const settledNodes  = new Set();
  const relaxedEdges  = new Set();
  const optimalPath   = new Set();
  const optimalNodes  = new Set();
  const distTable     = {};
  const parentMap     = {};

  nodes.forEach(n => { distTable[n.id] = Infinity; });
  if (sourceId) distTable[sourceId] = 0;

  let currentNode = null;

  for (let i = 0; i <= stepIdx && i < steps.length; i++) {
    const s = steps[i];
    if (s.type === 'visit')   { visitedNodes.add(s.nodeId);  currentNode = s.nodeId; distTable[s.nodeId] = s.dist; }
    if (s.type === 'relax')   { 
      relaxedEdges.add(s.edgeId);  
      distTable[s.nodeId] = s.newDist; 
      visitedNodes.add(s.nodeId);
      parentMap[s.nodeId] = { parentId: s.fromNodeId, viaEdgeId: s.edgeId };
    }
    if (s.type === 'settle')  { settledNodes.add(s.nodeId); }
  }

  // Trace back optimal path if target was reached at this point
  const isFinished = stepIdx === steps.length - 1 && steps.length > 0;
  const pathExists = (visitedNodes.has(targetId) || settledNodes.has(targetId)) && targetId !== '';
  
  if (pathExists) {
    let cur = targetId;
    optimalNodes.add(cur);
    while (cur && parentMap[cur]) {
      const p = parentMap[cur];
      optimalPath.add(p.viaEdgeId);
      cur = p.parentId;
      optimalNodes.add(cur);
    }
  }

  const nodeMap = {};
  nodes.forEach(n => (nodeMap[n.id] = n));

  const getNodeStyles = (id) => {
    let stroke = '#3f3f46';
    let fill = 'rgba(63, 63, 70, 0.2)';
    let glow = 'none';

    if (id === currentNode) {
      stroke = '#22d3ee';
      fill = 'rgba(34, 211, 238, 0.25)';
      glow = 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.5))';
    } else if (optimalNodes.has(id)) {
      stroke = '#34d399';
      fill = 'rgba(52, 211, 153, 0.25)';
      glow = 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.4))';
    } else if (settledNodes.has(id)) {
      stroke = '#10b981';
      fill = 'rgba(16, 185, 129, 0.1)';
    } else if (visitedNodes.has(id)) {
      stroke = '#fbbf24';
      fill = 'rgba(251, 191, 36, 0.1)';
    }

    return { stroke, fill, glow };
  };

  const getEdgeStyles = (eid) => {
    if (optimalPath.has(eid)) {
      return { stroke: '#34d399', width: 3.5, dash: 'none' };
    }
    if (relaxedEdges.has(eid)) {
      return { stroke: '#6366f1', width: 2, dash: '4 3' };
    }
    return { stroke: 'rgba(255, 255, 255, 0.06)', width: 1, dash: 'none' };
  };

  const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
  const minX = xs.length ? Math.min(...xs) : 0;
  const maxX = xs.length ? Math.max(...xs) : 600;
  const minY = ys.length ? Math.min(...ys) : 0;
  const maxY = ys.length ? Math.max(...ys) : 260;
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

      {/* Formula & Pseudocode Split Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formula */}
        <div className="glass-card rounded-2xl p-5 border border-white/5">
          <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-wider mb-3">Hydraulic Weight Formula</h4>
          <pre className="text-[11px] text-zinc-300 leading-relaxed" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
{`weight(u→v) = (euclidean_length × friction)
            + elevation_cost

elevation_cost = {
  Δz > 0 (uphill):   Δz × 4.0   // high resistance
  Δz < 0 (downhill): 0          // gravity assist
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
      </div>

      {/* Interactive visualizer */}
      <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Interactive Step Visualizer</h4>

        {/* Source/Target selectors */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Source (Pump):</span>
            <select value={sourceId} onChange={e => { setSourceId(e.target.value); setStepIdx(-1); setPlaying(false); }}
              className="bg-black border border-white/8 rounded-lg px-2 py-1 text-[10px] text-emerald-400 font-mono focus:outline-none focus:border-emerald-500/40">
              {pumps.map(p => <option key={p.id} value={p.id} className="bg-zinc-950 text-emerald-400">{p.id} - {p.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Target (Crop):</span>
            <select value={targetId} onChange={e => { setTargetId(e.target.value); setStepIdx(-1); setPlaying(false); }}
              className="bg-black border border-white/8 rounded-lg px-2 py-1 text-[10px] text-cyan-400 font-mono focus:outline-none focus:border-cyan-500/40">
              {crops.map((c, idx) => <option key={c.id} value={c.id} className="bg-zinc-950 text-cyan-400">{c.id} - Crop #{idx + 1}</option>)}
            </select>
          </div>
        </div>

        {/* SVG network */}
        <div className="bg-black/50 rounded-xl overflow-hidden border border-white/5">
          <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ maxHeight: 280 }}>
            {/* Draw edges/pipes */}
            {edges.map(e => {
              const f = nodeMap[e.from], t = nodeMap[e.to];
              if (!f || !t) return null;
              const { stroke, width, dash } = getEdgeStyles(e.id);
              return (
                <line key={e.id}
                  x1={scX(f.x)} y1={scY(f.y)} x2={scX(t.x)} y2={scY(t.y)}
                  stroke={stroke} strokeWidth={width} strokeDasharray={dash}
                  className="transition-all duration-300"
                />
              );
            })}
            
            {/* Draw nodes */}
            {nodes.map(n => {
              const { stroke, fill, glow } = getNodeStyles(n.id);
              const isCurr = n.id === currentNode;
              return (
                <g key={n.id} transform={`translate(${scX(n.x)}, ${scY(n.y)})`} style={{ filter: glow }}>
                  {isCurr && <circle r="16" fill="none" stroke="#22d3ee" strokeWidth="1.5" className="animate-ping" style={{ animationDuration: '2s' }} />}
                  
                  {n.type === 'pump' && (
                    <circle r="12" fill={fill} stroke={stroke} strokeWidth="1.5" className="transition-all duration-300" />
                  )}
                  {n.type === 'junction' && (
                    <polygon points="0,-10 10,0 0,10 -10,0" fill={fill} stroke={stroke} strokeWidth="1.5" className="transition-all duration-300" />
                  )}
                  {n.type === 'crop' && (
                    <rect x="-10" y="-10" width="20" height="20" rx="4" fill={fill} stroke={stroke} strokeWidth="1.5" className="transition-all duration-300" />
                  )}

                  <text textAnchor="middle" y="22" style={{ fill: '#71717a', fontSize: 8, fontFamily: '"DM Mono", monospace', fontWeight: 500 }}>
                    {n.id.length > 10 ? n.id.slice(0, 9) + '…' : n.id}
                  </text>
                  {distTable[n.id] !== undefined && distTable[n.id] !== Infinity && (
                    <text textAnchor="middle" y="-16" style={{ fill: stroke, fontSize: 8, fontFamily: '"DM Mono", monospace', fontWeight: 700 }}>
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
          <button onClick={() => { setStepIdx(-1); setPlaying(false); }} 
            disabled={steps.length === 0}
            className="p-2 rounded-lg border border-white/8 text-zinc-500 hover:text-white hover:border-white/15 transition-all disabled:opacity-30">
            <RotateCcw size={14} />
          </button>
          <button onClick={() => setStepIdx(i => Math.max(-1, i - 1))} disabled={stepIdx < 0 || steps.length === 0}
            className="p-2 rounded-lg border border-white/8 text-zinc-500 hover:text-white hover:border-white/15 transition-all disabled:opacity-30">
            <SkipBack size={14} />
          </button>
          <button onClick={() => setPlaying(p => !p)}
            disabled={steps.length === 0}
            className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-30 ${
              playing ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-emerald-500 text-black'
            }`}>
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button onClick={() => setStepIdx(i => Math.min(steps.length - 1, i + 1))} disabled={stepIdx >= steps.length - 1 || steps.length === 0}
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

        {/* Step description banner / Finished status banner */}
        <div className={`border rounded-xl p-4 min-h-[68px] flex items-center justify-between transition-all duration-300 ${
          isFinished 
            ? pathExists 
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
            : 'bg-white/[0.02] border-white/5 text-zinc-300'
        }`}>
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
              {isFinished ? 'Execution Completed' : 'Current Action'}
            </span>
            <p className="text-xs font-mono leading-relaxed">
              {isFinished ? (
                pathExists ? (
                  <span>
                    🎉 <strong>Shortest path found!</strong> Total hydraulic distance to <strong className="text-emerald-400">{targetId}</strong> is <strong>{typeof distTable[targetId] === 'number' ? distTable[targetId].toFixed(2) : '0.00'}m</strong>.
                  </span>
                ) : (
                  <span>
                    ❌ <strong>No path exists</strong> between <strong className="text-zinc-400">{sourceId}</strong> and <strong className="text-rose-400">{targetId}</strong>. The target field is isolated.
                  </span>
                )
              ) : stepIdx === -1 ? (
                <span className="text-zinc-500">Press Play or Step Forward to begin the visualization.</span>
              ) : (
                (() => {
                  const s = steps[stepIdx];
                  if (!s) return null;
                  if (s.type === 'visit') {
                    return (
                      <span>
                        Visiting node <strong className="text-cyan-400 font-bold">{s.nodeId}</strong> with accumulated distance <strong className="text-white font-bold">{s.dist.toFixed(1)}m</strong>.
                      </span>
                    );
                  }
                  if (s.type === 'relax') {
                    const oldDistVal = s.oldDist;
                    const newDistVal = s.newDist;
                    const oldDistStr = (oldDistVal === undefined || oldDistVal === Infinity) ? '∞' : oldDistVal.toFixed(1);
                    const newDistStr = (newDistVal === undefined || newDistVal === Infinity) ? '∞' : newDistVal.toFixed(1);
                    return (
                      <span>
                        Relaxing pipeline <strong className="text-indigo-400 font-bold">{s.edgeId}</strong>: updated distance to <strong className="text-cyan-400 font-bold">{s.nodeId}</strong> from <strong className="text-zinc-500 font-bold">{oldDistStr}</strong> to <strong className="text-emerald-400 font-bold">{newDistStr}m</strong>.
                      </span>
                    );
                  }
                  if (s.type === 'settle') {
                    return (
                      <span>
                        Settled node <strong className="text-emerald-400 font-bold">{s.nodeId}</strong>. Shortest path to this node is finalized.
                      </span>
                    );
                  }
                  return null;
                })()
              )}
            </p>
          </div>
          {isFinished && (
            <div className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
              pathExists ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
            }`}>
              {pathExists ? 'Optimal Path Solved' : 'No Connection'}
            </div>
          )}
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
              {nodes.map(n => {
                const isCrop = n.type === 'crop';
                const cropIndex = isCrop ? crops.findIndex(c => c.id === n.id) + 1 : 0;
                const displayName = isCrop ? `Crop #${cropIndex} (${n.id})` : n.id;
                const isOptimal = optimalNodes.has(n.id);
                return (
                  <tr key={n.id} className={`transition-colors ${
                    n.id === currentNode ? 'bg-cyan-500/10' : 
                    isOptimal ? 'bg-emerald-500/5' : ''
                  }`}>
                    <td className="px-3 py-1.5 font-bold text-white">{displayName}</td>
                    <td className="px-3 py-1.5 text-zinc-500 uppercase text-[9px]">{n.type}</td>
                    <td className={`px-3 py-1.5 font-bold ${(distTable[n.id] === undefined || distTable[n.id] === Infinity) ? 'text-zinc-700' : 'text-cyan-400'}`}>
                      {(distTable[n.id] === undefined || distTable[n.id] === Infinity) ? '∞' : distTable[n.id].toFixed(2)}
                    </td>
                    <td className="px-3 py-1.5">
                      <span className={`text-[8px] uppercase font-black px-1.5 py-0.5 rounded-md border ${
                        n.id === currentNode ? 'bg-cyan-500/15 border-cyan-500/25 text-cyan-400' :
                        isOptimal ? 'bg-emerald-500/25 border-emerald-500/30 text-emerald-300' :
                        settledNodes.has(n.id) ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-400' :
                        visitedNodes.has(n.id) ? 'bg-amber-500/10 border-amber-500/15 text-amber-400' :
                        'bg-zinc-800/10 border-zinc-700/20 text-zinc-500'
                      }`}>
                        {n.id === currentNode ? 'Current' : isOptimal ? 'Optimal' : settledNodes.has(n.id) ? 'Settled' : visitedNodes.has(n.id) ? 'Visited' : 'Unvisited'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-[9px] font-mono text-zinc-500 pt-2">
          {[
            ['#22d3ee', 'Current Node'], 
            ['#34d399', 'Optimal Path'], 
            ['#10b981', 'Settled Node'], 
            ['#fbbf24', 'Visited Node'], 
            ['#6366f1', 'Edge Relaxed']
          ].map(([c, l]) => (
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
