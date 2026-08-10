'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function updateMarketingConsent(customerId: string, field: 'sms_consent' | 'email_consent', value: string) {
  try {
    const { error } = await supabase
      .from('customers')
      .update({ [field]: value })
      .eq('id', customerId);

    if (error) throw error;
    
    revalidatePath(`/customers/${customerId}`);
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { error: err.message || 'Failed to update consent' };
    }
    return { error: 'Failed to update consent' };
  }
}

export async function updateCustomerContactDetails(customerId: string, name: string, phone: string, email: string | null) {
  try {
    if (!name || !phone) {
      return { error: 'Name and phone are required to verify a customer.' };
    }

    const { error } = await supabase
      .from('customers')
      .update({ name, phone, email })
      .eq('id', customerId);

    if (error) throw error;
    
    revalidatePath(`/customers/${customerId}`);
    revalidatePath('/');
    revalidatePath('/segments');
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { error: err.message || 'Failed to update contact details' };
    }
    return { error: 'Failed to update contact details' };
  }
}
