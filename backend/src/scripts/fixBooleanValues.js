import { getSheetData, updateSheet, SHEETS } from '../services/googleSheets.js';

/**
 * Fix boolean values in Google Sheets from TRUE to true
 */
async function fixBooleanValues() {
  try {
    console.log('🔧 Fixing boolean values in Google Sheets...\n');

    // Fix Users sheet
    console.log('Fixing Users sheet...');
    const users = await getSheetData(SHEETS.USERS);
    for (let i = 1; i < users.length; i++) {
      if (users[i][5] === 'TRUE' || users[i][5] === true) {
        await updateSheet(SHEETS.USERS, `F${i + 1}`, [['true']]);
        console.log(`  ✓ Fixed user row ${i + 1}`);
      }
    }

    // Fix Employees sheet
    console.log('\nFixing Employees sheet...');
    const employees = await getSheetData(SHEETS.EMPLOYEES);
    for (let i = 1; i < employees.length; i++) {
      if (employees[i][6] === 'TRUE' || employees[i][6] === true) {
        await updateSheet(SHEETS.EMPLOYEES, `G${i + 1}`, [['true']]);
        console.log(`  ✓ Fixed employee row ${i + 1}`);
      }
    }

    // Fix Sites sheet
    console.log('\nFixing Sites sheet...');
    const sites = await getSheetData(SHEETS.SITES);
    for (let i = 1; i < sites.length; i++) {
      if (sites[i][4] === 'TRUE' || sites[i][4] === true) {
        await updateSheet(SHEETS.SITES, `E${i + 1}`, [['true']]);
        console.log(`  ✓ Fixed site row ${i + 1}`);
      }
    }

    // Fix Attendance sheet (approved field)
    console.log('\nFixing Attendance sheet...');
    const attendance = await getSheetData(SHEETS.ATTENDANCE);
    for (let i = 1; i < attendance.length; i++) {
      if (attendance[i][8] === 'TRUE' || attendance[i][8] === true || attendance[i][8] === 'FALSE' || attendance[i][8] === false) {
        const value = (attendance[i][8] === 'TRUE' || attendance[i][8] === true) ? 'true' : 'false';
        await updateSheet(SHEETS.ATTENDANCE, `I${i + 1}`, [[value]]);
        console.log(`  ✓ Fixed attendance row ${i + 1}`);
      }
    }

    console.log('\n✅ All boolean values fixed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing boolean values:', error);
    process.exit(1);
  }
}

fixBooleanValues();
