'use server';

import { supabase } from '@/lib/supabase';
import { recalculateCustomerTags } from '@/lib/tags';

export type HistoricalCSVRow = {
  external_customer_id?: string;
  external_booking_id?: string;
  pickup_address?: string;
  dropoff_address?: string;
  booking_date?: string;
  booking_time?: string;
  fare?: string;
  booking_type?: string;
  status?: string;
};

export type ImportResult = {
  newCustomers: number;
  updatedCustomers: number;
  journeysAdded: number;
  skippedRows: number;
  errors: string[];
};

export async function processHistoricalCSV(rows: HistoricalCSVRow[]): Promise<ImportResult> {
  const result: ImportResult = {
    newCustomers: 0,
    updatedCustomers: 0,
    journeysAdded: 0,
    skippedRows: 0,
    errors: [],
  };

  const affectedCustomerIds = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    const extBookingId = row.external_booking_id?.trim();
    if (!extBookingId) {
      result.skippedRows++;
      result.errors.push(`Row ${i + 1}: Missing external_booking_id`);
      continue;
    }

    const extCustomerId = row.external_customer_id?.trim();
    if (!extCustomerId) {
      result.skippedRows++;
      result.errors.push(`Row ${i + 1}: Missing external_customer_id`);
      continue;
    }

    const pickup = row.pickup_address?.trim() || '';
    const dropoff = row.dropoff_address?.trim() || '';
    const fare = parseFloat(row.fare?.trim() || '0');
    const status = row.status?.trim().toLowerCase() === 'completed' ? 'completed' : 'cancelled';
    
    // Parse booking date safely
    let bookingDate = new Date().toISOString().split('T')[0];
    if (row.booking_date && row.booking_date.trim()) {
      const parsedDate = new Date(row.booking_date.trim());
      if (!isNaN(parsedDate.getTime())) {
        bookingDate = parsedDate.toISOString().split('T')[0];
      }
    }

    // 0. Idempotency Check - See if booking already exists
    const { data: existingJourney } = await supabase
      .from('journeys')
      .select('id')
      .eq('external_booking_id', extBookingId)
      .single();

    if (existingJourney) {
      result.skippedRows++;
      // Not necessarily an error, just a duplicate
      continue;
    }

    // 1. Find or create customer
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('external_customer_id', extCustomerId)
      .single();

    let customerId = '';

    if (existingCustomer) {
      // We no longer manually update metrics here. The recalculateCustomerTags loop will handle it.
      customerId = existingCustomer.id;
      result.updatedCustomers++;
    } else {
      // Create new anonymous customer
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({
          external_customer_id: extCustomerId,
          address_key: pickup || null,
          total_bookings: 1,
          total_spend: status === 'completed' ? fare : 0,
          first_booking_at: new Date(bookingDate).toISOString(),
          last_booking_at: new Date(bookingDate).toISOString(),
        })
        .select()
        .single();

      if (insertError || !newCustomer) {
        console.error(`Row ${i + 1} Insert Error:`, insertError);
        result.skippedRows++;
        result.errors.push(`Row ${i + 1}: Failed to create anonymous customer ${extCustomerId} - ${insertError?.message}`);
        continue;
      }
      customerId = newCustomer.id;
      result.newCustomers++;
    }

    // 2. Insert Journey
    const { error: journeyError } = await supabase
      .from('journeys')
      .insert({
        customer_id: customerId,
        external_booking_id: extBookingId,
        pickup_address: pickup,
        dropoff_address: dropoff,
        booking_date: bookingDate,
        fare,
        status,
        source: 'historical_import'
      });

    if (journeyError) {
      console.error(`Row ${i + 1} Journey Error:`, journeyError);
      const errMsg = journeyError.message || 'Unknown error';
      const errCode = journeyError.code ? `[${journeyError.code}] ` : '';
      const errDetails = journeyError.details ? ` (Details: ${journeyError.details})` : '';
      result.errors.push(`Row ${i + 1}: Journey insert failed for ${extCustomerId}: ${errCode}${errMsg}${errDetails}`);
    } else {
      result.journeysAdded++;
    }
    
    if (customerId) {
      affectedCustomerIds.add(customerId);
    }
  }

  // Recalculate tags for all affected customers
  for (const id of Array.from(affectedCustomerIds)) {
    await recalculateCustomerTags(id);
  }

  return result;
}
