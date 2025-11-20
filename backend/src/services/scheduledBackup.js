import cron from 'node-cron';
import { createBackup, cleanupOldBackups } from './backup.js';
import { logAudit } from './audit.js';

let scheduledTasks = [];

/**
 * Start automatic backup scheduler
 * Runs on the 1st day of every month at 2:00 AM
 */
export function startBackupScheduler() {
  // Monthly backup: 1st day of every month at 2:00 AM
  // Cron format: minute hour day month weekday
  // '0 2 1 * *' = At 02:00 on day 1 of every month
  const monthlyBackup = cron.schedule('0 2 1 * *', async () => {
    console.log('🔄 Running scheduled monthly backup...');
    
    try {
      const result = await createBackup();
      
      // Log the automated backup
      await logAudit(
        'system',
        'Automated Scheduler',
        'AUTOMATED_BACKUP',
        'backup',
        result.backup.id,
        { 
          backupName: result.backup.name,
          scheduled: true,
          frequency: 'monthly'
        }
      );
      
      console.log('✅ Scheduled monthly backup created successfully:', result.backup.name);
      
      // Auto-cleanup old backups (keep last 12 monthly backups = 1 year)
      const cleanupResult = await cleanupOldBackups(12);
      console.log(`🧹 Cleanup complete: ${cleanupResult.deleted} old backups removed`);
      
    } catch (error) {
      console.error('❌ Scheduled backup failed:', error.message);
      
      // Log the failure
      try {
        await logAudit(
          'system',
          'Automated Scheduler',
          'AUTOMATED_BACKUP_FAILED',
          'backup',
          'failed',
          { 
            error: error.message,
            scheduled: true,
            frequency: 'monthly'
          }
        );
      } catch (logError) {
        console.error('Failed to log backup error:', logError);
      }
    }
  }, {
    timezone: "Asia/Dubai" // UAE timezone
  });

  scheduledTasks.push(monthlyBackup);
  console.log('✅ Automatic monthly backup scheduler started (Runs on 1st of every month at 2:00 AM UAE time)');
}

/**
 * Start weekly backup scheduler (optional)
 * Runs every Sunday at 3:00 AM
 */
export function startWeeklyBackupScheduler() {
  // Weekly backup: Every Sunday at 3:00 AM
  // '0 3 * * 0' = At 03:00 on Sunday
  const weeklyBackup = cron.schedule('0 3 * * 0', async () => {
    console.log('🔄 Running scheduled weekly backup...');
    
    try {
      const result = await createBackup();
      
      await logAudit(
        'system',
        'Automated Scheduler',
        'AUTOMATED_BACKUP',
        'backup',
        result.backup.id,
        { 
          backupName: result.backup.name,
          scheduled: true,
          frequency: 'weekly'
        }
      );
      
      console.log('✅ Scheduled weekly backup created successfully:', result.backup.name);
      
    } catch (error) {
      console.error('❌ Scheduled weekly backup failed:', error.message);
    }
  }, {
    timezone: "Asia/Dubai"
  });

  scheduledTasks.push(weeklyBackup);
  console.log('✅ Automatic weekly backup scheduler started (Runs every Sunday at 3:00 AM UAE time)');
}

/**
 * Start daily backup scheduler (optional, for critical operations)
 * Runs every day at 1:00 AM
 */
export function startDailyBackupScheduler() {
  // Daily backup: Every day at 1:00 AM
  // '0 1 * * *' = At 01:00 every day
  const dailyBackup = cron.schedule('0 1 * * *', async () => {
    console.log('🔄 Running scheduled daily backup...');
    
    try {
      const result = await createBackup();
      
      await logAudit(
        'system',
        'Automated Scheduler',
        'AUTOMATED_BACKUP',
        'backup',
        result.backup.id,
        { 
          backupName: result.backup.name,
          scheduled: true,
          frequency: 'daily'
        }
      );
      
      console.log('✅ Scheduled daily backup created successfully:', result.backup.name);
      
      // Auto-cleanup for daily backups (keep last 30 days)
      const cleanupResult = await cleanupOldBackups(30);
      console.log(`🧹 Cleanup complete: ${cleanupResult.deleted} old backups removed`);
      
    } catch (error) {
      console.error('❌ Scheduled daily backup failed:', error.message);
    }
  }, {
    timezone: "Asia/Dubai"
  });

  scheduledTasks.push(dailyBackup);
  console.log('✅ Automatic daily backup scheduler started (Runs every day at 1:00 AM UAE time)');
}

/**
 * Stop all scheduled backups
 */
export function stopAllSchedulers() {
  scheduledTasks.forEach(task => task.stop());
  scheduledTasks = [];
  console.log('⏹️ All backup schedulers stopped');
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  return {
    active: scheduledTasks.length > 0,
    taskCount: scheduledTasks.length,
    schedulers: [
      { 
        name: 'Monthly Backup',
        schedule: '1st of every month at 2:00 AM',
        enabled: scheduledTasks.length > 0
      },
      {
        name: 'Weekly Backup',
        schedule: 'Every Sunday at 3:00 AM',
        enabled: scheduledTasks.length > 1
      },
      {
        name: 'Daily Backup',
        schedule: 'Every day at 1:00 AM',
        enabled: scheduledTasks.length > 2
      }
    ]
  };
}
