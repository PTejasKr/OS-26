# 💽 Disk Scheduling Algorithm Visualizer

An interactive, educational web application and mathematical simulator for Operating System disk scheduling algorithms: **FCFS**, **SSTF**, **SCAN (Elevator)**, and **C-SCAN (Circular SCAN)**.

Built with **Python 3**, **Streamlit**, and **Matplotlib**, this tool provides visual head trajectory charts, step-by-step mathematical seek distance calculations, performance benchmarking, input validation, and an academic viva preparation guide.

---

## 📑 Table of Contents
1. [Project Overview & Objectives](#1-project-overview--objectives)
2. [Key Features & Technologies](#2-key-features--technologies)
3. [Project Structure](#3-project-structure)
4. [Installation & Setup (Windows)](#4-installation--setup-windows)
5. [How to Run the Application](#5-how-to-run-the-application)
6. [Supported Algorithms & Worked Calculations](#6-supported-algorithms--worked-calculations)
7. [Movement-Counting Conventions](#7-movement-counting-conventions)
8. [Verified Sample Benchmark Output](#8-verified-sample-benchmark-output)
9. [Automated Testing & QA Verification](#9-automated-testing--qa-verification)
10. [Assumptions & Limitations](#10-assumptions--limitations)
11. [Faculty Demonstration Walkthrough Guide](#11-faculty-demonstration-walkthrough-guide)
12. [Comprehensive Viva Voce Questions & Answers](#12-comprehensive-viva-voce-questions--answers)

---

## 1. Project Overview & Objectives

In modern computer architectures, magnetic hard disk drives (HDDs) are mechanical storage devices where the read/write head assembly must physically travel to specific cylinders (tracks) to retrieve data. Because mechanical seek time is orders of magnitude slower than CPU and RAM speeds, disk scheduling is a critical operating system responsibility.

### Core Objectives:
- **Simulate & Compare:** Execute the 4 foundational disk scheduling algorithms on identical workloads.
- **Accurate Physics & Geometry:** Accurately represent disk boundaries, head direction, and circular wrap-around movements.
- **Educational Transparency:** Display step-by-step arithmetic proofs ($$\Delta = |to - from|$$) for every head transition.
- **Visual Clarity:** Render textbook-standard head trajectory diagrams (inverted Y-axis, time downward) with clear distinctions between serviced requests and boundary turnaround points.
- **College & Viva Readiness:** Equip students with rigorous explanations and answers for oral examination.

---

## 2. Key Features & Technologies

### Technologies Used:
- **Language:** Python 3.10+ (tested on Python 3.13)
- **GUI / Dashboard:** [Streamlit](https://streamlit.io/) (v1.30+)
- **Data & Plotting:** [Matplotlib](https://matplotlib.org/) (v3.8+), [Pandas](https://pandas.pydata.org/) (v2.0+)
- **Automated Testing:** [pytest](https://docs.pytest.org/) (v8.0+)
- **Architecture:** Zero external databases, zero paid APIs, zero cloud dependencies. 100% offline and local.

### Key Features:
- **Dynamic Input Validation:** Prevents crashes with user-friendly error messages for non-integers, out-of-range tracks, empty queues, inverted track boundaries, and invalid directions.
- **One-Click Presets:** Includes textbook benchmarks (Silberschatz), balanced workloads, clustered requests with duplicates, and boundary stress tests.
- **Comparative Ranking Table:** Automatically ranks algorithms by total track movement, calculating percentage savings compared to baseline FCFS.
- **Step-by-Step Mathematical Breakdowns:** Full DataFrame tables detailing From Track, To Track, Seek Distance, and Action Type.
- **Interactive Theory & Viva Guides:** Dedicated tabs explaining disk geometry, seek time vs. rotational latency, and common examiner questions.

---

## 3. Project Structure

```text
disk-scheduling-visualizer/
│
├── algorithms.py          # Core algorithmic engine, validations, and data models
├── app.py                 # Streamlit web interface, charts, and educational modules
├── requirements.txt       # Project dependencies (Streamlit, Matplotlib, Pytest, Pandas)
├── test_algorithms.py     # Automated pytest suite (20 unit & integration tests)
└── README.md              # Complete project documentation and viva manual
```

---

## 4. Installation & Setup (Windows)

### Prerequisites:
Ensure **Python 3.10 or newer** is installed on your system. You can verify this in PowerShell or Command Prompt:

```powershell
python --version
```

### Step 1: Open the Project Directory
```powershell
cd c:\Users\Mageshwaran\Desktop\disk-scheduling-visualizer
```

### Step 2: Create a Virtual Environment (Recommended)
Creating an isolated virtual environment prevents library conflicts:

```powershell
# Using PowerShell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

*(If using standard Command Prompt `cmd.exe`, run `venv\Scripts\activate.bat`)*

### Step 3: Install Required Dependencies
```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

---

## 5. How to Run the Application

Launch the Streamlit web server using either of these commands in PowerShell or Command Prompt:

```powershell
python -m streamlit run app.py
```

*Or simply double-click `run.bat` in the project folder!*

Streamlit will automatically open your default web browser at:
```text
Local URL: http://localhost:8501
Network URL: http://192.168.x.x:8501
```

If it does not open automatically, open your browser and navigate manually to `http://localhost:8501`.

---

## 6. Supported Algorithms & Worked Calculations

### Input Parameters for Worked Examples:
- **Request Queue:** `[98, 183, 37, 122, 14, 124, 65, 67]` (8 requests)
- **Initial Head Position:** `53`
- **Disk Boundaries:** `min_track = 0`, `max_track = 199`
- **Initial Direction:** `right` (increasing cylinder numbers)

---

### 1. FCFS (First-Come, First-Served)
- **Principle:** Requests are serviced in the exact sequential order of their arrival.
- **Service Order:** `98 ➔ 183 ➔ 37 ➔ 122 ➔ 14 ➔ 124 ➔ 65 ➔ 67`
- **Trajectory Path:** `[53, 98, 183, 37, 122, 14, 124, 65, 67]`
- **Step-by-Step Distance Calculation:**
  1. $53 \to 98 = |98 - 53| = 45\text{ tracks}$
  2. $98 \to 183 = |183 - 98| = 85\text{ tracks}$
  3. $183 \to 37 = |37 - 183| = 146\text{ tracks}$
  4. $37 \to 122 = |122 - 37| = 85\text{ tracks}$
  5. $122 \to 14 = |14 - 122| = 108\text{ tracks}$
  6. $14 \to 124 = |124 - 14| = 110\text{ tracks}$
  7. $124 \to 65 = |65 - 124| = 59\text{ tracks}$
  8. $65 \to 67 = |67 - 65| = 2\text{ tracks}$
- **Total Head Movement:** $45 + 85 + 146 + 85 + 108 + 110 + 59 + 2 = \mathbf{640\text{ tracks}}$
- **Average Movement per Request:** $640 / 8 = \mathbf{80.0\text{ tracks/request}}$
- **Evaluation:** High seek overhead; arm swings wildly across platters. Free from starvation.

---

### 2. SSTF (Shortest Seek Time First)
- **Principle:** At each step, selects the pending request that requires the minimum head movement.
- **Deterministic Tie-Breaking:** If two pending requests are equidistant, the lower track number is picked. Duplicate requests are serviced consecutively with $0$ seek distance.
- **Service Order:** `65 ➔ 67 ➔ 37 ➔ 14 ➔ 98 ➔ 122 ➔ 124 ➔ 183`
- **Trajectory Path:** `[53, 65, 67, 37, 14, 98, 122, 124, 183]`
- **Step-by-Step Distance Calculation:**
  1. $53 \to 65 = |65 - 53| = 12\text{ tracks}$
  2. $65 \to 67 = |67 - 65| = 2\text{ tracks}$
  3. $67 \to 37 = |37 - 67| = 30\text{ tracks}$
  4. $37 \to 14 = |14 - 37| = 23\text{ tracks}$
  5. $14 \to 98 = |98 - 14| = 84\text{ tracks}$
  6. $98 \to 122 = |122 - 98| = 24\text{ tracks}$
  7. $122 \to 124 = |124 - 122| = 2\text{ tracks}$
  8. $124 \to 183 = |183 - 124| = 59\text{ tracks}$
- **Total Head Movement:** $12 + 2 + 30 + 23 + 84 + 24 + 2 + 59 = \mathbf{236\text{ tracks}}$
- **Average Movement per Request:** $236 / 8 = \mathbf{29.5\text{ tracks/request}}$
- **Evaluation:** Massive 63.1% seek time reduction vs FCFS. Vulnerable to starvation if requests continuously arrive near the current cluster.

---

### 3. SCAN (Elevator Algorithm)
- **Principle:** Moves in the designated direction servicing requests along the way until reaching the physical boundary, reverses direction, and services remaining requests.
- **Service Order:** `65 ➔ 67 ➔ 98 ➔ 122 ➔ 124 ➔ 183 ➔ 37 ➔ 14`
- **Physical Trajectory Path:** `[53, 65, 67, 98, 122, 124, 183, 199, 37, 14]`
  *(Note: Track 199 is a boundary turnaround stop, not a serviced request)*
- **Step-by-Step Distance Calculation:**
  1. $53 \to 65 = 12\text{ tracks}$
  2. $65 \to 67 = 2\text{ tracks}$
  3. $67 \to 98 = 31\text{ tracks}$
  4. $98 \to 122 = 24\text{ tracks}$
  5. $122 \to 124 = 2\text{ tracks}$
  6. $124 \to 183 = 59\text{ tracks}$
  7. $183 \to 199\text{ (Boundary)} = |199 - 183| = 16\text{ tracks}$
  8. $199 \to 37\text{ (Reversed)} = |37 - 199| = 162\text{ tracks}$
  9. $37 \to 14 = |14 - 37| = 23\text{ tracks}$
- **Total Head Movement:** $(199 - 53) + (199 - 14) = 146 + 185 = \mathbf{331\text{ tracks}}$
- **Average Movement per Request:** $331 / 8 = \mathbf{41.38\text{ tracks/request}}$
- **Evaluation:** Completely starvation-free. Reaches boundary before reversing.

---

### 4. C-SCAN (Circular SCAN)
- **Principle:** Sweeps across the disk in one direction servicing requests until hitting the boundary, jumps back to the opposite boundary without servicing requests during the rapid return, and continues in the original direction.
- **Service Order:** `65 ➔ 67 ➔ 98 ➔ 122 ➔ 124 ➔ 183 ➔ 14 ➔ 37`
- **Physical Trajectory Path:** `[53, 65, 67, 98, 122, 124, 183, 199, 0, 14, 37]`
- **Step-by-Step Distance Calculation:**
  1. $53 \to 65 = 12\text{ tracks}$
  2. $65 \to 67 = 2\text{ tracks}$
  3. $67 \to 98 = 31\text{ tracks}$
  4. $98 \to 122 = 24\text{ tracks}$
  5. $122 \to 124 = 2\text{ tracks}$
  6. $124 \to 183 = 59\text{ tracks}$
  7. $183 \to 199\text{ (Boundary)} = 16\text{ tracks}$
  8. $199 \to 0\text{ (Wrap-Around Jump)} = |0 - 199| = \mathbf{199\text{ tracks}}$
  9. $0 \to 14 = 14\text{ tracks}$
  10. $14 \to 37 = 23\text{ tracks}$
- **Total Head Movement:** $(199 - 53) + 199 + (37 - 0) = 146 + 199 + 37 = \mathbf{382\text{ tracks}}$
- **Average Movement per Request:** $382 / 8 = \mathbf{47.75\text{ tracks/request}}$
- **Evaluation:** Provides the most uniform waiting time distribution of all directional algorithms.

---

## 7. Movement-Counting Conventions

To guarantee consistency with standard Operating Systems literature (Silberschatz, Galvin & Gagne, *Operating System Concepts*):

1. **Initial Head Position:**
   - The initial head position is the starting coordinate of the disk arm. It is **never counted as a serviced request**.
   - If a request coincides with the starting track (e.g. initial head is 53, and 53 is in the queue), the request is serviced immediately with a seek distance of **0 tracks**.
2. **Physical Boundary Turnaround (SCAN):**
   - In SCAN, the head travels all the way to the boundary cylinder (`max_track` when moving right, `min_track` when moving left) before reversing. This movement is explicitly included in the total seek count.
3. **Circular Wrap-Around (C-SCAN):**
   - In C-SCAN, the rapid return from boundary to boundary (e.g., from 199 to 0) is a physical movement across the disk platter.
   - **Counting Rule:** The wrap-around distance is counted as the physical distance between boundaries:
     $$\text{Wrap Distance} = |\text{max\_track} - \text{min\_track}| = |199 - 0| = 199\text{ tracks}$$
   - This distance is included in the reported total head movement.
4. **Distinction between Stops and Requests:**
   - `serviced_requests`: Contains only genuine requests from the queue.
   - `movement_path`: Contains the full sequence of visited tracks, including initial head, boundary turnarounds, and wrap-arounds.

---

## 8. Verified Sample Benchmark Output

When tested with:
- Queue: `98, 183, 37, 122, 14, 124, 65, 67`
- Head: `53` | Min: `0` | Max: `199` | Direction: `right`

### Summary Benchmark Table:
| Rank | Algorithm | Total Head Movement | Average Seek (tracks/req) | Serviced Requests | Trajectory Steps |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **#1** | **SSTF** | **236 tracks** | **29.50** | 8 | 8 |
| **#2** | **SCAN** | **331 tracks** | **41.38** | 8 | 9 (incl. boundary 199) |
| **#3** | **C-SCAN** | **382 tracks** | **47.75** | 8 | 10 (incl. wrap 199 $\to$ 0) |
| **#4** | **FCFS** | **640 tracks** | **80.00** | 8 | 8 |

---

## 9. Automated Testing & QA Verification

The project includes an automated test suite executed with `pytest` covering all standard scenarios, edge cases, and arithmetic verifications.

### Test Execution Command:
```powershell
python -m pytest test_algorithms.py -v
```

### Actual Test Results (Verified):
```text
============================= test session starts =============================
platform win32 -- Python 3.13.1, pytest-9.0.3, pluggy-1.6.0
rootdir: C:\Users\Mageshwaran\Desktop\disk-scheduling-visualizer
collected 20 items

test_algorithms.py::test_fcfs_standard_sample PASSED                     [  5%]
test_algorithms.py::test_sstf_standard_sample PASSED                     [ 10%]
test_algorithms.py::test_scan_right_standard_sample PASSED               [ 15%]
test_algorithms.py::test_scan_left_standard_sample PASSED                [ 20%]
test_algorithms.py::test_c_scan_right_standard_sample PASSED             [ 25%]
test_algorithms.py::test_c_scan_left_standard_sample PASSED              [ 30%]
test_algorithms.py::test_empty_requests PASSED                           [ 35%]
test_algorithms.py::test_duplicate_requests PASSED                       [ 40%]
test_algorithms.py::test_request_at_initial_head_position PASSED         [ 45%]
test_algorithms.py::test_sstf_deterministic_tie_breaking PASSED          [ 50%]
test_algorithms.py::test_requests_at_boundaries PASSED                   [ 55%]
test_algorithms.py::test_hand_verified_integrity_all_algorithms PASSED   [ 60%]
test_algorithms.py::test_validate_valid_inputs PASSED                    [ 65%]
test_algorithms.py::test_validate_non_integer_requests PASSED            [ 70%]
test_algorithms.py::test_validate_out_of_bounds_request PASSED           [ 75%]
test_algorithms.py::test_validate_head_out_of_bounds PASSED              [ 80%]
test_algorithms.py::test_validate_invalid_track_range PASSED             [ 85%]
test_algorithms.py::test_validate_negative_min_track PASSED              [ 90%]
test_algorithms.py::test_validate_empty_request_queue PASSED             [ 95%]
test_algorithms.py::test_comparison_table_generation PASSED              [100%]

============================= 20 passed in 3.88s ==============================
```

---

## 10. Assumptions & Limitations

1. **Rotational Latency & Transfer Time:**
   - In accordance with standard operating systems curriculum, the simulation focuses strictly on **Seek Time** (radial arm movement across cylinders). Sector-level rotational latency and bus transfer delays are assumed uniform.
2. **Deterministic Tie-Breaking:**
   - In SSTF, if two pending requests have the exact same seek distance from the current head, the algorithm deterministically selects the **lower track number**.
3. **Single Read/Write Head Model:**
   - The disk model assumes a single actuator arm assembly servicing concentric cylindrical tracks numbered from `min_track` to `max_track`.
4. **SSD Applicability:**
   - Traditional disk scheduling algorithms apply to mechanical spinning disks. Modern Solid State Drives (SSDs) use flash memory without moving parts and rely on controller-level wear leveling rather than seek scheduling.

---

## 11. Faculty Demonstration Walkthrough Guide

Follow this 5-step sequence during your project evaluation:

1. **Launch the Web App:**
   - Open PowerShell, navigate to the folder, and run `streamlit run app.py`.
   - Show the browser opening at `http://localhost:8501`.
2. **Present the Default Textbook Baseline:**
   - Point out the default input: Queue `[98, 183, 37, 122, 14, 124, 65, 67]`, Initial Head `53`.
   - Highlight the **Optimal Algorithm Banner**: SSTF wins with 236 tracks (63.1% reduction vs FCFS at 640 tracks).
3. **Demonstrate Trajectory Charts:**
   - Switch to the **SCAN** tab: explain how the arm sweeps right, touches the boundary at **199**, and reverses to service **37** and **14**. Show that 199 is marked with an orange square as a boundary stop.
   - Switch to the **C-SCAN** tab: point out the red dashed line for the wrap-around jump from 199 to 0 (199 tracks counted).
4. **Demonstrate Robust Input Validation:**
   - In the sidebar, type `abc` or an out-of-bounds number like `350`.
   - Click "Run Simulation". Show the friendly error message preventing a crash.
5. **Show Automated Tests:**
   - Open terminal and run `python -m pytest test_algorithms.py -v`.
   - Show that all 20 tests pass cleanly in under 4 seconds.

---

## 12. Comprehensive Viva Voce Questions & Answers

### Q1: What is the main cause of disk latency?
**Answer:** Total disk access time is composed of:
1. **Seek Time:** Time for the actuator arm to position the read/write head over the target cylinder (typically 3–10 ms).
2. **Rotational Latency:** Time for the target sector to rotate underneath the head (typically 2–4 ms).
3. **Transfer Time:** Time to magnetically read/write data blocks.
**Seek Time is the mechanical bottleneck** that disk scheduling algorithms minimize.

### Q2: Why does SSTF cause starvation?
**Answer:** SSTF greedily services the closest pending request to the current head. If new requests continually arrive close to the active cluster, the head stays in that localized region. Requests located far away from the head may wait indefinitely, leading to **starvation**.

### Q3: How does SCAN prevent starvation?
**Answer:** SCAN (the Elevator Algorithm) sweeps continuously across the entire disk from boundary to boundary. Every pending request in the direction of travel is serviced. When the boundary is reached, the arm reverses. Therefore, every request is guaranteed to be serviced within at most two sweeps, eliminating starvation.

### Q4: Why is C-SCAN preferred over SCAN in heavily loaded systems?
**Answer:** In SCAN, when the head reverses at the boundary, the cylinders just visited have very few requests waiting, while the cylinders at the far opposite end have been waiting the longest. C-SCAN solves this unfairness by always servicing in one direction, providing a **much more uniform waiting time** for all cylinders.

### Q5: How is the C-SCAN wrap-around counted in your project?
**Answer:** We follow the full physical movement convention: the rapid return from `max_track` (199) to `min_track` (0) is a physical movement across the entire disk surface equal to $|199 - 0| = 199\text{ tracks}$. It is explicitly included in the total head movement and clearly marked in our step breakdown.

### Q6: How are duplicate requests handled?
**Answer:** Duplicate requests are maintained in the request queue. For example, if track 35 is requested twice, the algorithm services the first instance, and the second instance is serviced with a seek distance of 0 tracks. Both instances are recorded in the serviced list.

### Q7: Do SSDs use SCAN or SSTF?
**Answer:** No. Solid State Drives (SSDs) have no mechanical moving heads or rotating platters. Accessing any memory cell in NAND flash takes virtually constant time ($O(1)$). Instead of seek-optimizing algorithms, SSDs use I/O schedulers focused on wear leveling, block erasure, and high parallel queue depths (NVMe / NCQ).

---

## 👥 Contributors & Academic Acknowledgments
- **Project:** Disk Scheduling Algorithm Visualizer
- **Course:** Operating Systems Laboratory / CS Core Curriculum
- **Reference Literature:** Silberschatz, Galvin & Gagne, *Operating System Concepts* (10th Edition)
