import { supabase } from '@/lib/supabase';
import DateFilter from '@/components/DateFilter';
import { Navigation, DollarSign, Users, UserCheck, Banknote, Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';
import CustomerNameDisplay from '@/components/CustomerNameDisplay';
import LTVBadge from '@/components/LTVBadge';

export const revalidate = 0;

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const from = typeof searchParams.from === 'string' ? searchParams.from : undefined;
  const to = typeof searchParams.to === 'string' ? searchParams.to : undefined;

  let query = supabase
    .from('journeys')
    .select('*, customer:customers(*)');

  if (from) query = query.gte('booking_date', from);
  if (to) query = query.lte('booking_date', to);
  
  query = query.order('booking_date', { ascending: false });

  const { data: journeys, error } = await query;

  if (error) {
    console.error('Error fetching journeys for summary:', error);
  }

  const validJourneys = journeys || [];

  const totalBookings = validJourneys.length;
  const completedJourneys = validJourneys.filter(j => j.status === 'completed');
  const totalRevenue = completedJourneys.reduce((sum, j) => sum + Number(j.fare || 0), 0);
  const avgFare = totalBookings > 0 ? totalRevenue / totalBookings : 0;

  const uniqueCustomerIds = new Set<string>();
  let newCustomersCount = 0;
  let repeatCustomersCount = 0;

  validJourneys.forEach(j => {
    // If the journey doesn't have an attached customer, skip counting them as unique new/repeat
    if (j.customer && j.customer.id && !uniqueCustomerIds.has(j.customer.id)) {
      uniqueCustomerIds.add(j.customer.id);
      
      const customer = j.customer;
      
      if (customer.first_booking_at) {
        const firstBookingDate = customer.first_booking_at.split('T')[0];
        let isNew = true;
        if (from && firstBookingDate < from) isNew = false;
        if (to && firstBookingDate > to) isNew = false;
        if (isNew) newCustomersCount++;
      } else if (Number(customer.total_bookings) === 1) {
        newCustomersCount++;
      }

      if (Number(customer.total_bookings) >= 2) {
        repeatCustomersCount++;
      }
    }
  });

  const formatCurrency = (val: number) => `£${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const stats = [
    { label: 'Bookings', value: totalBookings, icon: Navigation, color: 'from-brand-hover to-brand-hover' },
    { label: 'Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'from-emerald-400 to-green-500' },
    { label: 'Avg Fare', value: formatCurrency(avgFare), icon: Banknote, color: 'from-purple-400 to-pink-500' },
    { label: 'New Customers', value: newCustomersCount, icon: Users, color: 'from-blue-500 to-cyan-400' },
    { label: 'Repeat Customers', value: repeatCustomersCount, icon: UserCheck, color: 'from-orange-400 to-red-500' },
  ];

  let displayPeriod = 'All Time';
  if (from && to && from === to) {
    displayPeriod = new Date(from).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } else if (from && to) {
    displayPeriod = `${new Date(from).toLocaleDateString()} - ${new Date(to).toLocaleDateString()}`;
  } else if (from) {
    displayPeriod = `Since ${new Date(from).toLocaleDateString()}`;
  } else if (to) {
    displayPeriod = `Until ${new Date(to).toLocaleDateString()}`;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          <CalendarIcon className="w-8 h-8 text-brand" />
          Daily Summary
        </h2>
        <p className="text-zinc-400">Track your performance and business metrics across specific date ranges.</p>
      </div>

      <DateFilter />

      <div className="flex items-center gap-2 px-4 py-2 bg-brand/10 border border-brand/20 text-brand rounded-lg w-fit">
        <span className="text-sm font-semibold tracking-wide">Showing:</span>
        <span className="text-sm font-bold">{displayPeriod}</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-20`} />
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl bg-zinc-800/50 text-white shadow-inner`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-zinc-400">{stat.label}</p>
            </div>
            <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Journeys Table */}
      <div className="glass-panel rounded-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/50">
          <div>
            <h3 className="text-xl font-semibold text-white">Journeys in Period</h3>
            <p className="text-sm text-zinc-400 mt-1">Detailed list of all {totalBookings} journeys during this timeframe.</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/80">
                <th className="py-4 px-6 text-sm font-medium text-zinc-400">Date & Time</th>
                <th className="py-4 px-6 text-sm font-medium text-zinc-400">Customer</th>
                <th className="py-4 px-6 text-sm font-medium text-zinc-400">Route</th>
                <th className="py-4 px-6 text-sm font-medium text-zinc-400">Status</th>
                <th className="py-4 px-6 text-sm font-medium text-zinc-400 text-right">Fare</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {validJourneys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-500">No journeys found in this period.</td>
                </tr>
              ) : (
                validJourneys.map((j) => (
                  <tr key={j.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-zinc-200 font-medium">
                          {new Date(j.booking_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                          <Clock className="w-3.5 h-3.5" /> {new Date(j.booking_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {j.customer ? (
                          <>
                            <CustomerNameDisplay name={j.customer.name} addressKey={j.customer.address_key} />
                            <LTVBadge band={j.customer.lifetime_value_band} />
                          </>
                        ) : (
                          <span className="text-zinc-500 italic">Unknown Customer</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1.5">
                        <span className="flex items-start gap-1.5 text-sm text-zinc-300">
                          <MapPin className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                          <span className="line-clamp-1">{j.pickup_address}</span>
                        </span>
                        <span className="flex items-start gap-1.5 text-sm text-zinc-400">
                          <Navigation className="w-3.5 h-3.5 text-zinc-600 mt-0.5 shrink-0 ml-0.5" />
                          <span className="line-clamp-1">{j.dropoff_address}</span>
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-medium ${
                        j.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                        j.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {j.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-white">
                      {formatCurrency(Number(j.fare || 0))}
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
