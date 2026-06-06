// src/components/canvas/EdgeRenderer.jsx
import React, { memo } from 'react';
import useUIStore from '../../stores/uiStore.js';

/** Interpolate between two hex colors by ratio 0-1 */
function lerpColor(a, b, t) {
  const ah = parseInt(a.slice(1), 16), bh = parseInt(b.slice(1), 16);
  const ar = ah >> 16, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = bh >> 16, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${bl.toString(16).padStart(2,'0')}`;
}

function EdgeRenderer({ edges, nodes, hydraulics }) {
  const { selectedEdgeId, setSelectedEdgeId, setSelectedNodeId, activeTool } = useUIStore();

  const nodeMap = {};
  nodes.forEach(n => (nodeMap[n.id] = n));

  return (
    <g>
      {edges.map(edge => {
        const fromNode = nodeMap[edge.from];
        const toNode   = nodeMap[edge.to];
        if (!fromNode || !toNode) return null;

        const flow     = hydraulics.edgeCalculatedFlows[edge.id] || 0;
        const loss     = hydraulics.edgeCalculatedLosses[edge.id] || 0;
        const isSelected = selectedEdgeId === edge.id;
        const hasFlow    = flow > 0;
        const maxFlowCap = 300;
        const ratio      = flow / maxFlowCap;
        const isOverload = ratio >= 1.0;

        // Bezier control point
        const mx   = (fromNode.x + toNode.x) / 2;
        const my   = (fromNode.y + toNode.y) / 2;
        const dx   = toNode.x - fromNode.x;
        const dy   = toNode.y - fromNode.y;
        const len  = Math.hypot(dx, dy) || 1;
        const off  = 30;
        const cx   = mx - (dy / len) * off;
        const cy   = my + (dx / len) * off;
        const path = `M ${fromNode.x} ${fromNode.y} Q ${cx} ${cy} ${toNode.x} ${toNode.y}`;

        // Color logic
        let strokeColor = '#4b5563'; // standard neutral pipe
        if (hasFlow) {
          strokeColor = isOverload
            ? lerpColor('#22d3ee', '#f43f5e', Math.min(1.0, (ratio - 1.0) / 0.5 || 0.1))
            : '#22d3ee';
        } else {
          strokeColor = '#4b5563';
        }
        if (isSelected) strokeColor = '#818cf8';

        const strokeW   = hasFlow ? 4.5 : 3.2;
        const opacity   = isSelected ? 1 : hasFlow ? 1 : 0.45;

        // Label position (midpoint of bezier at t=0.5)
        const lx = 0.25 * fromNode.x + 0.5 * cx + 0.25 * toNode.x;
        const ly = 0.25 * fromNode.y + 0.5 * cy + 0.25 * toNode.y;

        return (
          <g key={edge.id}>
            {/* Glow for selected */}
            {isSelected && (
              <path d={path} stroke="rgba(99,102,241,0.35)" strokeWidth={18}
                    fill="none" strokeLinecap="round" />
            )}

            {/* Main pipe */}
            <path
              d={path}
              stroke={strokeColor}
              strokeWidth={strokeW}
              fill="none"
              strokeLinecap="round"
              opacity={opacity}
              className={hasFlow ? 'flow-moving' : ''}
            />

            {/* Hit box */}
            <path
              d={path}
              stroke="transparent"
              strokeWidth={18}
              fill="none"
              className="cursor-pointer pointer-events-auto"
              onClick={e => {
                e.stopPropagation();
                if (activeTool === 'select') {
                  setSelectedNodeId(null);
                  setSelectedEdgeId(edge.id);
                }
              }}
            />

            {/* Flow label */}
            {hasFlow && (
              <g transform={`translate(${lx}, ${ly - 14})`}>
                <rect x="-52" y="-9" width="104" height="17" rx="4"
                      fill="#000" stroke="rgba(6,182,212,0.3)" strokeWidth="0.8" opacity="0.85" />
                <text textAnchor="middle" y="2.5"
                      style={{ fill: isOverload ? '#f87171' : '#22d3ee', fontSize: 8, fontFamily: '"DM Mono", monospace', fontWeight: 700 }}>
                  {flow} GPM | -{loss} PSI
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

export default memo(EdgeRenderer);
