import { google } from 'googleapis';
import { getAuth } from './googleSheets.js';

export async function getDriveUsage() {
  const auth = await getAuth();
  const drive = google.drive({ version: 'v3', auth });

  const response = await drive.about.get({
    fields: 'user, storageQuota'
  });

  const { user, storageQuota } = response.data;

  return {
    user,
    storageQuota
  };
}

export default {
  getDriveUsage
};
