/**
 * Comprehensive Operating Systems Storage Viva Voce & Laboratory Exam Database
 * Covers Disk Scheduling, File Allocation, Directory Structure, Free Space, and Hardware Physics.
 */

export const VIVA_QUESTIONS = [
  {
    id: 'v1',
    category: 'Disk Scheduling',
    question: 'What is the primary difference between Seek Time and Rotational Latency?',
    answer: 'Seek Time is the mechanical delay for the read/write actuator arm to physically move radially to the target cylinder/track (3–10 ms, the largest bottleneck). Rotational Latency is the delay while the spindle rotates the disk platter until the target sector passes directly beneath the magnetic head (typically 2–4 ms at 7200–15000 RPM). Seek time is the parameter directly optimized by disk scheduling algorithms.',
    keyPoints: [
      'Seek Time: Radial arm travel (Optimized by OS scheduling).',
      'Rotational Latency: Angular platter rotation (Average = 0.5 / (RPM / 60)).',
      'Seek time is 2x to 5x larger than rotational latency.'
    ],
    difficulty: 'Basic'
  },
  {
    id: 'v2',
    category: 'Disk Scheduling',
    question: 'Why does SSTF suffer from starvation, and how does SCAN solve it?',
    answer: 'SSTF (Shortest Seek Time First) greedily services whichever pending request is closest to the current head position. In a high-traffic system where requests continuously arrive near the active head cluster, requests located on distant tracks may wait indefinitely (starvation). SCAN (the Elevator Algorithm) eliminates this by moving monotonically in one direction until reaching the disk boundary, servicing all encountered requests along the way, before reversing. This guarantees an upper bound on waiting time of at most two disk sweeps.',
    keyPoints: [
      'SSTF causes indefinite postponement for outlier cylinders.',
      'SCAN guarantees bounded delay (maximum 2 full sweeps).',
      'Elevator analogy: picks up passengers going in current direction first.'
    ],
    difficulty: 'Intermediate'
  },
  {
    id: 'v3',
    category: 'Disk Scheduling',
    question: 'What motivated the development of C-SCAN over standard SCAN?',
    answer: 'In standard SCAN, when the arm reaches a boundary and reverses, the tracks it just visited have very few new requests, whereas tracks at the far opposite boundary have had the longest time to accumulate pending I/O requests. This results in an uneven waiting time distribution across cylinders. C-SCAN (Circular SCAN) resolves this by servicing in only one direction. Upon hitting the boundary, it wraps around to the opposite boundary without servicing requests on the rapid return, delivering a remarkably uniform waiting time distribution for all cylinders.',
    keyPoints: [
      'SCAN favors middle cylinders over edges; boundary reversal has low density.',
      'C-SCAN treats cylinders as a circular ring buffer.',
      'Yields the most uniform and predictable response times.'
    ],
    difficulty: 'Advanced'
  },
  {
    id: 'v4',
    category: 'Disk Scheduling',
    question: 'How do LOOK and C-LOOK optimize upon SCAN and C-SCAN?',
    answer: 'SCAN and C-SCAN mechanically travel all the way to the physical boundary cylinders (e.g., track 0 and track 199) regardless of whether requests exist at those extremes. LOOK and C-LOOK "look ahead" at the request queue: the head only travels as far as the highest or lowest requested cylinder in the current direction before reversing (LOOK) or wrapping (C-LOOK). This trims off useless mechanical seek travel, reducing total head movement while maintaining the anti-starvation benefits.',
    keyPoints: [
      'LOOK stops at max pending request in direction; skips edge boundaries.',
      'C-LOOK wraps directly from highest request to lowest request.',
      'Saves tens to hundreds of unnecessary track seek movements.'
    ],
    difficulty: 'Intermediate'
  },
  {
    id: 'v5',
    category: 'File Systems',
    question: 'Compare Contiguous, Linked, and Indexed File Allocation.',
    answer: 'Contiguous Allocation stores files in consecutive blocks: supports instant direct access ($O(1)$) and high sequential read speed, but suffers severely from external fragmentation and file growth limits. Linked Allocation links scattered blocks via pointers: zero external fragmentation and easy file growth, but random access is terrible ($O(N)$ seeks) and pointer corruption risks data loss. Indexed Allocation (used in Unix Inodes) keeps all block pointers in an index block: combines instant direct access with zero external fragmentation, with only small metadata overhead for index blocks.',
    keyPoints: [
      'Contiguous: Fast direct access ($O(1)$), high external fragmentation.',
      'Linked: No fragmentation, slow random access ($O(N)$ seeks).',
      'Indexed / Inode: Best balance; fast direct lookup with zero external fragmentation.'
    ],
    difficulty: 'Intermediate'
  },
  {
    id: 'v6',
    category: 'Hardware & Modern Tech',
    question: 'Do SSDs (Solid State Drives) utilize mechanical disk scheduling algorithms?',
    answer: 'No. SSDs have no moving platters, read heads, or mechanical actuator arms. Flash memory cells are accessed electronically in near-constant time ($O(1)$ uniform access time regardless of Logical Block Address). Traditional disk scheduling algorithms like SSTF or SCAN are counterproductive for SSDs because they introduce unnecessary CPU overhead and can cause uneven write wear. SSDs instead employ flash-aware I/O dispatchers (such as Linux kyber or none/noop) alongside internal Flash Translation Layer (FTL) wear leveling and NVMe parallel queues.',
    keyPoints: [
      'SSDs have zero seek time and zero rotational latency.',
      'Scheduling focuses on Wear Leveling, Garbage Collection, and TRIM.',
      'Modern NVMe SSDs support up to 64,000 parallel queues with 64,000 commands each.'
    ],
    difficulty: 'Advanced'
  },
  {
    id: 'v7',
    category: 'Free Space Management',
    question: 'Explain how the Bit Vector (Bitmap) approach manages free disk blocks.',
    answer: 'The bit vector represents the entire disk using an array of bits, where bit[i] = 1 indicates block i is free, and bit[i] = 0 indicates block i is allocated. To locate the first free block, hardware or OS instructions (like find-first-set) quickly scan 32-bit or 64-bit words. When a non-zero word is found, the block address is calculated as: Block Number = (Word Index * Bits_Per_Word) + Offset_of_First_1_Bit. It is compact (1 bit per block) and allows easy contiguous allocation searching.',
    keyPoints: [
      'Bit 1 = Free, Bit 0 = Allocated.',
      'Block Address formula: (Word_Index * 32) + Offset.',
      'Extremely fast when bit vector is cached in RAM.'
    ],
    difficulty: 'Intermediate'
  }
];

export const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    question: 'Given an initial head position at track 53 and a queue of [98, 183, 37, 122, 14, 124, 65, 67], which request is serviced FIRST under SSTF?',
    options: ['98', '65', '37', '14'],
    correctIndex: 1,
    explanation: 'From head 53, distances to pending tracks are: |65 - 53| = 12, |37 - 53| = 16, |67 - 53| = 14, |98 - 53| = 45. Track 65 has the shortest seek distance (12 tracks) and is chosen first.'
  },
  {
    id: 'q2',
    question: 'In C-SCAN with disk bounds [0, 199] moving right from head 53, why does the head jump from 199 to 0?',
    options: [
      'To service requests on track 0',
      'To provide a uniform waiting time distribution without servicing on the return trip',
      'Because track 199 is broken',
      'To reduce total head movement'
    ],
    correctIndex: 1,
    explanation: 'C-SCAN treats cylinders as a circular ring. Servicing only in one direction and performing a fast reset return ensures all cylinders experience an equal, uniform wait time between sweeps.'
  },
  {
    id: 'q3',
    question: 'Which file allocation method suffers the most from External Fragmentation?',
    options: ['Indexed Allocation', 'Linked Allocation', 'Contiguous Allocation', 'FAT Allocation'],
    correctIndex: 2,
    explanation: 'Contiguous allocation requires a continuous span of empty blocks. As files are created and deleted over time, free space becomes broken into small non-contiguous pockets (external fragmentation).'
  },
  {
    id: 'q4',
    question: 'If a hard disk spins at 7200 RPM, what is its average rotational latency?',
    options: ['8.33 ms', '4.17 ms', '2.08 ms', '12.0 ms'],
    correctIndex: 1,
    explanation: 'Time for 1 full revolution = 60 / 7200 seconds = 8.33 ms. On average, the target sector is half a revolution away: 8.33 ms / 2 = 4.17 ms.'
  },
  {
    id: 'q5',
    question: 'In Unix Inode architecture, how is a 4 GB file addressed when the inode only has 12 direct pointers?',
    options: [
      'It cannot be addressed',
      'Through Single, Double, and Triple Indirect Pointer blocks',
      'By converting to Contiguous Allocation',
      'By expanding the inode size dynamically'
    ],
    correctIndex: 1,
    explanation: 'Unix inodes provide Multi-Level Indexing: Direct pointers cover small files, Single Indirect points to a block of pointers, Double Indirect points to blocks of single indirect blocks, and Triple Indirect allows addressing multi-gigabyte or terabyte files.'
  }
];
