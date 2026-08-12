import { supabase } from '@/lib/supabase';
import { Users, Navigation, DollarSign, UserCheck, UserMinus, ArrowRight, Banknote } from 'lucide-react';
import Link from 'next/link';
import LTVBadge from '@/components/LTVBadge';
import CustomerNameDisplay from '@/components/CustomerNameDisplay';

export const revalidate = 0;

export default async function Dashboard() {
  // 1. Total Customers
  const { count: totalCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  // 2. Total Journeys
  const { count: totalJourneys } = await supabase
    .from('journeys')
    .select('*', { count: 'exact', head: true });

  // 3. Total Revenue
  const { data: revenueData } = await supabase
    .from('customers')
    .select('total_spend');
  
  const totalRevenue = revenueData?.reduce((sum, c) => sum + Number(c.total_spend || 0), 0) || 0;

  // 4. Repeat Customers
  const { count: repeatCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .gte('total_bookings', 2);

  // 5. Inactive Customers
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { count: inactiveCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .lt('last_booking_at', thirtyDaysAgo.toISOString());

  // Customers Table Data
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .order('last_booking_at', { ascending: false, nullsFirst: false })
    .limit(50);

  const safeTotalJourneys = totalJourneys || 0;
  const avgFare = safeTotalJourneys > 0 ? totalRevenue / safeTotalJourneys : 0;

  const stats = [
    { label: 'Total Customers', value: totalCustomers || 0, icon: Users, color: 'from-blue-500 to-cyan-400' },
    { label: 'Total Journeys', value: totalJourneys || 0, icon: Navigation, color: 'from-brand-hover to-brand-hover' },
    { label: 'Total Revenue', value: `£${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, color: 'from-emerald-400 to-green-500' },
    { label: 'Average Fare', value: `£${avgFare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Banknote, color: 'from-purple-400 to-pink-500' },
    { label: 'Repeat Customers', value: repeatCustomers || 0, icon: UserCheck, color: 'from-orange-400 to-red-500' },
    { label: 'Inactive Customers', value: inactiveCustomers || 0, icon: UserMinus, color: 'from-zinc-400 to-zinc-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Overview</h2>
        <p className="text-zinc-400">Here&apos;s what&apos;s happening with your business today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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

      {/* Customers Table */}
      <div className="glass-panel rounded-2xl overflow-hidden flex flex-col w-full">
        <div className="p-4 md:p-6 border-b border-zinc-800/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-0 bg-zinc-900/50">
          <div>
            <h3 className="text-xl font-semibold text-white">Recent Customers</h3>
            <p className="text-sm text-zinc-400 mt-1">Showing up to 50 most recent active customers.</p>
          </div>
          <Link href="/bookings/new" className="px-4 py-2 bg-brand text-black text-sm font-medium rounded-lg hover:bg-brand-hover transition-colors shadow-lg shadow-brand/10">
            Add Booking
          </Link>
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
              {customers?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">No customers found.</td>
                </tr>
              ) : (
                customers?.map((customer) => (
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
