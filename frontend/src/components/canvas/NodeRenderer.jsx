// src/components/canvas/NodeRenderer.jsx
import React, { memo } from 'react';
import useUIStore from '../../stores/uiStore.js';

/** Hydration color: blue → rose */
function hydrationColor(pct) {
  const t = pct / 100;
  const r = Math.round(239 + (59 - 239) * t);
  const g = Math.round(68  + (130- 68)  * t);
  const b = Math.round(68  + (246- 68)  * t);
  return `rgb(${r},${g},${b})`;
}

/** Partial arc for hydration ring. */
function describeArc(r, pct) {
  const angle = (pct / 100) * 360 - 0.01;
  const rad   = (angle * Math.PI) / 180;
  const x     = r * Math.sin(rad);
  const y     = -r * Math.cos(rad);
  const large = angle > 180 ? 1 : 0;
  return `M 0 ${-r} A ${r} ${r} 0 ${large} 1 ${x} ${y}`;
}

function PumpIcon({ color }) {
  return (
    <g>
      <circle cx="0" cy="-2" r="5" stroke={color} strokeWidth="1.5" fill="none" />
      <path d="M -4 2 L 0 -2 L 4 2" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="-6" y1="4" x2="6" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </g>
  );
}

function JunctionIcon({ color }) {
  return (
    <g>
      <circle cx="0" cy="0" r="3" fill={color} />
      <line x1="-7" y1="0"  x2="7"  y2="0"  stroke={color} strokeWidth="1.5" />
      <line x1="0"  y1="-7" x2="0"  y2="7"  stroke={color} strokeWidth="1.5" />
    </g>
  );
}

function CropIcon({ color }) {
  return (
    <g>
      <path d="M 0 5 L 0 -2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 0 0 Q -5 -4 -3 -7 Q 0 -5 0 0" fill={color} opacity="0.8" />
      <path d="M 0 0 Q 5 -4 3 -7 Q 0 -5 0 0" fill={color} opacity="0.8" />
    </g>
  );
}

function NodeRenderer({ nodes, hydraulics, onNodeMouseDown, onNodeClick }) {
  const { selectedNodeId, selectedEdgeId, pipeSourceId, activeTool } = useUIStore();

  return (
    <g>
      {nodes.map(node => {
        const isPump     = node.type === 'pump';
        const isJunction = node.type === 'junction';
        const isCrop     = node.type === 'crop';
        const isSelected = selectedNodeId === node.id;
        const isSource   = pipeSourceId === node.id;
        const hydra      = node.hydration || 0;
        const receiving  = (node.currentReceived || 0) > 0;

        let strokeColor = '#27272a';
        if (isSelected) strokeColor = '#22d3ee';
        else if (isSource) strokeColor = '#6366f1';
        else if (isPump) strokeColor = 'rgba(16,185,129,0.5)';
        else if (isJunction) strokeColor = 'rgba(168,85,247,0.5)';
        else if (isCrop) strokeColor = hydra > 50 ? 'rgba(59,130,246,0.5)' : 'rgba(244,63,94,0.5)';

        const glowFilter = isSelected ? 'drop-shadow(0 0 10px rgba(34,211,238,0.7))'
                         : isSource   ? 'drop-shadow(0 0 10px rgba(99,102,241,0.7))'
                         : 'none';

        const cropsList = nodes.filter(n => n.type === 'crop');
        const cropIndex = cropsList.findIndex(n => n.id === node.id) + 1;
        const maxCap     = node.maxCapacity ?? 100;
        const targetCap  = node.targetCapacity ?? 100;

        return (
          <g
            key={node.id}
            transform={`translate(${node.x}, ${node.y})`}
            style={{ filter: glowFilter, cursor: activeTool === 'select' ? 'grab' : 'pointer' }}
            onMouseDown={e => onNodeMouseDown(node.id, e)}
            onClick={e => onNodeClick(node, e)}
          >
            {/* Invisible large hitbox to facilitate clicking */}
            <circle r={isPump ? 32 : isJunction ? 26 : 30} fill="transparent" pointerEvents="all" />

            {/* Selection glow ring */}
            {isSelected && (
              <circle r={isPump ? 32 : isJunction ? 24 : 30}
                      fill="none" stroke="rgba(34,211,238,0.15)" strokeWidth="6" />
            )}

            {/* Node shape */}
            {isPump && (
              <circle r="24" fill="#050505" stroke={strokeColor} strokeWidth={isSelected ? 2.5 : 1.5} />
            )}
            {isJunction && (
              <polygon points="0,-18 18,0 0,18 -18,0"
                       fill="#050505" stroke={strokeColor} strokeWidth={isSelected ? 2.5 : 1.5} />
            )}
            {isCrop && (
              <rect x="-22" y="-22" width="44" height="44" rx="10"
                    fill="#050505" stroke={strokeColor} strokeWidth={isSelected ? 2.5 : 1.5} />
            )}

            {/* Hydration arc for crop */}
            {isCrop && (() => {
              const isSupply = node.isSupplyEnabled !== false;
              const targetPct = Math.min(100, Math.max(0, (targetCap / maxCap) * 100));
              const hydraPct  = Math.min(100, Math.max(0, (hydra / maxCap) * 100));
              const drawPct   = Math.min(targetPct, hydraPct);

              return (
                <>
                  {/* BG base ring */}
                  <circle r="28" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
                  {/* Target Capacity Ring (dashed, faint emerald or red if paused) */}
                  <path
                    d={describeArc(28, targetPct)}
                    fill="none"
                    stroke={isSupply ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.1)"}
                    strokeWidth="3"
                    strokeDasharray="2 2"
                  />
                  {/* Hydration arc */}
                  <path
                    d={describeArc(28, drawPct)}
                    fill="none"
                    stroke={isSupply ? (node.isWateringActive === false ? '#a855f7' : hydrationColor((hydra / targetCap) * 100)) : '#71717a'}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    opacity={isSupply ? 0.85 : 0.4}
                  />
                  {/* Target capacity tick mark at the end of targetCap arc */}
                  {targetPct < 100 && (
                    <circle
                      cx={28 * Math.sin(((targetPct / 100) * 360 - 0.01) * Math.PI / 180)}
                      cy={-28 * Math.cos(((targetPct / 100) * 360 - 0.01) * Math.PI / 180)}
                      r="2.5"
                      fill={isSupply ? "#10b981" : "#71717a"}
                    />
                  )}
                </>
              );
            })()}

            {/* Icon */}
            {isPump     && <PumpIcon     color="#10b981" />}
            {isJunction && <JunctionIcon color="#a855f7" />}
            {isCrop     && (
              <CropIcon
                color={node.isSupplyEnabled === false ? '#71717a' : node.isWateringActive === false ? '#a855f7' : hydra >= targetCap - 1 ? '#10b981' : hydra > (targetCap * 0.5) ? '#60a5fa' : '#fb7185'}
              />
            )}

            {/* Water ping dot on receiving crop */}
            {isCrop && receiving && node.isSupplyEnabled !== false && (
              <circle r="3" fill="#3b82f6" className="crop-ping" opacity="0.9" />
            )}

            {/* Z altitude label */}
            <text y={isPump ? -30 : isJunction ? -24 : -30}
                  textAnchor="middle"
                  style={{ fill: '#52525b', fontSize: 8, fontFamily: '"DM Mono", monospace' }}>
              {node.z}m
            </text>

            {/* Node ID label */}
            <text y={isPump ? 38 : isJunction ? 28 : 38}
                  textAnchor="middle"
                  style={{ fill: isPump ? '#10b981' : isJunction ? '#a855f7' : '#60a5fa',
                           fontSize: 8, fontFamily: '"DM Mono", monospace', fontWeight: 700,
                           letterSpacing: '0.05em' }}>
              {isCrop ? `Crop #${cropIndex}` : node.id}
            </text>

            {/* Hydration / MaxCapacity ratio for crop */}
            {isCrop && (
              <text y="46" textAnchor="middle"
                    style={{ fill: node.isWateringActive === false ? '#a855f7' : hydra > (targetCap * 0.7) ? '#10b981' : hydra > (targetCap * 0.35) ? '#f59e0b' : '#f43f5e',
                             fontSize: 7.5, fontFamily: '"DM Mono", monospace', fontWeight: 700 }}>
                {hydra.toFixed(0)}/{maxCap}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

export default memo(NodeRenderer);
