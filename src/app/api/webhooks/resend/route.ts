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
    const data = payload?.data;
    const emailId = data?.email_id;
    const supabase = createClient();

    // 1. Update campaign_recipients if we have an emailId
    if (emailId) {
      if (type === 'email.delivered') {
        await supabase
          .from('campaign_recipients')
          .update({ status: 'delivered', delivered_at: new Date().toISOString() })
          .eq('resend_email_id', emailId);
      } else if (type === 'email.opened') {
        // Only update to opened if not already clicked
        const { data: currentRecord } = await supabase
          .from('campaign_recipients')
          .select('status')
          .eq('resend_email_id', emailId)
          .single();
          
        if (currentRecord && currentRecord.status !== 'clicked') {
          await supabase
            .from('campaign_recipients')
            .update({ status: 'opened', opened_at: new Date().toISOString() })
            .eq('resend_email_id', emailId);
        }
      } else if (type === 'email.clicked') {
        await supabase
          .from('campaign_recipients')
          .update({ status: 'clicked', clicked_at: new Date().toISOString() })
          .eq('resend_email_id', emailId);
      } else if (type === 'email.bounced') {
        await supabase
          .from('campaign_recipients')
          .update({ status: 'bounced', failed_reason: data?.reason || 'bounced' })
          .eq('resend_email_id', emailId);
      } else if (type === 'email.complained') {
        await supabase
          .from('campaign_recipients')
          .update({ status: 'complained' })
          .eq('resend_email_id', emailId);
      }
    }

    // 2. Original suppression logic for bounced/complained
    if (type === 'email.bounced' || type === 'email.complained') {
      const email = data?.to?.[0];
      
      if (email) {
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
