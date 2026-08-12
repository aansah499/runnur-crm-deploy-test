import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Verify secret
  const expectedSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const type = payload?.type;

    if (type === 'email.bounced' || type === 'email.complained') {
      const email = payload?.data?.to?.[0];
      
      if (email) {
        const supabase = createClient();
        
        // Find customer ID if it exists
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', email.toLowerCase())
          .single();

        // Insert into suppressions
        await supabase.from('suppressions').upsert(
          {
            customer_id: customer ? customer.id : null,
            email: email.toLowerCase(),
            reason: type === 'email.bounced' ? 'bounced' : 'complained'
          },
          { onConflict: 'email' }
        );

        // Opt out customer if found
        if (customer) {
          await supabase
            .from('customers')
            .update({ email_consent: 'opted_out' })
            .eq('id', customer.id);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
