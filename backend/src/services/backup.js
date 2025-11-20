import { google } from 'googleapis';
import { getAuth, SPREADSHEET_ID } from './googleSheets.js';
import { format } from 'date-fns';

const BACKUP_FOLDER_NAME = 'Labour_Management_Backups';

/**
 * Get or create backup folder in Google Drive
 */
async function getBackupFolder() {
  const auth = await getAuth();
  const drive = google.drive({ version: 'v3', auth });

  // Search for existing backup folder
  const response = await drive.files.list({
    q: `name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  if (response.data.files.length > 0) {
    return response.data.files[0].id;
  }

  // Create folder if it doesn't exist
  const folder = await drive.files.create({
    requestBody: {
      name: BACKUP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder'
    },
    fields: 'id'
  });

  return folder.data.id;
}

/**
 * Create a backup of the spreadsheet
 */
export async function createBackup() {
  try {
    const auth = await getAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });
    
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const backupName = `Backup_${timestamp}`;

    // Method 1: Simple copy without folder (stores in root of spreadsheet owner's Drive)
    // This way the backup is owned by the spreadsheet owner, not service account
    const backup = await drive.files.copy({
      fileId: SPREADSHEET_ID,
      requestBody: {
        name: backupName
        // No parents = goes to spreadsheet owner's "My Drive" root
      },
      fields: 'id, name, createdTime, size, webViewLink'
    });

    return {
      success: true,
      backup: {
        id: backup.data.id,
        name: backup.data.name,
        createdAt: backup.data.createdTime,
        size: backup.data.size,
        link: backup.data.webViewLink
      }
    };
  } catch (error) {
    console.error('Backup creation error:', error);
    throw new Error('Failed to create backup: ' + error.message);
  }
}

/**
 * List all backups
 */
export async function listBackups(limit = 20) {
  try {
    const auth = await getAuth();
    const drive = google.drive({ version: 'v3', auth });
    
    const folderId = await getBackupFolder();

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, createdTime, size, webViewLink, modifiedTime)',
      orderBy: 'createdTime desc',
      pageSize: limit
    });

    return {
      success: true,
      backups: response.data.files.map(file => ({
        id: file.id,
        name: file.name,
        createdAt: file.createdTime,
        modifiedAt: file.modifiedTime,
        size: file.size,
        link: file.webViewLink
      })),
      count: response.data.files.length
    };
  } catch (error) {
    console.error('List backups error:', error);
    throw new Error('Failed to list backups: ' + error.message);
  }
}

/**
 * Delete a backup
 */
export async function deleteBackup(backupId) {
  try {
    const auth = await getAuth();
    const drive = google.drive({ version: 'v3', auth });

    await drive.files.delete({
      fileId: backupId
    });

    return { success: true, message: 'Backup deleted successfully' };
  } catch (error) {
    console.error('Delete backup error:', error);
    throw new Error('Failed to delete backup: ' + error.message);
  }
}

/**
 * Restore from backup (overwrites current data)
 */
export async function restoreBackup(backupId) {
  try {
    const auth = await getAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    // Get backup file
    const backupFile = await drive.files.get({
      fileId: backupId,
      fields: 'id, name, mimeType'
    });

    if (!backupFile.data.mimeType.includes('spreadsheet')) {
      throw new Error('Invalid backup file type');
    }

    // Clear current spreadsheet data (all sheets)
    const currentSpreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID
    });

    const sheetNames = currentSpreadsheet.data.sheets.map(s => s.properties.title);

    // Copy data from backup to current spreadsheet
    for (const sheetName of sheetNames) {
      try {
        // Get backup sheet data
        const backupData = await sheets.spreadsheets.values.get({
          spreadsheetId: backupId,
          range: `${sheetName}!A:Z`
        });

        // Clear current sheet
        await sheets.spreadsheets.values.clear({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheetName}!A:Z`
        });

        // Write backup data to current sheet
        if (backupData.data.values && backupData.data.values.length > 0) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetName}!A1`,
            valueInputOption: 'RAW',
            requestBody: {
              values: backupData.data.values
            }
          });
        }
      } catch (error) {
        console.error(`Error restoring sheet ${sheetName}:`, error);
      }
    }

    return {
      success: true,
      message: 'Data restored successfully from backup',
      backup: {
        id: backupFile.data.id,
        name: backupFile.data.name
      }
    };
  } catch (error) {
    console.error('Restore backup error:', error);
    throw new Error('Failed to restore backup: ' + error.message);
  }
}

/**
 * Get backup details
 */
export async function getBackupDetails(backupId) {
  try {
    const auth = await getAuth();
    const drive = google.drive({ version: 'v3', auth });

    const file = await drive.files.get({
      fileId: backupId,
      fields: 'id, name, createdTime, modifiedTime, size, webViewLink, owners'
    });

    return {
      success: true,
      backup: {
        id: file.data.id,
        name: file.data.name,
        createdAt: file.data.createdTime,
        modifiedAt: file.data.modifiedTime,
        size: file.data.size,
        link: file.data.webViewLink,
        owner: file.data.owners?.[0]?.emailAddress
      }
    };
  } catch (error) {
    console.error('Get backup details error:', error);
    throw new Error('Failed to get backup details: ' + error.message);
  }
}

/**
 * Auto-cleanup old backups (keep last N backups)
 */
export async function cleanupOldBackups(keepCount = 30) {
  try {
    const { backups } = await listBackups(100);
    
    if (backups.length <= keepCount) {
      return {
        success: true,
        message: 'No old backups to clean up',
        deleted: 0
      };
    }

    const backupsToDelete = backups.slice(keepCount);
    let deletedCount = 0;

    for (const backup of backupsToDelete) {
      try {
        await deleteBackup(backup.id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete backup ${backup.id}:`, error);
      }
    }

    return {
      success: true,
      message: `Cleaned up ${deletedCount} old backups`,
      deleted: deletedCount
    };
  } catch (error) {
    console.error('Cleanup old backups error:', error);
    throw new Error('Failed to cleanup old backups: ' + error.message);
  }
}
