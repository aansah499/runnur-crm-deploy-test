'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, User as UserIcon, Phone, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import LTVBadge from '@/components/LTVBadge';

type SearchResult = {
  id: string;
  name: string | null;
  phone: string | null;
  address_key: string | null;
  lifetime_value_band: string | null;
};

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query || query.trim().length === 0) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/customers/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('Failed to search customers', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (id: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/customers/${id}`);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-5 h-5 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true);
          }}
          placeholder="Search by name, phone, or postcode..."
          className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all shadow-lg"
        />
        {isLoading && (
          <Loader2 className="absolute right-4 w-5 h-5 text-brand animate-spin" />
        )}
      </div>

      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-zinc-900 border border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="max-h-96 overflow-y-auto p-2">
            {!isLoading && results.length === 0 && (
              <div className="p-4 text-center text-zinc-400 text-sm">
                No customers found matching "{query}"
              </div>
            )}
            
            {results.map((customer) => (
              <button
                key={customer.id}
                onClick={() => handleSelect(customer.id)}
                className="w-full text-left p-3 hover:bg-zinc-800/50 rounded-xl transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-zinc-500 group-hover:text-brand transition-colors" />
                    <span className="font-medium text-zinc-200">{customer.name || 'Unknown'}</span>
                    <LTVBadge band={customer.lifetime_value_band} />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-xs text-zinc-400 pl-6">
                    {customer.phone && (
                      <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{customer.phone}</span>
                    )}
                    {customer.address_key && (
                      <span className="flex items-center gap-1.5 truncate max-w-[200px]" title={customer.address_key}><MapPin className="w-3.5 h-3.5" />{customer.address_key}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
