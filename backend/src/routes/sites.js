import express from 'express';
import { body } from 'express-validator';
import {
  getAllSites,
  getSite,
  createSite,
  updateSite,
  deleteSite
} from '../controllers/siteController.js';
import { authenticate, requireManager } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all sites (both manager and supervisor)
router.get('/', getAllSites);

// Get single site
router.get('/:id', getSite);

// Create site (manager only)
router.post('/',
  requireManager,
  body('siteNumber').notEmpty().trim(),
  body('siteName').notEmpty().trim(),
  validate,
  createSite
);

// Update site (manager only)
router.put('/:id',
  requireManager,
  updateSite
);

// Delete site (manager only)
router.delete('/:id',
  requireManager,
  deleteSite
);

export default router;
