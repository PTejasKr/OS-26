"""
Disk Scheduling Algorithm Visualizer
====================================
A modern, interactive Streamlit application for analyzing and visualizing
Operating System disk scheduling algorithms: FCFS, SSTF, SCAN, and C-SCAN.

Authors: OS Project Team
License: MIT
"""

from typing import Dict, List, Optional
import matplotlib.pyplot as plt
import pandas as pd
import streamlit as st

from algorithms import (
    MovementStep,
    SimulationResult,
    generate_comparison_table,
    run_all_algorithms,
    validate_inputs,
)

# -----------------------------------------------------------------------------
# Streamlit Page Configuration
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="Disk Scheduling Algorithm Visualizer",
    page_icon="💽",
    layout="wide",
    initial_sidebar_state="expanded"
)

# -----------------------------------------------------------------------------
# Charting Helpers (Matplotlib)
# -----------------------------------------------------------------------------
def plot_algorithm_path(result: SimulationResult, title_suffix: str = "") -> plt.Figure:
    """
    Renders a standard Operating Systems disk head movement diagram.
    X-axis: Track / Cylinder Number (min_track to max_track)
    Y-axis: Movement Sequence Step (Inverted: Step 0 at top, moving downward)
    """
    fig, ax = plt.subplots(figsize=(10, 4.8), dpi=130)
    
    path = result.movement_path
    steps_y = list(range(len(path)))
    
    # Base path line
    ax.plot(
        path, steps_y,
        color="#3b82f6",
        linestyle="-",
        linewidth=2.2,
        alpha=0.85,
        zorder=2,
        label="Head Path"
    )

    # Highlight special steps (e.g. C-SCAN wrap-around with dashed red line)
    for s in result.steps:
        if s.step_type == "WRAP_AROUND":
            # Step index in steps_y corresponds to s.step_number
            idx_from = s.step_number - 1
            idx_to = s.step_number
            ax.plot(
                [s.from_track, s.to_track],
                [idx_from, idx_to],
                color="#ef4444",
                linestyle="--",
                linewidth=2.5,
                zorder=3,
                label="Wrap-Around Jump"
            )

    # Differentiate markers
    start_x = [path[0]]
    start_y = [steps_y[0]]

    req_x, req_y = [], []
    bound_x, bound_y = [], []
    wrap_x, wrap_y = [], []

    for s in result.steps:
        curr_y = s.step_number
        if s.step_type == "REQUEST":
            req_x.append(s.to_track)
            req_y.append(curr_y)
        elif s.step_type == "BOUNDARY":
            bound_x.append(s.to_track)
            bound_y.append(curr_y)
        elif s.step_type == "WRAP_AROUND":
            wrap_x.append(s.to_track)
            wrap_y.append(curr_y)

    # Plot markers
    ax.scatter(start_x, start_y, color="#2563eb", s=130, marker="D", zorder=5, label=f"Start ({start_x[0]})")
    if req_x:
        ax.scatter(req_x, req_y, color="#10b981", s=90, marker="o", zorder=5, label="Serviced Request")
    if bound_x:
        ax.scatter(bound_x, bound_y, color="#f59e0b", s=110, marker="s", zorder=5, label="Boundary Turnaround")
    if wrap_x:
        ax.scatter(wrap_x, wrap_y, color="#ef4444", s=110, marker="^", zorder=5, label="Wrap-Around Reset")

    # Annotate tracks on points
    for i, (trk, step) in enumerate(zip(path, steps_y)):
        prefix = "S:" if i == 0 else ""
        ax.annotate(
            f"{prefix}{trk}",
            (trk, step),
            textcoords="offset points",
            xytext=(0, 7),
            ha="center",
            fontsize=8.5,
            fontweight="semibold",
            color="#1e293b",
            bbox=dict(boxstyle="round,pad=0.15", facecolor="#ffffff", edgecolor="#cbd5e1", alpha=0.85)
        )

    # Aesthetics
    ax.set_title(
        f"{result.algorithm_name} Head Trajectory {title_suffix} | Total Movement = {result.total_movement} tracks",
        fontsize=12,
        fontweight="bold",
        pad=12
    )
    ax.set_xlabel("Disk Track / Cylinder Number", fontsize=10, fontweight="medium")
    ax.set_ylabel("Movement Step (Time Progression ↓)", fontsize=10, fontweight="medium")
    
    # Invert Y so step 0 is at the top
    ax.invert_yaxis()
    ax.set_xlim(result.min_track - 5, result.max_track + 5)
    
    # Boundary guideline vertical lines
    ax.axvline(result.min_track, color="#94a3b8", linestyle=":", linewidth=1, alpha=0.7)
    ax.axvline(result.max_track, color="#94a3b8", linestyle=":", linewidth=1, alpha=0.7)

    ax.grid(True, linestyle="--", alpha=0.45)
    
    # Clean unique legend
    handles, labels = ax.get_legend_handles_labels()
    by_label = dict(zip(labels, handles))
    ax.legend(by_label.values(), by_label.keys(), loc="lower right", fontsize=8.5, framealpha=0.9)
    
    plt.tight_layout()
    return fig


def plot_comparison_grid(results: Dict[str, SimulationResult]) -> plt.Figure:
    """Renders a 2x2 comparison plot of all four algorithms side-by-side."""
    fig, axes = plt.subplots(2, 2, figsize=(14, 9), dpi=120)
    axes_list = axes.flatten()

    colors = {
        "FCFS": "#3b82f6",
        "SSTF": "#10b981",
        "SCAN": "#f59e0b",
        "C-SCAN": "#8b5cf6"
    }

    for idx, (name, res) in enumerate(results.items()):
        ax = axes_list[idx]
        path = res.movement_path
        steps_y = list(range(len(path)))
        col = colors.get(name, "#2563eb")

        ax.plot(path, steps_y, color=col, linestyle="-", marker="o", markersize=5, linewidth=1.8, label=name)
        ax.scatter([path[0]], [steps_y[0]], color="#dc2626", s=90, marker="D", zorder=4, label="Start")
        ax.invert_yaxis()
        ax.set_xlim(res.min_track - 5, res.max_track + 5)
        ax.set_title(f"{name}: {res.total_movement} Tracks (Avg: {res.average_movement})", fontsize=11, fontweight="bold")
        ax.set_xlabel("Track Number", fontsize=9)
        ax.set_ylabel("Step", fontsize=9)
        ax.grid(True, linestyle=":", alpha=0.6)
        ax.legend(loc="lower right", fontsize=8)

    plt.suptitle("Side-by-Side Trajectory Comparison", fontsize=14, fontweight="bold", y=1.00)
    plt.tight_layout()
    return fig


# -----------------------------------------------------------------------------
# Sidebar: Configuration and Inputs
# -----------------------------------------------------------------------------
st.sidebar.image(
    "https://img.icons8.com/fluency/96/hard-drive.png",
    width=64
)
st.sidebar.title("Configuration")

# Presets selector
preset_choice = st.sidebar.selectbox(
    "Select Sample Preset:",
    options=[
        "Default Textbook Example (Silberschatz)",
        "Balanced Mixed Workload",
        "Clustered Requests with Duplicates",
        "Extreme Boundary Stress Test",
        "Custom Input"
    ],
    index=0
)

# Preset definitions
presets = {
    "Default Textbook Example (Silberschatz)": {
        "queue": "98, 183, 37, 122, 14, 124, 65, 67",
        "head": 53,
        "min": 0,
        "max": 199,
        "dir": "right"
    },
    "Balanced Mixed Workload": {
        "queue": "82, 170, 43, 140, 24, 16, 190",
        "head": 50,
        "min": 0,
        "max": 199,
        "dir": "right"
    },
    "Clustered Requests with Duplicates": {
        "queue": "30, 35, 35, 40, 180, 185",
        "head": 50,
        "min": 0,
        "max": 199,
        "dir": "left"
    },
    "Extreme Boundary Stress Test": {
        "queue": "0, 10, 50, 150, 199",
        "head": 100,
        "min": 0,
        "max": 199,
        "dir": "right"
    },
    "Custom Input": {
        "queue": "98, 183, 37, 122, 14, 124, 65, 67",
        "head": 53,
        "min": 0,
        "max": 199,
        "dir": "right"
    }
}

active_preset = presets[preset_choice]

input_queue = st.sidebar.text_area(
    "Request Queue (comma-separated):",
    value=active_preset["queue"],
    help="Enter disk cylinder / track request numbers separated by commas or spaces."
)

col_h1, col_h2 = st.sidebar.columns(2)
with col_h1:
    input_head = st.number_input(
        "Initial Head:",
        value=active_preset["head"],
        step=1,
        help="The track position where the read/write head begins."
    )
with col_h2:
    direction_idx = 1 if active_preset["dir"] == "right" else 0
    input_direction = st.selectbox(
        "Initial Direction:",
        options=["left", "right"],
        index=direction_idx,
        help="Direction of head travel for SCAN and C-SCAN (left = decreasing tracks, right = increasing tracks)."
    )

col_t1, col_t2 = st.sidebar.columns(2)
with col_t1:
    input_min_track = st.number_input(
        "Min Track:",
        value=active_preset["min"],
        step=1,
        help="Lowest addressable disk track cylinder (typically 0)."
    )
with col_t2:
    input_max_track = st.number_input(
        "Max Track:",
        value=active_preset["max"],
        step=1,
        help="Highest addressable disk track cylinder (typically 199 for 200 cylinders)."
    )

run_button = st.sidebar.button("🚀 Run Simulation", type="primary", width="stretch")

st.sidebar.markdown("---")
st.sidebar.markdown(
    """
    **Conventions Applied:**
    - Initial head is the **starting position**, not a serviced request.
    - Full physical movement is reported.
    - C-SCAN boundary wrap-around is counted as `|max_track - min_track|` physical tracks.
    - Equal seek ties in SSTF pick the lower track number first.
    """
)


# -----------------------------------------------------------------------------
# Main Application Header
# -----------------------------------------------------------------------------
st.title("💽 Disk Scheduling Algorithm Visualizer")
st.markdown(
    """
    A comprehensive educational simulator for operating system disk scheduling algorithms:
    **FCFS**, **SSTF**, **SCAN (Elevator)**, and **C-SCAN (Circular SCAN)**.
    Designed for Operating Systems laboratory courses, demonstrations, and viva preparation.
    """
)

# -----------------------------------------------------------------------------
# Execution & Validation Logic
# -----------------------------------------------------------------------------
reqs, head, min_t, max_t, dirn, error_msg = validate_inputs(
    raw_requests=input_queue,
    raw_head=input_head,
    raw_min_track=input_min_track,
    raw_max_track=input_max_track,
    direction=input_direction
)

if error_msg:
    st.error(f"⚠️ **Input Validation Error:** {error_msg}")
    st.info("💡 Please adjust your input parameters in the left sidebar and run the simulation again.")
    st.stop()

# Run all 4 algorithms
results = run_all_algorithms(
    requests=reqs,
    initial_head=head,
    min_track=min_t,
    max_track=max_t,
    direction=dirn
)

comparison_df = generate_comparison_table(results)
best_algo_row = comparison_df.iloc[0]
best_algo_name = best_algo_row["Algorithm"]
best_algo_moves = best_algo_row["Total Head Movement (tracks)"]
fcfs_moves = results["FCFS"].total_movement
savings_pct = round(((fcfs_moves - best_algo_moves) / fcfs_moves) * 100, 1) if fcfs_moves > 0 else 0

# -----------------------------------------------------------------------------
# Top Metric Highlights
# -----------------------------------------------------------------------------
m_col1, m_col2, m_col3, m_col4 = st.columns(4)
with m_col1:
    st.metric(
        label="🏆 Optimal Algorithm",
        value=best_algo_name,
        delta=f"{best_algo_moves} tracks"
    )
with m_col2:
    st.metric(
        label="📉 Reduction vs FCFS",
        value=f"{fcfs_moves - best_algo_moves} tracks",
        delta=f"-{savings_pct}% seek distance" if savings_pct > 0 else "0% (FCFS was best)"
    )
with m_col3:
    st.metric(
        label="🎯 Requests Serviced",
        value=f"{len(reqs)} requests",
        help="All requested tracks across the workload."
    )
with m_col4:
    st.metric(
        label="📍 Initial Head / Direction",
        value=f"Track {head}",
        delta=f"Moving {dirn.upper()}"
    )

st.markdown("---")

# -----------------------------------------------------------------------------
# Tabbed Workspace
# -----------------------------------------------------------------------------
tab_compare, tab_fcfs, tab_sstf, tab_scan, tab_cscan, tab_theory, tab_viva = st.tabs([
    "📊 Performance Comparison",
    "1️⃣ FCFS",
    "2️⃣ SSTF",
    "3️⃣ SCAN (Elevator)",
    "4️⃣ C-SCAN (Circular)",
    "📚 OS Concepts & Theory",
    "🎓 Faculty Viva Guide"
])


# =============================================================================
# TAB 1: Performance Comparison
# =============================================================================
with tab_compare:
    st.subheader("Algorithm Performance & Ranking")
    st.markdown(
        f"""
        Algorithms are ranked below by **Total Head Movement** (lower is better).
        The current winner for this workload is **{best_algo_name}** with **{best_algo_moves} tracks** of movement.
        """
    )

    st.dataframe(
        comparison_df,
        hide_index=True
    )

    st.markdown("### 📈 Comparative Trajectory Visualization")
    fig_grid = plot_comparison_grid(results)
    st.pyplot(fig_grid)
    plt.close(fig_grid)

    st.markdown("### 📋 Executive Takeaways")
    c1, c2 = st.columns(2)
    with c1:
        st.success(
            f"**Best Performer:** **{best_algo_name}** minimized mechanical arm wear by traveling only "
            f"**{best_algo_moves} tracks** (average seek distance of **{best_algo_row['Average Seek (tracks/req)']} tracks/request**)."
        )
    with c2:
        st.warning(
            f"**Baseline (FCFS):** FCFS required **{fcfs_moves} tracks**. While strictly fair with zero "
            f"reordering overhead, it frequently swings wildly back and forth across the disk surface."
        )


# =============================================================================
# Helper function for rendering individual algorithm detail tabs
# =============================================================================
def render_algorithm_detail(result: SimulationResult):
    st.subheader(f"{result.algorithm_name} Simulation Breakdown")
    
    # Key Metrics
    c_m1, c_m2, c_m3, c_m4 = st.columns(4)
    with c_m1:
        st.metric("Total Head Movement", f"{result.total_movement} tracks")
    with c_m2:
        st.metric("Average Seek Distance", f"{result.average_movement} tracks/req")
    with c_m3:
        st.metric("Requests Serviced", f"{len(result.serviced_requests)}")
    with c_m4:
        st.metric("Physical Steps", f"{len(result.steps)}")

    # Service Order Breadcrumbs
    st.markdown("**Servicing Sequence:**")
    order_badges = "  ➔  ".join([f"`{trk}`" for trk in result.serviced_requests])
    st.markdown(order_badges if order_badges else "*No requests serviced.*")

    # Matplotlib Chart
    st.markdown("### 📉 Head Movement Trajectory")
    chart_fig = plot_algorithm_path(result)
    st.pyplot(chart_fig)
    plt.close(chart_fig)

    # Step-by-Step Mathematical Calculation Table
    st.markdown("### 🔢 Step-by-Step Seek Calculations")
    st.caption("Each step records the physical transition from the current head track to the destination track.")
    step_df = result.to_dataframe()
    st.dataframe(step_df, hide_index=True)

    # Calculation Summary Box
    calc_str = " + ".join([str(s.distance) for s in result.steps]) if result.steps else "0"
    st.info(
        f"**Mathematical Proof:**\n\n"
        f"$$\\text{{Total Movement}} = {calc_str} = {result.total_movement}\\text{{ tracks}}$$\n\n"
        f"$$\\text{{Average Seek}} = \\frac{{{result.total_movement}}}{{{result.request_count}}} = {result.average_movement}\\text{{ tracks/request}}$$"
    )

    # Algorithm Notes & Assumptions
    if result.notes:
        st.markdown("**Algorithm Behavior Notes:**")
        for n in result.notes:
            st.markdown(f"- {n}")


# =============================================================================
# TAB 2: FCFS Detail
# =============================================================================
with tab_fcfs:
    render_algorithm_detail(results["FCFS"])
    st.markdown("---")
    st.markdown(
        """
        #### How FCFS Works:
        - Tracks are serviced strictly in the order they arrived in the I/O queue.
        - **Pros:** Completely fair, simple to implement, zero CPU scheduling overhead, impossible to cause starvation.
        - **Cons:** Suffers from the "wild swing" problem. Seek time is usually unacceptably high.
        """
    )


# =============================================================================
# TAB 3: SSTF Detail
# =============================================================================
with tab_sstf:
    render_algorithm_detail(results["SSTF"])
    st.markdown("---")
    st.markdown(
        """
        #### How SSTF Works:
        - From the current head location, services whichever pending request requires the smallest seek distance.
        - **Tie-Breaking Rule in Visualizer:** When two pending requests are equidistant, the lower track number is picked.
        - **Pros:** Drastically cuts down total seek distance compared to FCFS; high throughput under typical workloads.
        - **Cons:** Starvation risk! Tracks located far from the current head cluster may wait indefinitely if new closer requests keep arriving.
        """
    )


# =============================================================================
# TAB 4: SCAN Detail
# =============================================================================
with tab_scan:
    render_algorithm_detail(results["SCAN"])
    st.markdown("---")
    st.markdown(
        f"""
        #### How SCAN (Elevator Algorithm) Works:
        - The read/write arm moves in one direction (currently **{dirn}**), servicing all requests in that direction.
        - It continues until it reaches the physical disk boundary (**track {max_t if dirn == 'right' else min_t}**).
        - At the boundary, it reverses direction and services the remaining requests on the return journey.
        - **Pros:** Prevents starvation; provides a much more uniform response time than SSTF.
        - **Cons:** Inefficient when few requests exist at the far edge; requests just behind the arm wait until the round-trip completes.
        """
    )


# =============================================================================
# TAB 5: C-SCAN Detail
# =============================================================================
with tab_cscan:
    render_algorithm_detail(results["C-SCAN"])
    st.markdown("---")
    st.markdown(
        f"""
        #### How C-SCAN (Circular SCAN) Works:
        - The head moves in a single direction (currently **{dirn}**), servicing requests until it hits the boundary.
        - Instead of reversing and servicing on the return trip, it wraps around directly to the opposite disk boundary
          without servicing requests during the rapid return.
        - Once at the beginning, it resumes servicing in the same original direction.
        - **Counting Convention:** The rapid wrap-around is a physical cylinder jump across the disk platter
          (`|{max_t} - {min_t}| = {abs(max_t - min_t)}` tracks) and is explicitly included in the total physical movement.
        - **Pros:** Provides the most uniform and predictable wait times of all directional algorithms.
        - **Cons:** Extra travel cost for the unserviced return wrap-around.
        """
    )


# =============================================================================
# TAB 6: Educational Concepts & Theory
# =============================================================================
with tab_theory:
    st.header("📖 Operating Systems: Disk Scheduling Fundamentals")
    
    st.markdown(
        """
        ### 1. What is Disk Scheduling and Why is it Necessary?
        In modern computer systems, the secondary storage subsystem (traditional hard disk drives or high-density storage)
        is orders of magnitude slower than main memory (RAM) and the CPU.

        Because multiple processes concurrently request read and write operations on different disk blocks, requests
        accumulate in an **I/O request queue**. The operating system's disk scheduling algorithm is responsible for
        deciding the order in which these pending I/O requests are serviced by the physical drive head.

        **Primary Objectives of Disk Scheduling:**
        1. **Minimize Seek Time:** Seek time is the physical movement of the mechanical arm to the desired cylinder.
        2. **Maximize Throughput:** Maximize the number of I/O requests serviced per unit time.
        3. **Ensure Fairness:** Prevent starvation where distant tracks wait indefinitely.
        4. **Minimize Variance in Response Time:** Provide predictable latency for interactive processes.
        """
    )

    st.markdown("---")
    st.markdown(
        """
        ### 2. Physical Anatomy of a Hard Disk Drive (HDD)
        A magnetic hard disk consists of several physical components:
        - **Platters:** Circular magnetic disks coated with a magnetic material on both surfaces.
        - **Spindle:** Rotates the platters at constant speeds (e.g., 5400 RPM, 7200 RPM, 15000 RPM).
        - **Tracks:** Concentric circular rings on each platter surface where data is recorded.
        - **Sectors:** Small subdivisions of a track (commonly 512 bytes or 4 KB).
        - **Cylinders:** The set of all tracks across all platter surfaces at the same radial arm position.
        - **Read/Write Head:** Aerodynamically floats just above the surface to read and write magnetic flux.
        - **Actuator Arm:** Moves all read/write heads simultaneously across cylinders.
        """
    )

    st.markdown("---")
    st.markdown(
        """
        ### 3. Components of Total Disk Access Time
        Whenever an I/O request is processed, the total time required is:

        $$\\text{Total Access Time} = \\text{Seek Time} + \\text{Rotational Latency} + \\text{Transfer Time} + \\text{Controller Overhead}$$

        | Component | Description | Typical Duration | Can OS Algorithm Optimize? |
        | :--- | :--- | :--- | :--- |
        | **Seek Time** | Time for the arm to move to the target cylinder/track | **3 - 10 ms (Dominant!)** | **YES** (Focus of Disk Scheduling) |
        | **Rotational Latency** | Time for target sector to rotate under the head | 2 - 4 ms (half rotation) | Partial (Rotational Scheduling) |
        | **Transfer Time** | Time to magnetically stream data to/from disk buffer | < 1 ms (data size / rate) | No (Hardware dependent) |
        | **Controller Overhead**| Handshake and command processing by disk controller | < 0.2 ms | No (Firmware/Bus dependent) |

        > **Key Takeaway:** Because **Seek Time** accounts for the vast majority of physical delay, disk scheduling
        > algorithms focus almost exclusively on minimizing head movement across cylinders.
        """
    )

    st.markdown("---")
    st.markdown(
        """
        ### 4. Comprehensive Comparison of the Four Algorithms

        | Metric / Trait | FCFS | SSTF | SCAN (Elevator) | C-SCAN |
        | :--- | :--- | :--- | :--- | :--- |
        | **Selection Principle** | Arrival order (FIFO) | Nearest cylinder | Sweeps to boundary, reverses | Sweeps to boundary, wraps |
        | **Average Seek Time** | Very High | Low to Very Low | Moderate to Low | Moderate |
        | **Starvation Risk** | Zero (impossible) | High for distant tracks | Low | Zero |
        | **Wait Time Uniformity** | Low (erratic) | Poor (clustered favor) | Moderate | **Highest / Most Uniform** |
        | **Complexity** | $O(1)$ queue pop | $O(N)$ seek search | $O(N \\log N)$ sort | $O(N \\log N)$ sort |
        | **Typical Use Case** | Low-load / simple controllers | Batch systems, small queues | General multi-user OS | High-concurrency servers |
        """
    )


# =============================================================================
# TAB 7: Faculty Viva Guide
# =============================================================================
with tab_viva:
    st.header("🎓 Faculty Viva Voce & Demonstration Guide")
    st.markdown(
        """
        Use this interactive guide to prepare for examiner and faculty viva questions.
        Click on any question to review the answer.
        """
    )

    viva_qas = [
        (
            "Q1: What is the primary difference between Seek Time and Rotational Latency?",
            "**Seek Time** is the time taken by the physical read/write head assembly to travel radially "
            "from its current cylinder to the destination cylinder. **Rotational Latency** is the delay while "
            "the spindle rotates the disk platter until the target sector passes directly beneath the head. "
            "Seek time is the larger mechanical delay and is the parameter optimized by disk scheduling algorithms."
        ),
        (
            "Q2: Why does SSTF suffer from starvation?",
            "SSTF always services the request with the smallest seek distance from the current head position. "
            "If a steady stream of requests arrives near the current head position (localized workload), the arm "
            "will continue servicing them, while requests for distant tracks are postponed indefinitely. This is known "
            "as starvation or indefinite postponement."
        ),
        (
            "Q3: How does SCAN solve the starvation problem present in SSTF?",
            "SCAN (the Elevator Algorithm) continuously sweeps across the disk from one end to the other, servicing all "
            "requests encountered along the way before reversing at the disk boundary. Because the arm sweeps across every "
            "cylinder from boundary to boundary, every pending request is guaranteed to be serviced within at most two sweeps, "
            "completely eliminating starvation."
        ),
        (
            "Q4: Why was C-SCAN developed if SCAN already eliminated starvation?",
            "In SCAN, when the arm reverses at a boundary, cylinders near that boundary were just serviced and have very few "
            "new requests, whereas cylinders at the opposite end have been waiting the longest and have the densest request accumulation. "
            "C-SCAN (Circular SCAN) solves this bias by always servicing in one direction. Once it reaches the end, it wraps around "
            "to the other end without servicing requests on the return journey. This provides a much more uniform waiting time."
        ),
        (
            "Q5: How does your implementation count the C-SCAN wrap-around?",
            "Our visualizer uses the complete physical movement counting convention: the rapid return from the outer boundary "
            "(e.g., track 199) to the inner boundary (track 0) is a physical movement of |199 - 0| = 199 tracks. "
            "We explicitly document this in our step-by-step calculation table and visual trajectory."
        ),
        (
            "Q6: Does modern SSD (Solid State Drive) storage use disk scheduling algorithms?",
            "Traditional disk scheduling algorithms (SSTF, SCAN, C-SCAN) were designed specifically to minimize mechanical seek time "
            "in magnetic hard drives. SSDs have no moving mechanical parts, platters, or arms; they access flash memory cells in constant time. "
            "Consequently, modern SSDs do not require cylinder seek scheduling, but instead use I/O scheduling optimized for internal wear leveling, "
            "flash block erasure, and command queuing (NVMe / NCQ)."
        ),
        (
            "Q7: How did you handle duplicate track requests in your project?",
            "In algorithms.py, our pending request queue maintains separate entries for duplicate requests. For instance, if track 35 is "
            "requested twice, SSTF services the first instance, and the second instance is serviced immediately afterwards with a seek distance "
            "of 0 tracks. This correctly simulates duplicate I/O requests from separate processes."
        )
    ]

    for question, answer in viva_qas:
        with st.expander(question):
            st.markdown(answer)

# -----------------------------------------------------------------------------
# Footer
# -----------------------------------------------------------------------------
st.markdown("---")
st.caption(
    "Disk Scheduling Algorithm Visualizer • Built for Operating Systems Academic Demonstration • "
    "Local Localhost Deployment • 100% Tested & Verified"
)
