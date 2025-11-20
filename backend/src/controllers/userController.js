import bcrypt from 'bcryptjs';
import { getSheetData, appendToSheet, updateSheet, generateId, SHEETS, findRowIndexById } from '../services/googleSheets.js';
import { logAudit } from '../services/audit.js';

/**
 * Get all users
 */
export async function getAllUsers(req, res) {
  try {
    const data = await getSheetData(SHEETS.USERS);
    
    if (data.length <= 1) {
      return res.json([]);
    }

    const users = data.slice(1)
      .filter(row => row[0] !== 'DELETED')
      .map(row => ({
        id: row[0],
        email: row[1],
        name: row[3],
        role: row[4],
        active: row[5] === 'TRUE' || row[5] === 'true' || row[5] === true,
        createdAt: row[6],
        lastLogin: row[7]
      }));

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

/**
 * Create new user (Manager only)
 */
export async function createUser(req, res) {
  try {
    const { email, password, name, role } = req.body;

    // Check if email already exists
    const users = await getSheetData(SHEETS.USERS);
    const existingUser = users.slice(1).find(row => row[1] === email);
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user row
    const userId = generateId('user_');
    const userRow = [
      userId,
      email,
      hashedPassword,
      name,
      role || 'supervisor',
      'true',
      new Date().toISOString(),
      ''
    ];
    
    await appendToSheet(SHEETS.USERS, [userRow]);
    
    await logAudit(
      req.user.id,
      req.user.name,
      'CREATE',
      'user',
      userId,
      { email, name, role }
    );

    res.status(201).json({
      id: userId,
      email,
      name,
      role: role || 'supervisor',
      active: true,
      createdAt: userRow[6],
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

/**
 * Update user (Manager only)
 */
export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { email, password, name, role } = req.body;

    const users = await getSheetData(SHEETS.USERS);
    const userIndex = findRowIndexById(users, id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRow = users[userIndex];
    const updates = {};

    // Update email if changed
    if (email && email !== userRow[1]) {
      // Check if new email already exists
      const existingUser = users.slice(1).find((row, idx) => 
        idx + 1 !== userIndex && row[1] === email
      );
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      await updateSheet(SHEETS.USERS, `B${userIndex + 1}`, [[email]]);
      updates.email = email;
    }

    // Update password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await updateSheet(SHEETS.USERS, `C${userIndex + 1}`, [[hashedPassword]]);
      updates.password = 'changed';
    }

    // Update name
    if (name && name !== userRow[3]) {
      await updateSheet(SHEETS.USERS, `D${userIndex + 1}`, [[name]]);
      updates.name = name;
    }

    // Update role
    if (role && role !== userRow[4]) {
      await updateSheet(SHEETS.USERS, `E${userIndex + 1}`, [[role]]);
      updates.role = role;
    }

    await logAudit(
      req.user.id,
      req.user.name,
      'UPDATE',
      'user',
      id,
      updates
    );

    // Get updated user data
    const updatedUsers = await getSheetData(SHEETS.USERS);
    const updatedRow = updatedUsers[userIndex];

    res.json({
      id: updatedRow[0],
      email: updatedRow[1],
      name: updatedRow[3],
      role: updatedRow[4],
      active: updatedRow[5] === 'TRUE' || updatedRow[5] === 'true' || updatedRow[5] === true,
      createdAt: updatedRow[6],
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

/**
 * Delete user (Manager only) - soft delete
 */
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    const users = await getSheetData(SHEETS.USERS);
    const userIndex = findRowIndexById(users, id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRow = users[userIndex];

    // Prevent deleting managers
    if (userRow[4] === 'manager') {
      return res.status(403).json({ error: 'Cannot delete manager accounts' });
    }

    // Mark as deleted
    await updateSheet(SHEETS.USERS, `A${userIndex + 1}`, [['DELETED']]);

    await logAudit(
      req.user.id,
      req.user.name,
      'DELETE',
      'user',
      id,
      { email: userRow[1], name: userRow[3] }
    );

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}
