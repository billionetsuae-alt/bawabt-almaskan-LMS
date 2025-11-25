import express from 'express';
import { body } from 'express-validator';
import { getSiteExpenses, createSiteExpense } from '../controllers/siteExpenseController.js';
import { authenticate, requireManager } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getSiteExpenses);

router.post('/',
  requireManager,
  body('siteId').notEmpty().trim(),
  body('siteNumber').notEmpty().trim(),
  body('amount').isFloat({ min: 0 }),
  body('date').isDate(),
  body('category').optional().trim(),
  body('notes').optional().trim(),
  validate,
  createSiteExpense
);

export default router;
