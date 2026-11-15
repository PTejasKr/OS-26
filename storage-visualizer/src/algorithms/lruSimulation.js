/**
 * LRU Page Replacement & Secondary Storage (3D Hard Drive Swap) Simulation Engine
 * Models primary memory (RAM Frames), MMU translation, temporal locality stack (Hash + DLL),
 * page faults, victim selection, and physical disk seek/transfer operations.
 */

// Deterministic mapping from Virtual Page Number to Physical Disk Cylinder [10 .. 190]
export function getDiskCylinderForPage(page) {
  const PRESET_MAP = {
    0: 20,
    1: 45,
    2: 70,
    3: 95,
    4: 125,
    5: 145,
    6: 165,
    7: 185,
    8: 35,
    9: 80,
  };
  if (PRESET_MAP[page] !== undefined) return PRESET_MAP[page];
  return ((Math.abs(page) * 23 + 17) % 175) + 12;
}

// Curated Best Standard Examples from OS Literature & Real Systems
export const LRU_EXAMPLES = [
  {
    id: 'silberschatz',
    title: 'Silberschatz OS Textbook Gold Standard',
    author: 'Silberschatz, Galvin & Gagne (Operating System Concepts)',
    description: 'The universal benchmark example used in universities worldwide. Demonstrates cold misses on 7, 0, 1; victim eviction of Page 7 when Page 2 arrives; then a dramatic 0ms hit on Page 0.',
    pages: [7, 0, 1, 2, 0, 3, 0, 4, 2, 3],
    defaultFrames: 3,
  },
  {
    id: 'temporal_locality',
    title: 'Temporal Locality & Working Set Loop',
    author: 'Denning Working Set Model (1968)',
    description: 'Models a program loop repeatedly accessing a small core working set. Shows how recently referenced pages remain pinned in DRAM while older loop members are churned out.',
    pages: [1, 2, 3, 4, 1, 2, 5, 1, 2, 3],
    defaultFrames: 3,
  },
  {
    id: 'database_btree',
    title: 'Database B-Tree Index Root & Leaf Traversal',
    author: 'Database Buffer Pool Manager (PostgreSQL/MySQL InnoDB)',
    description: 'Models a database querying index pages. Root index node (Page 2) is accessed frequently and never evicted, while transient leaf pages cycle through available buffer frames.',
    pages: [2, 3, 2, 1, 5, 2, 4, 5, 3, 2],
    defaultFrames: 4,
  },
  {
    id: 'thrashing',
    title: 'Cache Churn & Memory Thrashing Under Pressure',
    author: 'Virtual Memory Under-Allocation',
    description: 'Memory capacity (3 frames) is smaller than the program active footprint (4 pages). Every single access triggers a page fault and disk swap write/read cycle.',
    pages: [1, 2, 3, 4, 1, 2, 3, 4, 1, 2],
    defaultFrames: 3,
  },
];

/**
 * Simulates LRU Page Replacement with Physical Disk Secondary Storage
 * @param {number[]} pageRequests - Array of virtual page numbers accessed
 * @param {number} frameCapacity - Number of primary memory frames (typically 3 or 4)
 * @param {number} initialDiskHead - Starting cylinder position of 3D hard drive arm
 * @returns {object} Full simulation steps, telemetry, and frame transitions
 */
export function simulateLruDiskSwap(
  pageRequests = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3],
  frameCapacity = 3,
  initialDiskHead = 53
) {
  // Primary Memory Physical Frame Slots
  // Array of { frameIndex, page, lastAccessedStep, accessCount }
  let frames = Array.from({ length: frameCapacity }, (_, i) => ({
    frameIndex: i,
    page: null,
    lastAccessedStep: -1,
    accessCount: 0,
  }));

  // LRU Stack (ordered from Most Recently Used to Least Recently Used)
  let lruStack = []; // array of page numbers: [MRU, ..., LRU]

  const steps = [];
  let hits = 0;
  let misses = 0;
  let evictions = 0;
  let currentHead = initialDiskHead;
  let totalSeekDistance = 0;

  pageRequests.forEach((page, stepIdx) => {
    const stepNumber = stepIdx + 1;
    const targetCylinder = getDiskCylinderForPage(page);

    // 1. Check if page is in primary memory
    const existingFrameIdx = frames.findIndex((f) => f.page === page);
    const isHit = existingFrameIdx !== -1;

    let evictedPage = null;
    let evictedFrameIdx = null;
    let victimSwapCylinder = null;
    let seekDistance = 0;
    let diskHeadAtStart = currentHead;
    let diskHeadAfterStep = currentHead;
    let diskOperation = 'NONE';
    let explanation = '';

    if (isHit) {
      hits++;
      // Update frame metadata
      frames[existingFrameIdx].lastAccessedStep = stepNumber;
      frames[existingFrameIdx].accessCount += 1;

      // Update LRU Stack: Move accessed page to MRU head
      lruStack = [page, ...lruStack.filter((p) => p !== page)];

      diskOperation = 'IDLE_HIT';
      seekDistance = 0;
      explanation = `PAGE HIT: Page ${page} is already resident in RAM Frame ${existingFrameIdx}. Zero mechanical disk seek required (0.001 ms RAM speed)! Page ${page} promoted to MRU head.`;
    } else {
      misses++;

      // 2. Check for empty frame
      const emptyFrameIdx = frames.findIndex((f) => f.page === null);

      if (emptyFrameIdx !== -1) {
        // Cold Miss: Frame available without eviction
        frames[emptyFrameIdx].page = page;
        frames[emptyFrameIdx].lastAccessedStep = stepNumber;
        frames[emptyFrameIdx].accessCount = 1;

        lruStack = [page, ...lruStack.filter((p) => p !== page)];

        seekDistance = Math.abs(currentHead - targetCylinder);
        totalSeekDistance += seekDistance;
        diskHeadAfterStep = targetCylinder;
        currentHead = targetCylinder;

        diskOperation = 'PAGE_IN';
        explanation = `PAGE FAULT (COLD MISS): Page ${page} not in RAM. Empty Frame ${emptyFrameIdx} allocated. 3D Hard Drive arm seeks ${seekDistance} tracks (Cyl ${diskHeadAtStart} ➔ ${targetCylinder}) to fetch Page ${page} into RAM.`;
      } else {
        // 3. Frames Full: LRU Victim Eviction Needed!
        evictions++;

        // The victim is the page at the bottom of the LRU stack (unreferenced longest)
        const victimCandidate = lruStack[lruStack.length - 1];
        const victimIdx = frames.findIndex((f) => f.page === victimCandidate);

        evictedPage = victimCandidate;
        evictedFrameIdx = victimIdx;
        victimSwapCylinder = getDiskCylinderForPage(evictedPage);

        // Replace victim in primary memory
        frames[victimIdx].page = page;
        frames[victimIdx].lastAccessedStep = stepNumber;
        frames[victimIdx].accessCount = 1;

        // Update LRU stack
        lruStack = [page, ...lruStack.filter((p) => p !== page && p !== evictedPage)];

        // Two-stage mechanical seek:
        // Stage 1: Write dirty victim page out to swap cylinder
        const seekToSwap = Math.abs(currentHead - victimSwapCylinder);
        // Stage 2: Read incoming page from target cylinder
        const seekToPage = Math.abs(victimSwapCylinder - targetCylinder);
        seekDistance = seekToSwap + seekToPage;
        totalSeekDistance += seekDistance;
        diskHeadAfterStep = targetCylinder;
        currentHead = targetCylinder;

        diskOperation = 'SWAP_OUT_AND_IN';
        explanation = `PAGE FAULT & EVICTION: All ${frameCapacity} frames full. LRU identifies Page ${evictedPage} as victim (untouched for longest time). Arm seeks to Swap Cyl ${victimSwapCylinder} to churn out Page ${evictedPage}, then seeks to Cyl ${targetCylinder} to load Page ${page} into Frame ${victimIdx}.`;
      }
    }

    // Snapshot of frames at this step with role annotations
    const framesSnapshot = frames.map((f) => ({
      frameIndex: f.frameIndex,
      page: f.page,
      lastAccessedStep: f.lastAccessedStep,
      isTarget: f.page === page,
      isVictim: f.frameIndex === evictedFrameIdx,
      isMru: lruStack[0] === f.page,
      isLru: lruStack[lruStack.length - 1] === f.page,
      cylinder: f.page !== null ? getDiskCylinderForPage(f.page) : null,
    }));

    steps.push({
      stepNumber,
      page,
      isHit,
      evictedPage,
      evictedFrameIdx,
      victimSwapCylinder,
      targetCylinder,
      diskHeadAtStart,
      diskHeadAfterStep,
      seekDistance,
      cumulativeSeekDistance: totalSeekDistance,
      diskOperation,
      explanation,
      framesSnapshot,
      lruStackSnapshot: [...lruStack],
      cumulativeHits: hits,
      cumulativeMisses: misses,
      cumulativeEvictions: evictions,
      hitRate: Number(((hits / stepNumber) * 100).toFixed(1)),
    });
  });

  const total = pageRequests.length;
  const overallHitRate = total > 0 ? Number(((hits / total) * 100).toFixed(1)) : 0;
  const overallMissRate = total > 0 ? Number(((misses / total) * 100).toFixed(1)) : 0;
  const seeksAvoidedByCache = hits;
  const timeSavedMs = Number((hits * 7.5).toFixed(1)); // ~7.5 ms average seek + rotational delay saved per hit!

  return {
    pageRequests,
    frameCapacity,
    initialDiskHead,
    steps,
    totalRequests: total,
    hits,
    misses,
    evictions,
    hitRate: overallHitRate,
    missRate: overallMissRate,
    totalSeekDistance,
    seeksAvoidedByCache,
    timeSavedMs,
  };
}
