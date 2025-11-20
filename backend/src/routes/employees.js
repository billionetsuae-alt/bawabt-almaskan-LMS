import express from 'express';
import { body } from 'express-validator';
import {
  getAllEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee
} from '../controllers/employeeController.js';
import { authenticate, requireManager } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all employees (both manager and supervisor)
router.get('/', getAllEmployees);

// Get single employee
router.get('/:id', getEmployee);

// Create employee (manager only)
router.post('/',
  requireManager,
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
  updateEmployee
);

// Delete employee (manager only)
router.delete('/:id',
  requireManager,
  deleteEmployee
);

export default router;
