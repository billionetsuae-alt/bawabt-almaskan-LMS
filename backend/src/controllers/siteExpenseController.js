import { getSheetData, appendToSheet, generateId, SHEETS } from '../services/googleSheets.js';
import { logAudit } from '../services/audit.js';

export async function getSiteExpenses(req, res) {
  try {
    const { siteId } = req.query;

    const data = await getSheetData(SHEETS.SITE_EXPENSES);

    if (data.length <= 1) {
      return res.json([]);
    }

    let expenses = data.slice(1)
      .filter(row => row[0] !== 'DELETED')
      .map(row => ({
        id: row[0],
        siteId: row[1],
        siteNumber: row[2],
        amount: parseFloat(row[3]) || 0,
        date: row[4],
        category: row[5] || '',
        notes: row[6] || '',
        createdBy: row[7] || null,
        createdAt: row[8] || null,
      }));

    if (siteId) {
      expenses = expenses.filter(e => e.siteId === siteId);
    }

    res.json(expenses);
  } catch (error) {
    console.error('Get site expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch site expenses' });
  }
}

export async function createSiteExpense(req, res) {
  try {
    const { siteId, siteNumber, amount, date, category = '', notes = '' } = req.body;

    const expenseId = generateId('sexp_');
    const now = new Date().toISOString();

    const expenseRow = [
      expenseId,
      siteId,
      siteNumber,
      amount,
      date,
      category,
      notes,
      req.user.id,
      now,
    ];

    await appendToSheet(SHEETS.SITE_EXPENSES, [expenseRow]);

    await logAudit(
      req.user.id,
      req.user.name,
      'CREATE',
      'site_expense',
      expenseId,
      { siteId, siteNumber, amount, date }
    );

    res.status(201).json({
      id: expenseId,
      siteId,
      siteNumber,
      amount: parseFloat(amount) || 0,
      date,
      category,
      notes,
      createdBy: req.user.id,
      createdAt: now,
    });
  } catch (error) {
    console.error('Create site expense error:', error);
    res.status(500).json({ error: 'Failed to create site expense' });
  }
}
