// src/algorithms/dijkstra.js
// Pure functions — no React imports.

/** Build bidirectional adjacency list with hydraulic edge weights. */
export function buildAdjacencyList(nodes, edges, scaleMultiplier) {
  const nodeMap = {};
  nodes.forEach(n => (nodeMap[n.id] = n));

  const adj = {};
  nodes.forEach(n => (adj[n.id] = []));

  edges.forEach(e => {
    const fromNode = nodeMap[e.from];
    const toNode   = nodeMap[e.to];
    if (!fromNode || !toNode) return;

    const length = Math.hypot(toNode.x - fromNode.x, toNode.y - fromNode.y) * scaleMultiplier;
    const zDelta = toNode.z - fromNode.z;

    const elevFT = zDelta > 0 ? zDelta * 4.0 : 0;
    const elevTF = zDelta < 0 ? Math.abs(zDelta) * 4.0 : 0;

    const wFT = length + elevFT;
    const wTF = length + elevTF;

    adj[e.from].push({ targetId: e.to,   edgeId: e.id, weight: wFT });
    adj[e.to].push  ({ targetId: e.from, edgeId: e.id, weight: wTF });
  });

  return adj;
}

/** Min-heap priority queue. */
class MinHeap {
  constructor() { this.heap = []; }

  push(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    const top  = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  get size() { return this.heap.length; }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.heap[parent].dist <= this.heap[i].dist) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  _sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.heap[l].dist < this.heap[smallest].dist) smallest = l;
      if (r < n && this.heap[r].dist < this.heap[smallest].dist) smallest = r;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}

/** Dijkstra single-source shortest path using min-heap. Returns dist map + parents. */
export function dijkstraSingleSource(graphAdj, allNodeIds, sourceId, targetId) {
  const dist   = new Map();
  const parent = new Map();
  const steps  = [];

  allNodeIds.forEach(id => dist.set(id, Infinity));
  dist.set(sourceId, 0);
  parent.set(sourceId, null);

  const heap = new MinHeap();
  heap.push({ dist: 0, id: sourceId });

  while (heap.size > 0) {
    const { dist: d, id: u } = heap.pop();
    if (d > dist.get(u)) continue;

    steps.push({ type: 'visit', nodeId: u, dist: d });

    if (u === targetId) break;

    const neighbors = graphAdj[u] || [];
    for (const { targetId: v, edgeId, weight } of neighbors) {
      const alt = dist.get(u) + weight;
      if (alt < dist.get(v)) {
        const oldDist = dist.get(v);
        dist.set(v, alt);
        parent.set(v, { parentId: u, viaEdgeId: edgeId });
        heap.push({ dist: alt, id: v });
        steps.push({ type: 'relax', nodeId: v, edgeId, oldDist, newDist: alt });
      }
    }

    steps.push({ type: 'settle', nodeId: u });
  }

  const path = [];
  let cur = targetId;
  while (parent.get(cur) !== null && parent.get(cur) !== undefined) {
    const p = parent.get(cur);
    path.unshift(p.viaEdgeId);
    cur = p.parentId;
  }

  return {
    distance: dist.get(targetId) ?? Infinity,
    path,
    steps,
  };
}

/**
 * Dijkstra all-sources shortest distances from a single source to all reachable nodes.
 * Returns { distances: Map<nodeId, number>, parents: Map<nodeId, {parentId, viaEdgeId}|null> }
 */
function dijkstraAllTargets(graphAdj, allNodeIds, sourceId) {
  const dist   = new Map();
  const parent = new Map();

  allNodeIds.forEach(id => dist.set(id, Infinity));
  dist.set(sourceId, 0);
  parent.set(sourceId, null);

  const heap = new MinHeap();
  heap.push({ dist: 0, id: sourceId });

  while (heap.size > 0) {
    const { dist: d, id: u } = heap.pop();
    if (d > dist.get(u)) continue;

    const neighbors = graphAdj[u] || [];
    for (const { targetId: v, edgeId, weight } of neighbors) {
      const alt = dist.get(u) + weight;
      if (alt < dist.get(v)) {
        dist.set(v, alt);
        parent.set(v, { parentId: u, viaEdgeId: edgeId });
        heap.push({ dist: alt, id: v });
      }
    }
  }

  return { distances: dist, parents: parent };
}

/** Reconstruct path from parents map. */
function reconstructPath(parents, targetId) {
  const path = [];
  let cur = targetId;
  while (parents.get(cur) !== null && parents.get(cur) !== undefined) {
    const p = parents.get(cur);
    if (!p) break;
    path.unshift(p.viaEdgeId);
    cur = p.parentId;
  }
  return path;
}

/**
 * Compute hydraulic flows, allocations, and friction losses.
 *
 * KEY RULES:
 * 1. Source supplies CONTINUOUSLY to every connected crop field.
 * 2. Supply only pauses through a specific path when crop.hydration >= targetCapacity
 *    AND crop.isSupplyEnabled !== false.
 * 3. If supply is enabled but crop is at capacity, excess is redistributed to nearest under-capacity field.
 * 4. Nearest pump wins per crop; pumps respect their maxFlow budget.
 */
export function computeHydraulics(nodes, edges, scaleMultiplier, isSimulating) {
  const nodeAllocatedInputs  = {};
  const edgeCalculatedFlows  = {};
  const edgeCalculatedLosses = {};
  const pumpOutputRates      = {};

  nodes.forEach(n => (nodeAllocatedInputs[n.id]  = 0));
  edges.forEach(e => {
    edgeCalculatedFlows[e.id]  = 0;
    edgeCalculatedLosses[e.id] = 0;
  });

  if (!isSimulating) return { nodeAllocatedInputs, edgeCalculatedFlows, edgeCalculatedLosses, pumpOutputRates };

  try {
    const adj        = buildAdjacencyList(nodes, edges, scaleMultiplier);
    const allNodeIds = nodes.map(n => n.id);
    const pumps      = nodes.filter(n => n.type === 'pump');
    const crops      = nodes.filter(n => n.type === 'crop');

    // Budget remaining for each pump (GPM)
    const pumpBudget = {};
    pumps.forEach(p => {
      pumpBudget[p.id] = p.maxFlow || 600;
    });

    // Build pump → { distances, parents } once per pump for efficiency
    const pumpGraphData = {};
    pumps.forEach(pump => {
      pumpGraphData[pump.id] = dijkstraAllTargets(adj, allNodeIds, pump.id);
    });

    // Sort crops: those needing water first, then by how dry they are (most thirsty first)
    const sortedCrops = [...crops].sort((a, b) => {
      const aAt    = a.hydration ?? 0;
      const bAt    = b.hydration ?? 0;
      const aCap   = a.targetCapacity ?? 100;
      const bCap   = b.targetCapacity ?? 100;
      const aNeed  = (a.isSupplyEnabled !== false) && (a.isWateringActive !== false) && (aAt < aCap);
      const bNeed  = (b.isSupplyEnabled !== false) && (b.isWateringActive !== false) && (bAt < bCap);
      // Prioritise crops that need water; among those, more thirsty first
      if (aNeed && !bNeed) return -1;
      if (!aNeed && bNeed) return 1;
      return (aAt / aCap) - (bAt / bCap);
    });

    sortedCrops.forEach(crop => {
      const targetCap = crop.targetCapacity ?? 100;
      const manuallyOff = crop.isSupplyEnabled === false;
      const isWatering = crop.isWateringActive !== false;

      // Don't supply if manually turned off OR watering is suspended via hysteresis
      if (manuallyOff || !isWatering) return;

      const demand = crop.flowDemand || 150;

      // Find best pump: closest with budget remaining
      let bestPumpId   = null;
      let bestDist     = Infinity;
      let bestPath     = null;

      pumps.forEach(pump => {
        if (pumpBudget[pump.id] <= 0) return;
        const { distances, parents } = pumpGraphData[pump.id];
        const d = distances.get(crop.id) ?? Infinity;
        if (d < bestDist) {
          bestDist   = d;
          bestPumpId = pump.id;
          bestPath   = reconstructPath(parents, crop.id);
        }
      });

      if (bestPumpId !== null && bestDist !== Infinity && bestPath !== null) {
        const allocated = Math.min(demand, pumpBudget[bestPumpId]);
        pumpBudget[bestPumpId] -= allocated;
        nodeAllocatedInputs[crop.id] = allocated;
        bestPath.forEach(edgeId => {
          edgeCalculatedFlows[edgeId] = (edgeCalculatedFlows[edgeId] || 0) + allocated;
        });
      }
    });

    // Record actual pump output rates
    pumps.forEach(p => {
      const used = (p.maxFlow || 600) - pumpBudget[p.id];
      pumpOutputRates[p.id] = Math.max(0, used);
    });

    // Uniform friction loss formula: 0.00008 * flow^2 (max 15 PSI)
    edges.forEach(e => {
      const flow = edgeCalculatedFlows[e.id] || 0;
      if (flow === 0) return;
      edgeCalculatedLosses[e.id] = parseFloat(Math.min(15.0, 0.00008 * flow * flow).toFixed(1));
    });
  } catch (err) {
    console.error('computeHydraulics error:', err);
  }

  return { nodeAllocatedInputs, edgeCalculatedFlows, edgeCalculatedLosses, pumpOutputRates };
}

/** Compute network-level stats. */
export function computeNetworkStats(nodes, edges, hydraulics, scaleMultiplier) {
  const crops      = nodes.filter(n => n.type === 'crop');
  const totalDemand  = crops.reduce((s, c) => {
    const targetCap = c.targetCapacity ?? 100;
    const wantWater = (c.isSupplyEnabled !== false) && (c.isWateringActive !== false) && ((c.hydration ?? 0) < targetCap);
    return s + (wantWater ? (c.flowDemand || 150) : 0);
  }, 0);
  const totalDelivered = crops.reduce((s, c) => s + (c.currentReceived || 0), 0);
  const efficiencyPct  = totalDemand > 0 ? parseFloat((totalDelivered / totalDemand * 100).toFixed(1)) : 100;

  const overloadedPipes = [];
  let activePipesCount  = 0;

  edges.forEach(e => {
    const flow = hydraulics.edgeCalculatedFlows[e.id] || 0;
    if (flow > 0) activePipesCount++;
    if (flow > 300) overloadedPipes.push(e.id);
  });

  return {
    totalDemand,
    totalDelivered,
    efficiencyPct,
    activePipesCount,
    overloadedPipes,
  };
}
