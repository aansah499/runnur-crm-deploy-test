'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

type Props = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export default function CollapsibleSection({ title, children, defaultOpen = true }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-full">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors w-full text-left"
      >
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {isOpen ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
      </button>
      
      {isOpen && (
        <div className="p-0 overflow-x-auto">
          {children}
        </div>
      )}
    </div>
  );
}
