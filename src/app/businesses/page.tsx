import { supabase } from '@/lib/supabase';
import { Building, MapPin, Star } from 'lucide-react';

export const revalidate = 0;

export default async function BusinessesPage() {
  const { data: businesses, error } = await supabase
    .from('business_locations')
    .select('*')
    .order('total_revenue', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Error fetching businesses:', error);
  }

  const formatCurrency = (val: number) => `£${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Business Accounts</h2>
        <p className="text-zinc-400">Algorithmic detection of frequent corporate or commercial destinations.</p>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/50">
          <div>
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-brand" />
              Detected Business Locations
            </h3>
            <p className="text-sm text-zinc-400 mt-1">Locations with 5 or more combined visits (pickup or dropoff) from at least 3 unique customers.</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/80">
                <th className="py-4 px-6 text-sm font-medium text-zinc-400">#</th>
                <th className="py-4 px-6 text-sm font-medium text-zinc-400">Business Location / Address</th>
                <th className="py-4 px-6 text-sm font-medium text-zinc-400 text-right">Unique Customers</th>
                <th className="py-4 px-6 text-sm font-medium text-zinc-400 text-right">Total Journeys</th>
                <th className="py-4 px-6 text-sm font-medium text-zinc-400 text-right">Total Revenue</th>
                <th className="py-4 px-6 text-sm font-medium text-zinc-400 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {(!businesses || businesses.length === 0) ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">No business locations detected yet.</td>
                </tr>
              ) : (
                businesses.map((b, idx) => {
                  const journeys = Number(b.total_journeys || 0);
                  const revenue = Number(b.total_revenue || 0);
                  const uniqueCustomers = Number(b.unique_customers || 0);
                  const isPotentialAccount = journeys >= 10 && revenue > 100 && uniqueCustomers >= 3;

                  return (
                    <tr key={idx} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="py-4 px-6 font-medium text-zinc-500">{idx + 1}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg mt-0.5 ${isPotentialAccount ? 'bg-brand/20 text-brand' : 'bg-zinc-800/50 text-zinc-400'}`}>
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-zinc-200 font-medium block leading-tight">{b.address}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-zinc-800 text-xs font-medium text-zinc-300">
                          {uniqueCustomers}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-zinc-800 text-xs font-medium text-zinc-300">
                          {journeys}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-emerald-400">
                        {formatCurrency(revenue)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {isPotentialAccount ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold uppercase tracking-wider">
                            <Star className="w-3.5 h-3.5 fill-brand text-brand" />
                            Potential Account
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-xs uppercase tracking-wider font-medium">Standard</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
