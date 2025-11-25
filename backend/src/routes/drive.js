import express from 'express';
import { authenticate, requireManager } from '../middleware/auth.js';
import { getDriveUsageInfo } from '../controllers/driveController.js';

const router = express.Router();

router.use(authenticate);

router.get('/usage', requireManager, getDriveUsageInfo);

export default router;
