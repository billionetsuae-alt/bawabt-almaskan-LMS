import express from 'express';
import { body } from 'express-validator';
import {
  getAttendance,
  markAttendance,
  bulkMarkAttendance,
  updateAttendance,
  approveAttendance,
  deleteAttendance
} from '../controllers/attendanceController.js';
import { authenticate, requireManager, requireSupervisor } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get attendance records
router.get('/', getAttendance);

// Mark attendance (supervisor and manager)
router.post('/',
  requireSupervisor,
  body('employeeId').notEmpty(),
  body('date').isDate(),
  body('status').isIn(['Present', 'Absent', 'Half-Day']),
  body('otHours').optional().isFloat({ min: 0 }),
  validate,
  markAttendance
);

// Bulk mark attendance
router.post('/bulk',
  requireSupervisor,
  body('date').isDate(),
  body('records').isArray(),
  validate,
  bulkMarkAttendance
);

// Update attendance
router.put('/:id',
  requireSupervisor,
  updateAttendance
);

// Approve attendance (manager only)
router.post('/:id/approve',
  requireManager,
  approveAttendance
);

// Delete attendance
router.delete('/:id',
  requireSupervisor,
  deleteAttendance
);

export default router;
