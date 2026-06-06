// src/components/panels/InspectorPanel.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Scissors, ChevronUp, ChevronDown } from 'lucide-react';
import useUIStore      from '../../stores/uiStore.js';
import useNetworkStore from '../../stores/networkStore.js';

const RowItem = ({ label, value, valueClass = 'text-zinc-200' }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">{label}</span>
    <span className={`text-[10px] font-mono font-bold ${valueClass}`}>{value}</span>
  </div>
);

export default function InspectorPanel({ hydraulics, scaleMultiplier }) {
  const { selectedNodeId, selectedEdgeId, clearSelection } = useUIStore();
  const { nodes, edges, removeNode, removeEdge, updateNode, updateNodeWithHistory } = useNetworkStore();

  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState('');

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;
  const selectedEdge = edges.find(e => e.id === selectedEdgeId) || null;

  const cropsList = nodes.filter(n => n.type === 'crop');
  const cropIndex = selectedNode ? cropsList.findIndex(n => n.id === selectedNode.id) + 1 : 0;
  const connectedEdges = selectedNode ? edges.filter(e => e.from === selectedNode.id || e.to === selectedNode.id) : [];

  const handleDeleteNode = () => {
    removeNode(selectedNodeId);
    clearSelection();
  };
  const handleDeleteEdge = () => {
    removeEdge(selectedEdgeId);
    clearSelection();
  };

  const startEditName = (node) => {
    setNameVal(node.name);
    setEditingName(true);
  };

  const commitName = (id) => {
    if (nameVal.trim()) updateNodeWithHistory(id, { name: nameVal.trim() });
    setEditingName(false);
  };

  return (
    <div className="glass-card rounded-2xl p-4 min-h-[200px]">
      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-3">Inspector</p>

      <AnimatePresence mode="wait">
        {selectedNode ? (
          <motion.div key={`node-${selectedNode.id}`}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }} className="space-y-3"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className={`text-[9px] uppercase tracking-widest font-black mb-0.5 ${
                  selectedNode.type === 'pump' ? 'text-emerald-400' :
                  selectedNode.type === 'crop' ? 'text-blue-400' : 'text-purple-400'
                }`}>{selectedNode.type === 'crop' ? `Crop Field #${cropIndex}` : selectedNode.type}</div>
                {editingName ? (
                  <input
                    autoFocus
                    value={nameVal}
                    onChange={e => setNameVal(e.target.value)}
                    onBlur={() => commitName(selectedNode.id)}
                    onKeyDown={e => { if (e.key === 'Enter') commitName(selectedNode.id); if (e.key === 'Escape') setEditingName(false); }}
                    className="w-full bg-zinc-900 border border-cyan-500/30 rounded px-2 py-0.5 text-[11px] font-black text-white focus:outline-none"
                  />
                ) : (
                  <h4
                    className="text-[12px] font-black text-white break-all leading-tight cursor-pointer hover:text-cyan-300 transition-colors"
                    onDoubleClick={() => startEditName(selectedNode)}
                    title="Double-click to edit name"
                  >
                    {selectedNode.name}
                  </h4>
                )}
                <p className="text-[8px] font-mono text-zinc-600 mt-0.5">{selectedNode.id}</p>
              </div>
              <button onClick={handleDeleteNode} className="ml-2 p-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-black rounded-lg border border-rose-500/20 transition-all shrink-0">
                <Trash2 size={12} />
              </button>
            </div>

            <div className="border-t border-white/5 pt-3 space-y-1">
              <RowItem label="Position" value={`${selectedNode.x}px, ${selectedNode.y}px`} />
              <div className="flex justify-between items-center py-1">
                <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Altitude</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateNodeWithHistory(selectedNode.id, { z: Math.max(0, selectedNode.z - 1) })}
                    className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[8px] font-bold hover:text-white transition-colors">
                    <ChevronDown size={10} />
                  </button>
                  <span className="text-[10px] font-mono font-bold text-amber-400 w-14 text-center">{selectedNode.z}m</span>
                  <button onClick={() => updateNodeWithHistory(selectedNode.id, { z: selectedNode.z + 1 })}
                    className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[8px] font-bold hover:text-white transition-colors">
                    <ChevronUp size={10} />
                  </button>
                </div>
              </div>

              {selectedNode.type === 'pump' && (
                <>
                  <RowItem label="Max Flow" value={`${selectedNode.maxFlow} GPM`} valueClass="text-emerald-400" />
                  <RowItem label="Pressure" value={`${selectedNode.pressurePSI} PSI`} valueClass="text-cyan-400" />
                </>
              )}

              {selectedNode.type === 'junction' && (
                <div className="py-2.5 border-t border-white/5 mt-2 space-y-2">
                  <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider block">Connected Pipes (Sever helper)</span>
                  {connectedEdges.length === 0 ? (
                    <span className="text-[9px] text-zinc-600 italic block">No connected pipelines.</span>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {connectedEdges.map(edge => {
                        const peer = edge.from === selectedNode.id ? edge.to : edge.from;
                        return (
                          <div key={edge.id} className="flex justify-between items-center bg-zinc-950/40 border border-white/5 rounded px-2 py-1">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-zinc-300 font-mono">{edge.id}</span>
                              <span className="text-[7.5px] text-zinc-500 font-mono">To: {peer}</span>
                            </div>
                            <button
                              onClick={() => {
                                removeEdge(edge.id);
                                clearSelection();
                              }}
                              title="Disconnect Pipeline"
                              className="p-1 bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-400 rounded transition-colors shrink-0 border border-rose-500/15"
                            >
                              <Scissors size={10} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {selectedNode.type === 'crop' && (() => {
                const maxCap = selectedNode.maxCapacity ?? 100;
                const targetCap = selectedNode.targetCapacity ?? 100;
                const hydra = selectedNode.hydration ?? 0;
                const hi = (hydra / maxCap).toFixed(2);
                
                return (
                  <>
                    <RowItem label="Demand"    value={`${selectedNode.flowDemand} GPM`}    valueClass="text-amber-400" />
                    <RowItem label="Received"  value={`${selectedNode.currentReceived || 0} GPM`} valueClass="text-blue-400" />
                    <RowItem label="Hydration Index" value={`HI: ${hi}`} valueClass="text-purple-400" />
                    <RowItem label="Hydration Vol" value={`${hydra.toFixed(1)} / ${maxCap}`} valueClass="text-cyan-400" />
                    
                    <RowItem 
                      label="Irrigation Status" 
                      value={
                        selectedNode.isSupplyEnabled === false ? 'OFF (MANUAL)' :
                        selectedNode.isWateringActive === false ? 'SUSPENDED (SATIATED)' : 'ACTIVE'
                      }
                      valueClass={
                        selectedNode.isSupplyEnabled === false ? 'text-zinc-500' :
                        selectedNode.isWateringActive === false ? 'text-purple-400' : 'text-emerald-400'
                      }
                    />

                    <div className="py-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Hydration Level</span>
                        <span className={`text-[10px] font-mono font-bold ${
                          hydra > (targetCap * 0.7) ? 'text-emerald-400' :
                          hydra > (targetCap * 0.35) ? 'text-amber-400' : 'text-rose-500'}`}>
                          {Math.round((hydra / maxCap) * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full transition-colors duration-500"
                          style={{
                            width: `${Math.min(100, (hydra / maxCap) * 100)}%`,
                            background: hydra > (targetCap * 0.7) ? '#10b981' : hydra > (targetCap * 0.35) ? '#f59e0b' : '#f43f5e'
                          }}
                          animate={{ width: `${Math.min(100, (hydra / maxCap) * 100)}%` }}
                          transition={{ type: 'spring', damping: 20 }}
                        />
                      </div>
                    </div>

                    {/* Total Capacity Adjustment */}
                    <div className="py-2.5 border-t border-white/5 mt-2 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Total Capacity</span>
                        <span className="text-[10px] font-mono font-bold text-emerald-400">{maxCap}</span>
                      </div>
                      <input
                        type="range"
                        min="60"
                        max="200"
                        step="10"
                        value={maxCap}
                        onChange={e => {
                          const newMax = parseInt(e.target.value);
                          const updates = { maxCapacity: newMax };
                          if (targetCap > newMax) {
                            updates.targetCapacity = newMax;
                          }
                          updateNodeWithHistory(selectedNode.id, updates);
                        }}
                        className="w-full h-1.5 rounded-lg accent-emerald-500 cursor-pointer bg-zinc-800"
                      />
                    </div>

                    {/* Target Capacity Adjustment */}
                    <div className="py-2.5 border-t border-white/5 mt-1 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Target Capacity</span>
                        <span className="text-[10px] font-mono font-bold text-cyan-400">{targetCap}%</span>
                      </div>
                      <input
                        type="range"
                        min="30"
                        max={maxCap}
                        step="5"
                        value={Math.min(targetCap, maxCap)}
                        onChange={e => updateNodeWithHistory(selectedNode.id, { targetCapacity: parseInt(e.target.value) })}
                        className="w-full h-1.5 rounded-lg accent-cyan-500 cursor-pointer bg-zinc-800"
                      />
                    </div>

                    {/* ── Master Supply Switch ── */}
                    <div className="flex justify-between items-center py-2 border-t border-white/5 mt-1">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Water Supply</span>
                        <span className="text-[7.5px] text-zinc-600 font-mono mt-0.5">
                          {selectedNode.isSupplyEnabled !== false ? 'Fills to target, then cooldown' : 'Completely disabled'}
                        </span>
                      </div>
                      {/* Toggle switch */}
                      <button
                        onClick={() => {
                          const turningOn = selectedNode.isSupplyEnabled === false;
                          updateNodeWithHistory(selectedNode.id, {
                            isSupplyEnabled: turningOn,
                            ...(turningOn ? { isWateringActive: true } : { isWateringActive: false }),
                          });
                        }}
                        className={`relative w-10 h-5 rounded-full transition-colors duration-200 border ${
                          selectedNode.isSupplyEnabled !== false
                            ? 'bg-emerald-500/20 border-emerald-500/40'
                            : 'bg-zinc-800 border-zinc-700'
                        }`}
                        title={selectedNode.isSupplyEnabled !== false ? 'Turn OFF supply' : 'Turn ON supply'}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 ${
                          selectedNode.isSupplyEnabled !== false
                            ? 'left-5 bg-emerald-400'
                            : 'left-0.5 bg-zinc-500'
                        }`} />
                      </button>
                    </div>

                    {/* ── Cooldown status card (supply ON but watering suspended) ── */}
                    {selectedNode.isSupplyEnabled !== false && selectedNode.isWateringActive === false && (
                      <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 px-3 py-2.5 space-y-2 mt-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black uppercase tracking-wider text-purple-400">⏸ Cooldown</span>
                          <span className="text-[8px] font-mono text-purple-300/70">
                            Reached target ({targetCap}%)
                          </span>
                        </div>
                        <div className="text-[8px] text-zinc-400 font-mono leading-relaxed">
                          Auto-resumes when hydration drops below{' '}
                          <span className="text-amber-400 font-bold">{Math.round(targetCap * 0.35)}%</span>
                          {' '}· currently{' '}
                          <span className={`font-bold ${hydra > targetCap * 0.35 ? 'text-zinc-300' : 'text-emerald-400'}`}>
                            {hydra.toFixed(0)}%
                          </span>
                        </div>
                        <button
                          onClick={() => updateNodeWithHistory(selectedNode.id, { isWateringActive: true })}
                          className="w-full py-1.5 bg-purple-500/10 hover:bg-purple-500 border border-purple-500/30 hover:border-purple-400 text-purple-300 hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all"
                        >
                          ▶ Start Watering Now
                        </button>
                      </div>
                    )}

                    {/* ── Active watering indicator ── */}
                    {selectedNode.isSupplyEnabled !== false && selectedNode.isWateringActive !== false && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-500/15 bg-emerald-500/5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span className="text-[8px] font-mono text-emerald-400">
                          Watering — fills to <span className="font-bold">{targetCap}%</span>, then cooldown
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </motion.div>

        ) : selectedEdge ? (
          <motion.div key={`edge-${selectedEdge.id}`}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }} className="space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[9px] uppercase tracking-widest font-black text-indigo-400 mb-0.5">Pipeline</div>
                <h4 className="text-[12px] font-black text-indigo-300">{selectedEdge.id}</h4>
              </div>
              <button onClick={handleDeleteEdge}
                className="flex items-center gap-1 px-2 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-black rounded-lg border border-rose-500/20 transition-all text-[9px] font-black uppercase tracking-wider">
                <Scissors size={10} /> Sever
              </button>
            </div>

            <div className="border-t border-white/5 pt-3 space-y-1">
              <RowItem label="From"  value={selectedEdge.from} />
              <RowItem label="To"    value={selectedEdge.to}   />
              <RowItem label="Type"  value="Standard Drip Line" valueClass="text-cyan-400" />
              {(() => {
                const f = nodes.find(n => n.id === selectedEdge.from);
                const t = nodes.find(n => n.id === selectedEdge.to);
                const len = f && t ? Math.round(Math.hypot(t.x - f.x, t.y - f.y) * scaleMultiplier) : 0;
                const flow = hydraulics.edgeCalculatedFlows[selectedEdge.id] || 0;
                const loss = hydraulics.edgeCalculatedLosses[selectedEdge.id] || 0;
                const cap  = 300;
                const ratio = Math.min(1.0, flow / cap);
                return (
                  <>
                    <RowItem label="Length" value={`${len}m`} valueClass="text-amber-400" />
                    <RowItem label="Flow"   value={`${flow} GPM`} valueClass="text-emerald-400" />
                    <RowItem label="Loss"   value={`-${loss} PSI`} valueClass="text-rose-400" />
                    <div className="py-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Capacity</span>
                        <span className={`text-[10px] font-mono font-bold ${ratio >= 1.0 ? 'text-rose-400' : ratio > 0.6 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {Math.round(ratio * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${ratio * 100}%`, background: ratio >= 1.0 ? '#f43f5e' : ratio > 0.6 ? '#f59e0b' : '#10b981' }} />
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </motion.div>

        ) : (
          <motion.div key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-[10px] text-zinc-600 italic py-6 text-center leading-relaxed"
          >
            Select any node or pipeline<br />to inspect its properties.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
