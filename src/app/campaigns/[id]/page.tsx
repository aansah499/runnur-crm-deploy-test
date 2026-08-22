import { supabase } from '@/lib/supabase';
import { ArrowLeft, Mail, Users, CheckCircle2, Eye, MousePointerClick, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  // 1. Fetch Campaign
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (campaignError || !campaign) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl text-white font-bold">Campaign not found</h2>
        <Link href="/campaigns" className="text-brand mt-4 inline-block hover:underline">
          &larr; Back to Campaigns
        </Link>
      </div>
    );
  }

  // 2. Fetch Recipients
  const { data: recipients, error: recipientsError } = await supabase
    .from('campaign_recipients')
    .select(`
      *,
      customers (
        name
      )
    `)
    .eq('campaign_id', id)
    .order('created_at', { ascending: false });

  if (recipientsError) {
    console.error("Error fetching recipients:", recipientsError);
  }

  const validRecipients = recipients || [];

  // Calculate Stats
  const totalSent = validRecipients.length;
  let deliveredCount = 0;
  let openedCount = 0;
  let clickedCount = 0;
  let bounceCount = 0;

  validRecipients.forEach(r => {
    if (['delivered', 'opened', 'clicked'].includes(r.status)) deliveredCount++;
    if (['opened', 'clicked'].includes(r.status)) openedCount++;
    if (r.status === 'clicked') clickedCount++;
    if (['bounced', 'complained', 'failed'].includes(r.status)) bounceCount++;
  });

  // Calculate percentages based on delivered count, or total sent if 0
  const baseForRates = deliveredCount > 0 ? deliveredCount : totalSent;
  const openRate = baseForRates > 0 ? Math.round((openedCount / baseForRates) * 100) : 0;
  const clickRate = baseForRates > 0 ? Math.round((clickedCount / baseForRates) * 100) : 0;

  const stats = [
    { label: 'Total Sent', value: totalSent, icon: Users, color: 'text-zinc-400' },
    { label: 'Delivered', value: deliveredCount, icon: CheckCircle2, color: 'text-blue-400' },
    { label: 'Open Rate', value: `${openRate}%`, icon: Eye, color: 'text-yellow-400' },
    { label: 'Click Rate', value: `${clickRate}%`, icon: MousePointerClick, color: 'text-green-400' },
    { label: 'Bounced / Failed', value: bounceCount, icon: AlertTriangle, color: 'text-red-400' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent': return <span className="px-2 py-1 text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 rounded-md">Sent</span>;
      case 'delivered': return <span className="px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">Delivered</span>;
      case 'opened': return <span className="px-2 py-1 text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-md">Opened</span>;
      case 'clicked': return <span className="px-2 py-1 text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 rounded-md">Clicked</span>;
      case 'bounced':
      case 'complained':
      case 'failed': return <span className="px-2 py-1 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-md capitalize">{status}</span>;
      default: return <span className="px-2 py-1 text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 rounded-md capitalize">{status}</span>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString(undefined, { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div>
        <Link href="/campaigns" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Campaigns
        </Link>
        <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Mail className="w-8 h-8 text-brand" />
          {campaign.name}
        </h2>
        <div className="text-zinc-400 mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span><strong>Channel:</strong> <span className="uppercase">{campaign.channel}</span></span>
          <span><strong>Segment:</strong> {campaign.segment_name || 'All'}</span>
          <span><strong>Sent:</strong> {campaign.sent_at ? new Date(campaign.sent_at).toLocaleString() : 'N/A'}</span>
        </div>
        {campaign.message_summary && (
          <div className="mt-4 p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl">
            <p className="text-sm text-zinc-300"><strong>Summary:</strong> {campaign.message_summary}</p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center text-center border border-zinc-800/80">
            <stat.icon className={`w-6 h-6 mb-2 ${stat.color}`} />
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Recipients Table */}
      <div className="glass-panel rounded-2xl overflow-hidden flex flex-col w-full border border-zinc-800/80">
        <div className="p-4 md:p-6 border-b border-zinc-800/50 bg-zinc-900/50 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">Recipient Activity</h3>
          <span className="text-sm font-medium text-zinc-400 px-3 py-1 bg-zinc-800 rounded-full">{validRecipients.length} total recipients</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/80">
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 whitespace-nowrap">Customer</th>
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 whitespace-nowrap">Email</th>
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 whitespace-nowrap">Status</th>
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 whitespace-nowrap">Sent At</th>
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 whitespace-nowrap">Opened At</th>
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 whitespace-nowrap">Clicked At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {validRecipients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    No recipients tracked for this campaign.
                  </td>
                </tr>
              ) : (
                validRecipients.map((recipient) => (
                  <tr key={recipient.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap">
                      {recipient.customers?.name ? (
                        <Link href={`/customers/${recipient.customer_id}`} className="text-zinc-200 font-medium hover:text-brand transition-colors">
                          {recipient.customers.name}
                        </Link>
                      ) : (
                        <span className="text-zinc-500 italic">Unknown</span>
                      )}
                    </td>
                    <td className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap text-sm text-zinc-400">
                      {recipient.email}
                    </td>
                    <td className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap">
                      {getStatusBadge(recipient.status)}
                      {recipient.failed_reason && (
                        <span className="block text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={recipient.failed_reason}>
                          {recipient.failed_reason}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap text-sm text-zinc-500">
                      {formatDate(recipient.sent_at)}
                    </td>
                    <td className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap text-sm text-zinc-500">
                      {formatDate(recipient.opened_at)}
                    </td>
                    <td className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap text-sm text-zinc-500">
                      {formatDate(recipient.clicked_at)}
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
