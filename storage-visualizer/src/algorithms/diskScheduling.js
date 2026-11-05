/**
 * OS Disk Scheduling Core Engine
 * Implements FCFS, SSTF, SCAN, C-SCAN, LOOK, and C-LOOK with strict academic accuracy.
 * Conventions:
 * - Initial head is the starting position (not a serviced request).
 * - If a request is at initial head, seek distance is 0.
 * - SCAN travels to physical boundary (max_track or min_track) before reversing.
 * - C-SCAN wraps from boundary to opposite boundary (|max_track - min_track| counted).
 * - LOOK only travels to highest/lowest requested track (no boundary trip).
 * - C-LOOK wraps directly from highest request to lowest request.
 */

export function validateDiskInputs(rawRequests, rawHead, rawMinTrack, rawMaxTrack, direction = 'right') {
  const minTrack = parseInt(rawMinTrack, 10);
  const maxTrack = parseInt(rawMaxTrack, 10);
  if (isNaN(minTrack) || isNaN(maxTrack)) {
    return { valid: false, error: 'Min and Max track boundaries must be valid integers.' };
  }
  if (minTrack < 0) {
    return { valid: false, error: 'Min track cylinder cannot be negative.' };
  }
  if (minTrack >= maxTrack) {
    return { valid: false, error: `Min track (${minTrack}) must be strictly less than Max track (${maxTrack}).` };
  }

  const head = parseInt(rawHead, 10);
  if (isNaN(head)) {
    return { valid: false, error: 'Initial head position must be a valid integer.' };
  }
  if (head < minTrack || head > maxTrack) {
    return { valid: false, error: `Initial head (${head}) is outside track range [${minTrack}, ${maxTrack}].` };
  }

  const dir = String(direction).trim().toLowerCase();
  if (dir !== 'left' && dir !== 'right') {
    return { valid: false, error: "Direction must be either 'left' or 'right'." };
  }

  let tokens = [];
  if (typeof rawRequests === 'string') {
    const cleaned = rawRequests.replace(/,/g, ' ').trim();
    if (!cleaned) return { valid: false, error: 'Request queue is empty.' };
    tokens = cleaned.split(/\s+/);
  } else if (Array.isArray(rawRequests)) {
    tokens = rawRequests;
  } else {
    return { valid: false, error: 'Request queue must be a comma-separated string or array.' };
  }

  const requests = [];
  for (const token of tokens) {
    const val = parseInt(token, 10);
    if (isNaN(val)) {
      return { valid: false, error: `Invalid track request '${token}'. Must be an integer.` };
    }
    if (val < minTrack || val > maxTrack) {
      return { valid: false, error: `Track request ${val} is out of bounds [${minTrack}, ${maxTrack}].` };
    }
    requests.push(val);
  }

  if (requests.length === 0) {
    return { valid: false, error: 'Request queue must contain at least one track.' };
  }

  return {
    valid: true,
    requests,
    head,
    minTrack,
    maxTrack,
    direction: dir,
  };
}

export function fcfs(requests, initialHead, minTrack = 0, maxTrack = 199) {
  const steps = [];
  const movementPath = [initialHead];
  const servicedRequests = [];
  let current = initialHead;
  let totalMovement = 0;

  requests.forEach((req, idx) => {
    const dist = Math.abs(req - current);
    totalMovement += dist;
    steps.push({
      stepNumber: idx + 1,
      fromTrack: current,
      toTrack: req,
      distance: dist,
      isServicedRequest: true,
      stepType: 'REQUEST',
      cumulative: totalMovement,
      description: dist === 0
        ? `Service request at track ${req} (already at head, 0 seek)`
        : `Service request at track ${req} (seek distance = ${dist} tracks)`
    });
    servicedRequests.push(req);
    movementPath.push(req);
    current = req;
  });

  const avgMovement = requests.length ? Number((totalMovement / requests.length).toFixed(2)) : 0;
  return {
    algorithmName: 'FCFS',
    shortName: 'FCFS',
    initialHead,
    movementPath,
    servicedRequests,
    steps,
    totalMovement,
    averageMovement: avgMovement,
    requestCount: requests.length,
    minTrack,
    maxTrack,
    notes: [
      'First-Come, First-Served processes requests strictly in order of arrival.',
      'Fair and simple with zero starvation risk, but yields high mechanical seek overhead.',
      'Susceptible to the "wild swing" problem under erratic workloads.'
    ]
  };
}

export function sstf(requests, initialHead, minTrack = 0, maxTrack = 199) {
  const steps = [];
  const movementPath = [initialHead];
  const servicedRequests = [];
  let current = initialHead;
  let totalMovement = 0;
  const pending = [...requests];
  let stepNum = 1;

  while (pending.length > 0) {
    // Tie-breaker: smallest distance; if tied, lower track number
    let bestIdx = 0;
    let bestDist = Math.abs(pending[0] - current);
    let bestVal = pending[0];

    for (let i = 1; i < pending.length; i++) {
      const dist = Math.abs(pending[i] - current);
      if (dist < bestDist || (dist === bestDist && pending[i] < bestVal)) {
        bestDist = dist;
        bestVal = pending[i];
        bestIdx = i;
      }
    }

    const chosen = pending.splice(bestIdx, 1)[0];
    const dist = Math.abs(chosen - current);
    totalMovement += dist;

    steps.push({
      stepNumber: stepNum++,
      fromTrack: current,
      toTrack: chosen,
      distance: dist,
      isServicedRequest: true,
      stepType: 'REQUEST',
      cumulative: totalMovement,
      description: dist === 0
        ? `Service request at track ${chosen} (instant 0 seek)`
        : `Service closest pending track ${chosen} (seek distance = ${dist} tracks)`
    });

    servicedRequests.push(chosen);
    movementPath.push(chosen);
    current = chosen;
  }

  const avgMovement = requests.length ? Number((totalMovement / requests.length).toFixed(2)) : 0;
  return {
    algorithmName: 'SSTF',
    shortName: 'SSTF',
    initialHead,
    movementPath,
    servicedRequests,
    steps,
    totalMovement,
    averageMovement: avgMovement,
    requestCount: requests.length,
    minTrack,
    maxTrack,
    notes: [
      'Shortest Seek Time First picks the closest pending track to current head.',
      'Deterministic tie-breaking: selects the lower track number when distances are identical.',
      'High throughput and low seek time, but prone to starvation for distant tracks.'
    ]
  };
}

export function scan(requests, initialHead, minTrack = 0, maxTrack = 199, direction = 'right') {
  const steps = [];
  const movementPath = [initialHead];
  const servicedRequests = [];
  let current = initialHead;
  let totalMovement = 0;
  let stepNum = 1;

  let firstLeg = [];
  let secondLeg = [];
  let boundary = maxTrack;

  if (direction === 'right') {
    firstLeg = requests.filter(r => r >= initialHead).sort((a, b) => a - b);
    secondLeg = requests.filter(r => r < initialHead).sort((a, b) => b - a);
    boundary = maxTrack;
  } else {
    firstLeg = requests.filter(r => r <= initialHead).sort((a, b) => b - a);
    secondLeg = requests.filter(r => r > initialHead).sort((a, b) => a - b);
    boundary = minTrack;
  }

  // 1. Service first leg
  for (const req of firstLeg) {
    const dist = Math.abs(req - current);
    totalMovement += dist;
    steps.push({
      stepNumber: stepNum++,
      fromTrack: current,
      toTrack: req,
      distance: dist,
      isServicedRequest: true,
      stepType: 'REQUEST',
      cumulative: totalMovement,
      description: `Service track ${req} in initial ${direction.toUpperCase()} sweep (seek = ${dist})`
    });
    servicedRequests.push(req);
    movementPath.push(req);
    current = req;
  }

  // 2. Travel to physical boundary if requests remain in opposite direction (or not at boundary)
  if (current !== boundary && secondLeg.length > 0) {
    const dist = Math.abs(boundary - current);
    totalMovement += dist;
    steps.push({
      stepNumber: stepNum++,
      fromTrack: current,
      toTrack: boundary,
      distance: dist,
      isServicedRequest: false,
      stepType: 'BOUNDARY',
      cumulative: totalMovement,
      description: `Reach disk physical boundary cylinder ${boundary} and reverse arm direction`
    });
    movementPath.push(boundary);
    current = boundary;
  }

  // 3. Service second leg after reversing
  for (const req of secondLeg) {
    const dist = Math.abs(req - current);
    totalMovement += dist;
    steps.push({
      stepNumber: stepNum++,
      fromTrack: current,
      toTrack: req,
      distance: dist,
      isServicedRequest: true,
      stepType: 'REQUEST',
      cumulative: totalMovement,
      description: `Service track ${req} after reversing direction (seek = ${dist})`
    });
    servicedRequests.push(req);
    movementPath.push(req);
    current = req;
  }

  const avgMovement = requests.length ? Number((totalMovement / requests.length).toFixed(2)) : 0;
  return {
    algorithmName: 'SCAN (Elevator)',
    shortName: 'SCAN',
    initialHead,
    movementPath,
    servicedRequests,
    steps,
    totalMovement,
    averageMovement: avgMovement,
    requestCount: requests.length,
    direction,
    minTrack,
    maxTrack,
    notes: [
      `SCAN moves ${direction} first, travels to boundary track ${boundary}, then reverses.`,
      'Boundary cylinder travel is an explicit physical movement counted in total seek.',
      'Completely starvation-free; all requests serviced in at most 2 sweeps.'
    ]
  };
}

export function cScan(requests, initialHead, minTrack = 0, maxTrack = 199, direction = 'right') {
  const steps = [];
  const movementPath = [initialHead];
  const servicedRequests = [];
  let current = initialHead;
  let totalMovement = 0;
  let stepNum = 1;

  let firstLeg = [];
  let secondLeg = [];
  let outerBoundary = maxTrack;
  let wrapBoundary = minTrack;

  if (direction === 'right') {
    firstLeg = requests.filter(r => r >= initialHead).sort((a, b) => a - b);
    secondLeg = requests.filter(r => r < initialHead).sort((a, b) => a - b);
    outerBoundary = maxTrack;
    wrapBoundary = minTrack;
  } else {
    firstLeg = requests.filter(r => r <= initialHead).sort((a, b) => b - a);
    secondLeg = requests.filter(r => r > initialHead).sort((a, b) => b - a);
    outerBoundary = minTrack;
    wrapBoundary = maxTrack;
  }

  // 1. Service first leg
  for (const req of firstLeg) {
    const dist = Math.abs(req - current);
    totalMovement += dist;
    steps.push({
      stepNumber: stepNum++,
      fromTrack: current,
      toTrack: req,
      distance: dist,
      isServicedRequest: true,
      stepType: 'REQUEST',
      cumulative: totalMovement,
      description: `Service track ${req} along circular forward sweep (seek = ${dist})`
    });
    servicedRequests.push(req);
    movementPath.push(req);
    current = req;
  }

  // 2. Outer boundary & wrap around if second leg exists
  if (secondLeg.length > 0) {
    if (current !== outerBoundary) {
      const dist = Math.abs(outerBoundary - current);
      totalMovement += dist;
      steps.push({
        stepNumber: stepNum++,
        fromTrack: current,
        toTrack: outerBoundary,
        distance: dist,
        isServicedRequest: false,
        stepType: 'BOUNDARY',
        cumulative: totalMovement,
        description: `Travel to disk boundary ${outerBoundary} before circular wrap-around`
      });
      movementPath.push(outerBoundary);
      current = outerBoundary;
    }

    const wrapDist = Math.abs(wrapBoundary - current);
    totalMovement += wrapDist;
    steps.push({
      stepNumber: stepNum++,
      fromTrack: current,
      toTrack: wrapBoundary,
      distance: wrapDist,
      isServicedRequest: false,
      stepType: 'WRAP_AROUND',
      cumulative: totalMovement,
      description: `Circular wrap-around: jump from track ${current} to opposite boundary track ${wrapBoundary} (${wrapDist} tracks)`
    });
    movementPath.push(wrapBoundary);
    current = wrapBoundary;

    // 3. Service second leg in the same original direction
    for (const req of secondLeg) {
      const dist = Math.abs(req - current);
      totalMovement += dist;
      steps.push({
        stepNumber: stepNum++,
        fromTrack: current,
        toTrack: req,
        distance: dist,
        isServicedRequest: true,
        stepType: 'REQUEST',
        cumulative: totalMovement,
        description: `Service track ${req} in continuation of circular sweep (seek = ${dist})`
      });
      servicedRequests.push(req);
      movementPath.push(req);
      current = req;
    }
  }

  const avgMovement = requests.length ? Number((totalMovement / requests.length).toFixed(2)) : 0;
  return {
    algorithmName: 'C-SCAN (Circular SCAN)',
    shortName: 'C-SCAN',
    initialHead,
    movementPath,
    servicedRequests,
    steps,
    totalMovement,
    averageMovement: avgMovement,
    requestCount: requests.length,
    direction,
    minTrack,
    maxTrack,
    notes: [
      `C-SCAN sweeps ${direction}, reaches boundary ${outerBoundary}, then wraps around to ${wrapBoundary}.`,
      `Wrap-around distance (|${maxTrack} - ${minTrack}| = ${Math.abs(maxTrack - minTrack)} tracks) is counted as physical arm movement.`,
      'Provides the most uniform wait time distribution among all directional algorithms.'
    ]
  };
}

export function look(requests, initialHead, minTrack = 0, maxTrack = 199, direction = 'right') {
  const steps = [];
  const movementPath = [initialHead];
  const servicedRequests = [];
  let current = initialHead;
  let totalMovement = 0;
  let stepNum = 1;

  let firstLeg = [];
  let secondLeg = [];

  if (direction === 'right') {
    firstLeg = requests.filter(r => r >= initialHead).sort((a, b) => a - b);
    secondLeg = requests.filter(r => r < initialHead).sort((a, b) => b - a);
  } else {
    firstLeg = requests.filter(r => r <= initialHead).sort((a, b) => b - a);
    secondLeg = requests.filter(r => r > initialHead).sort((a, b) => a - b);
  }

  // Service first leg: only goes as far as highest/lowest requested cylinder!
  for (const req of firstLeg) {
    const dist = Math.abs(req - current);
    totalMovement += dist;
    steps.push({
      stepNumber: stepNum++,
      fromTrack: current,
      toTrack: req,
      distance: dist,
      isServicedRequest: true,
      stepType: 'REQUEST',
      cumulative: totalMovement,
      description: `LOOK services track ${req} in ${direction.toUpperCase()} sweep (seek = ${dist})`
    });
    servicedRequests.push(req);
    movementPath.push(req);
    current = req;
  }

  // Reverse immediately to service second leg without visiting disk boundary
  for (const req of secondLeg) {
    const dist = Math.abs(req - current);
    totalMovement += dist;
    steps.push({
      stepNumber: stepNum++,
      fromTrack: current,
      toTrack: req,
      distance: dist,
      isServicedRequest: true,
      stepType: 'REQUEST',
      cumulative: totalMovement,
      description: `LOOK reverses at request boundary and services track ${req} (seek = ${dist})`
    });
    servicedRequests.push(req);
    movementPath.push(req);
    current = req;
  }

  const avgMovement = requests.length ? Number((totalMovement / requests.length).toFixed(2)) : 0;
  return {
    algorithmName: 'LOOK (Elevator without Edge Penalty)',
    shortName: 'LOOK',
    initialHead,
    movementPath,
    servicedRequests,
    steps,
    totalMovement,
    averageMovement: avgMovement,
    requestCount: requests.length,
    direction,
    minTrack,
    maxTrack,
    notes: [
      'LOOK looks ahead: it only travels to the last requested cylinder in the current direction.',
      'Unlike SCAN, it avoids wasted arm movement to the extreme disk boundaries.',
      'Achieves lower total seek distance than SCAN while retaining fairness.'
    ]
  };
}

export function cLook(requests, initialHead, minTrack = 0, maxTrack = 199, direction = 'right') {
  const steps = [];
  const movementPath = [initialHead];
  const servicedRequests = [];
  let current = initialHead;
  let totalMovement = 0;
  let stepNum = 1;

  let firstLeg = [];
  let secondLeg = [];

  if (direction === 'right') {
    firstLeg = requests.filter(r => r >= initialHead).sort((a, b) => a - b);
    secondLeg = requests.filter(r => r < initialHead).sort((a, b) => a - b);
  } else {
    firstLeg = requests.filter(r => r <= initialHead).sort((a, b) => b - a);
    secondLeg = requests.filter(r => r > initialHead).sort((a, b) => b - a);
  }

  // 1. Service first leg
  for (const req of firstLeg) {
    const dist = Math.abs(req - current);
    totalMovement += dist;
    steps.push({
      stepNumber: stepNum++,
      fromTrack: current,
      toTrack: req,
      distance: dist,
      isServicedRequest: true,
      stepType: 'REQUEST',
      cumulative: totalMovement,
      description: `C-LOOK services track ${req} in ${direction.toUpperCase()} sweep (seek = ${dist})`
    });
    servicedRequests.push(req);
    movementPath.push(req);
    current = req;
  }

  // 2. Circular jump directly to lowest/highest requested track (no boundary travel)
  if (secondLeg.length > 0) {
    const targetWrapTrack = secondLeg[0];
    const wrapDist = Math.abs(targetWrapTrack - current);
    totalMovement += wrapDist;

    steps.push({
      stepNumber: stepNum++,
      fromTrack: current,
      toTrack: targetWrapTrack,
      distance: wrapDist,
      isServicedRequest: true, // directly services the first request of second leg
      stepType: 'WRAP_AROUND',
      cumulative: totalMovement,
      description: `C-LOOK circular reset: jump directly from track ${current} to earliest request at track ${targetWrapTrack} (seek = ${wrapDist})`
    });
    servicedRequests.push(targetWrapTrack);
    movementPath.push(targetWrapTrack);
    current = targetWrapTrack;

    // Remaining items in second leg
    for (let i = 1; i < secondLeg.length; i++) {
      const req = secondLeg[i];
      const dist = Math.abs(req - current);
      totalMovement += dist;
      steps.push({
        stepNumber: stepNum++,
        fromTrack: current,
        toTrack: req,
        distance: dist,
        isServicedRequest: true,
        stepType: 'REQUEST',
        cumulative: totalMovement,
        description: `Service track ${req} along circular trajectory (seek = ${dist})`
      });
      servicedRequests.push(req);
      movementPath.push(req);
      current = req;
    }
  }

  const avgMovement = requests.length ? Number((totalMovement / requests.length).toFixed(2)) : 0;
  return {
    algorithmName: 'C-LOOK (Circular LOOK)',
    shortName: 'C-LOOK',
    initialHead,
    movementPath,
    servicedRequests,
    steps,
    totalMovement,
    averageMovement: avgMovement,
    requestCount: requests.length,
    direction,
    minTrack,
    maxTrack,
    notes: [
      'C-LOOK circular version of LOOK: wraps directly to the lowest/highest requested cylinder.',
      'Eliminates the boundary travel penalty of C-SCAN entirely.',
      'Combines uniform wait times with significantly reduced mechanical travel.'
    ]
  };
}

export function simulateDiskScheduling(algorithmKey, requests, initialHead, direction = 'right', minTrack = 0, maxTrack = 199) {
  const normKey = String(algorithmKey).toUpperCase().trim();
  let res;
  switch (normKey) {
    case 'FCFS':
      res = fcfs(requests, initialHead, minTrack, maxTrack);
      break;
    case 'SSTF':
      res = sstf(requests, initialHead, minTrack, maxTrack);
      break;
    case 'SCAN':
      res = scan(requests, initialHead, minTrack, maxTrack, direction);
      break;
    case 'C-SCAN':
    case 'CSCAN':
      res = cScan(requests, initialHead, minTrack, maxTrack, direction);
      break;
    case 'LOOK':
      res = look(requests, initialHead, minTrack, maxTrack, direction);
      break;
    case 'C-LOOK':
    case 'CLOOK':
    default:
      res = cLook(requests, initialHead, minTrack, maxTrack, direction);
      break;
  }
  return {
    ...res,
    trajectory: res.movementPath,
    totalHeadMovements: res.totalMovement,
    seekSequence: res.servicedRequests,
  };
}

export function runAllAlgorithms(requests, initialHead, minTrack = 0, maxTrack = 199, direction = 'right') {
  const results = {
    FCFS: fcfs(requests, initialHead, minTrack, maxTrack),
    SSTF: sstf(requests, initialHead, minTrack, maxTrack),
    SCAN: scan(requests, initialHead, minTrack, maxTrack, direction),
    'C-SCAN': cScan(requests, initialHead, minTrack, maxTrack, direction),
    LOOK: look(requests, initialHead, minTrack, maxTrack, direction),
    'C-LOOK': cLook(requests, initialHead, minTrack, maxTrack, direction),
  };

  const fcfsMoves = results.FCFS.totalMovement;

  const comparison = Object.entries(results).map(([key, res]) => {
    const savings = fcfsMoves > 0 ? Number((((fcfsMoves - res.totalMovement) / fcfsMoves) * 100).toFixed(1)) : 0;
    
    // Calculate variance in seek step distances
    const distances = res.steps.map(s => s.distance);
    const avg = res.averageMovement;
    const variance = distances.length > 0
      ? Number((distances.reduce((acc, d) => acc + Math.pow(d - avg, 2), 0) / distances.length).toFixed(1))
      : 0;
    const stdDev = Math.sqrt(variance).toFixed(1);

    // Direction changes count
    let directionChanges = 0;
    for (let i = 2; i < res.movementPath.length; i++) {
      const prevDir = res.movementPath[i - 1] - res.movementPath[i - 2];
      const curDir = res.movementPath[i] - res.movementPath[i - 1];
      if ((prevDir > 0 && curDir < 0) || (prevDir < 0 && curDir > 0)) {
        directionChanges++;
      }
    }

    return {
      name: key,
      fullName: res.algorithmName,
      totalMovement: res.totalMovement,
      averageMovement: res.averageMovement,
      variance,
      stdDev,
      directionChanges,
      savingsVsFcfs: savings,
      totalSteps: res.steps.length,
      servicedCount: res.servicedRequests.length,
      starvationRisk: key === 'SSTF' ? 'HIGH' : (key === 'FCFS' ? 'NONE' : 'LOW'),
      armWearIndex: Math.min(100, Math.round((res.totalMovement / (requests.length * (maxTrack - minTrack) * 0.5)) * 100)),
      serviceOrder: res.servicedRequests.join(' → '),
    };
  });

  comparison.sort((a, b) => a.totalMovement - b.totalMovement);
  comparison.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return { results, comparison };
}
