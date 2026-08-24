import { getPrivacyRequests } from '@/actions/privacy';
import Link from 'next/link';
import { Shield, FileText, Download, Trash2, ArrowLeft } from 'lucide-react';
import CustomerNameDisplay from '@/components/CustomerNameDisplay';

export const revalidate = 0;

export default async function PrivacyRequestsPage() {
  const { data: requests, success, error } = await getPrivacyRequests();

  const getRequestIcon = (type: string) => {
    switch (type) {
      case 'data_export': return <Download className="w-4 h-4 text-blue-400" />;
      case 'subject_access': return <FileText className="w-4 h-4 text-emerald-400" />;
      case 'erasure': return <Trash2 className="w-4 h-4 text-red-400" />;
      default: return <Shield className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getRequestLabel = (type: string) => {
    switch (type) {
      case 'data_export': return 'Data Export';
      case 'subject_access': return 'Subject Access (SAR)';
      case 'erasure': return 'Erasure (Right to be Forgotten)';
      default: return type;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <Link href="/settings/audit" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Audit Log
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-brand" />
          <h1 className="text-3xl font-bold tracking-tight text-white">Privacy Requests</h1>
        </div>
        <p className="text-zinc-400">Audit log for GDPR data export, access, and erasure requests.</p>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-full border border-zinc-800/50">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/80">
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 whitespace-nowrap">Date</th>
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 whitespace-nowrap">Request Type</th>
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 whitespace-nowrap">Customer</th>
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 whitespace-nowrap">Processed By</th>
                <th className="py-3 px-4 md:py-4 md:px-6 text-sm font-medium text-zinc-400 text-right whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {!success || !requests || requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    {error ? 'Error loading requests' : 'No privacy requests recorded yet.'}
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap text-zinc-300">
                      {new Date(req.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getRequestIcon(req.request_type)}
                        <span className="text-sm text-zinc-200 font-medium">{getRequestLabel(req.request_type)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap">
                      {req.customer_id ? (
                        <Link href={`/customers/${req.customer_id}`} className="text-brand hover:underline">
                          {req.customers?.name ? (
                            <CustomerNameDisplay name={req.customers.name} addressKey={null} showBadge={false} />
                          ) : (
                            <span className="text-zinc-500 italic">Erased Customer {req.customers?.external_customer_id ? `(#${req.customers.external_customer_id})` : ''}</span>
                          )}
                        </Link>
                      ) : (
                        <span className="text-zinc-500 italic">Deleted Record</span>
                      )}
                    </td>
                    <td className="py-3 px-4 md:py-4 md:px-6 whitespace-nowrap text-zinc-400 text-sm">
                      {req.requested_by || 'System'}
                    </td>
                    <td className="py-3 px-4 md:py-4 md:px-6 text-right whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        Completed
                      </span>
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
