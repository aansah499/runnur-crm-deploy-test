'use server';

import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

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
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@runnur.co.uk',
      to: [email],
      subject: subject,
      html: `<p>${message.replace(/\n/g, '<br/>')}</p>`,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

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

    // Filter eligible customers
    const segmentCustomers = segment 
      ? (allCustomers || []).filter(c => c.tags?.includes(segment))
      : (allCustomers || []);

    const eligibleCustomers = segmentCustomers.filter(c => c.email && c.email_consent === 'opted_in');

    if (eligibleCustomers.length === 0) {
      return { success: false, error: 'No eligible customers in this segment.' };
    }

    // Send emails in batches of 50
    const BATCH_SIZE = 50;
    let successfulSends = 0;
    const errors: string[] = [];

    for (let i = 0; i < eligibleCustomers.length; i += BATCH_SIZE) {
      const batch = eligibleCustomers.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(customer => {
        return resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@runnur.co.uk',
          to: [customer.email],
          subject: subject,
          html: `<p>${message.replace(/\n/g, '<br/>')}</p>`,
        }).then(({ error }) => {
          if (error) {
            console.error(`Failed to send to ${customer.email}:`, error);
            errors.push(`Failed to send to ${customer.email}: ${error.message}`);
          } else {
            successfulSends++;
          }
        }).catch(err => {
          console.error(`Unexpected error for ${customer.email}:`, err);
          errors.push(`Unexpected error for ${customer.email}: ${err.message}`);
        });
      });

      await Promise.all(batchPromises);

      // Delay 1 second between batches to avoid rate limits
      if (i + BATCH_SIZE < eligibleCustomers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Log the campaign using existing server action logic (adapted for direct call)
    // Wait, the existing addCampaign takes FormData, it's a server action for a form.
    // I can construct a FormData or just call the DB directly here. Calling DB directly is better since we don't have FormData.
    const messageSummary = `${subject} - ${message}`.substring(0, 100);
    const { error: dbError } = await supabase
      .from('campaigns')
      .insert({
        name: campaignName,
        channel: 'email',
        segment_name: segment,
        audience_count: successfulSends,
        sent_at: new Date().toISOString(),
        message_summary: messageSummary,
      });

    if (dbError) {
      console.error('Error logging campaign to db:', dbError);
    }

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
