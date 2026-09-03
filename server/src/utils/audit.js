import AuditLog from "../models/AuditLog.js";

export async function recordAudit({ actor, action, entityType, entityId, metadata, req }) {
  try {
    await AuditLog.create({
      actor: actor?._id || actor,
      actorRole: actor?.role,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress: req?.ip,
    });
  } catch (err) {
    // Audit logging must never break the primary request flow.
    console.error("[audit] failed to record entry:", err.message);
  }
}
