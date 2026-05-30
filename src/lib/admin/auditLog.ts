import { createServiceSupabaseClient } from '@/lib/supabase/server';

export type AuditAction =
  | 'confirm_donation'
  | 'delete_donation'
  | 'set_role'
  | 'award_points_manual'
  | 'award_points_material'
  | 'award_points_volunteer';

export type AuditTargetType =
  | 'donation'
  | 'profile'
  | 'material_application'
  | 'volunteer_application';

export async function logAdminAction(
  actorId: string,
  action: AuditAction,
  targetType: AuditTargetType,
  targetId: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createServiceSupabaseClient()) as any;
    await supabase.from('admin_audit_log').insert({
      actor_id: actorId,
      action,
      target_type: targetType,
      target_id: targetId,
      payload: payload ?? null,
    });
  } catch {
    // Audit log failure must never break the main operation
    console.error('[auditLog] Failed to write audit entry', { actorId, action, targetType, targetId });
  }
}
