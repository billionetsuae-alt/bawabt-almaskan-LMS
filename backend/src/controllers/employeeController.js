import { getSheetData, appendToSheet, updateSheet, generateId, SHEETS, findRowIndexById } from '../services/googleSheets.js';
import { logAudit } from '../services/audit.js';

/**
 * Get all employees
 */
export async function getAllEmployees(req, res) {
  try {
    const data = await getSheetData(SHEETS.EMPLOYEES);
    
    if (data.length <= 1) {
      return res.json([]);
    }

    const headers = data[0];
    const employees = data.slice(1)
      .filter(row => row[0] !== 'DELETED')
      .map(row => ({
        id: row[0],
        name: row[1],
        profession: row[2],
        perDaySalary: parseFloat(row[3]) || 0,
        perHourSalary: parseFloat(row[4]) || 0,
        siteId: row[5] || null,
        active: row[6] === 'TRUE' || row[6] === 'true' || row[6] === true,
        joiningDate: row[7] || null,
        notes: row[8] || '',
        createdAt: row[9],
        updatedAt: row[10]
      }));

    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
}

/**
 * Get single employee
 */
export async function getEmployee(req, res) {
  try {
    const { id } = req.params;
    const data = await getSheetData(SHEETS.EMPLOYEES);
    
    const employeeRow = data.slice(1).find(row => row[0] === id && row[0] !== 'DELETED');
    
    if (!employeeRow) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employee = {
      id: employeeRow[0],
      name: employeeRow[1],
      profession: employeeRow[2],
      perDaySalary: parseFloat(employeeRow[3]) || 0,
      perHourSalary: parseFloat(employeeRow[4]) || 0,
      siteId: employeeRow[5] || null,
      active: employeeRow[6] === 'TRUE' || employeeRow[6] === 'true' || employeeRow[6] === true,
      joiningDate: employeeRow[7] || null,
      notes: employeeRow[8] || '',
      createdAt: employeeRow[9],
      updatedAt: employeeRow[10]
    };

    res.json(employee);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
}

/**
 * Create new employee
 */
export async function createEmployee(req, res) {
  try {
    const {
      name,
      profession,
      perDaySalary,
      perHourSalary,
      siteId = null,
      active = true,
      joiningDate = null,
      notes = ''
    } = req.body;

    const employeeId = generateId('emp_');
    const now = new Date().toISOString();

    const employeeRow = [
      employeeId,
      name,
      profession,
      perDaySalary,
      perHourSalary,
      siteId || '',
      active.toString(),
      joiningDate || '',
      notes,
      now,
      now
    ];

    await appendToSheet(SHEETS.EMPLOYEES, [employeeRow]);
    
    await logAudit(
      req.user.id,
      req.user.name,
      'CREATE',
      'employee',
      employeeId,
      { name, profession }
    );

    res.status(201).json({
      id: employeeId,
      name,
      profession,
      perDaySalary: parseFloat(perDaySalary),
      perHourSalary: parseFloat(perHourSalary),
      siteId,
      active,
      joiningDate,
      notes,
      createdAt: now,
      updatedAt: now
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
}

/**
 * Update employee
 */
export async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const data = await getSheetData(SHEETS.EMPLOYEES);
    const rowIndex = data.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const currentRow = data[rowIndex];
    const now = new Date().toISOString();

    // Update fields
    const updatedRow = [
      id,
      updates.name !== undefined ? updates.name : currentRow[1],
      updates.profession !== undefined ? updates.profession : currentRow[2],
      updates.perDaySalary !== undefined ? updates.perDaySalary : currentRow[3],
      updates.perHourSalary !== undefined ? updates.perHourSalary : currentRow[4],
      updates.siteId !== undefined ? (updates.siteId || '') : currentRow[5],
      updates.active !== undefined ? updates.active.toString() : currentRow[6],
      updates.joiningDate !== undefined ? (updates.joiningDate || '') : currentRow[7],
      updates.notes !== undefined ? updates.notes : currentRow[8],
      currentRow[9], // createdAt
      now // updatedAt
    ];

    await updateSheet(SHEETS.EMPLOYEES, `A${rowIndex + 1}:K${rowIndex + 1}`, [updatedRow]);

    await logAudit(
      req.user.id,
      req.user.name,
      'UPDATE',
      'employee',
      id,
      updates
    );

    res.json({
      id: updatedRow[0],
      name: updatedRow[1],
      profession: updatedRow[2],
      perDaySalary: parseFloat(updatedRow[3]),
      perHourSalary: parseFloat(updatedRow[4]),
      siteId: updatedRow[5] || null,
      active: updatedRow[6] === 'TRUE' || updatedRow[6] === 'true' || updatedRow[6] === true,
      joiningDate: updatedRow[7] || null,
      notes: updatedRow[8],
      createdAt: updatedRow[9],
      updatedAt: updatedRow[10]
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
}

/**
 * Delete employee (soft delete)
 */
export async function deleteEmployee(req, res) {
  try {
    const { id } = req.params;

    const data = await getSheetData(SHEETS.EMPLOYEES);
    const rowIndex = data.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employeeName = data[rowIndex][1];

    // Soft delete by marking first column as DELETED
    await updateSheet(SHEETS.EMPLOYEES, `A${rowIndex + 1}`, [['DELETED']]);

    await logAudit(
      req.user.id,
      req.user.name,
      'DELETE',
      'employee',
      id,
      { name: employeeName }
    );

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
}
