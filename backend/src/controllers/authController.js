import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getSheetData, appendToSheet, updateSheet, generateId, SHEETS, findRowIndexById } from '../services/googleSheets.js';
import { logAudit } from '../services/audit.js';

/**
 * Login user
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Get users from sheet
    const users = await getSheetData(SHEETS.USERS);
    
    if (users.length <= 1) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Find user by email
    const userRow = users.slice(1).find(row => {
      return row[1] === email && (row[5] === 'TRUE' || row[5] === 'true' || row[5] === true);
    });
    
    if (!userRow) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userRow[2]);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    const userId = userRow[0];
    const rowIndex = users.findIndex(row => row[0] === userId) + 1;
    await updateSheet(SHEETS.USERS, `H${rowIndex}`, [[new Date().toISOString()]]);

    // Generate JWT
    const token = jwt.sign(
      {
        id: userId,
        email: userRow[1],
        name: userRow[3],
        role: userRow[4]
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logAudit(userId, userRow[3], 'LOGIN', 'user', userId);

    res.json({
      token,
      user: {
        id: userId,
        email: userRow[1],
        name: userRow[3],
        role: userRow[4]
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(req, res) {
  try {
    const users = await getSheetData(SHEETS.USERS);
    const userRow = users.slice(1).find(row => row[0] === req.user.id);
    
    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: userRow[0],
      email: userRow[1],
      name: userRow[3],
      role: userRow[4],
      active: userRow[5] === 'TRUE' || userRow[5] === 'true' || userRow[5] === true,
      lastLogin: userRow[7]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
}

/**
 * Change password
 */
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const users = await getSheetData(SHEETS.USERS);
    const userIndex = users.findIndex(row => row[0] === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRow = users[userIndex];
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, userRow[2]);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await updateSheet(SHEETS.USERS, `C${userIndex + 1}`, [[hashedPassword]]);

    await logAudit(userId, userRow[3], 'PASSWORD_CHANGE', 'user', userId);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
}

/**
 * Create default users (run once during setup)
 */
export async function createDefaultUsers() {
  try {
    const users = await getSheetData(SHEETS.USERS);
    
    if (users.length > 1) {
      console.log('Users already exist');
      return;
    }

    const defaultUsers = [
      {
        email: 'manager@company.com',
        password: 'manager123',
        name: 'Manager',
        role: 'manager'
      },
      {
        email: 'supervisor@company.com',
        password: 'supervisor123',
        name: 'Supervisor',
        role: 'supervisor'
      }
    ];

    for (const user of defaultUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const userRow = [
        generateId('user_'),
        user.email,
        hashedPassword,
        user.name,
        user.role,
        'true',
        new Date().toISOString(),
        ''
      ];
      
      await appendToSheet(SHEETS.USERS, [userRow]);
      console.log(`✅ Created ${user.role}: ${user.email}`);
    }

    console.log('✅ Default users created successfully');
  } catch (error) {
    console.error('Error creating default users:', error);
    throw error;
  }
}
