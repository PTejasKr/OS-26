# 💽 CHRONOS // Visual Storage Analysis & Disk Algorithm Visualizer

A modern, interactive, retro-futuristic OS terminal and Bento-Grid laboratory web application for analyzing, simulating, and comparing **Disk Scheduling Algorithms**, **Storage Access Data Flows**, **File Allocation Techniques**, **Free Space Management**, and **Buffer Cache Page Replacement**.

Built with **React 19**, **Vite**, **Tailwind CSS**, and **HTML5 Canvas**, this tool delivers 60 FPS radial platter physics, synchronized textbook trajectory diagrams, step-by-step mathematical proofs, microsecond kernel state flow tracing, and an academic viva voce trainer.

---

## 🚀 Key Features

### 1. 💽 6 Core Disk Head Scheduling Algorithms
Simulate and compare all foundational OS disk head scheduling algorithms on identical workloads:
- **FCFS** (First-Come, First-Served) - Baseline FIFO arrival order.
- **SSTF** (Shortest Seek Time First) - Nearest cylinder with deterministic tie-breaking (lower track first).
- **SCAN** (Elevator Algorithm) - Continuous sweep to disk boundary with direction reversal.
- **C-SCAN** (Circular SCAN) - Unidirectional sweep with full circular wrap-around jump.
- **LOOK** - Elevator that stops at the last pending request without edge boundary penalty.
- **C-LOOK** - Circular sweep wrapping directly to the lowest/highest requested track.

### 2. 🌀 2D Mechanical Platter & Radial Arm Actuator (Canvas 60 FPS)
- Concentric circular tracks mapping cylinders from `min_track` to `max_track`.
- Rotating magnetic platter with customizable spindle RPM (e.g. 7200 RPM).
- Actuator assembly with pivot base, voice coil motor arc, and swinging read/write head slider.
- Magnetic read pulse effects when the head arrives at target tracks.
- Color-coded track cylinders: Active Head (Cyan), Pending Requests (Amber), Serviced Requests (Emerald).

### 3. ⚡ Storage Access Data Flow State Machine
A pure, interactive state transition pipeline tracing the lifecycle of data access:
1. **User Syscall** (`read(fd, buf, size)`, CPU Ring 3 ➔ Ring 0)
2. **VFS & Inode Lookup** (Logical byte offset ➔ LBA block)
3. **Kernel Page / Buffer Cache** (RAM cache HIT vs MISS gate)
4. **I/O Scheduler Queue** (Block elevator request sorting)
5. **Mechanical Arm Seek** (Voice Coil Motor radial travel: $T_{\text{seek}} = a + b \sqrt{\Delta}$)
6. **Spindle Rotational Latency** ($T_{\text{rot}} = \frac{1}{2} \cdot \frac{60}{\text{RPM}}$)
7. **Magnetic Read & DMA Transfer** (Direct Memory Access into Kernel RAM)
8. **Hardware IRQ & Process Wakeup** (Process `BLOCKED` ➔ `READY`)

### 4. 📈 Interactive Textbook Head Trajectory Diagrams
- Inverted Y-axis standard (Step 0 at top, downward time progression).
- Overlay Mode: compare all 6 algorithm paths simultaneously on a single chart!
- Hover & Scrubber: click or drag along any point to inspect step details, cylinder coordinates, and $\Delta$ seek distance.

### 5. 📁 File Management & Allocation Studio
- **Contiguous Allocation**: Direct block access formula ($O(1)$) and external fragmentation index.
- **Linked Allocation & FAT**: Chained block pointers and File Allocation Table demonstration.
- **Unix Inode Indexed Allocation**: Direct Pointers (0..3) with Single/Double Indirect addressing.
- Interactive File System: Create, allocate, and delete files dynamically on a 64-block storage matrix.

### 6. 🗄️ Free Space Management & Buffer Cache Replacement
- **Bit Vector (Bitmap)**: Binary 64-bit matrix and Hexadecimal memory words (`0x...`).
- **Linked Free List**: Pointer chain of unallocated blocks.
- **Storage Buffer Cache Simulator**: FIFO, LRU, LFU, and Clock / Second-Chance algorithms with real-time Hit vs Miss ratio and physical disk I/O savings counter.

### 7. 🎓 Academic Viva Voce & Laboratory Exam Suite
- Comprehensive examiner questions & answers with key talking points.
- Interactive multiple-choice self-test quiz with instant scoring, feedback, and celebration effects.
- Mechanical HDD vs Electronic SSD/NVMe architectural comparison guide.

### 8. 💾 Report Exporter
- One-click copy of full Markdown laboratory reports for course submissions.
- JSON and CSV telemetry export.
- Print-ready stylesheet.

---

## 🛠️ Installation & Running

### Prerequisites
- Node.js v18 or higher (v20+ recommended)

### Quick Start
```bash
# Navigate to the project directory
cd storage-visualizer

# Install dependencies
npm install --legacy-peer-deps

# Start the interactive development server
npm run dev
```

Visit the local URL shown in your terminal (typically `http://localhost:5173`).

### Production Build
```bash
npm run build
npm run preview
```

---

## 📐 Movement-Counting & Algorithmic Conventions

To ensure 100% academic consistency with Silberschatz, Galvin & Gagne (*Operating System Concepts*):
1. **Initial Head Position:** Starting position of the read/write arm; never counted as a serviced request. If a request is at initial head, seek distance is $0$.
2. **SCAN Boundary Turnaround:** Head travels to the outer physical cylinder (`max_track` or `min_track`) before reversing.
3. **C-SCAN Wrap-Around:** Circular return from boundary to boundary is counted as physical arm movement:
   $$\text{Wrap Distance} = |\text{max\_track} - \text{min\_track}|$$
4. **LOOK / C-LOOK Optimization:** Arm only travels as far as the highest/lowest requested cylinder, skipping unneeded boundary travel.
5. **Deterministic SSTF Tie-Breaking:** When two pending tracks are equidistant, the lower track number is serviced first.
