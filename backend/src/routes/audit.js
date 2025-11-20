import express from 'express';
import { getAuditLogs } from '../services/audit.js';
import { authenticate, requireManager } from '../middleware/auth.js';

const router = express.Router();

// Get audit logs (manager only)
router.get('/',
  authenticate,
  requireManager,
  async (req, res) => {
    try {
      const filters = {
        userId: req.query.userId,
        entity: req.query.entity,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const logs = await getAuditLogs(filters);
      res.json(logs);
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }
);

export default router;
