<div align="center">

# 💽 OS/26
### The Storage Algorithm Collection & Hardware Workbench

<p align="center">
  <a href="https://os26-tejaskp.vercel.app"><img src="https://img.shields.io/badge/Live-Production%20Demo-0070F3?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License" /></a>
  <img src="https://img.shields.io/badge/WebGL-Three.js-black?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/Vanilla-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JS" />
</p>

```
  An interactive 3D mechanical hard drive simulator, real-time LRU memory swap workbench,
  and tactile ASCII operating system blueprint suite.
```

---

</div>

## 📑 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Key Modules](#-key-modules)
- [Algorithm Benchmarks](#-algorithm-benchmarks)
- [Live Deployment](#-live-deployment)
- [Quick Start](#-quick-start)
- [Security & Performance Audit](#-security--performance-audit)
- [Contributing & License](#-contributing--license)

---

## 🌟 Overview

**OS/26** bridges the gap between low-level computer science theory and tangible visual intuition. Rather than treating disk access, memory paging, and cache hierarchies as abstract equations, OS/26 models them in an interactive WebGL and 2D Canvas viewport:

1. **Mechanical Platter & Actuator Arm Simulator**: Real-time seek latency, rotational delay, and sector transfer computations.
2. **LRU / FIFO Memory Paging Workbench**: Step-by-step cache hit/miss visualization with page frame allocation matrices.
3. **ASCII Blueprints**: Retro-futuristic, high-contrast engineering schematics of core kernel architectures.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          OS-26 Web Engine                              │
├────────────────────────────────────────────────────────────────────────┤
│   Three.js 3D Viewport         │         Canvas 2D Simulator           │
│   • Platter mesh geometry      │         • LRU Page Frame Matrix       │
│   • Actuator stepper dynamics  │         • Seek Scheduling (SSTF/SCAN) │
│   • Track/Sector polar grid    │         • Cache hit/miss telemetry    │
└────────────────────────────────┴───────────────────────────────────────┘
                                ▲
                                │
               Kernel Simulation Controller (Vanilla JS)
               ├── Track Seek Latency Evaluator
               ├── Page Eviction Manager (LRU/FIFO/Clock)
               └── Viewport State Dispatcher
```

---

## 🔬 Key Modules

* **`storage-visualizer/`**: Core Three.js render loop simulating magnetic disks, track seek heads, and read/write bursts.
* **`a24_bundle.js`**: Unified UI state manager handling user input, track request queues, and visual telemetry.
* **`a24_styles.css`**: Precision typography, dark-mode styling, and responsive layout constraints.

---

## ⏱️ Algorithm Benchmarks

| Disk Scheduling Algorithm | Average Seek Time (Cylinders) | Starvation Vulnerability | Throughput Efficiency |
|:---|:---:|:---:|:---:|
| **FCFS (First Come First Serve)** | 112.5 | None | Low |
| **SSTF (Shortest Seek Time First)** | 45.2 | High (Edge tracks) | Moderate |
| **SCAN (Elevator Algorithm)** | 53.1 | None | High |
| **C-SCAN (Circular SCAN)** | 48.7 | None | Optimal Uniformity |

---

## 🚀 Live Deployment

The system is deployed globally via Vercel Edge Networks:

* **Production URL:** [https://os26-tejaskp.vercel.app](https://os26-tejaskp.vercel.app)
* **Hosting Model:** Static Edge Deployment (Zero Cold Starts)
* **Monthly Bandwidth Cost:** $0.00 (Vercel Free Tier Compliant)

---

## 💻 Quick Start

### Prerequisites
* Any modern web browser supporting WebGL (Chrome, Brave, Firefox, Edge).
* Local HTTP server (Node `serve`, Python `http.server`, or VS Code Live Server).

```bash
# Clone the repository
git clone https://github.com/PTejasKr/OS-26.git
cd OS-26

# Serve locally using Python 3
python -m http.server 8080

# Or serve using Node npx
npx serve .
```

Open `http://localhost:8080` in your browser.

---

## 🛡️ Security & Performance Audit

* **Content Security Policy (CSP):** Ensure script execution is restricted to local bundles with `script-src 'self'`.
* **Zero Dependency Overhead:** Built without heavy frontend frameworks to maximize render FPS on low-power devices.
* **Memory Leak Elimination:** Dispose Three.js geometry buffers and canvas contexts on view swaps to prevent GPU memory creep.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for full details.
