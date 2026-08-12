import { supabase } from '@/lib/supabase';
import { Megaphone, Users, Navigation, DollarSign, PlusCircle, Mail } from 'lucide-react';
import Link from 'next/link';
import CampaignRow from '@/components/CampaignRow';

export const revalidate = 0;

export default async function CampaignsPage() {
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('sent_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching campaigns:', error);
  }

  const validCampaigns = campaigns || [];

  const totalCampaigns = validCampaigns.length;
  const totalAudience = validCampaigns.reduce((sum, c) => sum + Number(c.audience_count || 0), 0);
  const totalBookings = validCampaigns.reduce((sum, c) => sum + Number(c.bookings_result || 0), 0);
  const totalRevenue = validCampaigns.reduce((sum, c) => sum + Number(c.revenue_result || 0), 0);

  const formatCurrency = (val: number) => `£${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const stats = [
    { label: 'Total Campaigns', value: totalCampaigns, icon: Megaphone, color: 'from-blue-500 to-cyan-400' },
    { label: 'Audience Reached', value: totalAudience, icon: Users, color: 'from-purple-400 to-pink-500' },
    { label: 'Bookings Generated', value: totalBookings, icon: Navigation, color: 'from-brand-hover to-brand-hover' },
    { label: 'Revenue Generated', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'from-emerald-400 to-green-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-brand" />
            Marketing Campaigns
          </h2>
          <p className="text-zinc-400">Track your outbound marketing efforts and measure their ROI.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Link 
            href="/campaigns/send" 
            className="flex justify-center items-center gap-2 px-4 py-2 bg-zinc-800 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 transition-colors shadow-lg w-full sm:w-auto"
          >
            <Mail className="w-4 h-4" />
            Send Campaign
          </Link>
          <Link 
            href="/campaigns/new" 
            className="flex justify-center items-center gap-2 px-4 py-2 bg-brand text-black text-sm font-medium rounded-lg hover:bg-brand-hover transition-colors shadow-lg shadow-brand/10 w-full sm:w-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Log New Campaign
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Campaigns Table */}
      <div className="glass-panel rounded-2xl overflow-hidden flex flex-col w-full">
        <div className="p-4 md:p-6 border-b border-zinc-800/50 bg-zinc-900/50">
          <h3 className="text-xl font-semibold text-white">Campaign History</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/80">
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 w-1/4 whitespace-nowrap">Campaign</th>
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 whitespace-nowrap">Channel</th>
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 whitespace-nowrap">Audience</th>
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 whitespace-nowrap">Sent Date</th>
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 whitespace-nowrap">Bookings Result</th>
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 whitespace-nowrap">Revenue Result</th>
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {validCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    No marketing campaigns logged yet.
                  </td>
                </tr>
              ) : (
                validCampaigns.map((campaign) => (
                  <CampaignRow key={campaign.id} campaign={campaign} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
