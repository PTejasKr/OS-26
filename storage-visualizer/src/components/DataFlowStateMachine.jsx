import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Layers,
  Database,
  ListOrdered,
  Disc,
  RotateCw,
  Zap,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import BentoCard from './BentoCard';
import { playKeyClick, playReadPulse, playCacheHitSound } from '../utils/soundEffects';

export const PIPELINE_STATES = [
  {
    id: 'user_syscall',
    stepNumber: 1,
    title: 'User Syscall',
    subtitle: 'Process read(fd, buf, size)',
    icon: Cpu,
    color: 'neutral',
    kernelContext: 'CPU Mode Switch: Ring 3 (User) ➔ Ring 0 (Kernel)',
    durationMs: '0.002 ms',
    shortDuration: '0.002 ms',
    description: 'Process issues a blocking read() system call. CPU executes a software interrupt (SYSCALL), saving user registers onto the kernel stack. Process state transitions from RUNNING to BLOCKED (TASK_INTERRUPTIBLE).',
    structDetails: 'struct task_struct { state = TASK_UNINTERRUPTIBLE; ... }',
  },
  {
    id: 'vfs_inode',
    stepNumber: 2,
    title: 'VFS & Inode Lookup',
    subtitle: 'Logical offset ➔ LBA block',
    icon: Layers,
    color: 'neutral',
    kernelContext: 'Virtual File System (VFS)',
    durationMs: '0.008 ms',
    shortDuration: '0.008 ms',
    description: 'VFS resolves file descriptor to struct file and struct inode. Ext4/NTFS file system maps logical file byte offset into target Logical Block Address (LBA) on the physical disk partition.',
    structDetails: 'ext4_map_blocks(handle, inode, &map, 0)',
  },
  {
    id: 'buffer_cache',
    stepNumber: 3,
    title: 'Page / Buffer Cache',
    subtitle: 'Memory lookup (Hit vs Miss)',
    icon: Database,
    color: 'neutral',
    kernelContext: 'Kernel Page Cache (RAM)',
    durationMs: '0.001 ms (Hit) / 0.05 ms (Miss)',
    shortDuration: '0.001 - 0.05 ms',
    description: 'Kernel checks the Radix Tree / XArray page cache in RAM. If the block is already cached (CACHE HIT), data is copied immediately with ZERO physical disk seek! If CACHE MISS, an I/O bio packet is allocated.',
    structDetails: 'struct page *page = find_get_page(mapping, index);',
    hasDecisionGate: true,
  },
  {
    id: 'io_scheduler',
    stepNumber: 4,
    title: 'I/O Scheduler Queue',
    subtitle: 'Algorithm queue sorting',
    icon: ListOrdered,
    color: 'neutral',
    kernelContext: 'Block Device Elevator Queue',
    durationMs: '0.015 ms',
    shortDuration: '0.015 ms',
    description: 'The requested sector is placed into the disk request queue. The active disk scheduling algorithm (FCFS, SSTF, SCAN, LOOK) sorts and merges requests to minimize mechanical actuator travel.',
    structDetails: 'struct request_queue *q; blk_mq_submit_bio(bio);',
  },
  {
    id: 'arm_seek',
    stepNumber: 5,
    title: 'Mechanical Arm Seek',
    subtitle: 'Radial travel to cylinder',
    icon: Disc,
    color: 'accent',
    kernelContext: 'Hardware Actuator Voice Coil Motor',
    durationMs: '3.0 - 9.0 ms (DOMINANT)',
    shortDuration: '3.0 - 9.0 ms',
    description: 'The Voice Coil Motor (VCM) accelerates the mechanical read/write arm assembly radially across platters until the slider aligns with the target track cylinder. This seek time is the primary bottleneck optimized by OS schedulers.',
    structDetails: 'Formula: T_seek = a + b * sqrt(tracks_traveled)',
  },
  {
    id: 'rotational_latency',
    stepNumber: 6,
    title: 'Rotational Latency',
    subtitle: 'Waiting for sector under head',
    icon: RotateCw,
    color: 'accent',
    kernelContext: 'Platter Spindle Motor',
    durationMs: '4.17 ms (@ 7200 RPM)',
    shortDuration: '4.17 ms',
    description: 'The head is poised on the cylinder, but must wait for the magnetic platter to rotate the requested sector directly underneath the read gap. Average rotational delay is half a full revolution (1 / (2 * RPM/60)).',
    structDetails: 'T_rot = 0.5 * (60 / RPM) = 4.17 ms at 7200 RPM',
  },
  {
    id: 'dma_transfer',
    stepNumber: 7,
    title: 'Magnetic Read & DMA',
    subtitle: 'Controller ➔ Kernel RAM',
    icon: Zap,
    color: 'neutral',
    kernelContext: 'Direct Memory Access (DMA)',
    durationMs: '0.15 - 0.40 ms',
    shortDuration: '0.15 - 0.40 ms',
    description: 'Magnetic flux reversals induce electrical signals in the TMR head sensor. The disk controller decodes ECC sectors and streams raw data directly into host RAM via Direct Memory Access (DMA) over PCIe/SATA with 0% CPU overhead.',
    structDetails: 'dma_async_issue_pending(chan); transfer_size = 4096 bytes;',
  },
  {
    id: 'process_wakeup',
    stepNumber: 8,
    title: 'IRQ & Wakeup',
    subtitle: 'Process BLOCKED ➔ READY',
    icon: CheckCircle2,
    color: 'neutral',
    kernelContext: 'Hardware Interrupt Handler',
    durationMs: '0.005 ms',
    shortDuration: '0.005 ms',
    description: 'Disk controller asserts hardware interrupt (MSI-X). CPU IRQ handler acknowledges transfer, copies data to user buffer, and moves process from WAIT queue back to CPU READY runqueue to resume execution!',
    structDetails: 'try_to_wake_up(task, TASK_NORMAL, 0); return bytes_read;',
  },
];

export default function DataFlowStateMachine({
  activeAlgorithm = 'SSTF',
  activeTrack = 65,
  previousTrack = 53,
  seekDistance = 12,
  theme = 'base',
}) {
  const isDark = theme === 'dark';
  const [activeStepId, setActiveStepId] = useState('arm_seek');
  const [isSimulatingPacket, setIsSimulatingPacket] = useState(false);
  const [packetStepIndex, setPacketStepIndex] = useState(0);

  // Trigger automated animated data packet flow
  const runPacketFlow = (forceHit = false) => {
    setIsSimulatingPacket(true);
    setPacketStepIndex(0);
    playKeyClick();

    const maxSteps = forceHit ? 3 : PIPELINE_STATES.length;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < maxSteps) {
        setPacketStepIndex(currentStep);
        setActiveStepId(PIPELINE_STATES[currentStep].id);
        if (currentStep === 2 && forceHit) {
          playCacheHitSound();
        } else {
          playReadPulse();
        }
      } else {
        clearInterval(interval);
        setIsSimulatingPacket(false);
      }
    }, 850);
  };

  const selectedState = PIPELINE_STATES.find((s) => s.id === activeStepId) || PIPELINE_STATES[0];

  return (
    <div className="space-y-6">
      {/* Top Banner & Interactive Controls */}
      <div
        className={`p-6 border flex flex-wrap items-center justify-between gap-6 transition-colors ${
          isDark
            ? 'bg-[#101018] border-[#24242e]'
            : 'bg-[#fdfcf7] border-[#0d0d11]/15'
        }`}
      >
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl md:text-3xl font-tall font-bold uppercase tracking-tight">
              STORAGE ACCESS DATA FLOW STATE MACHINE
            </h2>
            <span
              className={`text-[10px] px-2 py-0.5 border font-mono-tech uppercase tracking-widest ${
                isDark
                  ? 'border-[#24242e] bg-[#15151f] text-[#8c8b94]'
                  : 'border-[#0d0d11]/20 bg-[#f2f2f2] text-[#6b6a72]'
              }`}
            >
              MICROSECOND TELEMETRY
            </span>
          </div>
          <p
            className={`font-editorial italic text-sm mt-1 max-w-3xl ${
              isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
            }`}
          >
            End-to-end trace of storage migration: from Ring 3 system call through VFS, buffer cache lookup, I/O elevator sorting, physical arm sweep, and DMA completion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => runPacketFlow(false)}
            disabled={isSimulatingPacket}
            className={`px-4 py-2 text-xs font-mono-tech uppercase tracking-wider border flex items-center gap-2 transition-all ${
              isDark
                ? 'bg-[#f2f2f2] text-[#07070a] border-[#f2f2f2] hover:bg-white disabled:opacity-50'
                : 'bg-[#0d0d11] text-[#f2f2f2] border-[#0d0d11] hover:bg-black disabled:opacity-50'
            }`}
          >
            <Sparkles size={13} />
            <span>Trace Disk Read (Cache Miss)</span>
          </button>

          <button
            onClick={() => runPacketFlow(true)}
            disabled={isSimulatingPacket}
            className={`px-4 py-2 text-xs font-mono-tech uppercase tracking-wider border flex items-center gap-2 transition-all ${
              isDark
                ? 'bg-[#15151f] text-[#d6d5dc] border-[#24242e] hover:border-[#f2f2f2] disabled:opacity-50'
                : 'bg-[#fdfcf7] text-[#0d0d11] border-[#0d0d11]/20 hover:border-[#0d0d11] disabled:opacity-50'
            }`}
          >
            <Zap size={13} />
            <span>Trace Page Cache Hit (0 Seek)</span>
          </button>
        </div>
      </div>

      {/* Interactive Horizontal Pipeline Visualizer */}
      <div
        className={`p-6 border overflow-x-auto no-scrollbar transition-colors ${
          isDark
            ? 'bg-[#0c0c12] border-[#24242e]'
            : 'bg-[#f8f7f2] border-[#0d0d11]/15'
        }`}
      >
        <div className="min-w-[920px] flex items-start justify-between relative pt-3 pb-2">
          {/* Connecting Line Track running through vertical center of 48px square nodes */}
          <div
            className={`absolute top-[35px] left-10 right-10 h-[2px] z-0 ${
              isDark ? 'bg-[#24242e]' : 'bg-[#0d0d11]/15'
            }`}
          />
          <div
            className="absolute top-[35px] left-10 h-[2px] bg-[#891a20] z-0 transition-all duration-500"
            style={{
              width: `${(packetStepIndex / (PIPELINE_STATES.length - 1)) * 90}%`,
            }}
          />

          {PIPELINE_STATES.map((state, idx) => {
            const Icon = state.icon;
            const isSelected = activeStepId === state.id;
            const isPacketHere = isSimulatingPacket && packetStepIndex === idx;

            return (
              <div
                key={state.id}
                onClick={() => {
                  playKeyClick();
                  setActiveStepId(state.id);
                }}
                className="relative z-10 flex-1 max-w-[125px] flex flex-col items-center cursor-pointer group px-1"
              >
                {/* Uniform Node Square */}
                <div
                  className={`w-12 h-12 flex items-center justify-center p-2.5 transition-all duration-200 border ${
                    isPacketHere
                      ? 'bg-[#891a20] text-white border-[#891a20] scale-110 shadow-lg'
                      : isSelected
                      ? isDark
                        ? 'bg-[#f2f2f2] text-[#07070a] border-[#f2f2f2] shadow-md font-bold'
                        : 'bg-[#0d0d11] text-[#f2f2f2] border-[#0d0d11] shadow-md font-bold'
                      : isDark
                      ? 'bg-[#15151f] text-[#8c8b94] border-[#24242e] hover:border-[#f2f2f2] hover:text-[#f2f2f2]'
                      : 'bg-[#fdfcf7] text-[#6b6a72] border-[#0d0d11]/20 hover:border-[#0d0d11] hover:text-[#0d0d11]'
                  }`}
                >
                  <Icon size={19} className="shrink-0" />
                </div>

                {/* Step Number Tag */}
                <span
                  className={`font-mono-tech text-[10px] tracking-widest mt-2 font-bold ${
                    isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                  }`}
                >
                  0{state.stepNumber}
                </span>

                {/* Node Title with fixed height for perfect vertical alignment */}
                <span
                  className={`font-mono-tech text-[11px] uppercase tracking-wider text-center mt-0.5 h-8 flex items-center justify-center leading-tight ${
                    isSelected
                      ? isDark
                        ? 'text-white font-bold'
                        : 'text-black font-bold'
                      : isDark
                      ? 'text-[#8c8b94] group-hover:text-white'
                      : 'text-[#6b6a72] group-hover:text-black'
                  }`}
                >
                  {state.title}
                </span>

                {/* Duration Badge */}
                <span
                  className={`font-mono-tech text-[9.5px] mt-1 px-1.5 py-0.5 border rounded-none whitespace-nowrap tracking-wide ${
                    state.color === 'accent'
                      ? 'text-[#891a20] border-[#891a20]/30 font-semibold bg-[#891a20]/5'
                      : isDark
                      ? 'text-[#8c8b94] border-[#24242e] bg-[#14141c]'
                      : 'text-[#6b6a72] border-[#0d0d11]/15 bg-white'
                  }`}
                >
                  {state.shortDuration || state.durationMs}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected State Micro-Inspection Bento Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Deep Microscopic Inspection */}
        <BentoCard
          title={`STATE 0${selectedState.stepNumber}: ${selectedState.title}`}
          subtitle={selectedState.kernelContext}
          badge={`LATENCY: ${selectedState.durationMs}`}
          badgeColor="neutral"
          icon={selectedState.icon}
          className="lg:col-span-2"
        >
          <div className="space-y-4">
            <p
              className={`leading-relaxed text-sm font-editorial italic text-base ${
                isDark ? 'text-[#d6d5dc]' : 'text-[#1b1b1e]'
              }`}
            >
              {selectedState.description}
            </p>

            <div
              className={`p-3 border font-mono-tech text-xs ${
                isDark
                  ? 'bg-[#050508] border-[#24242e]'
                  : 'bg-[#fdfcf7] border-[#0d0d11]/15'
              }`}
            >
              <div
                className={`text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5 ${
                  isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                }`}
              >
                <Info size={11} />
                <span>Kernel Subsystem Code / Data Structures</span>
              </div>
              <code
                className={`text-xs break-all ${
                  isDark ? 'text-[#f2f2f2]' : 'text-[#0d0d11]'
                }`}
              >
                {selectedState.structDetails}
              </code>
            </div>

            {/* Contextual Live Storage Parameters */}
            <div
              className={`grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t font-mono-tech text-xs ${
                isDark ? 'border-[#24242e]' : 'border-[#0d0d11]/15'
              }`}
            >
              <div
                className={`p-3.5 border ${
                  isDark
                    ? 'bg-[#15151f] border-[#24242e]'
                    : 'bg-[#fdfcf7] border-[#0d0d11]/15'
                }`}
              >
                <div className="text-[10px] text-[#8c8b94] uppercase tracking-wider font-semibold">CURRENT TRACK</div>
                <div className="font-bold text-sm mt-1">CYL {activeTrack}</div>
              </div>
              <div
                className={`p-3.5 border ${
                  isDark
                    ? 'bg-[#15151f] border-[#24242e]'
                    : 'bg-[#fdfcf7] border-[#0d0d11]/15'
                }`}
              >
                <div className="text-[10px] text-[#8c8b94] uppercase tracking-wider font-semibold">PREVIOUS TRACK</div>
                <div className="font-bold text-sm mt-1">CYL {previousTrack}</div>
              </div>
              <div
                className={`p-3.5 border ${
                  isDark
                    ? 'bg-[#15151f] border-[#24242e]'
                    : 'bg-[#fdfcf7] border-[#0d0d11]/15'
                }`}
              >
                <div className="text-[10px] text-[#8c8b94] uppercase tracking-wider font-semibold">SEEK DELTA</div>
                <div className="font-bold text-sm text-[#891a20] mt-1">{seekDistance} Tracks</div>
              </div>
              <div
                className={`p-3.5 border ${
                  isDark
                    ? 'bg-[#15151f] border-[#24242e]'
                    : 'bg-[#fdfcf7] border-[#0d0d11]/15'
                }`}
              >
                <div className="text-[10px] text-[#8c8b94] uppercase tracking-wider font-semibold">ACTIVE SCHEDULER</div>
                <div className="font-bold text-sm mt-1">{activeAlgorithm}</div>
              </div>
            </div>
          </div>
        </BentoCard>

        {/* Right Col: Mathematical Latency Breakdown */}
        <BentoCard
          title="DISK ACCESS LATENCY FORMULA"
          subtitle="Physical Mechanical Modeling"
          badge="MATHEMATICS"
          badgeColor="neutral"
          icon={Clock}
        >
          <div className="space-y-4 font-mono-tech text-xs">
            <div
              className={`p-4 border text-center ${
                isDark
                  ? 'bg-[#050508] border-[#24242e]'
                  : 'bg-[#fdfcf7] border-[#0d0d11]/15'
              }`}
            >
              <div className="font-bold text-sm tracking-wider">
                T_access = T_seek + T_rot + T_xfer + T_ctrl
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div
                className={`flex justify-between items-center border-b py-2.5 ${
                  isDark ? 'border-[#24242e]' : 'border-[#0d0d11]/15'
                }`}
              >
                <span className={isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'}>1. Seek Time (T_seek):</span>
                <span className="text-[#891a20] font-semibold">~4.50 ms (90% of total)</span>
              </div>
              <div
                className={`flex justify-between items-center border-b py-2.5 ${
                  isDark ? 'border-[#24242e]' : 'border-[#0d0d11]/15'
                }`}
              >
                <span className={isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'}>2. Rotational Delay (T_rot):</span>
                <span className={isDark ? 'text-[#d6d5dc]' : 'text-[#1b1b1e]'}>~4.17 ms (@ 7200 RPM)</span>
              </div>
              <div
                className={`flex justify-between items-center border-b py-2.5 ${
                  isDark ? 'border-[#24242e]' : 'border-[#0d0d11]/15'
                }`}
              >
                <span className={isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'}>3. Transfer Time (T_xfer):</span>
                <span className={isDark ? 'text-[#d6d5dc]' : 'text-[#1b1b1e]'}>&lt; 0.05 ms (4 KB block)</span>
              </div>
              <div
                className={`flex justify-between items-center border-b py-2.5 ${
                  isDark ? 'border-[#24242e]' : 'border-[#0d0d11]/15'
                }`}
              >
                <span className={isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'}>4. Controller Overhead:</span>
                <span className={isDark ? 'text-[#d6d5dc]' : 'text-[#1b1b1e]'}>&lt; 0.02 ms</span>
              </div>
            </div>

            <div
              className={`p-4 border border-l-2 border-l-[#891a20] text-xs leading-relaxed ${
                isDark
                  ? 'bg-[#15151f] border-[#24242e] text-[#8c8b94]'
                  : 'bg-[#fdfcf7] border-[#0d0d11]/15 text-[#6b6a72]'
              }`}
            >
              <strong className={isDark ? 'text-white' : 'text-[#0d0d11]'}>
                Why Disk Scheduling Matters:
              </strong>{' '}
              Because mechanical seek time dwarfs electronic RAM access by over <strong>100,000x</strong>, intelligent request reordering saves millions of CPU wait cycles.
            </div>
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
