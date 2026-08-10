import { supabase } from '@/lib/supabase';

export async function recalculateCustomerTags(customerId: string) {
  // 1. Fetch ALL customer journeys to act as source of truth
  const { data: journeys, error: journeysError } = await supabase
    .from('journeys')
    .select('pickup_address, dropoff_address, fare, status, booking_date')
    .eq('customer_id', customerId);

  if (journeysError) {
    console.error(`Failed to fetch journeys for customer ${customerId}:`, journeysError);
    return;
  }

  // Calculate Core Metrics
  const totalBookings = journeys?.length || 0;
  let totalSpend = 0;
  let first_booking_at: string | null = null;
  let last_booking_at: string | null = null;

  for (const journey of journeys || []) {
    if (journey.status === 'completed' && journey.fare) {
      totalSpend += Number(journey.fare);
    }
    
    if (journey.booking_date) {
      // Safely parse the date, handling only YYYY-MM-DD
      const dateString = journey.booking_date.includes('T') ? journey.booking_date : `${journey.booking_date}T00:00:00Z`;
      const journeyDateObj = new Date(dateString);
      
      if (!first_booking_at || journeyDateObj < new Date(first_booking_at)) {
        first_booking_at = journeyDateObj.toISOString();
      }
      if (!last_booking_at || journeyDateObj > new Date(last_booking_at)) {
        last_booking_at = journeyDateObj.toISOString();
      }
    }
  }

  const tags: string[] = [];

  // Rules
  if (totalBookings === 1) tags.push('new_customer');
  if (totalBookings >= 2) tags.push('repeat_customer');
  if (totalBookings >= 5) tags.push('frequent_customer');
  
  if (totalSpend >= 200) tags.push('high_spend');

  if (last_booking_at) {
    const lastBooking = new Date(last_booking_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastBooking.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 30 && diffDays <= 59) {
      tags.push('inactive_30');
    } else if (diffDays >= 60 && diffDays <= 89) {
      tags.push('inactive_60');
    } else if (diffDays >= 90) {
      tags.push('inactive_90');
    }
  }

  // Location-based rules & Favourite locations
  let airportCount = 0;
  let stationCount = 0;
  let schoolCount = 0;
  let hospitalCount = 0;
  let careHomeCount = 0;
  let shoppingCount = 0;
  let nightlifeCount = 0;
  let businessCount = 0;
  
  const pickupCounts: Record<string, number> = {};
  const dropoffCounts: Record<string, number> = {};

  for (const journey of journeys || []) {
    const p = journey.pickup_address?.trim();
    const d = journey.dropoff_address?.trim();
    const pLower = (p || '').toLowerCase();
    const dLower = (d || '').toLowerCase();

    const containsAny = (str: string, keywords: string[]) => keywords.some(kw => str.includes(kw));

    if (pLower.includes('airport') || dLower.includes('airport')) airportCount++;
    if (pLower.includes('station') || dLower.includes('station')) stationCount++;
    
    if (containsAny(pLower, ['school', 'academy', 'nursery', 'college']) || containsAny(dLower, ['school', 'academy', 'nursery', 'college'])) schoolCount++;
    if (containsAny(pLower, ['hospital', 'clinic', 'surgery']) || containsAny(dLower, ['hospital', 'clinic', 'surgery'])) hospitalCount++;
    if (containsAny(pLower, ['care home', 'nursing home', 'care & nursing']) || containsAny(dLower, ['care home', 'nursing home', 'care & nursing'])) careHomeCount++;
    if (containsAny(pLower, ['tesco', 'sainsbury', 'morrisons', 'aldi', 'asda', 'supermarket', 'shopping']) || containsAny(dLower, ['tesco', 'sainsbury', 'morrisons', 'aldi', 'asda', 'supermarket', 'shopping'])) shoppingCount++;
    if (containsAny(pLower, ['pub', 'bar', 'wetherspoon', 'club', 'tavern']) || containsAny(dLower, ['pub', 'bar', 'wetherspoon', 'club', 'tavern'])) nightlifeCount++;
    if (containsAny(pLower, ['ltd', 'office', 'business park', 'industrial estate']) || containsAny(dLower, ['ltd', 'office', 'business park', 'industrial estate'])) businessCount++;

    if (p) pickupCounts[p] = (pickupCounts[p] || 0) + 1;
    if (d) dropoffCounts[d] = (dropoffCounts[d] || 0) + 1;
  }

  if (airportCount >= 2) tags.push('airport_traveller');
  if (stationCount >= 2) tags.push('station_traveller');
  if (schoolCount >= 2) tags.push('school_run');
  if (hospitalCount >= 2) tags.push('hospital_visitor');
  if (careHomeCount >= 2) tags.push('care_home_related');
  if (shoppingCount >= 2) tags.push('shopping_traveller');
  if (nightlifeCount >= 2) tags.push('nightlife_traveller');
  if (businessCount >= 2) tags.push('business_traveller');

  let favourite_pickup = null;
  let maxPickup = 0;
  for (const [address, count] of Object.entries(pickupCounts)) {
    if (count > maxPickup) {
      maxPickup = count;
      favourite_pickup = address;
    }
  }

  let favourite_dropoff = null;
  let maxDropoff = 0;
  for (const [address, count] of Object.entries(dropoffCounts)) {
    if (count > maxDropoff) {
      maxDropoff = count;
      favourite_dropoff = address;
    }
  }

  // LTV Band Calculation
  let lifetime_value_band = 'Bronze';
  if (totalSpend >= 750) {
    lifetime_value_band = 'Platinum';
  } else if (totalSpend >= 250) {
    lifetime_value_band = 'Gold';
  } else if (totalSpend >= 50) {
    lifetime_value_band = 'Silver';
  }

  // 3. Update the database
  const { error: updateError } = await supabase
    .from('customers')
    .update({ 
      total_bookings: totalBookings,
      total_spend: totalSpend,
      first_booking_at,
      last_booking_at,
      tags,
      lifetime_value_band,
      favourite_pickup,
      favourite_dropoff
    })
    .eq('id', customerId);

  if (updateError) {
    console.error(`Failed to update tags for customer ${customerId}:`, updateError);
  }
}
