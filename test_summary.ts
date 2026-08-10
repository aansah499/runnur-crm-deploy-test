import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
  const { data, error } = await supabase
    .from('journeys')
    .select('*, customer:customers(*)')
    .order('booking_date', { ascending: false })
    .order('time', { ascending: false });
    
  fs.writeFileSync('summary_output.json', JSON.stringify({ length: data?.length, error }, null, 2));
}

check();
