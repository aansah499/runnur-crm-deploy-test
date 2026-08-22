'use server';

import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';
import { generateUnsubscribeLink } from '@/utils/unsubscribe';
import { logAudit } from '@/utils/audit';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function getSegmentStats(segment: string) {
  try {
    const { data: allCustomers, error } = await supabase
      .from('customers')
      .select('id, tags, email, email_consent');

    if (error) {
      console.error('Error fetching customers:', error);
      return { total: 0, eligible: 0, skipped: 0 };
    }

    // Filter customers in the segment
    const segmentCustomers = segment 
      ? (allCustomers || []).filter(c => c.tags?.includes(segment))
      : (allCustomers || []);

    const total = segmentCustomers.length;
    let eligible = 0;
    let skipped = 0;

    segmentCustomers.forEach(customer => {
      if (customer.email && customer.email_consent === 'opted_in') {
        eligible++;
      } else {
        skipped++;
      }
    });

    return { total, eligible, skipped };
  } catch (err) {
    console.error('Error getting segment stats:', err);
    return { total: 0, eligible: 0, skipped: 0 };
  }
}

export async function sendTestEmail(email: string, subject: string, message: string) {
  try {
    // Check if the test email is suppressed
    const { data: suppression } = await supabase
      .from('suppressions')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();

    if (suppression) {
      return { success: false, error: 'Cannot send test email: This email address is on the suppression list.' };
    }

    const unsubscribeLink = generateUnsubscribeLink('test-dummy-id');
    const footerHtml = `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 12px; color: #666; text-align: center;">
        <p>You are receiving this email because you are subscribed to updates.</p>
        <p>If you no longer wish to receive these emails, you can <a href="${unsubscribeLink}" style="color: #666; text-decoration: underline;">unsubscribe here</a>.</p>
      </div>
    `;
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@runnur.co.uk',
      to: [email],
      subject: subject,
      html: `<p>${message.replace(/\n/g, '<br/>')}</p>${footerHtml}`,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    await logAudit('campaign.test_sent', 'campaign', null, { email, subject });

    return { success: true, data };
  } catch (err: unknown) {
    console.error('Unexpected error sending test email:', err);
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Unexpected error' };
  }
}

export async function sendCampaignEmail(campaignName: string, segment: string, subject: string, message: string) {
  try {
    const { data: allCustomers, error } = await supabase
      .from('customers')
      .select('id, tags, email, email_consent');

    if (error) {
      return { success: false, error: 'Failed to fetch customers.' };
    }

    const { data: suppressions, error: supError } = await supabase
      .from('suppressions')
      .select('email');
      
    if (supError) {
      console.error('Failed to fetch suppressions:', supError);
      return { success: false, error: 'Failed to fetch suppression list.' };
    }

    const suppressedEmails = new Set((suppressions || []).map(s => s.email.toLowerCase()));

    // Filter eligible customers
    const segmentCustomers = segment 
      ? (allCustomers || []).filter(c => c.tags?.includes(segment))
      : (allCustomers || []);

    const eligibleCustomers = segmentCustomers.filter(c => 
      c.email && 
      c.email_consent === 'opted_in' && 
      !suppressedEmails.has(c.email.toLowerCase())
    );

    if (eligibleCustomers.length === 0) {
      return { success: false, error: 'No eligible customers in this segment.' };
    }

    const messageSummary = `${subject} - ${message}`.substring(0, 100);
    const { data: newCampaign, error: dbError } = await supabase
      .from('campaigns')
      .insert({
        name: campaignName,
        channel: 'email',
        segment_name: segment,
        audience_count: 0,
        sent_at: new Date().toISOString(),
        message_summary: messageSummary,
      })
      .select()
      .single();

    if (dbError || !newCampaign) {
      console.error('Error initializing campaign:', dbError);
      return { success: false, error: 'Failed to initialize campaign record.' };
    }

    // Send emails in batches of 50
    const BATCH_SIZE = 50;
    let successfulSends = 0;
    const errors: string[] = [];

    for (let i = 0; i < eligibleCustomers.length; i += BATCH_SIZE) {
      const batch = eligibleCustomers.slice(i, i + BATCH_SIZE);
      const recipientInserts: {
        campaign_id: string;
        customer_id: string;
        email: string;
        resend_email_id: string;
        status: string;
      }[] = [];
      
      const batchPromises = batch.map(customer => {
        const unsubscribeLink = generateUnsubscribeLink(customer.id);
        const footerHtml = `
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 12px; color: #666; text-align: center;">
            <p>You are receiving this email because you are subscribed to updates.</p>
            <p>If you no longer wish to receive these emails, you can <a href="${unsubscribeLink}" style="color: #666; text-decoration: underline;">unsubscribe here</a>.</p>
          </div>
        `;

        return resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@runnur.co.uk',
          to: [customer.email!],
          subject: subject,
          html: `<p>${message.replace(/\n/g, '<br/>')}</p>${footerHtml}`,
        }).then(({ data, error }) => {
          if (error) {
            console.error(`Failed to send to ${customer.email}:`, error);
            errors.push(`Failed to send to ${customer.email}: ${error.message}`);
          } else {
            successfulSends++;
            if (data?.id) {
              recipientInserts.push({
                campaign_id: newCampaign.id,
                customer_id: customer.id,
                email: customer.email,
                resend_email_id: data.id,
                status: 'sent'
              });
            }
          }
        }).catch(err => {
          console.error(`Unexpected error for ${customer.email}:`, err);
          errors.push(`Unexpected error for ${customer.email}: ${err.message}`);
        });
      });

      await Promise.all(batchPromises);

      if (recipientInserts.length > 0) {
        const { error: insertError } = await supabase.from('campaign_recipients').insert(recipientInserts);
        if (insertError) {
          console.error('Failed to insert campaign recipients:', insertError);
        }
      }

      // Delay 1 second between batches to avoid rate limits
      if (i + BATCH_SIZE < eligibleCustomers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Update the final audience count for the campaign
    await supabase
      .from('campaigns')
      .update({ audience_count: successfulSends })
      .eq('id', newCampaign.id);

    await logAudit('campaign.sent', 'campaign', newCampaign.id, { 
      name: campaignName, 
      segment, 
      audience_count: successfulSends 
    });

    return { 
      success: true, 
      sentCount: successfulSends,
      errors: errors.length > 0 ? errors : undefined 
    };
  } catch (err: unknown) {
    console.error('Unexpected error sending campaign:', err);
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Unexpected error' };
  }
}
