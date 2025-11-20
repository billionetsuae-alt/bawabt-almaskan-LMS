import { getSheetData, SHEETS } from '../services/googleSheets.js';
import { logAudit } from '../services/audit.js';
import { format, getDaysInMonth } from 'date-fns';

/**
 * Calculate monthly payroll
 */
export async function calculateMonthlyPayroll(req, res) {
  try {
    const { month, year } = req.params;
    
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (monthNum < 1 || monthNum > 12 || yearNum < 2000) {
      return res.status(400).json({ error: 'Invalid month or year' });
    }

    // Get employees
    const employeesData = await getSheetData(SHEETS.EMPLOYEES);
    const employees = employeesData.slice(1)
      .filter(row => row[0] !== 'DELETED')
      .map(row => ({
        id: row[0],
        name: row[1],
        profession: row[2],
        perDaySalary: parseFloat(row[3]) || 0,
        perHourSalary: parseFloat(row[4]) || 0,
        active: row[6] === 'TRUE' || row[6] === 'true' || row[6] === true
      }));

    // Get attendance for the month
    const attendanceData = await getSheetData(SHEETS.ATTENDANCE);
    const startDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
    const endDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-${getDaysInMonth(new Date(yearNum, monthNum - 1))}`;
    
    const attendance = attendanceData.slice(1)
      .filter(row => row[0] !== 'DELETED' && row[2] >= startDate && row[2] <= endDate)
      .map(row => ({
        employeeId: row[1],
        date: row[2],
        status: row[3],
        otHours: parseFloat(row[4]) || 0,
        siteId: row[5],
        approved: row[9] === 'TRUE' || row[9] === 'true' || row[9] === true
      }));

    // Get sites for reference
    const sitesData = await getSheetData(SHEETS.SITES);
    const sites = sitesData.slice(1)
      .filter(row => row[0] !== 'DELETED')
      .reduce((acc, row) => {
        acc[row[0]] = { siteNumber: row[1], siteName: row[2] };
        return acc;
      }, {});

    // Calculate payroll for each employee
    const payroll = employees.map(employee => {
      const employeeAttendance = attendance.filter(a => a.employeeId === employee.id);
      
      let presentDays = 0;
      let absentDays = 0;
      let halfDays = 0;
      let totalOtHours = 0;
      const sitesSummary = {};

      employeeAttendance.forEach(att => {
        if (att.status === 'Present') {
          presentDays += 1;
        } else if (att.status === 'Absent') {
          absentDays += 1;
        } else if (att.status === 'Half-Day') {
          halfDays += 1;
          presentDays += 0.5;
        }
        
        totalOtHours += att.otHours;

        // Site summary
        const siteKey = att.siteId || 'No Site';
        if (!sitesSummary[siteKey]) {
          sitesSummary[siteKey] = {
            siteNumber: sites[att.siteId]?.siteNumber || 'N/A',
            siteName: sites[att.siteId]?.siteName || 'No Site',
            days: 0
          };
        }
        sitesSummary[siteKey].days += att.status === 'Half-Day' ? 0.5 : 1;
      });

      // Calculate total salary
      const daySalary = presentDays * employee.perDaySalary;
      const otSalary = totalOtHours * employee.perHourSalary;
      const totalSalary = daySalary + otSalary;

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        profession: employee.profession,
        presentDays,
        absentDays,
        halfDays,
        totalOtHours,
        perDaySalary: employee.perDaySalary,
        perHourSalary: employee.perHourSalary,
        daySalary,
        otSalary,
        totalSalary,
        sites: Object.values(sitesSummary)
      };
    });

    // Filter out employees with no attendance
    const finalPayroll = payroll.filter(p => p.presentDays > 0 || p.absentDays > 0);

    await logAudit(
      req.user.id,
      req.user.name,
      'CALCULATE_PAYROLL',
      'payroll',
      `${year}-${month}`,
      { month, year, employeeCount: finalPayroll.length }
    );

    res.json({
      month: monthNum,
      year: yearNum,
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.name,
      totalEmployees: finalPayroll.length,
      totalAmount: finalPayroll.reduce((sum, p) => sum + p.totalSalary, 0),
      payroll: finalPayroll
    });
  } catch (error) {
    console.error('Calculate payroll error:', error);
    res.status(500).json({ error: 'Failed to calculate payroll' });
  }
}

/**
 * Get payroll summary
 */
export async function getPayrollSummary(req, res) {
  try {
    const { startMonth, startYear, endMonth, endYear } = req.query;
    
    // This would aggregate payroll data across multiple months
    // For now, return basic implementation
    res.json({
      message: 'Payroll summary endpoint - implementation pending'
    });
  } catch (error) {
    console.error('Get payroll summary error:', error);
    res.status(500).json({ error: 'Failed to get payroll summary' });
  }
}
