'use client';

import { useState, useEffect } from 'react';
import { findDuplicates, mergeCustomers, type DuplicateGroup } from '@/actions/duplicates';
import { Copy, AlertTriangle, User as UserIcon, Phone, Mail, MapPin, Navigation, DollarSign, CheckCircle2 } from 'lucide-react';
import LTVBadge from '@/components/LTVBadge';

export default function DuplicatesPage() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mergingId, setMergingId] = useState<string | null>(null);

  useEffect(() => {
    loadDuplicates();
  }, []);

  const loadDuplicates = async () => {
    setIsLoading(true);
    setError(null);
    const result = await findDuplicates();
    if (result.success && result.groups) {
      setGroups(result.groups);
    } else {
      setError(result.error || 'Failed to load duplicates');
    }
    setIsLoading(false);
  };

  const handleMerge = async (groupId: string, primaryId: string, allIds: string[]) => {
    setMergingId(primaryId);
    try {
      // Find all secondary IDs to merge into this primary one
      const secondaryIds = allIds.filter(id => id !== primaryId);
      
      for (const secId of secondaryIds) {
        const result = await mergeCustomers(primaryId, secId);
        if (!result.success) {
          throw new Error(result.error || 'Merge failed for one or more records');
        }
      }
      
      // Remove this group from the UI upon success
      setGroups(prev => prev.filter(g => g.customers.map(c => c.id).join('|') !== groupId));
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unexpected error during merge');
      }
    } finally {
      setMergingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Copy className="w-6 h-6 text-brand" />
          Possible Duplicates
        </h1>
        <p className="text-zinc-400 mt-1">
          Review and merge customer records that share the same phone number or similar name/postcode.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {groups.length === 0 && !error && (
        <div className="glass-panel p-12 text-center flex flex-col items-center justify-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-500" />
          <h2 className="text-xl font-bold text-white">All Clear!</h2>
          <p className="text-zinc-400 max-w-md mx-auto">
            We couldn&apos;t find any obvious duplicate customer records in your database based on phone numbers or name/postcode combinations.
          </p>
          <button 
            onClick={loadDuplicates}
            className="px-4 py-2 mt-4 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Check Again
          </button>
        </div>
      )}

      <div className="space-y-8">
        {groups.map((group, index) => {
          const groupId = group.customers.map(c => c.id).join('|');
          const allIds = group.customers.map(c => c.id);
          
          return (
            <div key={groupId} className="glass-panel rounded-2xl overflow-hidden border border-zinc-800/80">
              <div className="bg-zinc-900/80 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="font-semibold text-zinc-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  {group.reason}
                </h3>
                <span className="text-xs text-zinc-500 font-mono">Match #{index + 1}</span>
              </div>
              
              <div className="p-6 overflow-x-auto">
                <div className="flex gap-6 min-w-max">
                  {group.customers.map(customer => (
                    <div key={customer.id} className="w-80 flex-shrink-0 bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-5 space-y-4 relative">
                      <div className="space-y-1">
                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-zinc-500" />
                          {customer.name || 'Unknown'}
                        </h4>
                        <LTVBadge band={customer.lifetime_value_band} />
                      </div>
                      
                      <div className="space-y-2 text-sm text-zinc-400">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-zinc-500" />
                          {customer.phone || '-'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-zinc-500" />
                          <span className="truncate" title={customer.email || ''}>{customer.email || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-zinc-500" />
                          <span className="truncate" title={customer.address_key || ''}>{customer.address_key || '-'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-zinc-800/50">
                        <div className="bg-zinc-900 rounded-lg p-2 text-center">
                          <div className="flex items-center justify-center gap-1 text-zinc-500 mb-1">
                            <Navigation className="w-3 h-3" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Bookings</span>
                          </div>
                          <p className="text-lg font-semibold text-white">{customer.total_bookings || 0}</p>
                        </div>
                        <div className="bg-zinc-900 rounded-lg p-2 text-center">
                          <div className="flex items-center justify-center gap-1 text-zinc-500 mb-1">
                            <DollarSign className="w-3 h-3" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Spend</span>
                          </div>
                          <p className="text-lg font-semibold text-emerald-400">£{customer.total_spend || 0}</p>
                        </div>
                      </div>

                      {customer.tags && customer.tags.length > 0 && (
                        <div className="pt-2 flex flex-wrap gap-1">
                          {customer.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-[10px] rounded-full">
                              {tag.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => handleMerge(groupId, customer.id, allIds)}
                        disabled={mergingId !== null}
                        className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all shadow-lg ${
                          mergingId === customer.id 
                            ? 'bg-brand/50 text-black cursor-wait' 
                            : mergingId !== null 
                              ? 'bg-zinc-800 text-zinc-500 opacity-50 cursor-not-allowed'
                              : 'bg-brand text-black hover:bg-brand-hover hover:shadow-brand/20'
                        }`}
                      >
                        {mergingId === customer.id ? 'Merging...' : 'Keep as Primary'}
                      </button>
                      
                      {mergingId === null && (
                        <p className="text-[10px] text-zinc-500 text-center mt-2 leading-tight">
                          Click to keep this profile. Other profiles in this match will be archived and their bookings moved here.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
