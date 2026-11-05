import React, { useState } from 'react';
import { Copy, Check, Terminal, FileText, Activity, Layers, Disc } from 'lucide-react';
import BentoCard from './BentoCard';
import { playKeyClick } from '../utils/soundEffects';

export default function AsciiDiagrams({
  activeResult,
  currentTrack = 53,
  minTrack = 0,
  maxTrack = 199,
  servicedRequests = [],
  pendingRequests = [],
  theme = 'base',
}) {
  const isDark = theme === 'dark';
  const [copiedId, setCopiedId] = useState(null);
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline', 'trajectory', 'platter', 'files'

  const copyToClipboard = (text, id) => {
    playKeyClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. Generate ASCII Data Flow Pipeline
  const asciiPipeline = `================================================================================
          STORAGE ACCESS DATA FLOW STATE MACHINE (KERNEL TO HARDWARE)
================================================================================

+-----------------------------------------------------------------------------+
| 01. USER PROCESS                                                            |
|     read(fd, buffer, 4096)  --> CPU Trap (Syscall 0x80)                     |
|     Process State: RUNNING ===> BLOCKED (TASK_UNINTERRUPTIBLE)              |
+--------------------------------------|--------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------+
| 02. VIRTUAL FILE SYSTEM (VFS) & EXT4/NTFS INODE LAYER                       |
|     Map File Descriptor -> Inode -> Logical Block Address (LBA)             |
+--------------------------------------|--------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------+
| 03. KERNEL PAGE / BUFFER CACHE LOOKUP (RAM)                                 |
|     Check Radix-Tree / XArray for cached block memory pages                 |
+--------------------------------------|--------------------------------------+
                   |                                       |
     [CACHE HIT: 0 Seek Time]                 [CACHE MISS: Fetch from Disk]
                   |                                       |
                   v                                       v
+-------------------------------------+ +-------------------------------------+
| Immediate Zero-Copy RAM Transfer    | | Allocate struct bio / block request |
| Skip physical arm movement!         | | Queue to Block Device Driver        |
| Process State ===> READY (0.001 ms) | +------------------|------------------+
+-------------------------------------+                    |
                                                           v
+-----------------------------------------------------------------------------+
| 04. I/O REQUEST QUEUE & ELEVATOR SCHEDULER                                  |
|     Algorithm (${activeResult?.algorithmName || 'SSTF'}) reorders cylinder queue to minimize travel   |
+--------------------------------------|--------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------+
| 05. MECHANICAL VOICE COIL MOTOR ACTUATOR (ARM SEEK)                         |
|     Arm sweeps radially to target cylinder: CYL ${currentTrack}                         |
|     Seek Time: T_seek = a + b * sqrt(tracks_traveled)  (~3.0 to 9.0 ms)     |
+--------------------------------------|--------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------+
| 06. SPINDLE MOTOR ROTATIONAL LATENCY                                        |
|     Wait for target sector to rotate underneath magnetic read head          |
|     Rotational Delay: 0.5 * (60 / 7200 RPM) = ~4.17 ms                      |
+--------------------------------------|--------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------+
| 07. MAGNETIC READ SENSOR & DMA CONTROLLER                                   |
|     TMR sensor reads magnetic flux -> DMA streams block to Kernel DRAM      |
|     PCIe/SATA Bus Transfer: ~0.05 ms (0% CPU Overhead)                      |
+--------------------------------------|--------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------+
| 08. HARDWARE IRQ & PROCESS WAKEUP                                           |
|     Disk Controller triggers Interrupt (MSI-X) -> Kernel wakes process      |
|     Process State: BLOCKED ===> READY on CPU Runqueue                       |
+-----------------------------------------------------------------------------+`;

  // 2. Generate ASCII Trajectory Timeline
  const generateAsciiTrajectory = () => {
    if (!activeResult) return 'No active simulation data.';
    let out = `================================================================================\n`;
    out += `          ${activeResult.algorithmName} ASCII HEAD SEEK TRAJECTORY MAP\n`;
    out += `          Total Seek: ${activeResult.totalMovement} Tracks | Average Seek: ${activeResult.averageMovement} tracks/req\n`;
    out += `================================================================================\n\n`;
    out += `Step  | From -> To    | Seek Dist | Cumulative | Action      | Progress Diagram [Cyl ${minTrack} .. ${maxTrack}]\n`;
    out += `------+---------------+-----------+------------+-------------+------------------------------------------------\n`;

    // Step 0: Start
    const startNorm = Math.round(((activeResult.initialHead - minTrack) / (maxTrack - minTrack)) * 40);
    const startBar = ' '.repeat(startNorm) + '[H:' + activeResult.initialHead + ']' + ' '.repeat(Math.max(0, 40 - startNorm));
    out += `S0    | Start at ${activeResult.initialHead}  | 0 tracks  | 0 tracks   | INITIAL     | ${startBar}\n`;

    activeResult.steps.forEach((s) => {
      const fromNorm = Math.round(((s.fromTrack - minTrack) / (maxTrack - minTrack)) * 40);
      const toNorm = Math.round(((s.toTrack - minTrack) / (maxTrack - minTrack)) * 40);
      
      let diagram = Array(45).fill(' ');
      const minN = Math.min(fromNorm, toNorm);
      const maxN = Math.max(fromNorm, toNorm);
      for (let k = minN; k <= maxN; k++) {
        diagram[k] = s.stepType === 'WRAP_AROUND' ? '=' : '-';
      }
      diagram[toNorm] = s.stepType === 'WRAP_AROUND' ? '<' : s.toTrack > s.fromTrack ? '>' : '<';

      const diagStr = diagram.join('');
      const stepLabel = `S${s.stepNumber}`.padEnd(5);
      const moveLabel = `${s.fromTrack} -> ${s.toTrack}`.padEnd(13);
      const distLabel = `${s.distance} trk`.padEnd(9);
      const cumLabel = `${s.cumulative} trk`.padEnd(10);
      const typeLabel = s.stepType.padEnd(11);

      out += `${stepLabel} | ${moveLabel} | ${distLabel} | ${cumLabel} | ${typeLabel} | ${diagStr} [${s.toTrack}]\n`;
    });

    out += `------+---------------+-----------+------------+-------------+------------------------------------------------\n`;
    out += `TOTAL | ${activeResult.steps.length} Transitions | ${activeResult.totalMovement} tracks | Average: ${activeResult.averageMovement} tracks/req\n`;
    return out;
  };

  // 3. Generate ASCII Platter Cylinder Radar Map
  const generateAsciiPlatter = () => {
    let out = `================================================================================\n`;
    out += `                   ASCII CONCENTRIC CYLINDER RADAR MAP\n`;
    out += `================================================================================\n\n`;
    out += `                    .---------------------------------.\n`;
    out += `                 .-'       TRACK 199 (MAX BOUNDARY)    '-.\n`;
    out += `               .'    .-------------------------------.    '.\n`;
    out += `              /    .'      TRACK 150 (OUTER CYLINDERS) '.   \\\n`;
    out += `             /    /    .---------------------------.    \\    \\\n`;
    out += `            |    |    /    TRACK 100 (MID CYLINDERS)\\    |    |\n`;
    out += `            |    |   |    .---------------------.    |   |    |\n`;
    out += `            |    |   |   /   TRACK 50 (INNER)    \\   |   |    |    ACTUATOR ARM:\n`;
    out += `            |    |   |  |   .--------------.      |  |   |    |   /==============[ PIVOT ]\n`;
    out += `            |    |   |  |  /  TRACK 0 (HUB) \\     |  |   |    |  /  (Voice Coil Motor)\n`;
    out += `            |    |   |  | |   ( SPINDLE )   |     |  |   |    | / \n`;
    out += `            |    |   |  |  \\   7200 RPM    /      |  |   |    |/   HEAD READ SLIDER:\n`;
    out += `            |    |   |  |   '--------------'      |  |   |    +=====> [CYL ${String(currentTrack).padStart(3, '0')}]\n`;
    out += `            |    |   |   \\                       /   |   |    |\n`;
    out += `            |    |   |    '---------------------'    |   |    |\n`;
    out += `            |    |    \\                             /    |    |\n`;
    out += `            |    |     '---------------------------'     |    |\n`;
    out += `             \\    \\                                     /    /\n`;
    out += `              \\    '.                                 .'    /\n`;
    out += `               '.    '-------------------------------'    .'\n`;
    out += `                 '-.                                   .-'\n`;
    out += `                    '---------------------------------'\n\n`;
    out += `  [CURRENT HEAD: CYL ${currentTrack}] | [PENDING: ${pendingRequests.join(', ') || 'None'}] | [SERVICED: ${servicedRequests.join(', ') || 'None'}]\n`;
    return out;
  };

  // 4. Generate ASCII File Allocation Models
  const asciiFiles = `================================================================================
       FILE ALLOCATION & DIRECTORY METHODS: ARCHITECTURAL COMPARISON
================================================================================

1. CONTIGUOUS ALLOCATION:
   Directory Table:
   +---------------+-------------+--------------+------------------------------+
   | File Name     | Start Block | Block Length | Direct Access Formula        |
   +---------------+-------------+--------------+------------------------------+
   | report.pdf    | Block 04    | 4 blocks     | LBA = Start + Offset  [O(1)] |
   | music.mp3     | Block 12    | 6 blocks     | LBA = Start + Offset  [O(1)] |
   +---------------+-------------+--------------+------------------------------+

   Physical Disk Blocks (64-Block Array):
   [00][01][02][03] [04][05][06][07] [08][09][10][11] [12][13][14][15][16][17]
   [ FREE BLOCKS  ] [  report.pdf  ] [ FREE BLOCKS  ] [      music.mp3       ]
   * Advantage: Instant direct block access with single seek.
   * Drawback : Severe External Fragmentation (Free space broken into small gaps).

--------------------------------------------------------------------------------

2. LINKED ALLOCATION & FAT (FILE ALLOCATION TABLE):
   Directory Table: [file.log | Start: 03 | End: 19]

   Pointer Chain Across Scattered Disk Blocks:
   +------------+      +------------+      +------------+      +------------+
   |  BLOCK 03  | ---> |  BLOCK 08  | ---> |  BLOCK 14  | ---> |  BLOCK 19  |
   | [Data] Ptr |      | [Data] Ptr |      | [Data] Ptr |      | [Data] EOF |
   +------------+      +------------+      +------------+      +------------+

   In-Memory FAT Table:
   FAT Index: [00] [01] [02] [03] [04] ... [08] ... [14] ... [19]
   Entry Val: [ -] [ -] [ -] [08] [ -] ... [14] ... [19] ... [EOF]
   * Advantage: ZERO external fragmentation; files can grow dynamically anywhere.
   * Drawback : Random access to block K requires K sequential disk seeks [O(N)].

--------------------------------------------------------------------------------

3. UNIX INODE INDEXED ALLOCATION:
   +-----------------------------------------------------------+
   | INODE #1024  (File Metadata: permissions, size, owner)    |
   +-----------------------------------------------------------+
   | [01] Direct Pointer 0  ===> [ Physical Disk Block 21 ]    |
   | [02] Direct Pointer 1  ===> [ Physical Disk Block 22 ]    |
   | [03] Direct Pointer 2  ===> [ Physical Disk Block 23 ]    |
   | [04] Direct Pointer 3  ===> [ Physical Disk Block 24 ]    |
   | [05] Single Indirect   ===> [ Pointer Block 40 ]          |
   |                             |--> [Block 50, 51, 52, 53]   |
   | [06] Double Indirect   ===> [ Index of Index Blocks ]     |
   |                             |--> [Table 60] -> [Data...]  |
   +-----------------------------------------------------------+
   * Advantage: Fast direct access AND dynamic sizing with 0% external fragmentation!`;

  const tabs = [
    { id: 'pipeline', label: '01 // Data Flow Pipeline', icon: Activity },
    { id: 'trajectory', label: '02 // Head Trajectory', icon: Disc },
    { id: 'platter', label: '03 // Platter Radar', icon: Layers },
    { id: 'files', label: '04 // Allocation Models', icon: FileText },
  ];

  return (
    <BentoCard
      title="ARCHITECTURAL SCHEMATICS & MONOSPACE FLOW GRAPHS"
      subtitle="Pure text-based technical diagrams for academic documentation & viva notes"
      badge="ASCII SCHEMATICS"
      badgeColor="neutral"
      icon={Terminal}
    >
      <div className="space-y-4">
        {/* Navigation Strip */}
        <div
          className={`flex items-center justify-between pb-3 border-b flex-wrap gap-3 ${
            isDark ? 'border-[#24242e]' : 'border-[#0d0d11]/15'
          }`}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    playKeyClick();
                    setActiveTab(tab.id);
                  }}
                  className={`px-3 py-1.5 text-xs font-mono-tech tracking-wider uppercase transition-colors flex items-center gap-2 border ${
                    isActive
                      ? isDark
                        ? 'bg-[#f2f2f2] text-[#07070a] border-[#f2f2f2] font-semibold'
                        : 'bg-[#0d0d11] text-[#f2f2f2] border-[#0d0d11] font-semibold'
                      : isDark
                      ? 'bg-[#101018] text-[#8c8b94] border-[#24242e] hover:text-[#f2f2f2] hover:border-[#383848]'
                      : 'bg-[#fdfcf7] text-[#6b6a72] border-[#0d0d11]/15 hover:text-[#0d0d11] hover:border-[#0d0d11]/30'
                  }`}
                >
                  <tab.icon size={12} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Copy Button */}
          <button
            onClick={() => {
              const textMap = {
                pipeline: asciiPipeline,
                trajectory: generateAsciiTrajectory(),
                platter: generateAsciiPlatter(),
                files: asciiFiles,
              };
              copyToClipboard(textMap[activeTab], activeTab);
            }}
            className={`px-3 py-1.5 border font-mono-tech text-xs tracking-wider uppercase flex items-center gap-2 transition-colors ${
              copiedId === activeTab
                ? 'bg-[#891a20] text-white border-[#891a20]'
                : isDark
                ? 'bg-[#15151f] text-[#d6d5dc] border-[#24242e] hover:border-[#f2f2f2]'
                : 'bg-[#fdfcf7] text-[#0d0d11] border-[#0d0d11]/20 hover:border-[#0d0d11]'
            }`}
          >
            {copiedId === activeTab ? (
              <>
                <Check size={12} className="text-white" />
                <span className="font-semibold">Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy Monospace ASCII</span>
              </>
            )}
          </button>
        </div>

        {/* Viewport */}
        <div
          className={`border p-5 overflow-x-auto max-h-[520px] overflow-y-auto font-mono-tech text-[11.5px] leading-relaxed transition-colors ${
            isDark
              ? 'bg-[#050508] border-[#24242e] text-[#d6d5dc]'
              : 'bg-[#fdfcf7] border-[#0d0d11]/15 text-[#1b1b1e]'
          }`}
        >
          <pre className="select-text whitespace-pre font-mono-tech">
            {activeTab === 'pipeline' && asciiPipeline}
            {activeTab === 'trajectory' && generateAsciiTrajectory()}
            {activeTab === 'platter' && generateAsciiPlatter()}
            {activeTab === 'files' && asciiFiles}
          </pre>
        </div>

        {/* Archival metadata caption */}
        <div className="flex items-center justify-between text-[11px] font-mono-tech text-[#8c8b94] pt-1">
          <span>FORMAT: 80-COLUMN MONOSPACE RAW PLAINTEXT</span>
          <span>COMPLIANT: IEEE OS SPEC // ACADEMIC VIVA SUBMISSION READY</span>
        </div>
      </div>
    </BentoCard>
  );
}
