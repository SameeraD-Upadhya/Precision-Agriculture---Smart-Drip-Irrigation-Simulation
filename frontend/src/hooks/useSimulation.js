// src/hooks/useSimulation.js
import { useEffect, useRef } from 'react';
import useNetworkStore from '../stores/networkStore.js';
import useUIStore      from '../stores/uiStore.js';

const TICK_MS         = 800;   // simulation tick interval
const FILL_RATE       = 1.5;   // % hydration gained per tick when actively receiving water
const EVAP_RATE       = 0.4;   // % hydration lost per tick when not receiving water

/**
 * Core simulation loop.
 * - Source is always supplying (handled by computeHydraulics in dijkstra.js).
 * - Hydration rises when water is allocated AND supply is enabled AND below targetCapacity.
 * - When hydration hits targetCapacity, supply stops at the hydraulic layer (not here).
 * - When supply is manually off OR at capacity, hydration slowly evaporates.
 */
export function useSimulation(calculatedHydraulics, isSimulating, setHydrationHistory) {
  const { nodes, updateNode } = useNetworkStore();
  const { addLog }            = useUIStore();
  const logCooldown           = useRef({});    // per-crop log throttling

  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const crops   = nodes.filter(n => n.type === 'crop');
      const snapshot = { time: Date.now(), values: {} };

      crops.forEach(crop => {
        const received    = calculatedHydraulics.nodeAllocatedInputs[crop.id] || 0;
        const targetCap   = crop.targetCapacity ?? 100;
        const maxCap      = crop.maxCapacity ?? 100;
        const manuallyOff = crop.isSupplyEnabled === false;
        
        let isWatering = crop.isWateringActive !== false;
        let hydration = crop.hydration ?? 0;

        // Apply fill or evaporation
        let delta;
        if (!manuallyOff && isWatering && received > 0) {
          delta = FILL_RATE;
        } else {
          delta = -EVAP_RATE;
        }

        const rawNew     = hydration + delta;
        const clampedNew = Math.max(0, Math.min(maxCap, rawNew));
        const newHydra   = parseFloat(clampedNew.toFixed(1));

        // Hysteresis State Transition logic
        let nextIsWatering = isWatering;
        if (isWatering && newHydra >= targetCap) {
          nextIsWatering = false;
        } else if (!isWatering && newHydra <= (0.35 * targetCap)) {
          nextIsWatering = true;
        }

        updateNode(crop.id, { 
          currentReceived: received, 
          hydration: newHydra, 
          isWateringActive: nextIsWatering 
        });
        snapshot.values[crop.id] = newHydra;

        // Log state transitions
        const now  = Date.now();
        const last = logCooldown.current[crop.id] || 0;
        if (now - last > 8000) {
          if (!nextIsWatering && isWatering) {
            addLog(`${crop.name || crop.id} reached target capacity (${targetCap}%) — water cut-off.`, 'success');
            logCooldown.current[crop.id] = now;
          } else if (nextIsWatering && !isWatering) {
            addLog(`${crop.name || crop.id} dropped below 35% capacity — resuming water supply.`, 'info');
            logCooldown.current[crop.id] = now;
          } else if (newHydra <= 0 && hydration > 0) {
            addLog(`${crop.name || crop.id} is critically dry!`, 'error');
            logCooldown.current[crop.id] = now;
          }
        }
      });

      setHydrationHistory(prev => {
        const next = [...prev, snapshot];
        return next.length > 60 ? next.slice(next.length - 60) : next;
      });

    }, TICK_MS);

    return () => clearInterval(interval);
  }, [isSimulating, calculatedHydraulics, nodes, updateNode, addLog]);
}
