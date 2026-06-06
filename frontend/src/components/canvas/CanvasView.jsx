// src/components/canvas/CanvasView.jsx
import React, { useRef, useEffect, useCallback, useState } from 'react';
import useUIStore      from '../../stores/uiStore.js';
import useNetworkStore from '../../stores/networkStore.js';
import { SNAP_GRID } from '../../utils/constants.js';
import EdgeRenderer from './EdgeRenderer.jsx';
import NodeRenderer from './NodeRenderer.jsx';
import MiniMap      from './MiniMap.jsx';

export default function CanvasView({ hydraulics }) {
  const {
    activeTool, setActiveTool,
    selectedPipeType,
    pipeSourceId, setPipeSourceId,
    draggingNodeId, setDraggingNodeId,
    selectedNodeId, setSelectedNodeId,
    selectedEdgeId, setSelectedEdgeId,
    clearSelection,
    zoom, setZoom,
    panX, setPanX, panY, setPanY, setPan,
    snapToGrid,
    addLog,
  } = useUIStore();

  const { nodes, edges, addNode, updateNode, addEdge } = useNetworkStore();

  const canvasRef = useRef(null);
  const panStart  = useRef(null);
  const isPanning = useRef(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // ── Coordinate transform ─────────────────────────────────
  const parseCoords = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    let x = Math.round((e.clientX - rect.left - panX) / zoom);
    let y = Math.round((e.clientY - rect.top  - panY) / zoom);
    if (snapToGrid) {
      x = Math.round(x / SNAP_GRID) * SNAP_GRID;
      y = Math.round(y / SNAP_GRID) * SNAP_GRID;
    }
    return { x, y };
  }, [panX, panY, zoom, snapToGrid]);

  // ── Wheel zoom ───────────────────────────────────────────
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoom(zoom * factor);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoom, setZoom]);

  // ── Mouse events ─────────────────────────────────────────
  const onMouseDown = (e) => {
    const isBg = e.target.id === 'canvas-bg' || e.target.tagName === 'svg';
    if (e.button === 0 && (activeTool === 'select' || activeTool === 'pan') && isBg) {
      isPanning.current = true;
      panStart.current  = { x: e.clientX - panX, y: e.clientY - panY };
      e.preventDefault();
    } else if (e.button === 1) {
      isPanning.current = true;
      panStart.current  = { x: e.clientX - panX, y: e.clientY - panY };
      e.preventDefault();
    }
  };

  const onMouseMove = (e) => {
    const coords = parseCoords(e);
    setMousePos(coords);

    if (isPanning.current && panStart.current) {
      setPanX(e.clientX - panStart.current.x);
      setPanY(e.clientY - panStart.current.y);
      return;
    }

    if (draggingNodeId && activeTool === 'select') {
      updateNode(draggingNodeId, { x: coords.x, y: coords.y });
    }
  };

  const onMouseUp = () => {
    isPanning.current = false;
    panStart.current  = null;
    setDraggingNodeId(null);
  };

  const onCanvasClick = (e) => {
    if (isPanning.current) return;
    const tag = e.target.tagName;
    if (tag !== 'svg' && e.target.id !== 'canvas-bg') return;

    if (activeTool === 'select' || activeTool === 'pan') {
      clearSelection();
      return;
    }
    if (activeTool === 'pipe') return;

    const coords = parseCoords(e);
    let idPrefix = 'NODE_', verboseName = 'Network Node', type = activeTool;
    if (activeTool === 'pump')     { idPrefix = 'PUMP_';  verboseName = 'Pump Station'; }
    if (activeTool === 'junction') { idPrefix = 'JCT_';   verboseName = 'Junction';     }
    if (activeTool === 'crop')     { idPrefix = 'CROP_';  verboseName = 'Crop Field';   }

    const uid = `${idPrefix}${Math.floor(100 + Math.random() * 900)}`;
    const newNode = {
      id:   uid,
      name: `${verboseName} ${uid}`,
      type,
      x: coords.x, y: coords.y, z: 12,
      ...(type === 'pump'     ? { maxFlow: 600, pressurePSI: 75 }               : {}),
      ...(type === 'crop'     ? { flowDemand: 160, currentReceived: 0, hydration: 50, targetCapacity: 100, maxCapacity: 120, isSupplyEnabled: true, isWateringActive: true } : {}),
    };
    addNode(newNode);
    addLog(`Spawned ${type} node ${uid} at (${coords.x}, ${coords.y})`, 'success');
    setActiveTool('select');
  };

  const onNodeMouseDown = (nodeId, e) => {
    if (activeTool !== 'select') return;
    e.stopPropagation();
    setDraggingNodeId(nodeId);
    setSelectedNodeId(nodeId);
  };

  const onNodeClick = (node, e) => {
    e.stopPropagation();
    if (activeTool === 'select') {
      setSelectedNodeId(node.id);
      return;
    }
    if (activeTool === 'pipe') {
      if (!pipeSourceId) {
        setPipeSourceId(node.id);
        addLog(`Pipeline source: ${node.id}. Click destination.`, 'info');
      } else {
        if (pipeSourceId === node.id) { setPipeSourceId(null); return; }
        const dup = edges.some(edge =>
          (edge.from === pipeSourceId && edge.to === node.id) ||
          (edge.from === node.id && edge.to === pipeSourceId)
        );
        if (dup) {
          addLog('Connection already exists between these nodes.', 'warning');
          setPipeSourceId(null);
          return;
        }
        const uid = `PIPE_${Math.floor(100 + Math.random() * 900)}`;
        addEdge({ id: uid, from: pipeSourceId, to: node.id });
        addLog(`Connected ${pipeSourceId} → ${node.id} via new pipeline`, 'success');
        setPipeSourceId(null);
      }
    }
  };

  const sourceNode = pipeSourceId ? nodes.find(n => n.id === pipeSourceId) : null;
  const cursorStyle = activeTool === 'pan' ? 'cursor-grab' : activeTool === 'select' ? 'cursor-default' : 'cursor-crosshair';

  return (
    <div className="relative w-full h-full" style={{ minHeight: 560 }}>
      <div
        ref={canvasRef}
        className={`w-full h-full blueprint-grid rounded-[2rem] overflow-hidden relative ${cursorStyle}`}
        style={{ minHeight: 560 }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={onCanvasClick}
      >
        <svg
          id="main-svg"
          width="100%" height="100%"
          className="absolute inset-0"
          style={{ minHeight: 560 }}
        >
          <rect id="canvas-bg" width="9999" height="9999" x="-4000" y="-4000" fill="transparent" />
          <g style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})`, transformOrigin: '0 0' }}>
            <EdgeRenderer edges={edges} nodes={nodes} hydraulics={hydraulics} />

            {/* Ghost pipe line */}
            {activeTool === 'pipe' && sourceNode && (
              <g>
                <line
                  x1={sourceNode.x} y1={sourceNode.y}
                  x2={mousePos.x}   y2={mousePos.y}
                  stroke="#6366f1" strokeWidth="2"
                  strokeDasharray="6 4" opacity="0.75"
                />
                <circle cx={mousePos.x} cy={mousePos.y} r="5" fill="#6366f1" className="animate-ping" />
              </g>
            )}

            <NodeRenderer
              nodes={nodes}
              hydraulics={hydraulics}
              onNodeMouseDown={onNodeMouseDown}
              onNodeClick={onNodeClick}
            />
          </g>
        </svg>

        <MiniMap nodes={nodes} />

        {/* Zoom controls */}
        <div className="absolute top-3 right-3 flex items-center gap-1 glass-card rounded-xl p-1.5">
          <button
            onClick={() => setZoom(Math.max(0.2, zoom - 0.15))}
            className="p-1.5 hover:bg-white/5 rounded text-zinc-400 hover:text-white transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <span className="text-[10px] font-mono text-zinc-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(4, zoom + 0.15))}
            className="p-1.5 hover:bg-white/5 rounded text-zinc-400 hover:text-white transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          </button>
          <div className="w-px h-4 bg-white/10 mx-0.5" />
          <button
            onClick={() => { setZoom(1.0); setPan(0, 0); }}
            className="px-2 py-1 text-[8px] font-mono font-black text-zinc-500 hover:text-zinc-300 uppercase tracking-wider transition-colors"
          >Reset</button>
        </div>
      </div>
    </div>
  );
}
