'use client';

import { useState } from 'react';
import { updateCampaignResults } from '@/actions/campaigns';
import { Edit2, Check, X } from 'lucide-react';

type Campaign = {
  id: string;
  name: string;
  channel: string;
  segment_name: string | null;
  audience_count: number | null;
  sent_at: string | null;
  message_summary: string | null;
  bookings_result: number | null;
  revenue_result: number | null;
};

export default function CampaignRow({ campaign }: { campaign: Campaign }) {
  const [isEditing, setIsEditing] = useState(false);
  const [bookings, setBookings] = useState(campaign.bookings_result?.toString() || '0');
  const [revenue, setRevenue] = useState(campaign.revenue_result?.toString() || '0');
  const [isSaving, setIsSaving] = useState(false);

  const formatCurrency = (val: number) => `£${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSave = async () => {
    setIsSaving(true);
    const parsedBookings = parseInt(bookings, 10) || 0;
    const parsedRevenue = parseFloat(revenue) || 0;
    
    const result = await updateCampaignResults(campaign.id, parsedBookings, parsedRevenue);
    
    if (result.success) {
      setIsEditing(false);
    } else {
      alert(result.error || 'Failed to update results');
    }
    setIsSaving(false);
  };

  const channelColors: Record<string, string> = {
    sms: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    email: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    call: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    other: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  };

  const badgeClass = channelColors[campaign.channel?.toLowerCase()] || channelColors.other;

  return (
    <tr className="hover:bg-zinc-800/30 transition-colors group">
      <td className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <span className="text-zinc-200 font-medium">{campaign.name}</span>
          <span className="text-xs text-zinc-500 line-clamp-1">{campaign.message_summary}</span>
        </div>
      </td>
      <td className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap">
        <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-medium border uppercase tracking-wider ${badgeClass}`}>
          {campaign.channel}
        </span>
      </td>
      <td className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap text-sm text-zinc-300">
        <div className="flex flex-col">
          <span>{campaign.segment_name || 'All'}</span>
          <span className="text-xs text-zinc-500">{campaign.audience_count} reached</span>
        </div>
      </td>
      <td className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap text-sm text-zinc-300">
        {campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString() : 'N/A'}
      </td>
      
      {isEditing ? (
        <>
          <td className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap">
            <input 
              type="number" 
              value={bookings} 
              onChange={e => setBookings(e.target.value)} 
              className="w-20 bg-black border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-brand"
            />
          </td>
          <td className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap">
            <div className="relative">
              <span className="absolute left-2 top-1.5 text-zinc-500 text-sm">£</span>
              <input 
                type="number" 
                step="0.01"
                value={revenue} 
                onChange={e => setRevenue(e.target.value)} 
                className="w-24 bg-black border border-zinc-700 rounded px-2 py-1 pl-6 text-sm text-white focus:outline-none focus:border-brand"
              />
            </div>
          </td>
          <td className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap text-right">
            <div className="flex items-center justify-end gap-2">
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsEditing(false)} 
                disabled={isSaving}
                className="p-1.5 bg-zinc-800 text-zinc-400 rounded hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </td>
        </>
      ) : (
        <>
          <td className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap text-zinc-300">
            {campaign.bookings_result || 0}
          </td>
          <td className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap font-medium text-emerald-400">
            {formatCurrency(Number(campaign.revenue_result || 0))}
          </td>
          <td className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap text-right">
            <button 
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 text-sm text-brand hover:text-brand-hover opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Update <Edit2 className="w-3.5 h-3.5" />
            </button>
          </td>
        </>
      )}
    </tr>
  );
}
