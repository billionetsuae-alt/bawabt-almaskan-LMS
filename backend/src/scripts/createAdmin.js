import bcrypt from 'bcryptjs';
import { appendToSheet, getSheetData, SHEETS, generateId } from '../services/googleSheets.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Create admin user
 * Email: admin@bawabtalmaskan.com
 * Password: admin
 * Role: manager
 */
async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...');

    // Check if admin already exists
    const users = await getSheetData(SHEETS.USERS);
    const existingAdmin = users.slice(1).find(
      row => row[1] === 'admin@bawabtalmaskan.com' && row[0] !== 'DELETED'
    );

    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log('Email: admin@bawabtalmaskan.com');
      console.log('Password: admin');
      console.log('Role: manager');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin', 10);

    // Create admin user
    const adminId = generateId('usr_');
    const now = new Date().toISOString();

    const adminRow = [
      adminId,
      'admin@bawabtalmaskan.com',
      hashedPassword,
      'Admin User',
      'manager',
      'TRUE', // active
      now, // createdAt
      '' // lastLogin
    ];

    await appendToSheet(SHEETS.USERS, [adminRow]);

    console.log('');
    console.log('✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: admin@bawabtalmaskan.com');
    console.log('🔑 Password: admin');
    console.log('👤 Role: Manager');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    console.log('');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

createAdminUser();
