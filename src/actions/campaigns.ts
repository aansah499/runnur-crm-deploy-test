'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function addCampaign(prevState: any, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const channel = formData.get('channel') as string;
    const segment_name = formData.get('segment_name') as string;
    const audience_count = parseInt(formData.get('audience_count') as string, 10) || 0;
    const sent_at = formData.get('sent_at') as string;
    const message_summary = formData.get('message_summary') as string;
    const notes = formData.get('notes') as string;

    if (!name || !channel || !sent_at) {
      return { error: 'Name, channel, and sent date are required.' };
    }

    const { error } = await supabase
      .from('campaigns')
      .insert({
        name,
        channel,
        segment_name,
        audience_count,
        sent_at,
        message_summary,
        notes,
      });

    if (error) {
      console.error('Error adding campaign:', error);
      return { error: 'Failed to add campaign.' };
    }

    revalidatePath('/campaigns');
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { error: err.message || 'An unexpected error occurred.' };
    }
    return { error: 'An unexpected error occurred.' };
  }
}

export async function updateCampaignResults(id: string, bookings: number, revenue: number) {
  try {
    const { error } = await supabase
      .from('campaigns')
      .update({
        bookings_result: bookings,
        revenue_result: revenue,
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating campaign results:', error);
      return { success: false, error: 'Failed to update results.' };
    }

    revalidatePath('/campaigns');
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
    return { success: false, error: 'An unexpected error occurred.' };
  }
}
