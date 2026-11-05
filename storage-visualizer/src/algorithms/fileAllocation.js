/**
 * File Management & Allocation Algorithm Engine
 * Implements Contiguous, Linked/FAT, and Inode/Indexed file allocation simulations.
 */

export const DISK_BLOCK_COUNT = 64; // 8x8 or 16x4 grid of blocks

export const DEFAULT_FILES = [
  { id: 'f1', name: 'kernel.sys', size: 6, color: '#00f0ff' }, // Cyan
  { id: 'f2', name: 'database.db', size: 10, color: '#ffb000' }, // Amber
  { id: 'f3', name: 'app_logs.txt', size: 4, color: '#00ff66' }, // Phosphor Green
  { id: 'f4', name: 'graphics.raw', size: 8, color: '#d946ef' }, // Magenta
];

export function createInitialDiskState() {
  const blocks = Array.from({ length: DISK_BLOCK_COUNT }, (_, i) => ({
    blockIndex: i,
    isAllocated: false,
    fileId: null,
    fileName: null,
    color: null,
    nextBlock: null, // For linked allocation
    isIndexBlock: false,
    isIndirectBlock: false,
    contentPreview: null,
  }));
  return blocks;
}

// ----------------------------------------------------------------------------
// 1. Contiguous Allocation Simulation
// ----------------------------------------------------------------------------
export function simulateContiguousAllocation(files = DEFAULT_FILES) {
  const blocks = createInitialDiskState();
  const fileEntries = [];
  const rejectedFiles = [];

  // Simulate First-Fit or Best-Fit placement
  for (const file of files) {
    let startFound = -1;
    let consecutiveFree = 0;

    for (let i = 0; i < DISK_BLOCK_COUNT; i++) {
      if (!blocks[i].isAllocated) {
        consecutiveFree++;
        if (consecutiveFree === file.size) {
          startFound = i - file.size + 1;
          break;
        }
      } else {
        consecutiveFree = 0;
      }
    }

    if (startFound !== -1) {
      const allocatedIndices = [];
      for (let j = 0; j < file.size; j++) {
        const bIdx = startFound + j;
        blocks[bIdx].isAllocated = true;
        blocks[bIdx].fileId = file.id;
        blocks[bIdx].fileName = file.name;
        blocks[bIdx].color = file.color;
        blocks[bIdx].contentPreview = `Block ${j} of ${file.name}`;
        allocatedIndices.push(bIdx);
      }
      fileEntries.push({
        ...file,
        startBlock: startFound,
        length: file.size,
        blocks: allocatedIndices,
      });
    } else {
      rejectedFiles.push({
        ...file,
        reason: 'External fragmentation: no contiguous sequence of free blocks found!',
      });
    }
  }

  // Calculate external fragmentation
  let freeRuns = 0;
  let totalFreeBlocks = 0;
  let inRun = false;
  for (let i = 0; i < DISK_BLOCK_COUNT; i++) {
    if (!blocks[i].isAllocated) {
      totalFreeBlocks++;
      if (!inRun) {
        freeRuns++;
        inRun = true;
      }
    } else {
      inRun = false;
    }
  }

  return {
    blocks,
    fileEntries,
    rejectedFiles,
    totalFreeBlocks,
    freeRuns,
    fragmentationIndex: freeRuns > 1 ? Number(((freeRuns / totalFreeBlocks) * 100).toFixed(1)) : 0,
  };
}

// ----------------------------------------------------------------------------
// 2. Linked / FAT Allocation Simulation
// ----------------------------------------------------------------------------
export function simulateLinkedAllocation(files = DEFAULT_FILES) {
  const blocks = createInitialDiskState();
  const fileEntries = [];
  const fatTable = Array(DISK_BLOCK_COUNT).fill(-1); // -1 = EOF or Free

  for (const file of files) {
    // Find free blocks (scattered anywhere)
    const available = [];
    for (let i = 0; i < DISK_BLOCK_COUNT; i++) {
      if (!blocks[i].isAllocated) {
        available.push(i);
        if (available.length === file.size) break;
      }
    }

    if (available.length === file.size) {
      // Allocate and link them
      for (let k = 0; k < file.size; k++) {
        const bIdx = available[k];
        const nextBIdx = k < file.size - 1 ? available[k + 1] : -1;
        blocks[bIdx].isAllocated = true;
        blocks[bIdx].fileId = file.id;
        blocks[bIdx].fileName = file.name;
        blocks[bIdx].color = file.color;
        blocks[bIdx].nextBlock = nextBIdx;
        blocks[bIdx].contentPreview = `Chunk ${k} (Next: ${nextBIdx === -1 ? 'EOF' : nextBIdx})`;
        fatTable[bIdx] = nextBIdx;
      }

      fileEntries.push({
        ...file,
        startBlock: available[0],
        endBlock: available[available.length - 1],
        length: file.size,
        blocks: available,
      });
    }
  }

  return {
    blocks,
    fileEntries,
    fatTable,
  };
}

// ----------------------------------------------------------------------------
// 3. Inode / Indexed Allocation Simulation
// ----------------------------------------------------------------------------
export function simulateIndexedAllocation(files = DEFAULT_FILES) {
  const blocks = createInitialDiskState();
  const fileEntries = [];

  for (const file of files) {
    // Needs 1 Index Block + file.size Data Blocks
    const totalNeeded = 1 + file.size;
    const available = [];
    for (let i = 0; i < DISK_BLOCK_COUNT; i++) {
      if (!blocks[i].isAllocated) {
        available.push(i);
        if (available.length === totalNeeded) break;
      }
    }

    if (available.length === totalNeeded) {
      const indexBlockIdx = available[0];
      const dataBlockIndices = available.slice(1);

      // Setup index block
      blocks[indexBlockIdx].isAllocated = true;
      blocks[indexBlockIdx].fileId = file.id;
      blocks[indexBlockIdx].fileName = `${file.name} [INODE]`;
      blocks[indexBlockIdx].color = file.color;
      blocks[indexBlockIdx].isIndexBlock = true;
      blocks[indexBlockIdx].contentPreview = `Pointers: [${dataBlockIndices.join(', ')}]`;

      // Setup data blocks
      dataBlockIndices.forEach((dIdx, k) => {
        blocks[dIdx].isAllocated = true;
        blocks[dIdx].fileId = file.id;
        blocks[dIdx].fileName = file.name;
        blocks[dIdx].color = file.color;
        blocks[dIdx].contentPreview = `Data ${k} (Indexed by ${indexBlockIdx})`;
      });

      fileEntries.push({
        ...file,
        indexBlock: indexBlockIdx,
        dataBlocks: dataBlockIndices,
        length: file.size,
        inode: {
          inodeNumber: indexBlockIdx * 1024 + 17,
          mode: '-rw-r--r--',
          uid: 1000,
          gid: 1000,
          sizeBytes: file.size * 4096,
          directPointers: dataBlockIndices.slice(0, 4),
          singleIndirect: dataBlockIndices.length > 4 ? dataBlockIndices.slice(4) : null,
        }
      });
    }
  }

  return {
    blocks,
    fileEntries,
  };
}

// ----------------------------------------------------------------------------
// 4. Free Space Management Simulation (Bit Vector & Linked List)
// ----------------------------------------------------------------------------
export function simulateFreeSpaceManagement(blocks) {
  // Bitmap: 1 for free, 0 for allocated
  const bitVector = blocks.map(b => (b.isAllocated ? 0 : 1));
  const hexBytes = [];
  for (let i = 0; i < bitVector.length; i += 8) {
    const byteBits = bitVector.slice(i, i + 8);
    const byteVal = byteBits.reduce((acc, bit, idx) => acc | (bit << (7 - idx)), 0);
    hexBytes.push('0x' + byteVal.toString(16).padStart(2, '0').toUpperCase());
  }

  const freeList = [];
  blocks.forEach((b, idx) => {
    if (!b.isAllocated) freeList.push(idx);
  });

  return {
    bitVector,
    hexBytes,
    freeList,
    totalFree: freeList.length,
    totalAllocated: DISK_BLOCK_COUNT - freeList.length,
    freePercent: Number(((freeList.length / DISK_BLOCK_COUNT) * 100).toFixed(1)),
  };
}
