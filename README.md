# Precision Agriculture — Smart Drip Irrigation Simulation

A real-time, interactive hydraulic network designer and simulation tool built for precision agricultural planning. Design custom irrigation layouts with reservoirs (pumps), junctions (valves), and crop fields, then simulate pressure loss, flow distribution, and smart soil hydration cycles with hysteresis controls.

---

## 🌟 Key Features

### 1. Interactive Canvas Designer
* **Drag & Drop Layouts:** Instantly place and position Pump Stations, Valves/Junctions, and Crop Fields.
* **Smart Piping:** Connect nodes with custom pipeline routes. Click on junctions to view, sever, or manage connections.
* **Interactive Hitboxes:** Seamless canvas selections and element manipulation.

### 2. Intelligent Hydraulic Simulation
* **Shortest-Path Flow Solver:** Dijkstra-based routing allocates flow from pumps/sources to destination crops.
* **Continuous Transmissions:** Source nodes continuously supply connected paths in real-time, cutting off only when destinations are fully saturated.
* **Elevation & Flow Calculation:** Computes network pressure stats, elevation changes, and flow distribution (GPM).

### 3. Dynamic Hydration & Cooldown Loops
* **Custom Crop Capacities:** Set variable maximum soil capacities (e.g., 95% to 150%) and custom target capacities per crop.
* **Hysteresis Auto-Irrigation:**
  * Irrigates a crop field until it hits the user-defined **Target Capacity**.
  * Once met, irrigation goes into a **Cooldown/Suspended** state.
  * Hydration naturally evaporates. When it drops below **35% of the target**, watering automatically resumes.
  * **Master Override:** Toggle the Master Water Supply ON/OFF at any time, or click "Start Watering Now" during cooldown to override the threshold and irrigate immediately.

### 4. Project Management & Exports
* **Preset Library:** Load and experiment with pre-configured demo layouts (e.g. Single Source, Dual-Source Grid, Complex Loop).
* **Multi-Format Exports:** Export and import layouts as JSON, PNG screenshots, or comprehensive PDF reports.

---

## 📂 Repository Structure

```
Precision-Agriculture---Smart-Drip-Irrigation-Simulation/
├── README.md               # Root documentation & setup guide
├── backend/                # Documentation & local export hub
│   ├── README.md           # Hub overview & instructions
│   ├── docs/               # Technical details (architecture, schema)
│   └── exports/            # Default folder for saving JSON/PNG/PDF exports
└── frontend/               # React (Vite) application source code
    ├── src/                # Component & state store code
    ├── package.json        # Build scripts & dependencies
    └── vite.config.js      # Build tool configuration
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (version 18+ recommended).

### 1. Clone the Repository

Clone the project repository to your local system:

```bash
git clone https://github.com/SameeraD-Upadhya/Precision-Agriculture---Smart-Drip-Irrigation-Simulation.git
cd Precision-Agriculture---Smart-Drip-Irrigation-Simulation
```

### 2. Install Dependencies

Navigate into the frontend directory and install the packages:

```bash
cd frontend
npm install
```

### 3. Run the Development Server

Launch the Vite local development server:

```bash
npm run dev
```

The application will be running locally. Open your browser and navigate to the address displayed in your terminal (typically `http://localhost:5173/`).

### 4. Build for Production

To build optimized assets for production:

```bash
npm run build
```

The compiled output will be generated inside the `frontend/dist/` directory.

---

## 💾 Saving Your Work

When exporting JSON layouts, the application uses the browser's native **File System Access API** (on Chromium-based browsers) to let you choose your destination folder. We recommend saving all JSON files, PNG screenshots, and PDF reports directly into the `backend/exports/` directory to keep your workspace clean.
