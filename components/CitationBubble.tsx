import React, { useState } from 'react';
import { FileText, X } from 'lucide-react';

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
}

const CitationBubble: React.FC<CitationBubbleProps> = ({ number, source }) => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <span className="relative inline-block">
      <button
        onClick={() => setShowPopup(!showPopup)}
        className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-emerald-500 rounded-full hover:bg-emerald-600 transition-colors mx-0.5 cursor-pointer shadow-sm hover:shadow-md"
        title={`Sumber: ${source.documentName}`}
      >
        {number}
      </button>
      
      {showPopup && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowPopup(false)}
          />
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 max-w-[90vw] animate-fade-in-up">
            <div className="bg-white rounded-xl shadow-xl border border-zinc-200 overflow-hidden">
              <div className="bg-zinc-50 px-4 py-2 flex items-center justify-between border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-sm text-zinc-800 truncate max-w-[180px]">
                    {source.documentName}
                  </span>
                </div>
                <button 
                  onClick={() => setShowPopup(false)}
                  className="p-1 hover:bg-zinc-200 rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-zinc-500" />
                </button>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Halaman {source.pageNumber}
                  </span>
                </div>
                <p className="text-sm text-zinc-700 leading-relaxed italic">
                  "{source.content.length > 300 
                    ? source.content.substring(0, 300) + '...' 
                    : source.content}"
                </p>
              </div>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white" />
          </div>
        </>
      )}
    </span>
  );
};

export default CitationBubble;
