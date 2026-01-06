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
        <div className="fixed z-[100] animate-fade-in-up pointer-events-none" 
          style={{
            width: '280px',
            maxWidth: 'calc(100vw - 32px)',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 'auto',
            top: 'auto'
          }}
          ref={(el) => {
            if (el) {
              const rect = el.getBoundingClientRect();
              const parentRect = el.parentElement?.getBoundingClientRect();
              if (parentRect) {
                let left = parentRect.left + parentRect.width / 2 - rect.width / 2;
                let top = parentRect.top - rect.height - 8;
                if (left < 16) left = 16;
                if (left + rect.width > window.innerWidth - 16) left = window.innerWidth - rect.width - 16;
                if (top < 16) top = parentRect.bottom + 8;
                el.style.left = `${left}px`;
                el.style.top = `${top}px`;
                el.style.transform = 'none';
              }
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl border border-zinc-200 overflow-hidden">
            <div className="bg-zinc-50 px-3 py-2 flex items-center gap-2 border-b border-zinc-100">
              <FileText className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold text-xs text-zinc-800 truncate flex-1">
                {source.documentName}
              </span>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex-shrink-0">
                Hal. {source.pageNumber}
              </span>
            </div>
            <div className="px-3 py-2">
              <p className="text-xs text-zinc-600 leading-relaxed line-clamp-4">
                "{source.content.length > 200 
                  ? source.content.substring(0, 200) + '...' 
                  : source.content}"
              </p>
              <p className="text-[10px] text-zinc-400 mt-2">Klik untuk detail lengkap</p>
            </div>
          </div>
        </div>
      )}
    </span>
  );
};

export default CitationBubble;
