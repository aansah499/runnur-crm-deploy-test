'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { recalculateCustomerTags } from '@/lib/tags';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function addBooking(prevState: any, formData: FormData) {
  try {
    const phone = formData.get('phone') as string;
    const name = formData.get('name') as string;
    const email = (formData.get('email') as string) || null;
    const pickup = formData.get('pickup') as string;
    const dropoff = formData.get('dropoff') as string;
    const bookingDate = formData.get('bookingDate') as string;
    const fare = parseFloat((formData.get('fare') as string) || '0');
    const status = formData.get('status') as string;
    const smsConsent = (formData.get('sms_consent') as string) || 'unknown';
    const emailConsent = (formData.get('email_consent') as string) || 'unknown';

    if (!phone) {
      return { error: 'Phone number is required.' };
    }
    if (!name) {
      return { error: 'Customer name is required.' };
    }
    if (!pickup || !dropoff || !bookingDate || isNaN(fare)) {
      return { error: 'All journey fields are required and fare must be a number.' };
    }

    // 1. Find or create customer
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .single();

    let customerId = '';

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({
          name,
          phone,
          email,
          total_bookings: 1,
          total_spend: status === 'completed' ? fare : 0,
          first_booking_at: new Date(bookingDate).toISOString(),
          last_booking_at: new Date(bookingDate).toISOString(),
          sms_consent: smsConsent,
          email_consent: emailConsent,
        })
        .select()
        .single();

      if (insertError || !newCustomer) {
        return { error: 'Failed to create new customer.' };
      }
      customerId = newCustomer.id;
    }

    // 2. Insert Journey
    const { error: journeyError } = await supabase
      .from('journeys')
      .insert({
        customer_id: customerId,
        pickup_address: pickup,
        dropoff_address: dropoff,
        booking_date: bookingDate,
        fare,
        status,
        source: 'manual_entry'
      });

    if (journeyError) {
      return { error: 'Failed to add journey.' };
    }

    await recalculateCustomerTags(customerId);

    revalidatePath('/');
    return { success: true };

  } catch (err: unknown) {
    if (err instanceof Error) {
      return { error: err.message || 'An unexpected error occurred.' };
    }
    return { error: 'An unexpected error occurred.' };
  }
}
