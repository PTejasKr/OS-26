import React, { useState } from 'react';
import {
  FolderTree,
  FileText,
  Link,
  Layers,
  Trash2,
  Plus,
  ArrowRight,
  Info,
} from 'lucide-react';
import BentoCard from './BentoCard';
import {
  simulateContiguousAllocation,
  simulateLinkedAllocation,
  simulateIndexedAllocation,
  DISK_BLOCK_COUNT,
  DEFAULT_FILES,
} from '../algorithms/fileAllocation';
import { playKeyClick, playReadPulse, playButtonSnap } from '../utils/soundEffects';

export default function FileAllocationStudio({ theme }) {
  const isDark =
    theme === 'dark' ||
    (theme === undefined &&
      typeof document !== 'undefined' &&
      document.documentElement.getAttribute('data-theme') === 'dark');

  const [allocationMode, setAllocationMode] = useState('contiguous'); // 'contiguous', 'linked', 'indexed'
  const [fileList, setFileList] = useState(DEFAULT_FILES);
  const [selectedBlockIdx, setSelectedBlockIdx] = useState(null);
  const [newFileName, setNewFileName] = useState('user_data.bin');
  const [newFileSize, setNewFileSize] = useState(5);

  const contiguousResult = simulateContiguousAllocation(fileList);
  const linkedResult = simulateLinkedAllocation(fileList);
  const indexedResult = simulateIndexedAllocation(fileList);

  const currentResult =
    allocationMode === 'contiguous'
      ? contiguousResult
      : allocationMode === 'linked'
      ? linkedResult
      : indexedResult;

  const handleAddFile = (e) => {
    e.preventDefault();
    if (!newFileName.trim() || newFileSize <= 0) return;
    playKeyClick();
    const colors = ['#891a20', '#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777'];
    const newFile = {
      id: `f_${Date.now()}`,
      name: newFileName.trim(),
      size: parseInt(newFileSize, 10),
      color: colors[fileList.length % colors.length],
    };
    setFileList([...fileList, newFile]);
    setNewFileName(`file_${fileList.length + 1}.dat`);
  };

  const handleDeleteFile = (fileId) => {
    playButtonSnap();
    setFileList(fileList.filter((f) => f.id !== fileId));
    setSelectedBlockIdx(null);
  };

  const selectedBlock =
    selectedBlockIdx !== null ? currentResult.blocks[selectedBlockIdx] : null;

  return (
    <div className="space-y-6 select-text transition-colors duration-300">
      {/* Allocation Mode Selector Bar */}
      <div
        className={`p-6 border flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors ${
          isDark
            ? 'bg-[#0c0c12] border-[#24242e]'
            : 'bg-[#f5f4ef] border-[#0d0d11]/15'
        }`}
      >
        <div className="flex items-center space-x-3.5">
          <div
            className={`p-2 border shrink-0 ${
              isDark
                ? 'border-[#24242e] bg-[#14141c] text-[#f3f1ea]'
                : 'border-[#0d0d11]/20 bg-white text-[#0d0d11]'
            }`}
          >
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <span
              className={`text-[10px] font-mono-tech uppercase tracking-[0.25em] block mb-0.5 font-bold ${
                isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
              }`}
            >
              STUDIO 01 // FILE ALLOCATION ARCHITECTURE
            </span>
            <h2
              className={`text-2xl sm:text-3xl font-tall font-bold uppercase tracking-tight leading-none ${
                isDark ? 'text-[#f3f1ea]' : 'text-[#0d0d11]'
              }`}
            >
              FILE ALLOCATION STRATEGIES
            </h2>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'contiguous', label: 'Contiguous' },
            { id: 'linked', label: 'Linked / FAT' },
            { id: 'indexed', label: 'Indexed / Inode' },
          ].map((mode) => {
            const isActive = allocationMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  playButtonSnap();
                  setAllocationMode(mode.id);
                  setSelectedBlockIdx(null);
                }}
                className={`px-4 py-2 border text-xs font-mono-tech uppercase tracking-[0.16em] transition-all font-semibold ${
                  isActive
                    ? isDark
                      ? 'bg-[#f3f1ea] text-[#07070a] border-[#f3f1ea] shadow-sm'
                      : 'bg-[#0d0d11] text-[#f2f2f2] border-[#0d0d11] shadow-sm'
                    : isDark
                    ? 'bg-transparent text-[#8c8b94] border-[#24242e] hover:border-[#8c8b94] hover:text-[#f3f1ea]'
                    : 'bg-transparent text-[#6b6a72] border-[#0d0d11]/20 hover:border-[#0d0d11] hover:text-[#0d0d11]'
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 64-Block Storage Disk Array Canvas */}
        <BentoCard
          title="PHYSICAL STORAGE DISK BLOCK MATRIX"
          subtitle={`Mode: ${allocationMode.toUpperCase()} | 64 blocks total | Click any block to inspect metadata`}
          badge={`${currentResult.fileEntries.length} FILES STORED`}
          icon={Layers}
          className="lg:col-span-2"
          theme={theme}
        >
          <div className="space-y-5">
            {/* 8x8 Block Grid */}
            <div
              className={`grid grid-cols-8 sm:grid-cols-16 gap-2 p-4 border transition-colors ${
                isDark
                  ? 'bg-[#12121b] border-[#24242e]'
                  : 'bg-white border-[#0d0d11]/15'
              }`}
            >
              {currentResult.blocks.map((block) => {
                const isSelected = selectedBlockIdx === block.blockIndex;
                return (
                  <div
                    key={`blk-${block.blockIndex}`}
                    onClick={() => {
                      playReadPulse();
                      setSelectedBlockIdx(block.blockIndex);
                    }}
                    className={`aspect-square p-1.5 flex flex-col justify-between cursor-pointer transition-all duration-200 border relative ${
                      isSelected
                        ? isDark
                          ? 'border-[#f3f1ea] ring-2 ring-white/40 scale-105 z-20 shadow-md'
                          : 'border-[#0d0d11] ring-2 ring-black/30 scale-105 z-20 shadow-md'
                        : block.isAllocated
                        ? 'border-transparent hover:scale-105'
                        : isDark
                        ? 'border-[#24242e]/60 bg-[#161622] hover:border-[#8c8b94]'
                        : 'border-[#0d0d11]/10 bg-[#f0eee6] hover:border-[#0d0d11]/40'
                    }`}
                    style={{
                      backgroundColor: block.isAllocated
                        ? `${block.color || '#891a20'}22`
                        : undefined,
                      borderColor: block.isAllocated
                        ? block.color || '#891a20'
                        : undefined,
                    }}
                  >
                    <span
                      className={`text-[9px] font-mono-tech font-bold ${
                        isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                      }`}
                    >
                      {block.blockIndex}
                    </span>

                    {block.isAllocated && (
                      <span
                        className="w-2 h-2 rounded-full self-end shadow-xs"
                        style={{ backgroundColor: block.color || '#891a20' }}
                      />
                    )}

                    {block.isIndexBlock && (
                      <span className="absolute top-0.5 right-1 text-[8px] font-mono-tech font-black text-[#891a20]">
                        IX
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Block Inspector Callout */}
            {selectedBlock ? (
              <div
                className={`p-4 border space-y-2 transition-colors ${
                  isDark
                    ? 'bg-[#14141c] border-[#24242e]'
                    : 'bg-white border-[#0d0d11]/15'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono-tech font-bold text-xs uppercase tracking-wide">
                    INSPECTING BLOCK #{selectedBlock.blockIndex}:
                  </span>
                  <span
                    className={`text-[10px] font-mono-tech uppercase tracking-[0.16em] px-2.5 py-0.5 border font-semibold ${
                      selectedBlock.isAllocated
                        ? isDark
                          ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                          : 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : isDark
                        ? 'border-[#24242e] text-[#8c8b94]'
                        : 'border-[#0d0d11]/20 text-[#6b6a72]'
                    }`}
                  >
                    {selectedBlock.isAllocated ? 'ALLOCATED' : 'FREE BLOCK'}
                  </span>
                </div>
                {selectedBlock.isAllocated ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs font-mono-tech">
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider opacity-60">File</span>
                      <strong className="font-bold">{selectedBlock.fileName}</strong>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider opacity-60">Type</span>
                      <strong className="font-bold">
                        {selectedBlock.isIndexBlock ? 'INODE INDEX BLOCK' : 'DATA BLOCK'}
                      </strong>
                    </div>
                    {selectedBlock.nextBlock !== undefined && (
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider opacity-60">Pointer</span>
                        <strong className="font-bold">
                          {selectedBlock.nextBlock === -1 ? 'EOF (End of File)' : `➔ Block ${selectedBlock.nextBlock}`}
                        </strong>
                      </div>
                    )}
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider opacity-60">Payload</span>
                      <span className="opacity-80 truncate block">{selectedBlock.contentPreview}</span>
                    </div>
                  </div>
                ) : (
                  <p
                    className={`text-xs font-editorial italic ${
                      isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                    }`}
                  >
                    This block is unallocated and available for storage writes.
                  </p>
                )}
              </div>
            ) : (
              <div
                className={`p-3 border text-xs font-mono-tech text-center ${
                  isDark
                    ? 'border-[#24242e] text-[#8c8b94] bg-[#12121b]'
                    : 'border-[#0d0d11]/15 text-[#6b6a72] bg-white/60'
                }`}
              >
                Click any of the 64 disk blocks above to inspect sector pointers, Inode contents, or FAT entries.
              </div>
            )}

            {/* Mode-Specific Insights & Proofs */}
            <div
              className={`p-4 border-l-2 border-[#891a20] space-y-1 transition-colors ${
                isDark ? 'bg-[#891a20]/10 text-[#dedbd2]' : 'bg-[#891a20]/5 text-[#2b2a33]'
              }`}
            >
              {allocationMode === 'contiguous' && (
                <>
                  <div className="flex justify-between items-center text-xs font-mono-tech">
                    <span className="font-bold uppercase text-[#891a20]">
                      Contiguous External Fragmentation Index:
                    </span>
                    <span className="font-bold">
                      {contiguousResult.fragmentationIndex}% ({contiguousResult.freeRuns} separate free gaps)
                    </span>
                  </div>
                  <p className="text-xs font-editorial italic leading-relaxed pt-1">
                    Direct access formula: LBA = StartBlock + Offset (O(1)). Fast sequential read, but new files may be rejected if free space is fractured into non-contiguous fragments.
                  </p>
                </>
              )}

              {allocationMode === 'linked' && (
                <>
                  <div className="text-xs font-mono-tech font-bold uppercase text-[#891a20]">
                    Linked Allocation & FAT Table:
                  </div>
                  <p className="text-xs font-editorial italic leading-relaxed pt-1">
                    Blocks are scattered anywhere across the platters with zero external fragmentation. However, seeking to block K requires traversing K sequential disk pointers (O(N) sequential traversal delay).
                  </p>
                </>
              )}

              {allocationMode === 'indexed' && (
                <>
                  <div className="text-xs font-mono-tech font-bold uppercase text-[#891a20]">
                    Unix Inode Multi-Level Indexing:
                  </div>
                  <p className="text-xs font-editorial italic leading-relaxed pt-1">
                    Combines the direct-access speed of contiguous allocation with the zero-fragmentation flexibility of linked allocation. The Inode holds Direct Pointers for small files, and Single/Double Indirect Pointers for massive files.
                  </p>
                </>
              )}
            </div>
          </div>
        </BentoCard>

        {/* Right Col: Directory Structure & File Manager */}
        <BentoCard
          title="DIRECTORY TABLE & FILE SYSTEM"
          subtitle="Kernel File Control Blocks (FCB)"
          badge={`${fileList.length} REGISTERED`}
          icon={FileText}
          theme={theme}
        >
          <div className="space-y-5">
            {/* Create New File Form */}
            <form
              onSubmit={handleAddFile}
              className={`p-4 border space-y-3 transition-colors ${
                isDark
                  ? 'bg-[#14141c] border-[#24242e]'
                  : 'bg-white border-[#0d0d11]/15'
              }`}
            >
              <div
                className={`text-[10px] font-mono-tech uppercase tracking-[0.2em] font-bold ${
                  isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                }`}
              >
                CREATE NEW FILE ENTRY:
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="filename.ext"
                  className={`border px-3 py-2 text-xs font-mono-tech outline-none ${
                    isDark
                      ? 'bg-[#0c0c12] border-[#24242e] text-[#f3f1ea] focus:border-[#f3f1ea]'
                      : 'bg-white border-[#0d0d11]/20 text-[#0d0d11] focus:border-[#0d0d11]'
                  }`}
                />
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={newFileSize}
                  onChange={(e) => setNewFileSize(e.target.value)}
                  className={`border px-3 py-2 text-xs font-mono-tech outline-none ${
                    isDark
                      ? 'bg-[#0c0c12] border-[#24242e] text-[#f3f1ea] focus:border-[#f3f1ea]'
                      : 'bg-white border-[#0d0d11]/20 text-[#0d0d11] focus:border-[#0d0d11]'
                  }`}
                />
              </div>
              <button
                type="submit"
                className={`w-full py-2.5 border font-mono-tech text-xs uppercase tracking-[0.16em] font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  isDark
                    ? 'bg-[#f3f1ea] text-[#07070a] border-[#f3f1ea] hover:bg-white'
                    : 'bg-[#0d0d11] text-[#f2f2f2] border-[#0d0d11] hover:bg-black'
                }`}
              >
                <Plus size={14} />
                <span>Allocate File to Disk</span>
              </button>
            </form>

            {/* Registered Directory Table */}
            <div className="space-y-2">
              <div
                className={`text-[10px] font-mono-tech uppercase tracking-[0.2em] font-semibold ${
                  isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                }`}
              >
                Directory Table (FCB Entries):
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {currentResult.fileEntries.map((file) => (
                  <div
                    key={file.id}
                    className={`p-3 border flex items-center justify-between gap-3 transition-colors ${
                      isDark
                        ? 'border-[#24242e] bg-[#14141c]'
                        : 'border-[#0d0d11]/15 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: file.color }}
                      />
                      <div className="min-w-0">
                        <div
                          className={`font-mono-tech font-bold text-xs truncate ${
                            isDark ? 'text-[#f3f1ea]' : 'text-[#0d0d11]'
                          }`}
                        >
                          {file.name}
                        </div>
                        <div
                          className={`text-[10px] font-mono-tech ${
                            isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                          }`}
                        >
                          {file.size} Blocks ({file.size * 4} KB)
                          {file.startBlock !== undefined && ` | Start: ${file.startBlock}`}
                          {file.indexBlock !== undefined && ` | Inode: ${file.indexBlock}`}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className={`p-1.5 transition-colors cursor-pointer ${
                        isDark ? 'text-[#8c8b94] hover:text-red-400' : 'text-[#6b6a72] hover:text-red-600'
                      }`}
                      title="Delete File and Free Blocks"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                {/* Rejected Files Callout (if contiguous allocation failed) */}
                {currentResult.rejectedFiles && currentResult.rejectedFiles.length > 0 && (
                  <div className="p-3 border border-rose-500/40 bg-rose-500/10 text-rose-400 text-xs font-mono-tech">
                    <strong>Allocation Failed for:</strong>
                    {currentResult.rejectedFiles.map((rf) => (
                      <div key={rf.id} className="mt-1">
                        • {rf.name} ({rf.size} blocks): {rf.reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
