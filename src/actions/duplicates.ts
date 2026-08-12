'use server';

import { supabase } from '@/lib/supabase';
import { recalculateCustomerTags } from '@/lib/tags';
import { logAudit } from '@/utils/audit';
import { revalidatePath } from 'next/cache';

export type CustomerDuplicate = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  address_key: string | null;
  total_bookings: number | null;
  total_spend: number | null;
  tags: string[] | null;
  first_booking_at: string | null;
  last_booking_at: string | null;
  lifetime_value_band: string | null;
};

export type DuplicateGroup = {
  reason: string;
  customers: CustomerDuplicate[];
};

export async function findDuplicates(): Promise<{ success: boolean; groups?: DuplicateGroup[]; error?: string }> {
  try {
    // Fetch all active customers (ignoring archived)
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone, email, address_key, total_bookings, total_spend, tags, first_booking_at, last_booking_at, lifetime_value_band')
      .neq('is_archived', true);

    if (error) throw error;
    if (!customers || customers.length === 0) return { success: true, groups: [] };

    const phoneGroups = new Map<string, CustomerDuplicate[]>();
    const namePostcodeGroups = new Map<string, CustomerDuplicate[]>();

    customers.forEach(customer => {
      // 1. Group by normalized phone
      if (customer.phone) {
        const normalizedPhone = customer.phone.replace(/^(\+44|0)/, '').replace(/[\s-]/g, '');
        if (normalizedPhone.length >= 8) { // Only group if phone looks somewhat valid
          if (!phoneGroups.has(normalizedPhone)) phoneGroups.set(normalizedPhone, []);
          phoneGroups.get(normalizedPhone)!.push(customer);
        }
      }

      // 2. Group by Name + Postcode District (first 4 chars of address_key usually contains it)
      if (customer.name && customer.address_key) {
        const normalizedName = customer.name.trim().toLowerCase();
        const postcodeDistrict = customer.address_key.trim().substring(0, 4).toLowerCase();
        if (normalizedName.length > 2 && postcodeDistrict.length >= 2) {
          const nameKey = `${normalizedName}|${postcodeDistrict}`;
          if (!namePostcodeGroups.has(nameKey)) namePostcodeGroups.set(nameKey, []);
          namePostcodeGroups.get(nameKey)!.push(customer);
        }
      }
    });

    const groups: DuplicateGroup[] = [];
    const seenGroupIds = new Set<string>();

    const addGroup = (reason: string, custs: CustomerDuplicate[]) => {
      if (custs.length < 2) return;
      
      // Create a unique hash for this group to avoid showing the same pair twice
      const groupHash = custs.map(c => c.id).sort().join('|');
      if (seenGroupIds.has(groupHash)) return;
      
      seenGroupIds.add(groupHash);
      groups.push({ reason, customers: custs });
    };

    phoneGroups.forEach((custs, phone) => addGroup(`Phone Match (${phone})`, custs));
    namePostcodeGroups.forEach((custs, key) => addGroup(`Name & Postcode Match (${key.split('|')[0]})`, custs));

    return { success: true, groups };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Unexpected error finding duplicates' };
  }
}

export async function mergeCustomers(primaryId: string, secondaryId: string) {
  try {
    if (primaryId === secondaryId) throw new Error('Cannot merge a customer into themselves');

    // 1. Update all journeys to point to the primary customer
    const { error: journeyError } = await supabase
      .from('journeys')
      .update({ customer_id: primaryId })
      .eq('customer_id', secondaryId);

    if (journeyError) throw journeyError;

    // 2. Mark secondary customer as archived and point to primary
    const { error: archiveError } = await supabase
      .from('customers')
      .update({ is_archived: true, merged_into: primaryId })
      .eq('id', secondaryId);

    if (archiveError) throw archiveError;

    // 3. Recalculate stats & tags for both (secondary will become 0, primary will combine them)
    await recalculateCustomerTags(secondaryId);
    await recalculateCustomerTags(primaryId);

    // 4. Log the audit event
    await logAudit('customer.merged', 'customer', primaryId, { merged_from: secondaryId });

    revalidatePath('/customers');
    revalidatePath('/segments');
    revalidatePath('/');
    
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: 'Failed to merge customers' };
  }
}
