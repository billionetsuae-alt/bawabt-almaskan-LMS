import express from 'express';
import { calculateMonthlyPayroll, getPayrollSummary } from '../controllers/payrollController.js';
import { authenticate, requireManager } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and manager role
router.use(authenticate, requireManager);

// Calculate monthly payroll
router.get('/:year/:month', calculateMonthlyPayroll);

// Get payroll summary
router.get('/summary', getPayrollSummary);

export default router;
