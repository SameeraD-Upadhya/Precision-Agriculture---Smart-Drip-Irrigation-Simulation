// src/utils/constants.js

export const INITIAL_NODES = [
  { id: 'BASIN_P1',   name: 'High-Output Supply Reservoir', type: 'pump',     x: 120, y: 140, z: 25, maxFlow: 800, pressurePSI: 85 },
  { id: 'AQUIFER_P2', name: 'Deep Well Pump Station',       type: 'pump',     x: 220, y: 520, z: 10, maxFlow: 500, pressurePSI: 65 },
  { id: 'VALVE_J1',   name: 'Central Pressure Manifold',   type: 'junction', x: 440, y: 320, z: 15 },
  { id: 'CROP_204',   name: 'Alfalfa Irrigation Grid',     type: 'crop',     x: 740, y: 220, z: 22, flowDemand: 220, currentReceived: 0, hydration: 60, targetCapacity: 100, maxCapacity: 120, isSupplyEnabled: true, isWateringActive: true },
  { id: 'CROP_205',   name: 'Orchard Micro-Spray Sector',  type: 'crop',     x: 780, y: 480, z: 14, flowDemand: 140, currentReceived: 0, hydration: 45, targetCapacity: 90, maxCapacity: 100, isSupplyEnabled: true, isWateringActive: true },
];

export const INITIAL_EDGES = [
  { id: 'PIPE_01', from: 'BASIN_P1',   to: 'VALVE_J1' },
  { id: 'PIPE_02', from: 'AQUIFER_P2', to: 'VALVE_J1' },
  { id: 'PIPE_03', from: 'VALVE_J1',   to: 'CROP_204' },
  { id: 'PIPE_04', from: 'VALVE_J1',   to: 'CROP_205' },
];

export const SNAP_GRID = 20;

export const NODE_COLORS = {
  pump:     { fill: '#10b981', stroke: '#059669', label: '#10b981' },
  junction: { fill: '#a855f7', stroke: '#9333ea', label: '#a855f7' },
  crop:     { fill: '#3b82f6', stroke: '#2563eb', label: '#60a5fa' },
};
