# Backend — Documentation & Exports

This folder serves as the **documentation hub** and **local exports store** for the
Precision Agriculture Smart Drip Irrigation Simulation project.

---

## Folder Structure

```
backend/
├── README.md           ← You are here
├── docs/               ← Technical documentation
│   ├── architecture.md ← System architecture overview
│   ├── algorithms.md   ← Hydraulic algorithm details (Dijkstra, hysteresis)
│   └── data-schema.md  ← Network node / edge JSON schema
└── exports/            ← Default save location for app exports
    ├── .gitkeep
    └── README.md       ← Export file conventions
```

---

## Export Files

The app supports three export formats. When prompted by your browser, navigate to
`backend/exports/` to keep all exports organised in one place.

| Format | Filename Pattern                              | Contents                    |
|--------|-----------------------------------------------|-----------------------------|
| JSON   | `agroflow-<project>-<date>.json`              | Full network snapshot       |
| PNG    | `agroflow-<project>.png`                      | Canvas screenshot           |
| PDF    | `agroflow-report-<project>.pdf`               | Full simulation report      |

---

## Technology Stack

| Layer       | Technology                              |
|-------------|------------------------------------------|
| Frontend    | React 18 · Vite · Zustand · Tailwind CSS |
| Simulation  | Custom Dijkstra hydraulic solver         |
| Charts      | Recharts                                 |
| PDF Export  | jsPDF + jspdf-autotable                  |
| PNG Export  | html-to-image / toPng                    |

---

> This project is frontend-only. No backend server is required.
> All simulation state is managed client-side via Zustand stores.
