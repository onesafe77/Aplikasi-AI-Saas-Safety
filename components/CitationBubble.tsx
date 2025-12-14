import React, { useState, useRef } from 'react';
import { FileText } from 'lucide-react';

export interface SourceInfo {
  id: number;
  chunkId: number;
  documentName: string;
  pageNumber: number;
  content: string;
  score: number;
}

interface CitationBubbleProps {
  number: number;
  source: SourceInfo;
  onOpenPanel?: (source: SourceInfo) => void;
}

const CitationBubble: React.FC<CitationBubbleProps> = ({ number, source, onOpenPanel }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => {
      setShowTooltip(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    setShowTooltip(false);
  };

  const handleClick = () => {
    if (onOpenPanel) {
      onOpenPanel(source);
    }
  };

  return (
    <span 
      className="relative inline"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={handleClick}
        className="inline-flex items-center justify-center w-4 h-4 text-[9px] font-semibold text-emerald-700 bg-emerald-100 rounded hover:bg-emerald-200 transition-colors cursor-pointer align-super -ml-0.5 mr-0.5"
        title={`Sumber: ${source.documentName}`}
      >
        {number}
      </button>
      
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 max-w-[90vw] animate-fade-in-up pointer-events-none">
          <div className="bg-white rounded-lg shadow-lg border border-zinc-200 overflow-hidden">
            <div className="bg-zinc-50 px-3 py-1.5 flex items-center gap-2 border-b border-zinc-100">
              <FileText className="w-3 h-3 text-emerald-600" />
              <span className="font-semibold text-xs text-zinc-800 truncate max-w-[180px]">
                {source.documentName}
              </span>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded ml-auto">
                Hal. {source.pageNumber}
              </span>
            </div>
            <div className="px-3 py-2">
              <p className="text-xs text-zinc-600 leading-relaxed line-clamp-3">
                "{source.content.length > 150 
                  ? source.content.substring(0, 150) + '...' 
                  : source.content}"
              </p>
              <p className="text-[10px] text-zinc-400 mt-1.5">Klik untuk detail lengkap</p>
            </div>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-white" />
        </div>
      )}
    </span>
  );
};

export default CitationBubble;
