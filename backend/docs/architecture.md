# Architecture Overview

## System Design

The application is a **single-page client-side simulation** with no backend server.

```
┌─────────────────────────────────────────────────────┐
│                     React App (Vite)                │
│                                                     │
│  ┌──────────────┐   ┌──────────────┐               │
│  │  Zustand      │   │  Simulation   │               │
│  │  Network Store│◄──│  Hook (tick)  │               │
│  │  (nodes/edges)│   │  800ms interval│              │
│  └──────┬───────┘   └──────┬───────┘               │
│         │                  │                         │
│         ▼                  ▼                         │
│  ┌──────────────┐   ┌──────────────┐               │
│  │  Dijkstra    │   │  Hysteresis  │               │
│  │  Hydraulic   │   │  Controller  │               │
│  │  Solver      │   │  (per crop)  │               │
│  └──────────────┘   └──────────────┘               │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │              SVG Canvas View                  │  │
│  │  NodeRenderer · EdgeRenderer · MiniMap       │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## State Management

| Store          | Responsibility                                    |
|----------------|---------------------------------------------------|
| `networkStore` | Nodes, edges, demo layouts, undo/redo history     |
| `uiStore`      | Tool selection, panel visibility, log messages    |

## Simulation Loop

1. Every **800ms**, `useSimulation` tick fires
2. Reads `calculatedHydraulics` from Dijkstra solver
3. For each crop: applies fill rate or evaporation
4. Manages hysteresis transitions (`isWateringActive`)
5. Updates Zustand store → triggers React re-render
