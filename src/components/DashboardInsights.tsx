import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowRight, MapPin, Navigation, TrendingUp } from 'lucide-react';
import CustomerNameDisplay from './CustomerNameDisplay';
import CollapsibleSection from './CollapsibleSection';

export default async function DashboardInsights() {
  const [
    { data: topCustomers },
    { data: topPickups },
    { data: topDropoffs },
    { data: topRoutes, error: topRoutesError }
  ] = await Promise.all([
    supabase.from('customers').select('*').order('total_spend', { ascending: false, nullsFirst: false }).limit(10),
    supabase.from('top_pickup_locations').select('*').limit(10),
    supabase.from('top_dropoff_locations').select('*').limit(10),
    supabase.from('top_routes').select('*').limit(10)
  ]);

  if (topRoutesError) {
    console.error("TOP ROUTES ERROR:", topRoutesError);
  }

  const formatCurrency = (val: number) => `£${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 mt-12 pt-8 border-t border-zinc-800/50">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-brand" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Top Insights</h2>
          <p className="text-sm text-zinc-400">Business intelligence and top performers derived directly from your journeys.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top 10 Customers */}
        <CollapsibleSection title="Top 10 Customers by Spend">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-900/80 border-b border-zinc-800/50">
                  <th className="py-3 px-4 font-medium text-zinc-400 whitespace-nowrap">#</th>
                  <th className="py-3 px-4 font-medium text-zinc-400 whitespace-nowrap">Customer</th>
                  <th className="py-3 px-4 font-medium text-zinc-400 text-right whitespace-nowrap">Bookings</th>
                  <th className="py-3 px-4 font-medium text-zinc-400 text-right whitespace-nowrap">Revenue</th>
                  <th className="py-3 px-4 whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {topCustomers?.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="py-3 px-4 font-medium text-zinc-500 whitespace-nowrap">{idx + 1}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <CustomerNameDisplay name={c.name} addressKey={c.address_key} />
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-300 whitespace-nowrap">{c.total_bookings}</td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-400 whitespace-nowrap">{formatCurrency(Number(c.total_spend || 0))}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link href={`/customers/${c.id}`} className="text-brand hover:text-brand-hover lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-4 h-4 inline" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {(!topCustomers || topCustomers.length === 0) && (
                  <tr><td colSpan={5} className="py-6 text-center text-zinc-500 whitespace-nowrap">No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>

        {/* Top 10 Routes */}
        <CollapsibleSection title="Top 10 Routes">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-900/80 border-b border-zinc-800/50">
                  <th className="py-3 px-4 font-medium text-zinc-400 whitespace-nowrap">#</th>
                  <th className="py-3 px-4 font-medium text-zinc-400 whitespace-nowrap">Route</th>
                  <th className="py-3 px-4 font-medium text-zinc-400 text-right whitespace-nowrap">Count</th>
                  <th className="py-3 px-4 font-medium text-zinc-400 text-right whitespace-nowrap">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {topRoutes?.map((r, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="py-3 px-4 font-medium text-zinc-500 whitespace-nowrap">{idx + 1}</td>
                    <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 truncate max-w-[200px]" title={r.pickup_address}><MapPin className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" /> <span className="truncate">{r.pickup_address}</span></span>
                        <span className="flex items-center gap-1.5 text-xs text-zinc-500 truncate max-w-[200px]" title={r.dropoff_address}><Navigation className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{r.dropoff_address}</span></span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-300 whitespace-nowrap">{r.journey_count}</td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-400 whitespace-nowrap">{formatCurrency(Number(r.total_revenue || 0))}</td>
                  </tr>
                ))}
                {(!topRoutes || topRoutes.length === 0) && (
                  <tr><td colSpan={4} className="py-6 text-center text-zinc-500 whitespace-nowrap">No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>

        {/* Top 10 Pickups */}
        <CollapsibleSection title="Top 10 Pickup Locations">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-900/80 border-b border-zinc-800/50">
                  <th className="py-3 px-4 font-medium text-zinc-400 whitespace-nowrap">#</th>
                  <th className="py-3 px-4 font-medium text-zinc-400 whitespace-nowrap">Address</th>
                  <th className="py-3 px-4 font-medium text-zinc-400 text-right whitespace-nowrap">Count</th>
                  <th className="py-3 px-4 font-medium text-zinc-400 text-right whitespace-nowrap">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {topPickups?.map((p, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="py-3 px-4 font-medium text-zinc-500 whitespace-nowrap">{idx + 1}</td>
                    <td className="py-3 px-4 text-zinc-300 whitespace-nowrap"><span className="flex items-center gap-1.5 truncate max-w-[200px]" title={p.pickup_address}><MapPin className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" /> <span className="truncate">{p.pickup_address}</span></span></td>
                    <td className="py-3 px-4 text-right text-zinc-300 whitespace-nowrap">{p.journey_count}</td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-400 whitespace-nowrap">{formatCurrency(Number(p.total_revenue || 0))}</td>
                  </tr>
                ))}
                {(!topPickups || topPickups.length === 0) && (
                  <tr><td colSpan={4} className="py-6 text-center text-zinc-500 whitespace-nowrap">No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>

        {/* Top 10 Dropoffs */}
        <CollapsibleSection title="Top 10 Dropoff Locations">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-900/80 border-b border-zinc-800/50">
                  <th className="py-3 px-4 font-medium text-zinc-400 whitespace-nowrap">#</th>
                  <th className="py-3 px-4 font-medium text-zinc-400 whitespace-nowrap">Address</th>
                  <th className="py-3 px-4 font-medium text-zinc-400 text-right whitespace-nowrap">Count</th>
                  <th className="py-3 px-4 font-medium text-zinc-400 text-right whitespace-nowrap">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {topDropoffs?.map((d, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="py-3 px-4 font-medium text-zinc-500 whitespace-nowrap">{idx + 1}</td>
                    <td className="py-3 px-4 text-zinc-300 whitespace-nowrap"><span className="flex items-center gap-1.5 truncate max-w-[200px]" title={d.dropoff_address}><Navigation className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" /> <span className="truncate">{d.dropoff_address}</span></span></td>
                    <td className="py-3 px-4 text-right text-zinc-300 whitespace-nowrap">{d.journey_count}</td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-400 whitespace-nowrap">{formatCurrency(Number(d.total_revenue || 0))}</td>
                  </tr>
                ))}
                {(!topDropoffs || topDropoffs.length === 0) && (
                  <tr><td colSpan={4} className="py-6 text-center text-zinc-500 whitespace-nowrap">No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>

      </div>
    </div>
  );
}
