import express from 'express';
import { 
  createBackupHandler, 
  listBackupsHandler, 
  getBackupDetailsHandler,
  deleteBackupHandler, 
  restoreBackupHandler,
  cleanupOldBackupsHandler,
  getSchedulerStatusHandler,
  enableSchedulerHandler,
  disableSchedulerHandler
} from '../controllers/backupController.js';
import { authenticate, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// All backup routes require authentication and manager role
router.use(authenticate);
router.use(authorizeRole('manager'));

/**
 * @route   POST /api/backup/create
 * @desc    Create a new backup
 * @access  Manager only
 */
router.post('/create', createBackupHandler);

/**
 * @route   GET /api/backup/list
 * @desc    List all backups
 * @access  Manager only
 */
router.get('/list', listBackupsHandler);

/**
 * @route   GET /api/backup/scheduler/status
 * @desc    Get scheduler status
 * @access  Manager only
 */
router.get('/scheduler/status', getSchedulerStatusHandler);

/**
 * @route   POST /api/backup/scheduler/enable
 * @desc    Enable automatic backups
 * @access  Manager only
 */
router.post('/scheduler/enable', enableSchedulerHandler);

/**
 * @route   POST /api/backup/scheduler/disable
 * @desc    Disable automatic backups
 * @access  Manager only
 */
router.post('/scheduler/disable', disableSchedulerHandler);

/**
 * @route   GET /api/backup/:id
 * @desc    Get backup details
 * @access  Manager only
 */
router.get('/:id', getBackupDetailsHandler);

/**
 * @route   DELETE /api/backup/:id
 * @desc    Delete a backup
 * @access  Manager only
 */
router.delete('/:id', deleteBackupHandler);

/**
 * @route   POST /api/backup/:id/restore
 * @desc    Restore from a backup
 * @access  Manager only
 */
router.post('/:id/restore', restoreBackupHandler);

/**
 * @route   POST /api/backup/cleanup
 * @desc    Cleanup old backups (keep last N)
 * @access  Manager only
 */
router.post('/cleanup', cleanupOldBackupsHandler);

export default router;
