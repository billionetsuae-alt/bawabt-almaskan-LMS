import { getSheetData, appendToSheet, updateSheet, generateId, SHEETS } from '../services/googleSheets.js';
import { logAudit } from '../services/audit.js';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Get attendance records
 */
export async function getAttendance(req, res) {
  try {
    const { startDate, endDate, employeeId, status, siteId } = req.query;
    
    const data = await getSheetData(SHEETS.ATTENDANCE);
    
    if (data.length <= 1) {
      return res.json([]);
    }

    let attendance = data.slice(1)
      .filter(row => row[0] !== 'DELETED')
      .map(row => ({
        id: row[0],
        employeeId: row[1],
        date: row[2],
        status: row[3],
        otHours: parseFloat(row[4]) || 0,
        siteId: row[5] || null,
        notes: row[6] || '',
        markedBy: row[7],
        approvedBy: row[8] || null,
        approved: row[9] === 'TRUE' || row[9] === 'true' || row[9] === true,
        markedAt: row[10],
        lastEditedAt: row[11] || null,
        approvedAt: row[12] || null
      }));

    // Apply filters
    if (startDate) {
      attendance = attendance.filter(a => a.date >= startDate);
    }
    if (endDate) {
      attendance = attendance.filter(a => a.date <= endDate);
    }
    if (employeeId) {
      attendance = attendance.filter(a => a.employeeId === employeeId);
    }
    if (status) {
      attendance = attendance.filter(a => a.status === status);
    }
    if (siteId) {
      attendance = attendance.filter(a => a.siteId === siteId);
    }

    res.json(attendance);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
}

/**
 * Mark attendance
 */
export async function markAttendance(req, res) {
  try {
    const { employeeId, date, status, otHours = 0, siteId, notes = '' } = req.body;

    // Check if attendance already exists for this employee on this date
    const existing = await getSheetData(SHEETS.ATTENDANCE);
    const duplicate = existing.slice(1).find(
      row => row[1] === employeeId && row[2] === date && row[0] !== 'DELETED'
    );

    if (duplicate) {
      return res.status(400).json({ error: 'Attendance already marked for this date' });
    }

    const attendanceId = generateId('att_');
    const now = new Date().toISOString();

    const attendanceRow = [
      attendanceId,
      employeeId,
      date,
      status,
      otHours,
      siteId || '',
      notes,
      req.user.id,
      '', // approvedBy
      'false', // approved
      now, // markedAt
      '', // lastEditedAt
      '' // approvedAt
    ];

    await appendToSheet(SHEETS.ATTENDANCE, [attendanceRow]);

    await logAudit(
      req.user.id,
      req.user.name,
      'MARK_ATTENDANCE',
      'attendance',
      attendanceId,
      { employeeId, date, status }
    );

    res.status(201).json({
      id: attendanceId,
      employeeId,
      date,
      status,
      otHours: parseFloat(otHours),
      siteId,
      notes,
      markedBy: req.user.id,
      approvedBy: null,
      approved: false,
      markedAt: now,
      lastEditedAt: null,
      approvedAt: null
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
}

/**
 * Bulk mark attendance
 */
export async function bulkMarkAttendance(req, res) {
  try {
    const { date, records } = req.body; // records: [{ employeeId, status, otHours, siteId, notes }]

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'No records provided' });
    }

    const existing = await getSheetData(SHEETS.ATTENDANCE);
    const now = new Date().toISOString();
    const created = [];

    for (const record of records) {
      // Check duplicate
      const duplicate = existing.slice(1).find(
        row => row[1] === record.employeeId && row[2] === date && row[0] !== 'DELETED'
      );

      if (duplicate) continue; // Skip duplicates

      const attendanceId = generateId('att_');
      const attendanceRow = [
        attendanceId,
        record.employeeId,
        date,
        record.status,
        record.otHours || 0,
        record.siteId || '',
        record.notes || '',
        req.user.id,
        '',
        'false',
        now,
        '',
        ''
      ];

      await appendToSheet(SHEETS.ATTENDANCE, [attendanceRow]);
      created.push({
        id: attendanceId,
        employeeId: record.employeeId,
        date,
        status: record.status,
        otHours: parseFloat(record.otHours) || 0,
        siteId: record.siteId,
        notes: record.notes || '',
        markedBy: req.user.id,
        approved: false,
        markedAt: now
      });
    }

    await logAudit(
      req.user.id,
      req.user.name,
      'BULK_MARK_ATTENDANCE',
      'attendance',
      'bulk',
      { date, count: created.length }
    );

    res.status(201).json({ created, count: created.length });
  } catch (error) {
    console.error('Bulk mark attendance error:', error);
    res.status(500).json({ error: 'Failed to bulk mark attendance' });
  }
}

/**
 * Update attendance
 */
export async function updateAttendance(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const data = await getSheetData(SHEETS.ATTENDANCE);
    const rowIndex = data.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Attendance not found' });
    }

    const currentRow = data[rowIndex];
    
    // Check if supervisor is trying to edit approved attendance
    const isApproved = currentRow[9] === 'TRUE' || currentRow[9] === 'true' || currentRow[9] === true;
    if (req.user.role === 'supervisor' && isApproved) {
      return res.status(403).json({ error: 'Cannot edit approved attendance' });
    }

    const now = new Date().toISOString();

    const updatedRow = [
      id,
      currentRow[1], // employeeId
      currentRow[2], // date
      updates.status !== undefined ? updates.status : currentRow[3],
      updates.otHours !== undefined ? updates.otHours : currentRow[4],
      updates.siteId !== undefined ? (updates.siteId || '') : currentRow[5],
      updates.notes !== undefined ? updates.notes : currentRow[6],
      currentRow[7], // markedBy
      currentRow[8], // approvedBy
      currentRow[9], // approved
      currentRow[10], // markedAt
      now, // lastEditedAt
      currentRow[12] // approvedAt
    ];

    await updateSheet(SHEETS.ATTENDANCE, `A${rowIndex + 1}:M${rowIndex + 1}`, [updatedRow]);

    await logAudit(
      req.user.id,
      req.user.name,
      'UPDATE',
      'attendance',
      id,
      updates
    );

    res.json({
      id: updatedRow[0],
      employeeId: updatedRow[1],
      date: updatedRow[2],
      status: updatedRow[3],
      otHours: parseFloat(updatedRow[4]),
      siteId: updatedRow[5] || null,
      notes: updatedRow[6],
      markedBy: updatedRow[7],
      approvedBy: updatedRow[8] || null,
      approved: updatedRow[9] === 'TRUE' || updatedRow[9] === 'true' || updatedRow[9] === true,
      markedAt: updatedRow[10],
      lastEditedAt: updatedRow[11],
      approvedAt: updatedRow[12] || null
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
}

/**
 * Approve attendance (Manager only)
 */
export async function approveAttendance(req, res) {
  try {
    const { id } = req.params;

    const data = await getSheetData(SHEETS.ATTENDANCE);
    const rowIndex = data.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Attendance not found' });
    }

    const currentRow = data[rowIndex];
    const now = new Date().toISOString();

    const updatedRow = [...currentRow];
    updatedRow[8] = req.user.id; // approvedBy
    updatedRow[9] = 'true'; // approved
    updatedRow[12] = now; // approvedAt

    await updateSheet(SHEETS.ATTENDANCE, `A${rowIndex + 1}:M${rowIndex + 1}`, [updatedRow]);

    await logAudit(
      req.user.id,
      req.user.name,
      'APPROVE',
      'attendance',
      id,
      { date: currentRow[2], employeeId: currentRow[1] }
    );

    res.json({ message: 'Attendance approved successfully' });
  } catch (error) {
    console.error('Approve attendance error:', error);
    res.status(500).json({ error: 'Failed to approve attendance' });
  }
}

/**
 * Delete attendance
 */
export async function deleteAttendance(req, res) {
  try {
    const { id } = req.params;

    const data = await getSheetData(SHEETS.ATTENDANCE);
    const rowIndex = data.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Attendance not found' });
    }

    const currentRow = data[rowIndex];
    
    // Only manager can delete approved attendance
    const isApproved = currentRow[9] === 'TRUE' || currentRow[9] === 'true' || currentRow[9] === true;
    if (isApproved && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Cannot delete approved attendance' });
    }

    await updateSheet(SHEETS.ATTENDANCE, `A${rowIndex + 1}`, [['DELETED']]);

    await logAudit(
      req.user.id,
      req.user.name,
      'DELETE',
      'attendance',
      id,
      { date: currentRow[2], employeeId: currentRow[1] }
    );

    res.json({ message: 'Attendance deleted successfully' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ error: 'Failed to delete attendance' });
  }
}
