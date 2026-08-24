'use server';

import { supabase } from '@/lib/supabase';
import { createClient } from '@/utils/supabase/server';
import { logAudit } from '@/utils/audit';
import { Resend } from 'resend';
import { revalidatePath } from 'next/cache';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function exportCustomerData(customerId: string) {
  try {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError) throw customerError;

    const { data: journeys } = await supabase
      .from('journeys')
      .select('*')
      .eq('customer_id', customerId);

    const { data: campaigns } = await supabase
      .from('campaign_recipients')
      .select('*')
      .eq('customer_id', customerId);

    const exportData = {
      customer,
      journeys: journeys || [],
      campaigns: campaigns || []
    };

    const serverClient = createClient();
    const { data: { user } } = await serverClient.auth.getUser();

    await supabase.from('privacy_requests').insert({
      customer_id: customerId,
      request_type: 'data_export',
      status: 'completed',
      requested_by: user?.email || 'System'
    });

    await logAudit('privacy.data_export', 'customer', customerId, { action: 'exported' });

    return { success: true, data: exportData };
  } catch (err: unknown) {
    console.error('Error exporting data:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function sendDataReport(customerId: string) {
  try {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError) throw customerError;
    if (!customer.email) throw new Error('Customer has no email address.');

    const { data: journeys } = await supabase
      .from('journeys')
      .select('*')
      .eq('customer_id', customerId);

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #000;">Subject Access Request Data Report</h1>
        <p>This report contains the personal data held about you by our systems.</p>
        
        <h2>Customer Profile</h2>
        <ul>
          <li><strong>Name:</strong> ${customer.name || 'Not provided'}</li>
          <li><strong>Email:</strong> ${customer.email || 'Not provided'}</li>
          <li><strong>Phone:</strong> ${customer.phone || 'Not provided'}</li>
          <li><strong>Primary Address:</strong> ${customer.address_key || 'Not provided'}</li>
        </ul>

        <h2>Marketing Preferences</h2>
        <ul>
          <li><strong>Email Consent:</strong> ${customer.email_consent}</li>
          <li><strong>SMS Consent:</strong> ${customer.sms_consent}</li>
        </ul>

        <h2>Journey History</h2>
        <p>Total Bookings: ${customer.total_bookings}</p>
        <ul>
          ${(journeys || []).map(j => `<li>${new Date(j.booking_date).toLocaleDateString()} - Route: ${j.pickup_address} to ${j.dropoff_address}</li>`).join('')}
        </ul>
      </div>
    `;

    const { error: resendError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@runnur.co.uk',
      to: [customer.email],
      subject: 'Your Data Report',
      html: htmlContent,
    });

    if (resendError) throw resendError;

    const serverClient = createClient();
    const { data: { user } } = await serverClient.auth.getUser();

    await supabase.from('privacy_requests').insert({
      customer_id: customerId,
      request_type: 'subject_access',
      status: 'completed',
      requested_by: user?.email || 'System'
    });

    await logAudit('privacy.subject_access', 'customer', customerId, { action: 'emailed' });

    return { success: true };
  } catch (err: unknown) {
    console.error('Error sending data report:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function eraseCustomerData(customerId: string) {
  try {
    const { error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .single();

    if (customerError) throw customerError;

    // Perform erasure
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        name: null,
        phone: null,
        email: null,
        address_key: null,
        notes: null,
        favourite_pickup: null,
        favourite_dropoff: null,
        tags: [],
        email_consent: 'opted_out',
        sms_consent: 'opted_out',
        privacy_status: 'erased'
      })
      .eq('id', customerId);

    if (updateError) throw updateError;

    const serverClient = createClient();
    const { data: { user } } = await serverClient.auth.getUser();

    await supabase.from('privacy_requests').insert({
      customer_id: customerId,
      request_type: 'erasure',
      status: 'completed',
      requested_by: user?.email || 'System',
      notes: 'Anonymized name, contact details, and locations.'
    });

    await logAudit('privacy.erasure', 'customer', customerId, { action: 'erased' });

    revalidatePath(`/customers/${customerId}`);
    revalidatePath('/privacy-requests');

    return { success: true };
  } catch (err: unknown) {
    console.error('Error erasing customer:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getPrivacyRequests() {
  try {
    const { data, error } = await supabase
      .from('privacy_requests')
      .select('*, customers(name, email, external_customer_id)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (err: unknown) {
    console.error('Error fetching privacy requests:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error', data: null };
  }
}
