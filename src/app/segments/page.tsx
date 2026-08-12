import { supabase } from '@/lib/supabase';
import { Users, ArrowRight, Tags, Mail } from 'lucide-react';
import Link from 'next/link';
import RecalculateButton from './RecalculateButton';
import LTVBadge from '@/components/LTVBadge';
import CustomerNameDisplay from '@/components/CustomerNameDisplay';

export const revalidate = 0;

import { TAG_LABELS } from '@/lib/constants';

export default async function SegmentsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const selectedTag = searchParams.tag as string | undefined;

  // Fetch all customers for aggregation and display
  const { data: allCustomers } = await supabase
    .from('customers')
    .select('*')
    .order('last_booking_at', { ascending: false, nullsFirst: false });

  // Compute aggregate counts
  const tagCounts: Record<string, number> = {};
  for (const c of allCustomers || []) {
    for (const t of c.tags || []) {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    }
  }

  // Filter customers based on selection
  const filteredCustomers = selectedTag 
    ? allCustomers?.filter(c => c.tags?.includes(selectedTag)) 
    : allCustomers;

  // Convert map to array for cards, sorted by count descending
  const segmentCards = Object.keys(tagCounts).map(tag => ({
    tag,
    label: TAG_LABELS[tag] || tag,
    count: tagCounts[tag]
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Customer Segments</h2>
          <p className="text-zinc-400">View your customer base divided by behavior and attributes.</p>
        </div>
        <RecalculateButton />
      </div>

      {/* Segment Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link 
          href="/segments"
          className={`glass-panel p-6 rounded-2xl relative overflow-hidden group transition-all cursor-pointer ${!selectedTag ? 'ring-2 ring-brand' : 'hover:bg-zinc-800/50'}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${!selectedTag ? 'bg-brand text-black' : 'bg-zinc-800 text-white'}`}>
              <Users className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium text-zinc-300">All Customers</p>
          </div>
          <h3 className="text-2xl font-bold text-white">{allCustomers?.length || 0}</h3>
        </Link>

        {segmentCards.map((segment) => {
          const isSelected = selectedTag === segment.tag;
          return (
            <div 
              key={segment.tag} 
              className={`glass-panel p-6 rounded-2xl relative overflow-hidden group transition-all ${isSelected ? 'ring-2 ring-brand bg-zinc-800/80' : 'hover:bg-zinc-800/50'}`}
            >
              <Link href={`/segments?tag=${segment.tag}`} className="absolute inset-0 z-0" />
              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-brand text-black' : 'bg-zinc-800 text-brand'}`}>
                    <Tags className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-medium text-zinc-300 truncate" title={segment.label}>{segment.label}</p>
                </div>
                <Link 
                  href={`/campaigns/send?segment=${segment.tag}`}
                  className="p-1.5 rounded-md bg-zinc-800/80 text-zinc-400 hover:text-brand hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100 z-20 relative"
                  title="Send Campaign"
                >
                  <Mail className="w-4 h-4" />
                </Link>
              </div>
              <h3 className="relative z-10 text-2xl font-bold text-white pointer-events-none">{segment.count}</h3>
            </div>
          );
        })}
      </div>

      {/* Customers Table */}
      <div className="glass-panel rounded-2xl overflow-hidden flex flex-col w-full">
        <div className="p-4 md:p-6 border-b border-zinc-800/50 bg-zinc-900/50">
          <h3 className="text-xl font-semibold text-white">
            {selectedTag ? `${TAG_LABELS[selectedTag] || selectedTag} Customers` : 'All Customers'}
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            Showing {filteredCustomers?.length || 0} customer(s).
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/80">
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 whitespace-nowrap">Name</th>
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 whitespace-nowrap">Phone</th>
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 whitespace-nowrap">Bookings</th>
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 whitespace-nowrap">Total Spend</th>
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 whitespace-nowrap">Last Booking</th>
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {(!filteredCustomers || filteredCustomers.length === 0) ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">No customers found in this segment.</td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <CustomerNameDisplay name={customer.name} addressKey={customer.address_key} />
                        <LTVBadge band={customer.lifetime_value_band} />
                      </div>
                      {customer.email && <div className="text-xs text-zinc-500 mt-0.5">{customer.email}</div>}
                    </td>
                    <td className="py-3 px-4 md:py-4 md:px-6 text-zinc-300 whitespace-nowrap">{customer.phone || <span className="text-zinc-600 italic">Unknown</span>}</td>
                    <td className="py-3 px-4 md:py-4 md:px-6 text-zinc-300 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-zinc-800 text-xs font-medium">
                        {customer.total_bookings}
                      </span>
                    </td>
                    <td className="py-3 px-4 md:py-4 md:px-6 text-zinc-300 whitespace-nowrap">£{Number(customer.total_spend || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 md:py-4 md:px-6 text-zinc-300 whitespace-nowrap">
                      {customer.last_booking_at ? new Date(customer.last_booking_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 md:py-4 md:px-6 text-right whitespace-nowrap">
                      <Link href={`/customers/${customer.id}`} className="inline-flex items-center gap-2 text-sm text-brand hover:text-brand-hover md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        View Profile <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
