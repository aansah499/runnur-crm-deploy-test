import { createClient } from '@/utils/supabase/server';
import { Shield, Clock, User, Filter } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createClient();
  const actionFilter = searchParams.action as string;
  const daysFilter = searchParams.days as string;

  let query = supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (actionFilter) {
    query = query.eq('action', actionFilter);
  }

  if (daysFilter) {
    const date = new Date();
    date.setDate(date.getDate() - parseInt(daysFilter));
    query = query.gte('created_at', date.toISOString());
  }

  const { data: logs, error } = await query;

  // Extract unique actions for the filter dropdown
  const { data: uniqueActions } = await supabase
    .from('audit_log')
    .select('action')
    .limit(1000);
    
  const allActions = Array.from(new Set(uniqueActions?.map(a => a.action) || []));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand" />
            Audit Log
          </h1>
          <p className="text-zinc-400 mt-1">
            System-wide chronological record of key actions.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Filter className="w-4 h-4" />
          <span>Filters:</span>
        </div>
        
        <div className="flex gap-2">
          <Link 
            href={`/settings/audit?days=${daysFilter || ''}`} 
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${!actionFilter ? 'bg-brand/10 text-brand border border-brand/20' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
          >
            All Actions
          </Link>
          {allActions.map(action => (
            <Link 
              key={action}
              href={`/settings/audit?action=${action}&days=${daysFilter || ''}`} 
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${actionFilter === action ? 'bg-brand/10 text-brand border border-brand/20' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
            >
              {action}
            </Link>
          ))}
        </div>

        <div className="flex gap-2 md:ml-auto">
          <Link 
            href={`/settings/audit?action=${actionFilter || ''}`} 
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${!daysFilter ? 'bg-brand/10 text-brand border border-brand/20' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
          >
            All Time
          </Link>
          <Link 
            href={`/settings/audit?action=${actionFilter || ''}&days=7`} 
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${daysFilter === '7' ? 'bg-brand/10 text-brand border border-brand/20' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
          >
            Last 7 Days
          </Link>
          <Link 
            href={`/settings/audit?action=${actionFilter || ''}&days=30`} 
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${daysFilter === '30' ? 'bg-brand/10 text-brand border border-brand/20' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
          >
            Last 30 Days
          </Link>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/30">
                <th className="p-4 text-sm font-semibold text-zinc-300">Timestamp</th>
                <th className="p-4 text-sm font-semibold text-zinc-300">Action</th>
                <th className="p-4 text-sm font-semibold text-zinc-300">User ID</th>
                <th className="p-4 text-sm font-semibold text-zinc-300">Entity</th>
                <th className="p-4 text-sm font-semibold text-zinc-300">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {error && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-red-400">
                    Failed to load audit logs: {error.message}
                  </td>
                </tr>
              )}
              
              {!error && (!logs || logs.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    No audit logs found matching the criteria.
                  </td>
                </tr>
              )}

              {logs?.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="p-4 text-zinc-400 text-sm whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-zinc-800 text-zinc-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-400 text-xs font-mono">
                    {log.user_id ? (
                      <div className="flex items-center gap-1.5" title={log.user_id}>
                        <User className="w-3.5 h-3.5" />
                        {log.user_id.substring(0, 8)}...
                      </div>
                    ) : (
                      <span className="italic text-zinc-500">System</span>
                    )}
                  </td>
                  <td className="p-4 text-zinc-300 text-sm">
                    {log.entity_type} <span className="text-zinc-500">{log.entity_id ? `(${log.entity_id.substring(0,8)}...)` : ''}</span>
                  </td>
                  <td className="p-4 text-zinc-400 text-xs max-w-xs truncate" title={JSON.stringify(log.details)}>
                    {log.details ? JSON.stringify(log.details) : '-'}
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
