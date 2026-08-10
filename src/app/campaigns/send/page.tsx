import { Mail } from 'lucide-react';
import SendCampaignForm from '@/components/SendCampaignForm';

export const revalidate = 0;

export default function SendCampaignPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const initialSegment = searchParams.segment as string | undefined;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          <Mail className="w-8 h-8 text-brand" />
          Send Email Campaign
        </h2>
        <p className="text-zinc-400">Compose and send an email directly to a targeted customer segment.</p>
      </div>

      <SendCampaignForm initialSegment={initialSegment} />
    </div>
  );
}
