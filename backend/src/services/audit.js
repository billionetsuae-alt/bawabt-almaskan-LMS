import { appendToSheet, generateId, SHEETS } from './googleSheets.js';

/**
 * Log audit event
 */
export async function logAudit(userId, userName, action, entity, entityId, details = {}) {
  try {
    const auditEntry = [
      generateId('audit_'),
      new Date().toISOString(),
      userId,
      userName,
      action,
      entity,
      entityId,
      JSON.stringify(details)
    ];

    await appendToSheet(SHEETS.AUDIT_LOGS, [auditEntry]);
    console.log(`📝 Audit: ${userName} ${action} ${entity} ${entityId}`);
  } catch (error) {
    console.error('Failed to log audit:', error);
    // Don't throw - audit logging failure shouldn't break the main operation
  }
}

/**
 * Get audit logs with optional filters
 */
export async function getAuditLogs(filters = {}) {
  try {
    const { getSheetData } = await import('./googleSheets.js');
    const data = await getSheetData(SHEETS.AUDIT_LOGS);
    
    if (data.length <= 1) return [];

    const headers = data[0];
    const logs = data.slice(1).map(row => ({
      id: row[0],
      timestamp: row[1],
      userId: row[2],
      userName: row[3],
      action: row[4],
      entity: row[5],
      entityId: row[6],
      details: row[7] ? JSON.parse(row[7]) : {}
    }));

    // Apply filters
    let filtered = logs;
    
    if (filters.userId) {
      filtered = filtered.filter(log => log.userId === filters.userId);
    }
    
    if (filters.entity) {
      filtered = filtered.filter(log => log.entity === filters.entity);
    }
    
    if (filters.startDate) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
    }

    // Sort by timestamp desc
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error('Error getting audit logs:', error);
    throw error;
  }
}
