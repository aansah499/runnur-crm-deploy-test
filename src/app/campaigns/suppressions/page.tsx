import { createClient } from '@/utils/supabase/server';
import { ShieldAlert, MailX, Frown, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SuppressionsPage() {
  const supabase = createClient();
  
  const { data: suppressions, error } = await supabase
    .from('suppressions')
    .select('*, customers(name)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-brand" />
            Suppression List
          </h1>
          <p className="text-zinc-400 mt-1">
            Emails that have been unsubscribed, bounced, or reported as spam.
          </p>
        </div>
        <Link href="/campaigns" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm font-medium">
          Back to Campaigns
        </Link>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/30">
                <th className="p-4 text-sm font-semibold text-zinc-300">Email</th>
                <th className="p-4 text-sm font-semibold text-zinc-300">Customer</th>
                <th className="p-4 text-sm font-semibold text-zinc-300">Reason</th>
                <th className="p-4 text-sm font-semibold text-zinc-300">Date Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {error && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-red-400">
                    Failed to load suppressions: {error.message}
                  </td>
                </tr>
              )}
              
              {!error && (!suppressions || suppressions.length === 0) && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">
                    No suppressed emails found.
                  </td>
                </tr>
              )}

              {suppressions?.map((sup) => (
                <tr key={sup.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="p-4 text-zinc-300">{sup.email}</td>
                  <td className="p-4 text-zinc-400">
                    {sup.customers?.name || <span className="italic">Unknown / Deleted</span>}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium capitalize
                      ${sup.reason === 'unsubscribed' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : ''}
                      ${sup.reason === 'bounced' ? 'bg-red-500/10 text-red-500 border-red-500/20' : ''}
                      ${sup.reason === 'complained' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : ''}
                    `}>
                      {sup.reason === 'unsubscribed' && <CheckCircle className="w-3.5 h-3.5" />}
                      {sup.reason === 'bounced' && <MailX className="w-3.5 h-3.5" />}
                      {sup.reason === 'complained' && <Frown className="w-3.5 h-3.5" />}
                      {sup.reason}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-400 text-sm">
                    {new Date(sup.created_at).toLocaleDateString()} at {new Date(sup.created_at).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
