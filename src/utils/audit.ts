import { createClient } from '@/utils/supabase/server';

export type AuditAction = 
  | 'customer.updated'
  | 'customer.consent_updated'
  | 'customer.tags_updated'
  | 'campaign.sent'
  | 'campaign.test_sent'
  | string;

/**
 * Logs an action to the audit_log table.
 * 
 * @param action - The action performed (e.g. 'customer.updated')
 * @param entityType - The type of entity affected (e.g. 'customer', 'campaign')
 * @param entityId - The ID of the entity affected
 * @param details - Any additional JSON details about the action
 */
export async function logAudit(
  action: AuditAction, 
  entityType: string, 
  entityId: string | null = null, 
  details: Record<string, unknown> = {}
) {
  try {
    const supabase = createClient();
    
    // Attempt to get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('audit_log').insert({
      user_id: user?.id || null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details
    });

    if (error) {
      console.error('Failed to write to audit log:', error);
    }
  } catch (err) {
    console.error('Unexpected error writing to audit log:', err);
  }
}
