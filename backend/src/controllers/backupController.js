import { 
  createBackup, 
  listBackups, 
  deleteBackup, 
  restoreBackup, 
  getBackupDetails,
  cleanupOldBackups 
} from '../services/backup.js';
import { 
  getSchedulerStatus,
  startBackupScheduler,
  startWeeklyBackupScheduler,
  startDailyBackupScheduler,
  stopAllSchedulers
} from '../services/scheduledBackup.js';
import { logAudit } from '../services/audit.js';

/**
 * Create a new backup
 */
export async function createBackupHandler(req, res) {
  try {
    const result = await createBackup();

    await logAudit(
      req.user.id,
      req.user.name,
      'CREATE_BACKUP',
      'backup',
      result.backup.id,
      { backupName: result.backup.name }
    );

    res.json(result);
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({ error: error.message || 'Failed to create backup' });
  }
}

/**
 * List all backups
 */
export async function listBackupsHandler(req, res) {
  try {
    const { limit = 20 } = req.query;
    const result = await listBackups(parseInt(limit));

    res.json(result);
  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({ error: error.message || 'Failed to list backups' });
  }
}

/**
 * Get backup details
 */
export async function getBackupDetailsHandler(req, res) {
  try {
    const { id } = req.params;
    const result = await getBackupDetails(id);

    res.json(result);
  } catch (error) {
    console.error('Get backup details error:', error);
    res.status(500).json({ error: error.message || 'Failed to get backup details' });
  }
}

/**
 * Delete a backup
 */
export async function deleteBackupHandler(req, res) {
  try {
    const { id } = req.params;
    const result = await deleteBackup(id);

    await logAudit(
      req.user.id,
      req.user.name,
      'DELETE_BACKUP',
      'backup',
      id,
      { action: 'delete' }
    );

    res.json(result);
  } catch (error) {
    console.error('Delete backup error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete backup' });
  }
}

/**
 * Restore from backup
 */
export async function restoreBackupHandler(req, res) {
  try {
    const { id } = req.params;
    const result = await restoreBackup(id);

    await logAudit(
      req.user.id,
      req.user.name,
      'RESTORE_BACKUP',
      'backup',
      id,
      { backupName: result.backup.name, action: 'restore' }
    );

    res.json(result);
  } catch (error) {
    console.error('Restore backup error:', error);
    res.status(500).json({ error: error.message || 'Failed to restore backup' });
  }
}

/**
 * Cleanup old backups
 */
export async function cleanupOldBackupsHandler(req, res) {
  try {
    const { keepCount = 30 } = req.query;
    const result = await cleanupOldBackups(parseInt(keepCount));

    await logAudit(
      req.user.id,
      req.user.name,
      'CLEANUP_BACKUPS',
      'backup',
      'cleanup',
      { deletedCount: result.deleted, keepCount: parseInt(keepCount) }
    );

    res.json(result);
  } catch (error) {
    console.error('Cleanup backups error:', error);
    res.status(500).json({ error: error.message || 'Failed to cleanup backups' });
  }
}

/**
 * Get scheduler status
 */
export async function getSchedulerStatusHandler(req, res) {
  try {
    const status = getSchedulerStatus();
    res.json(status);
  } catch (error) {
    console.error('Get scheduler status error:', error);
    res.status(500).json({ error: error.message || 'Failed to get scheduler status' });
  }
}

/**
 * Enable scheduler
 */
export async function enableSchedulerHandler(req, res) {
  try {
    const { frequency = 'monthly' } = req.body;
    
    // Stop existing schedulers first
    stopAllSchedulers();
    
    // Start requested scheduler
    if (frequency === 'monthly') {
      startBackupScheduler();
    } else if (frequency === 'weekly') {
      startWeeklyBackupScheduler();
    } else if (frequency === 'daily') {
      startDailyBackupScheduler();
    }

    await logAudit(
      req.user.id,
      req.user.name,
      'ENABLE_SCHEDULER',
      'backup',
      'scheduler',
      { frequency }
    );

    res.json({ 
      success: true, 
      message: `${frequency} backup scheduler enabled`,
      frequency 
    });
  } catch (error) {
    console.error('Enable scheduler error:', error);
    res.status(500).json({ error: error.message || 'Failed to enable scheduler' });
  }
}

/**
 * Disable scheduler
 */
export async function disableSchedulerHandler(req, res) {
  try {
    stopAllSchedulers();

    await logAudit(
      req.user.id,
      req.user.name,
      'DISABLE_SCHEDULER',
      'backup',
      'scheduler',
      { action: 'disabled' }
    );

    res.json({ 
      success: true, 
      message: 'Backup scheduler disabled' 
    });
  } catch (error) {
    console.error('Disable scheduler error:', error);
    res.status(500).json({ error: error.message || 'Failed to disable scheduler' });
  }
}
