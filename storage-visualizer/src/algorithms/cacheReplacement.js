/**
 * Storage Buffer Cache & Page Replacement Engine
 * Simulates FIFO, LRU, LFU, and Clock / Second-Chance algorithms.
 */

export function simulateCacheReplacement(blockRequests, frameCapacity = 4, algorithm = 'LRU') {
  const steps = [];
  let hits = 0;
  let misses = 0;

  // Frame slots array: { block, meta }
  let frames = [];
  // For Clock algorithm
  let clockPointer = 0;
  // For LFU frequency map
  const freqMap = new Map();

  blockRequests.forEach((block, reqIdx) => {
    // Current frequency
    const currentFreq = (freqMap.get(block) || 0) + 1;
    freqMap.set(block, currentFreq);

    const hitIndex = frames.findIndex(f => f.block === block);
    const isHit = hitIndex !== -1;
    let evictedBlock = null;

    if (isHit) {
      hits++;
      if (algorithm === 'LRU') {
        // Move accessed frame to most recent
        const [hitFrame] = frames.splice(hitIndex, 1);
        hitFrame.lastUsed = reqIdx;
        frames.push(hitFrame);
      } else if (algorithm === 'LFU') {
        frames[hitIndex].freq = currentFreq;
      } else if (algorithm === 'Clock') {
        frames[hitIndex].refBit = 1;
      }
    } else {
      misses++;
      if (frames.length < frameCapacity) {
        // Space available
        frames.push({
          block,
          lastUsed: reqIdx,
          freq: currentFreq,
          refBit: 1,
          loadedAt: reqIdx,
        });
      } else {
        // Replacement needed
        if (algorithm === 'FIFO') {
          // Evict oldest loaded
          const evicted = frames.shift();
          evictedBlock = evicted.block;
          frames.push({
            block,
            lastUsed: reqIdx,
            freq: currentFreq,
            refBit: 1,
            loadedAt: reqIdx,
          });
        } else if (algorithm === 'LRU') {
          // Evict least recently used (first in list)
          const evicted = frames.shift();
          evictedBlock = evicted.block;
          frames.push({
            block,
            lastUsed: reqIdx,
            freq: currentFreq,
            refBit: 1,
            loadedAt: reqIdx,
          });
        } else if (algorithm === 'LFU') {
          // Evict lowest frequency
          let minFreqIdx = 0;
          for (let i = 1; i < frames.length; i++) {
            if (frames[i].freq < frames[minFreqIdx].freq) {
              minFreqIdx = i;
            }
          }
          const evicted = frames.splice(minFreqIdx, 1)[0];
          evictedBlock = evicted.block;
          frames.push({
            block,
            lastUsed: reqIdx,
            freq: currentFreq,
            refBit: 1,
            loadedAt: reqIdx,
          });
        } else if (algorithm === 'Clock') {
          // Clock search with circular pointer
          while (true) {
            const frame = frames[clockPointer];
            if (frame.refBit === 0) {
              evictedBlock = frame.block;
              frames[clockPointer] = {
                block,
                lastUsed: reqIdx,
                freq: currentFreq,
                refBit: 1,
                loadedAt: reqIdx,
              };
              clockPointer = (clockPointer + 1) % frameCapacity;
              break;
            } else {
              frame.refBit = 0;
              clockPointer = (clockPointer + 1) % frameCapacity;
            }
          }
        }
      }
    }

    steps.push({
      stepNumber: reqIdx + 1,
      block,
      isHit,
      evictedBlock,
      framesSnapshot: frames.map(f => ({ ...f })),
      clockPointer: algorithm === 'Clock' ? clockPointer : null,
    });
  });

  const total = blockRequests.length;
  const hitRate = total ? Number(((hits / total) * 100).toFixed(1)) : 0;
  const missRate = total ? Number(((misses / total) * 100).toFixed(1)) : 0;

  return {
    algorithm,
    frameCapacity,
    blockRequests,
    steps,
    hits,
    misses,
    hitRate,
    missRate,
    diskIoAvoided: hits,
  };
}
