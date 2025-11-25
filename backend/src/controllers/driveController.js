import { getDriveUsage } from '../services/driveAdmin.js';

export async function getDriveUsageInfo(req, res) {
  try {
    const info = await getDriveUsage();

    res.json({
      success: true,
      userEmail: info.user?.emailAddress,
      storageQuota: info.storageQuota
    });
  } catch (error) {
    console.error('Get Drive usage error:', error);
    res.status(500).json({
      error: 'Failed to fetch Drive usage information',
      details: error.message
    });
  }
}
