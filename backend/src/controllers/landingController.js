import { appendToSheet } from '../services/googleSheets.js';

const LANDING_SHEET_ID = '1r9iso6G71dOe-RVuLLIl-T2IZBm_FstxB0xiEsdTH0Y';
const FORM_SHEET_NAME = 'Form Data';

/**
 * Submit landing page form
 */
export async function submitLandingForm(req, res) {
  try {
    const { fullName, email, companyName, contactNumber } = req.body;

    // Validate required fields
    if (!fullName || !email || !companyName || !contactNumber) {
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }

    // Create row data
    const timestamp = new Date().toISOString();
    const rowData = [
      timestamp,           // Timestamp
      fullName,           // Full Name
      email,              // Company Email
      companyName,        // Company Name
      contactNumber,      // Contact Number
      'Pending',          // Status
      ''                  // Notes (empty for now)
    ];

    // Append to Google Sheets
    await appendToSheet(FORM_SHEET_NAME, [rowData], LANDING_SHEET_ID);

    res.json({ 
      success: true,
      message: 'Thank you! We will contact you soon.' 
    });

  } catch (error) {
    console.error('Landing form submission error:', error);
    res.status(500).json({ 
      error: 'Failed to submit form. Please try again.' 
    });
  }
}
