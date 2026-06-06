// src/components/canvas/MiniMap.jsx
import React, { memo } from 'react';
import useUIStore from '../../stores/uiStore.js';

const W = 160, H = 100;

function MiniMap({ nodes }) {
  const { zoom, panX, panY, setPan, setZoom } = useUIStore();

  if (!nodes.length) return null;

  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  const minX = Math.min(...xs) - 40, maxX = Math.max(...xs) + 40;
  const minY = Math.min(...ys) - 40, maxY = Math.max(...ys) + 40;
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const toMM = (nx, ny) => ({
    x: ((nx - minX) / rangeX) * W,
    y: ((ny - minY) / rangeY) * H,
  });

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;
    const worldX = (mx / W) * rangeX + minX;
    const worldY = (my / H) * rangeY + minY;
    setPan(-worldX * zoom + 300, -worldY * zoom + 200);
  };

  // Viewport rect in minimap coords
  const vpMinX = (-panX / zoom - minX) / rangeX * W;
  const vpMinY = (-panY / zoom - minY) / rangeY * H;
  const vpW    = (window.innerWidth  / zoom) / rangeX * W;
  const vpH    = (window.innerHeight / zoom) / rangeY * H;

  return (
    <div
      className="absolute bottom-4 right-4 glass-card rounded-xl overflow-hidden cursor-pointer shadow-xl border border-white/8"
      style={{ width: W, height: H }}
      onClick={handleClick}
      title="Click to navigate"
    >
      <svg width={W} height={H}>
        {/* Viewport rectangle */}
        <rect
          x={vpMinX} y={vpMinY} width={vpW} height={vpH}
          fill="rgba(34,211,238,0.06)"
          stroke="rgba(34,211,238,0.4)"
          strokeWidth="1"
        />
        {/* Node dots */}
        {nodes.map(n => {
          const p = toMM(n.x, n.y);
          const color = n.type === 'pump' ? '#10b981' : n.type === 'crop' ? '#60a5fa' : '#a855f7';
          return <circle key={n.id} cx={p.x} cy={p.y} r={3} fill={color} opacity="0.9" />;
        })}
      </svg>
      <div className="absolute top-1 left-2 text-[8px] font-mono text-zinc-600 uppercase tracking-widest">MiniMap</div>
    </div>
  );
}

export default memo(MiniMap);
