'use server';

import { supabase } from '@/lib/supabase';
import { recalculateCustomerTags } from '@/lib/tags';
import { revalidatePath } from 'next/cache';

export async function recalculateAllCustomers() {
  const { data: customers, error } = await supabase.from('customers').select('id');
  
  if (error) {
    console.error('Failed to fetch customers for recalculation:', error);
    return;
  }
  
  if (customers) {
    // We run this sequentially to avoid overwhelming the database with too many concurrent requests if there are many customers
    for (const customer of customers) {
      await recalculateCustomerTags(customer.id);
    }
  }
  
  revalidatePath('/segments');
  revalidatePath('/customers');
  revalidatePath('/');
}
