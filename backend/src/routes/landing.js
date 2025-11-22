import express from 'express';
import { submitLandingForm } from '../controllers/landingController.js';

const router = express.Router();

/**
 * @route   POST /api/landing/submit
 * @desc    Submit landing page form
 * @access  Public
 */
router.post('/submit', submitLandingForm);

export default router;
