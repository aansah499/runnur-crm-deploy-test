import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query || query.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  const trimmedQuery = query.trim();
  
  // Normalize phone for searching by stripping typical formatting
  const normalizedPhone = trimmedQuery.replace(/^(\+44|0)/, '').replace(/[\s-]/g, '');

  const { data, error } = await supabase
    .from('customers')
    .select('id, name, phone, address_key, lifetime_value_band')
    .or(`name.ilike.%${trimmedQuery}%,phone.ilike.%${normalizedPhone}%,address_key.ilike.%${trimmedQuery}%`)
    .limit(8);

  if (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ results: data || [] });
}
