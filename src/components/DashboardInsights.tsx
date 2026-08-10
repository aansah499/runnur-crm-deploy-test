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
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-900/80 border-b border-zinc-800/50">
                <th className="py-3 px-4 font-medium text-zinc-400">#</th>
                <th className="py-3 px-4 font-medium text-zinc-400">Customer</th>
                <th className="py-3 px-4 font-medium text-zinc-400 text-right">Bookings</th>
                <th className="py-3 px-4 font-medium text-zinc-400 text-right">Revenue</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {topCustomers?.map((c, idx) => (
                <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="py-3 px-4 font-medium text-zinc-500">{idx + 1}</td>
                  <td className="py-3 px-4">
                    <CustomerNameDisplay name={c.name} addressKey={c.address_key} />
                  </td>
                  <td className="py-3 px-4 text-right text-zinc-300">{c.total_bookings}</td>
                  <td className="py-3 px-4 text-right font-medium text-emerald-400">{formatCurrency(Number(c.total_spend || 0))}</td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/customers/${c.id}`} className="text-brand hover:text-brand-hover opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-4 h-4 inline" />
                    </Link>
                  </td>
                </tr>
              ))}
              {(!topCustomers || topCustomers.length === 0) && (
                <tr><td colSpan={5} className="py-6 text-center text-zinc-500">No data available</td></tr>
              )}
            </tbody>
          </table>
        </CollapsibleSection>

        {/* Top 10 Routes */}
        <CollapsibleSection title="Top 10 Routes">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-900/80 border-b border-zinc-800/50">
                <th className="py-3 px-4 font-medium text-zinc-400">#</th>
                <th className="py-3 px-4 font-medium text-zinc-400">Route</th>
                <th className="py-3 px-4 font-medium text-zinc-400 text-right">Count</th>
                <th className="py-3 px-4 font-medium text-zinc-400 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {topRoutes?.map((r, idx) => (
                <tr key={idx} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="py-3 px-4 font-medium text-zinc-500">{idx + 1}</td>
                  <td className="py-3 px-4 text-zinc-300">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-zinc-500" /> {r.pickup_address}</span>
                      <span className="flex items-center gap-1.5 text-xs text-zinc-500"><Navigation className="w-3 h-3" /> {r.dropoff_address}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-zinc-300">{r.journey_count}</td>
                  <td className="py-3 px-4 text-right font-medium text-emerald-400">{formatCurrency(Number(r.total_revenue || 0))}</td>
                </tr>
              ))}
              {(!topRoutes || topRoutes.length === 0) && (
                <tr><td colSpan={4} className="py-6 text-center text-zinc-500">No data available</td></tr>
              )}
            </tbody>
          </table>
        </CollapsibleSection>

        {/* Top 10 Pickups */}
        <CollapsibleSection title="Top 10 Pickup Locations">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-900/80 border-b border-zinc-800/50">
                <th className="py-3 px-4 font-medium text-zinc-400">#</th>
                <th className="py-3 px-4 font-medium text-zinc-400">Address</th>
                <th className="py-3 px-4 font-medium text-zinc-400 text-right">Count</th>
                <th className="py-3 px-4 font-medium text-zinc-400 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {topPickups?.map((p, idx) => (
                <tr key={idx} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="py-3 px-4 font-medium text-zinc-500">{idx + 1}</td>
                  <td className="py-3 px-4 text-zinc-300"><span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-zinc-500" /> {p.pickup_address}</span></td>
                  <td className="py-3 px-4 text-right text-zinc-300">{p.journey_count}</td>
                  <td className="py-3 px-4 text-right font-medium text-emerald-400">{formatCurrency(Number(p.total_revenue || 0))}</td>
                </tr>
              ))}
              {(!topPickups || topPickups.length === 0) && (
                <tr><td colSpan={4} className="py-6 text-center text-zinc-500">No data available</td></tr>
              )}
            </tbody>
          </table>
        </CollapsibleSection>

        {/* Top 10 Dropoffs */}
        <CollapsibleSection title="Top 10 Dropoff Locations">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-zinc-900/80 border-b border-zinc-800/50">
                <th className="py-3 px-4 font-medium text-zinc-400">#</th>
                <th className="py-3 px-4 font-medium text-zinc-400">Address</th>
                <th className="py-3 px-4 font-medium text-zinc-400 text-right">Count</th>
                <th className="py-3 px-4 font-medium text-zinc-400 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {topDropoffs?.map((d, idx) => (
                <tr key={idx} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="py-3 px-4 font-medium text-zinc-500">{idx + 1}</td>
                  <td className="py-3 px-4 text-zinc-300"><span className="flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5 text-zinc-500" /> {d.dropoff_address}</span></td>
                  <td className="py-3 px-4 text-right text-zinc-300">{d.journey_count}</td>
                  <td className="py-3 px-4 text-right font-medium text-emerald-400">{formatCurrency(Number(d.total_revenue || 0))}</td>
                </tr>
              ))}
              {(!topDropoffs || topDropoffs.length === 0) && (
                <tr><td colSpan={4} className="py-6 text-center text-zinc-500">No data available</td></tr>
              )}
            </tbody>
          </table>
        </CollapsibleSection>

      </div>
    </div>
  );
}
