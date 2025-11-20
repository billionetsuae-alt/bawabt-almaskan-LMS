import { getSheetData, appendToSheet, updateSheet, generateId, SHEETS } from '../services/googleSheets.js';
import { logAudit } from '../services/audit.js';

/**
 * Get all sites
 */
export async function getAllSites(req, res) {
  try {
    const data = await getSheetData(SHEETS.SITES);
    
    if (data.length <= 1) {
      return res.json([]);
    }

    const sites = data.slice(1)
      .filter(row => row[0] !== 'DELETED')
      .map(row => ({
        id: row[0],
        siteNumber: row[1],
        siteName: row[2],
        location: row[3] || '',
        active: row[4] === 'TRUE' || row[4] === 'true' || row[4] === true,
        createdAt: row[5],
        updatedAt: row[6]
      }));

    res.json(sites);
  } catch (error) {
    console.error('Get sites error:', error);
    res.status(500).json({ error: 'Failed to fetch sites' });
  }
}

/**
 * Get single site
 */
export async function getSite(req, res) {
  try {
    const { id } = req.params;
    const data = await getSheetData(SHEETS.SITES);
    
    const siteRow = data.slice(1).find(row => row[0] === id && row[0] !== 'DELETED');
    
    if (!siteRow) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const site = {
      id: siteRow[0],
      siteNumber: siteRow[1],
      siteName: siteRow[2],
      location: siteRow[3] || '',
      active: siteRow[4] === 'TRUE' || siteRow[4] === 'true' || siteRow[4] === true,
      createdAt: siteRow[5],
      updatedAt: siteRow[6]
    };

    res.json(site);
  } catch (error) {
    console.error('Get site error:', error);
    res.status(500).json({ error: 'Failed to fetch site' });
  }
}

/**
 * Create new site
 */
export async function createSite(req, res) {
  try {
    const { siteNumber, siteName, location = '', active = true } = req.body;

    // Check if site number already exists
    const existing = await getSheetData(SHEETS.SITES);
    const duplicate = existing.slice(1).find(
      row => row[1] === siteNumber && row[0] !== 'DELETED'
    );

    if (duplicate) {
      return res.status(400).json({ error: 'Site number already exists' });
    }

    const siteId = generateId('site_');
    const now = new Date().toISOString();

    const siteRow = [
      siteId,
      siteNumber,
      siteName,
      location,
      active.toString(),
      now,
      now
    ];

    await appendToSheet(SHEETS.SITES, [siteRow]);

    await logAudit(
      req.user.id,
      req.user.name,
      'CREATE',
      'site',
      siteId,
      { siteNumber, siteName }
    );

    res.status(201).json({
      id: siteId,
      siteNumber,
      siteName,
      location,
      active,
      createdAt: now,
      updatedAt: now
    });
  } catch (error) {
    console.error('Create site error:', error);
    res.status(500).json({ error: 'Failed to create site' });
  }
}

/**
 * Update site
 */
export async function updateSite(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const data = await getSheetData(SHEETS.SITES);
    const rowIndex = data.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const currentRow = data[rowIndex];
    const now = new Date().toISOString();

    // Check if site number is being changed to an existing one
    if (updates.siteNumber && updates.siteNumber !== currentRow[1]) {
      const duplicate = data.slice(1).find(
        row => row[1] === updates.siteNumber && row[0] !== id && row[0] !== 'DELETED'
      );
      if (duplicate) {
        return res.status(400).json({ error: 'Site number already exists' });
      }
    }

    const updatedRow = [
      id,
      updates.siteNumber !== undefined ? updates.siteNumber : currentRow[1],
      updates.siteName !== undefined ? updates.siteName : currentRow[2],
      updates.location !== undefined ? updates.location : currentRow[3],
      updates.active !== undefined ? updates.active.toString() : currentRow[4],
      currentRow[5], // createdAt
      now // updatedAt
    ];

    await updateSheet(SHEETS.SITES, `A${rowIndex + 1}:G${rowIndex + 1}`, [updatedRow]);

    await logAudit(
      req.user.id,
      req.user.name,
      'UPDATE',
      'site',
      id,
      updates
    );

    res.json({
      id: updatedRow[0],
      siteNumber: updatedRow[1],
      siteName: updatedRow[2],
      location: updatedRow[3],
      active: updatedRow[4] === 'TRUE' || updatedRow[4] === 'true' || updatedRow[4] === true,
      createdAt: updatedRow[5],
      updatedAt: updatedRow[6]
    });
  } catch (error) {
    console.error('Update site error:', error);
    res.status(500).json({ error: 'Failed to update site' });
  }
}

/**
 * Delete site (soft delete)
 */
export async function deleteSite(req, res) {
  try {
    const { id } = req.params;

    const data = await getSheetData(SHEETS.SITES);
    const rowIndex = data.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const siteNumber = data[rowIndex][1];

    await updateSheet(SHEETS.SITES, `A${rowIndex + 1}`, [['DELETED']]);

    await logAudit(
      req.user.id,
      req.user.name,
      'DELETE',
      'site',
      id,
      { siteNumber }
    );

    res.json({ message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Delete site error:', error);
    res.status(500).json({ error: 'Failed to delete site' });
  }
}
