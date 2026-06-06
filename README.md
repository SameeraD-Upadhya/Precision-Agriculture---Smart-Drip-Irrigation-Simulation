# 🌱 Precision Agriculture — Smart Drip Irrigation Simulation

<div align="center">

### Intelligent Hydraulic Network Design & Real-Time Irrigation Optimization

Design, simulate, analyze, and optimize agricultural irrigation networks with advanced hydraulic modeling, dynamic soil hydration control, and intelligent flow distribution.

![Version](https://img.shields.io/badge/version-1.0-green)
![React](https://img.shields.io/badge/React-18+-61DAFB)
![Vite](https://img.shields.io/badge/Vite-Latest-646CFF)
![License](https://img.shields.io/badge/license-MIT-blue)
![Status](https://img.shields.io/badge/status-Active-success)

</div>

---

## 🚀 Overview

**Precision Agriculture — Smart Drip Irrigation Simulation** is a next-generation irrigation planning and hydraulic simulation platform built for precision farming, agricultural research, educational demonstrations, and smart water management.

The application enables users to visually construct irrigation networks using pumps, valves, junctions, pipelines, and crop fields, then simulate real-world water distribution dynamics including pressure loss, elevation effects, flow allocation, soil hydration cycles, and automated irrigation control systems.

Whether you're designing a small greenhouse irrigation system or analyzing a complex multi-source agricultural network, the simulator provides instant visual feedback and real-time performance metrics.

---

## ✨ Core Capabilities

### 🎨 Interactive Network Designer

Create irrigation systems visually using an intuitive drag-and-drop canvas.

#### Features

✅ Drag & Drop Node Placement

* Pump Stations (Water Sources)
* Valves & Junction Nodes
* Crop Field Destinations

✅ Smart Pipeline Routing

* Connect any compatible nodes
* Create branched networks
* Design looped irrigation systems
* Manage and remove existing connections

✅ Real-Time Editing

* Move components dynamically
* Edit parameters instantly
* Visual network updates without reloads

---

### 💧 Intelligent Hydraulic Simulation Engine

A powerful simulation engine calculates water movement throughout the network.

#### Simulation Features

* Dijkstra-Based Shortest Path Routing
* Real-Time Flow Allocation
* Pressure Loss Analysis
* Elevation-Aware Water Distribution
* Continuous Water Transmission
* Multi-Source Flow Management
* Dynamic Capacity Monitoring

#### Smart Flow Behavior

Unlike traditional static simulations:

✔ Source nodes continuously supply connected destinations.

✔ Water delivery only stops when crop fields reach configured saturation levels.

✔ Flow automatically redistributes when network conditions change.

✔ Multiple pumps can simultaneously contribute to irrigation demand.

---

### 🌾 Advanced Soil Hydration System

Simulate realistic crop watering behavior with customizable soil capacities.

#### Crop Configuration

Each crop field supports:

| Parameter         | Description                |
| ----------------- | -------------------------- |
| Maximum Capacity  | Upper hydration limit      |
| Target Capacity   | Desired watering goal      |
| Current Hydration | Live soil moisture value   |
| Evaporation Rate  | Natural moisture loss      |
| Refill Threshold  | Automatic watering trigger |

#### Hysteresis-Based Irrigation Logic

The system intelligently prevents excessive start-stop cycles.

```text
Start Irrigation
        ↓
Reach Target Capacity
        ↓
Enter Cooldown State
        ↓
Natural Evaporation
        ↓
Hydration < 35% Target
        ↓
Resume Irrigation
```

This creates a realistic autonomous watering cycle similar to modern smart farming systems.

---

### ⚡ Smart Irrigation Controls

#### Automatic Water Management

* Autonomous Irrigation Scheduling
* Continuous Moisture Monitoring
* Automatic Cooldown Management
* Dynamic Refill Activation

#### Manual Override Controls

Users can instantly:

* Turn Master Water Supply ON/OFF
* Force Immediate Irrigation
* Override Cooldown Restrictions
* Reset Network States

---

### 📊 Live Network Analytics

Monitor irrigation performance through real-time system statistics.

#### Metrics Available

* Total Network Flow
* Active Water Sources
* Crop Saturation Levels
* Hydraulic Pressure Status
* Water Consumption Trends
* Pipeline Connectivity
* Elevation Differential Analysis

---

### 🏗 Demo Layout Library

Quickly explore the simulator using built-in network templates.

#### Included Presets

🔹 Single Source Irrigation

Simple pump-to-field topology.

🔹 Dual Source Distribution

Load-balanced irrigation network.

🔹 Grid-Based Farm Layout

Large-scale agricultural planning scenario.

🔹 Complex Loop Network

Advanced hydraulic redundancy simulation.

🔹 Multi-Zone Precision Farm

Realistic precision agriculture deployment.

---

## 📤 Import, Export & Reporting

The application supports multiple export formats for analysis and documentation.

### Supported Formats

| Format  | Purpose              |
| ------- | -------------------- |
| JSON    | Save & Load Projects |
| PNG     | Network Screenshots  |
| PDF     | Technical Reports    |
| Presets | Share Configurations |

### Project Persistence

Save complete simulations including:

* Network topology
* Crop configurations
* Pipeline layouts
* Simulation parameters
* Hydraulic settings

---

## 🏛 System Architecture

```text
┌────────────────────────────┐
│        React + Vite        │
│        Frontend UI         │
└─────────────┬──────────────┘
              │
              ▼
┌────────────────────────────┐
│     State Management       │
│  Nodes • Pipes • Crops     │
└─────────────┬──────────────┘
              │
              ▼
┌────────────────────────────┐
│ Hydraulic Simulation Core  │
│ Dijkstra Flow Allocation   │
│ Pressure Calculations      │
│ Hydration Management       │
└─────────────┬──────────────┘
              │
              ▼
┌────────────────────────────┐
│ Export & Reporting Engine  │
│ JSON • PNG • PDF           │
└────────────────────────────┘
```

---

## 📂 Repository Structure

```bash
Precision-Agriculture---Smart-Drip-Irrigation-Simulation/
│
├── README.md
│
├── backend/
│   ├── README.md
│   ├── docs/
│   └── exports/
│
└── frontend/
    ├── src/
    ├── package.json
    └── vite.config.js
```

---

## ⚙️ Getting Started

### Prerequisites

Before installation, ensure the following are available:

* Node.js 18+
* npm 9+
* Modern Chromium-Based Browser

---

### 1️⃣ Clone Repository

```bash
git clone https://github.com/SameeraD-Upadhya/Precision-Agriculture---Smart-Drip-Irrigation-Simulation.git

cd Precision-Agriculture---Smart-Drip-Irrigation-Simulation
```

---

### 2️⃣ Install Dependencies

```bash
cd frontend

npm install
```

---

### 3️⃣ Start Development Server

```bash
npm run dev
```

Default local address:

```text
http://localhost:5173
```

---

### 4️⃣ Production Build

```bash
npm run build
```

Compiled assets will be generated inside:

```text
frontend/dist/
```

---

## 💾 Export Recommendations

For organized project management, store exported files inside:

```text
backend/exports/
```

Supported export outputs:

* Layout JSON Files
* PNG Network Snapshots
* PDF Technical Reports

The application utilizes the browser's native **File System Access API** (supported by Chromium-based browsers) for seamless saving and loading operations.

---

## 🎯 Use Cases

### Precision Agriculture

Design optimized irrigation systems with minimal water waste.

### Educational Demonstrations

Teach hydraulic networks, graph algorithms, and flow optimization.

### Agricultural Research

Experiment with irrigation strategies and network configurations.

### Smart Farming Prototypes

Prototype autonomous irrigation control systems before deployment.

### Engineering Visualization

Demonstrate Dijkstra routing and resource allocation in a practical environment.

---

## 🔮 Planned Enhancements

* AI-Based Water Optimization
* Weather Forecast Integration
* IoT Sensor Simulation
* Pump Energy Consumption Analysis
* Water Usage Prediction Models
* Multi-Farm Scenario Management
* 3D Terrain Visualization
* GIS & Satellite Map Integration
* Mobile Responsive Dashboard
* Collaborative Network Editing

---

## 🤝 Contributing

Contributions, suggestions, and feature requests are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Open a Pull Request

---

## 📜 License

This project is distributed under the MIT License.

---

<div align="center">

### 🌱 Building Smarter Irrigation Systems for Sustainable Agriculture

**Precision Agriculture • Smart Water Management • Intelligent Simulation**

</div>
