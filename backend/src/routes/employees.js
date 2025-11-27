import express from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import {
  getAllEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  testEmployeeDriveUpload,
  downloadEmployeeIdProof
} from '../controllers/employeeController.js';
import { authenticate, requireManager } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Multer configuration for handling file uploads in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB per file
  }
});

// All routes require authentication
router.use(authenticate);

// Get all employees (both manager and supervisor)
router.get('/', getAllEmployees);

// Download employee identity proof file
router.get('/:id/id-proof/file', downloadEmployeeIdProof);

// Get single employee
router.get('/:id', getEmployee);

// Create employee (manager only)
router.post('/',
  requireManager,
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'idProof', maxCount: 1 }
  ]),
  body('name').notEmpty().trim(),
  body('profession').notEmpty().trim(),
  body('perDaySalary').isFloat({ min: 0 }),
  body('perHourSalary').isFloat({ min: 0 }),
  validate,
  createEmployee
);

// Update employee (manager only)
router.put('/:id',
  requireManager,
  upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'idProof', maxCount: 1 }
  ]),
  updateEmployee
);

// Test Google Drive upload for employee (manager only)
router.post('/:id/drive-test',
  requireManager,
  testEmployeeDriveUpload
);

// Delete employee (manager only)
router.delete('/:id',
  requireManager,
  deleteEmployee
);

export default router;
