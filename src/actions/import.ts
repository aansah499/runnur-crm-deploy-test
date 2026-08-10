'use server';

import { supabase } from '@/lib/supabase';
import { recalculateCustomerTags } from '@/lib/tags';

export type CSVRow = {
  'Customer Name'?: string;
  Phone?: string;
  Email?: string;
  'Pickup Address'?: string;
  'Dropoff Address'?: string;
  'Booking Date'?: string;
  Fare?: string;
  Status?: string;
};

export type ImportResult = {
  newCustomers: number;
  updatedCustomers: number;
  journeysAdded: number;
  skippedRows: number;
  errors: string[];
};

export async function processCSV(rows: CSVRow[]): Promise<ImportResult> {
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
    
    if (!row.Phone || row.Phone.trim() === '') {
      result.skippedRows++;
      result.errors.push(`Row ${i + 1}: Missing Phone number`);
      continue;
    }

    const phone = row.Phone.trim();
    const name = row['Customer Name']?.trim() || 'Unknown';
    const email = row.Email?.trim() || null;
    const pickup = row['Pickup Address']?.trim() || '';
    const dropoff = row['Dropoff Address']?.trim() || '';
    const fare = parseFloat(row.Fare?.trim() || '0');
    const status = row.Status?.trim().toLowerCase() === 'completed' ? 'completed' : 'cancelled';
    
    // Parse booking date safely
    let bookingDate = new Date().toISOString().split('T')[0];
    if (row['Booking Date'] && row['Booking Date'].trim()) {
      const parsedDate = new Date(row['Booking Date'].trim());
      if (!isNaN(parsedDate.getTime())) {
        bookingDate = parsedDate.toISOString().split('T')[0];
      }
    }

    // 1. Find or create customer
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .single();

    let customerId = '';

    if (existingCustomer) {
      // We no longer manually update metrics here. The recalculateCustomerTags loop will handle it.
      customerId = existingCustomer.id;
      result.updatedCustomers++;
    } else {
      // Create new customer
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
        })
        .select()
        .single();

      if (insertError || !newCustomer) {
        console.error(`Row ${i + 1} Insert Error:`, insertError);
        result.skippedRows++;
        result.errors.push(`Row ${i + 1}: Failed to create customer ${phone} - ${insertError?.message || 'Unknown error'}`);
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
        pickup_address: pickup,
        dropoff_address: dropoff,
        booking_date: bookingDate,
        fare,
        status,
        source: 'csv_import'
      });

    if (journeyError) {
      console.error(`Row ${i + 1} Journey Error:`, journeyError);
      result.errors.push(`Row ${i + 1}: Journey insert failed for ${phone} - ${journeyError?.message || 'Unknown error'}`);
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
