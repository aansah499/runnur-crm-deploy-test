"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Calendar } from 'lucide-react';

export default function DateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState(fromParam || '');
  const [customTo, setCustomTo] = useState(toParam || '');

  const setRange = (type: string) => {
    setShowCustom(false);
    const today = new Date();
    // Use local date string format YYYY-MM-DD
    const pad = (n: number) => n.toString().padStart(2, '0');
    const toDateString = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    let from = '';
    let to = '';
    
    if (type === 'today') {
      from = toDateString(today);
      to = from;
    } else if (type === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      from = toDateString(yesterday);
      to = from;
    } else if (type === 'week') {
      const startOfWeek = new Date(today);
      const day = today.getDay() || 7; // Make Sunday 7 instead of 0 for ISO week
      startOfWeek.setDate(today.getDate() - day + 1);
      from = toDateString(startOfWeek);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      to = toDateString(endOfWeek);
    } else if (type === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      from = toDateString(startOfMonth);
      
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      to = toDateString(endOfMonth);
    }
    
    if (type === 'all') {
      router.push('/summary');
    } else {
      router.push(`/summary?from=${from}&to=${to}`);
    }
  };

  const applyCustom = () => {
    if (customFrom && customTo) {
      router.push(`/summary?from=${customFrom}&to=${customTo}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setRange('today')} className="px-4 py-2 bg-zinc-900 text-sm text-zinc-300 font-medium rounded-lg border border-zinc-800 hover:border-brand hover:text-brand transition-colors">Today</button>
        <button onClick={() => setRange('yesterday')} className="px-4 py-2 bg-zinc-900 text-sm text-zinc-300 font-medium rounded-lg border border-zinc-800 hover:border-brand hover:text-brand transition-colors">Yesterday</button>
        <button onClick={() => setRange('week')} className="px-4 py-2 bg-zinc-900 text-sm text-zinc-300 font-medium rounded-lg border border-zinc-800 hover:border-brand hover:text-brand transition-colors">This Week</button>
        <button onClick={() => setRange('month')} className="px-4 py-2 bg-zinc-900 text-sm text-zinc-300 font-medium rounded-lg border border-zinc-800 hover:border-brand hover:text-brand transition-colors">This Month</button>
        <button onClick={() => setRange('all')} className="px-4 py-2 bg-zinc-900 text-sm text-zinc-300 font-medium rounded-lg border border-zinc-800 hover:border-brand hover:text-brand transition-colors">All Time</button>
        
        <button 
          onClick={() => setShowCustom(!showCustom)} 
          className={`px-4 py-2 text-sm font-medium rounded-lg border flex items-center gap-2 transition-colors ${showCustom ? 'bg-brand/10 border-brand text-brand' : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-brand hover:text-brand'}`}
        >
          <Calendar className="w-4 h-4" />
          Custom Range
        </button>
      </div>

      {showCustom && (
        <div className="flex items-end gap-3 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50 w-fit">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Start Date</label>
            <input 
              type="date" 
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">End Date</label>
            <input 
              type="date" 
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand"
            />
          </div>
          <button 
            onClick={applyCustom}
            disabled={!customFrom || !customTo}
            className="px-4 py-2 bg-brand text-black text-sm font-medium rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Filter
          </button>
        </div>
      )}
    </div>
  );
}
