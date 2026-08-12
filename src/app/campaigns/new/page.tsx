'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Megaphone, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { addCampaign } from '@/actions/campaigns';

export default function NewCampaignPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await addCampaign(null, formData);
    
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      router.push('/campaigns');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/campaigns" className="p-2 bg-zinc-900 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
            Log New Campaign
          </h2>
          <p className="text-zinc-400">Record a recent marketing effort to track its ROI.</p>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand/20 to-brand-hover/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        
        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="name" className="text-sm font-medium text-zinc-300">Campaign Name <span className="text-red-400">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="e.g. Summer Discount Blast"
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="channel" className="text-sm font-medium text-zinc-300">Channel <span className="text-red-400">*</span></label>
              <select
                id="channel"
                name="channel"
                required
                defaultValue="sms"
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all appearance-none"
              >
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="call">Phone Call</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="sent_at" className="text-sm font-medium text-zinc-300">Date Sent <span className="text-red-400">*</span></label>
              <input
                type="date"
                id="sent_at"
                name="sent_at"
                required
                defaultValue={today}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="segment_name" className="text-sm font-medium text-zinc-300">Target Segment</label>
              <input
                type="text"
                id="segment_name"
                name="segment_name"
                placeholder="e.g. Airport Travellers"
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="audience_count" className="text-sm font-medium text-zinc-300">Audience Count</label>
              <input
                type="number"
                id="audience_count"
                name="audience_count"
                min="0"
                placeholder="e.g. 150"
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="message_summary" className="text-sm font-medium text-zinc-300">Message / Offer Summary</label>
              <input
                type="text"
                id="message_summary"
                name="message_summary"
                placeholder="e.g. 10% off airport rides valid until Friday"
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="notes" className="text-sm font-medium text-zinc-300">Internal Notes</label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Any additional details..."
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all resize-none"
              ></textarea>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex justify-center items-center gap-2 px-6 py-3 bg-brand text-black font-semibold rounded-xl hover:bg-brand-hover transition-colors shadow-lg shadow-brand/10 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Megaphone className="w-5 h-5" />
                  Save Campaign
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
