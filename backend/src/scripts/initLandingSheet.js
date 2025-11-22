import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const LANDING_SHEET_ID = '1r9iso6G71dOe-RVuLLIl-T2IZBm_FstxB0xiEsdTH0Y';
const FORM_SHEET_NAME = 'Form Data';

async function initializeLandingSheet() {
  try {
    console.log('🔧 Initializing Landing Page Form Sheet...');

    // Initialize Google Sheets client
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Define headers for Form Data sheet
    const headers = [
      'Timestamp',
      'Full Name',
      'Company Email',
      'Company Name',
      'Contact Number',
      'Status',
      'Notes'
    ];

    // Update the sheet with headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: LANDING_SHEET_ID,
      range: `${FORM_SHEET_NAME}!A1:G1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [headers],
      },
    });

    console.log('✅ Landing Page Form sheet headers initialized successfully!');
    console.log('');
    console.log('Sheet Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📄 Sheet Name: ${FORM_SHEET_NAME}`);
    console.log(`🔗 Sheet ID: ${LANDING_SHEET_ID}`);
    console.log('📊 Headers:', headers.join(', '));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('✅ Ready to receive form submissions!');
    console.log('');

  } catch (error) {
    console.error('❌ Error initializing sheet:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

initializeLandingSheet();
