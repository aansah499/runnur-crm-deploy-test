import { verifyUnsubscribeToken } from '@/utils/unsubscribe';
import { createClient } from '@/utils/supabase/server';
import { CheckCircle2, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const token = searchParams.token as string;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <div className="glass-panel p-8 max-w-md w-full text-center space-y-4">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h1 className="text-xl font-bold text-white">Invalid Link</h1>
          <p className="text-zinc-400 text-sm">
            The unsubscribe link is missing or invalid. Please ensure you clicked the full link from your email.
          </p>
        </div>
      </div>
    );
  }

  const customerId = verifyUnsubscribeToken(token);

  if (!customerId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <div className="glass-panel p-8 max-w-md w-full text-center space-y-4">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h1 className="text-xl font-bold text-white">Link Expired or Invalid</h1>
          <p className="text-zinc-400 text-sm">
            This unsubscribe link is no longer valid. If you are still receiving emails, please contact support.
          </p>
        </div>
      </div>
    );
  }

  // Handle the test link gracefully without DB operations
  if (customerId === 'test-dummy-id') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <div className="glass-panel p-8 max-w-md w-full text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-brand mx-auto" />
          <h1 className="text-xl font-bold text-white">Test Unsubscribe Successful</h1>
          <p className="text-zinc-400 text-sm">
            This was a test link. No database changes were made, but the signature verified correctly!
          </p>
        </div>
      </div>
    );
  }

  // Real customer unsubscribe flow
  const supabase = createClient();

  // 1. Get the customer's email
  const { data: customer } = await supabase
    .from('customers')
    .select('email')
    .eq('id', customerId)
    .single();

  if (customer && customer.email) {
    // 2. Add to suppressions
    await supabase.from('suppressions').upsert(
      {
        customer_id: customerId,
        email: customer.email.toLowerCase(),
        reason: 'unsubscribed'
      },
      { onConflict: 'email' }
    );

    // 3. Opt-out in customers table
    await supabase
      .from('customers')
      .update({ email_consent: 'opted_out' })
      .eq('id', customerId);
  } else {
    // Customer not found or no email
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <div className="glass-panel p-8 max-w-md w-full text-center space-y-4">
          <XCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h1 className="text-xl font-bold text-white">Error processing request</h1>
          <p className="text-zinc-400 text-sm">
            We couldn&apos;t find the associated account for this email address.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <div className="glass-panel p-8 max-w-md w-full text-center space-y-4">
        <CheckCircle2 className="w-12 h-12 text-brand mx-auto" />
        <h1 className="text-xl font-bold text-white">You&apos;ve been unsubscribed</h1>
        <p className="text-zinc-400 text-sm">
          Your email address has been successfully removed from our mailing list. You will no longer receive marketing emails from us.
        </p>
      </div>
    </div>
  );
}
