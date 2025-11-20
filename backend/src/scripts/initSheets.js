import { initializeSheetHeaders } from '../services/googleSheets.js';
import { createDefaultUsers } from '../controllers/authController.js';

async function init() {
  try {
    console.log('🚀 Initializing Google Sheets...\n');

    // Initialize sheet headers
    console.log('📝 Setting up sheet headers...');
    await initializeSheetHeaders();

    // Create default users
    console.log('\n👤 Creating default users...');
    await createDefaultUsers();

    console.log('\n✅ Initialization complete!\n');
    console.log('Default credentials:');
    console.log('Manager: manager@company.com / manager123');
    console.log('Supervisor: supervisor@company.com / supervisor123');
    console.log('\n⚠️  Please change these passwords after first login!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
}

init();
