import express from 'express';
import { body } from 'express-validator';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import { authenticate, requireManager } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// All routes require authentication and manager role
router.use(authenticate);
router.use(requireManager);

// Get all users
router.get('/', getAllUsers);

// Create user
router.post('/',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim(),
  body('role').isIn(['manager', 'supervisor']),
  validate,
  createUser
);

// Update user
router.put('/:id',
  body('email').optional().isEmail(),
  body('password').optional().isLength({ min: 6 }),
  body('name').optional().notEmpty().trim(),
  body('role').optional().isIn(['manager', 'supervisor']),
  validate,
  updateUser
);

// Delete user
router.delete('/:id', deleteUser);

export default router;
