import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceAPI, employeeAPI, payrollAPI, siteAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { FileText, DollarSign, Users, Download, Calendar, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Format currency in AED (UAE Dirham)
const formatCurrency = (amount) => {
  return `AED ${Number(amount || 0).toFixed(2)}`;
};

export function Reports() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [reportDate, setReportDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState('attendance');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedSiteId, setSelectedSiteId] = useState('');

  const [year, month] = selectedMonth.split('-').map(Number);

  // Fetch data
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await employeeAPI.getAll();
      return res.data;
    },
  });

  const { data: payrollData, isLoading: payrollLoading } = useQuery({
    queryKey: ['payroll', year, month],
    queryFn: async () => {
      const res = await payrollAPI.calculateMonthly(year, month);
      return res.data;
    },
    enabled: !!year && !!month,
  });

  const { data: attendance = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', reportDate],
    queryFn: async () => {
      const res = await attendanceAPI.getAll({
        startDate: reportDate,
        endDate: reportDate,
      });
      return res.data;
    },
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const res = await siteAPI.getAll();
      return res.data;
    },
  });

  const selectedSite = sites.find((s) => s.id === selectedSiteId) || null;

  const siteAttendance = selectedSiteId
    ? attendance.filter(att => {
        const isPrimary = att.siteId === selectedSiteId;
        const hasExtra = (att.extraSites || []).includes(selectedSiteId);
        return isPrimary || hasExtra;
      })
    : [];

  useEffect(() => {
    if (!selectedSiteId && sites.length > 0) {
      setSelectedSiteId(sites[0].id);
    }
  }, [selectedSiteId, sites]);

  // Generate Attendance Report PDF
  const generateAttendancePDF = (returnBlob = false) => {
    const pdf = new jsPDF();

    // Company Header - Professional Teal
    pdf.setFillColor(20, 83, 89);
    pdf.rect(0, 0, 210, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.text('BAWABT ALMASKAN', 105, 15, { align: 'center' });
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text('REAL ESTATE - Daily Attendance Report', 105, 22, { align: 'center' });
    pdf.text(`Date: ${format(new Date(reportDate), 'dd MMM yyyy')}`, 105, 29, { align: 'center' });

    pdf.setTextColor(0, 0, 0);

    const tableData = attendance.map(att => {
      const emp = employees.find(e => e.id === att.employeeId);
      const site = sites.find(s => s.id === att.siteId);
      const siteInfo = site ? `${site.siteNumber} - ${site.siteName}` : '-';

      const otherSitesInfo = (att.extraSites || [])
        .map((siteId) => {
          const extraSite = sites.find(s => s.id === siteId);
          if (!extraSite) return null;
          return `${extraSite.siteNumber} - ${extraSite.siteName}`;
        })
        .filter(Boolean)
        .join(', ') || '-';

      return [
        emp?.name || '-',
        emp?.profession || '-',
        att.status,
        att.otHours || 0,
        siteInfo,
        otherSitesInfo,
        att.approved ? 'Yes' : 'No',
      ];
    });

    pdf.autoTable({
      head: [['Employee', 'Profession', 'Status', 'OT Hours', 'Site (Number - Name)', 'Other Sites', 'Approved']],
      body: tableData,
      startY: 42,
      theme: 'striped',
      headStyles: { fillColor: [20, 83, 89], fontSize: 10, fontStyle: 'bold' },
      margin: { left: 14, right: 14 },
    });

    const footerY = pdf.internal.pageSize.height - 15;
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Generated on: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 105, footerY, { align: 'center' });
    pdf.text('BAWABT ALMASKAN - Confidential Document', 105, footerY + 5, { align: 'center' });

    if (returnBlob) {
      return pdf.output('bloburl');
    } else {
      pdf.save(`Attendance_${reportDate}.pdf`);
    }
  };

  const generateSiteAttendancePDF = (returnBlob = false) => {
    if (!selectedSite) return null;

    const pdf = new jsPDF();

    pdf.setFillColor(20, 83, 89);
    pdf.rect(0, 0, 210, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.text('BAWABT ALMASKAN', 105, 15, { align: 'center' });
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text('REAL ESTATE - Site-wise Attendance Report', 105, 22, { align: 'center' });

    // Use black text for site and date so it's clearly visible
    pdf.setTextColor(0, 0, 0);

    const siteLocation = selectedSite.location || 'No location';
    // Site line on teal bar in white
    pdf.setTextColor(255, 255, 255);
    pdf.text(
      `Site: ${selectedSite.siteNumber} - ${selectedSite.siteName} (${siteLocation})`,
      105,
      29,
      { align: 'center' }
    );
    // Date line below in black on white background
    pdf.setTextColor(0, 0, 0);
    pdf.text(
      `Date: ${format(new Date(reportDate), 'dd MMM yyyy')}`,
      105,
      40,
      { align: 'center' }
    );

    pdf.setTextColor(0, 0, 0);

    const tableData = siteAttendance.map(att => {
      const emp = employees.find(e => e.id === att.employeeId);
      const isPrimary = att.siteId === selectedSiteId;
      const type = isPrimary ? 'Primary Site' : 'Other Site';

      return [
        emp?.name || '-',
        emp?.profession || '-',
        att.status,
        att.otHours || 0,
        type,
      ];
    });

    pdf.autoTable({
      head: [['Employee', 'Profession', 'Status', 'OT Hours', 'Type']],
      body: tableData,
      startY: 56,
      theme: 'striped',
      headStyles: { fillColor: [20, 83, 89], fontSize: 10, fontStyle: 'bold' },
      margin: { left: 14, right: 14 },
    });

    const footerY = pdf.internal.pageSize.height - 15;
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Generated on: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 105, footerY, { align: 'center' });
    pdf.text('BAWABT ALMASKAN - Confidential Document', 105, footerY + 5, { align: 'center' });

    if (returnBlob) {
      return pdf.output('bloburl');
    } else {
      const safeSiteNumber = (selectedSite.siteNumber || 'Site').toString().replace(/\s+/g, '_');
      pdf.save(`Site_Attendance_${safeSiteNumber}_${reportDate}.pdf`);
    }
  };

  // Generate Payroll Report PDF
  const generatePayrollPDF = (returnBlob = false) => {
    if (!payrollData) return null;

    const pdf = new jsPDF();

    pdf.setFillColor(20, 83, 89);
    pdf.rect(0, 0, 210, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.text('BAWABT ALMASKAN', 105, 15, { align: 'center' });
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text('REAL ESTATE - Monthly Payroll Report', 105, 22, { align: 'center' });
    pdf.text(`Period: ${format(new Date(year, month - 1), 'MMMM yyyy')}`, 105, 29, { align: 'center' });

    pdf.setTextColor(0, 0, 0);

    pdf.setFillColor(240, 240, 240);
    pdf.roundedRect(14, 42, 182, 20, 3, 3, 'F');
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.text('Payroll Summary', 20, 50);
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(10);
    pdf.text(`Total Employees: ${payrollData.totalEmployees}`, 20, 57);
    pdf.text(`Generated by: ${payrollData.generatedBy}`, 120, 57);

    const tableData = payrollData.payroll.map(p => [
      p.employeeName,
      p.profession,
      p.presentDays,
      p.totalOtHours.toFixed(1),
      formatCurrency(p.daySalary),
      formatCurrency(p.otSalary),
      formatCurrency(p.totalSalary),
    ]);

    pdf.autoTable({
      head: [['Employee', 'Profession', 'Days', 'OT Hrs', 'Day Salary', 'OT Salary', 'Total']],
      body: tableData,
      startY: 70,
      theme: 'striped',
      headStyles: { fillColor: [20, 83, 89], fontSize: 10, fontStyle: 'bold' },
      margin: { left: 14, right: 14 },
    });

    const finalY = pdf.lastAutoTable.finalY || 70;
    pdf.setFillColor(34, 197, 94);
    pdf.roundedRect(14, finalY + 5, 182, 12, 3, 3, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('GRAND TOTAL:', 20, finalY + 13);
    pdf.text(formatCurrency(payrollData.totalAmount), 190, finalY + 13, { align: 'right' });

    const footerY = pdf.internal.pageSize.height - 15;
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Generated on: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 105, footerY, { align: 'center' });
    pdf.text('BAWABT ALMASKAN - Confidential Document', 105, footerY + 5, { align: 'center' });

    if (returnBlob) {
      return pdf.output('bloburl');
    } else {
      pdf.save(`Payroll_${year}-${month}.pdf`);
    }
  };

  // Generate Employee List PDF
  const generateEmployeeListPDF = (returnBlob = false) => {
    const pdf = new jsPDF();

    pdf.setFillColor(20, 83, 89);
    pdf.rect(0, 0, 210, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.text('BAWABT ALMASKAN', 105, 15, { align: 'center' });
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text('REAL ESTATE - Employee List', 105, 22, { align: 'center' });
    pdf.text(`Generated: ${format(new Date(), 'dd MMM yyyy')}`, 105, 29, { align: 'center' });

    pdf.setTextColor(0, 0, 0);

    const tableData = employees.map(emp => {
      const site = sites.find(s => s.id === emp.siteId);
      return [
        emp.name,
        emp.profession,
        formatCurrency(emp.perDaySalary),
        site ? site.siteName : '-',
        emp.active ? 'Active' : 'Inactive',
        emp.joiningDate || '-',
      ];
    });

    pdf.autoTable({
      head: [['Name', 'Profession', 'Daily Rate', 'Current Site', 'Status', 'Joined']],
      body: tableData,
      startY: 42,
      theme: 'striped',
      headStyles: { fillColor: [20, 83, 89], fontSize: 10, fontStyle: 'bold' },
      margin: { left: 14, right: 14 },
    });

    const footerY = pdf.internal.pageSize.height - 15;
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Generated on: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 105, footerY, { align: 'center' });
    pdf.text('BAWABT ALMASKAN - Confidential Document', 105, footerY + 5, { align: 'center' });

    if (returnBlob) {
      return pdf.output('bloburl');
    } else {
      pdf.save(`Employee_List_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    }
  };

  const attendanceHasData = attendance.length > 0 && employees.length > 0;
  const siteAttendanceHasData =
    !!selectedSite && siteAttendance.length > 0 && employees.length > 0;
  const payrollHasData = !!(payrollData && Array.isArray(payrollData.payroll) && payrollData.payroll.length > 0);
  const employeesHasData = employees.length > 0;

  // Update preview when active tab or data changes
  useEffect(() => {
    // Clean up previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    let url = null;

    try {
      if (activeTab === 'attendance' && attendanceHasData) {
        url = generateAttendancePDF(true);
      } else if (
        activeTab === 'site-attendance' &&
        siteAttendanceHasData
      ) {
        url = generateSiteAttendancePDF(true);
      } else if (activeTab === 'payroll' && payrollHasData) {
        url = generatePayrollPDF(true);
      } else if (activeTab === 'employees' && employeesHasData) {
        url = generateEmployeeListPDF(true);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
    }

    setPreviewUrl(url);

    // Cleanup on unmount
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [activeTab, reportDate, selectedMonth, selectedSiteId, attendance, employees, payrollData, sites]);

  const getPreviewMessage = () => {
    if (activeTab === 'attendance') {
      if (attendanceLoading) return 'Loading attendance report...';
      if (!attendanceHasData) return 'No attendance records for this date';
    } else if (activeTab === 'site-attendance') {
      if (attendanceLoading || sites.length === 0) return 'Loading site-wise attendance report...';
      if (!selectedSiteId) return 'Select a site to view site-wise attendance';
      if (!siteAttendanceHasData) return 'No attendance for this site on this date';
    } else if (activeTab === 'payroll') {
      if (payrollLoading) return 'Loading payroll report...';
      if (!payrollHasData) return 'No payroll data for this month';
    } else if (activeTab === 'employees') {
      if (!employeesHasData) return 'No employees found';
    }
    return 'Loading preview...';
  };

  const reports = [
    {
      id: 'attendance',
      title: 'Attendance Report',
      description: 'Daily attendance records',
      icon: FileText,
      gradient: 'from-info-light to-info/10',
      iconBg: 'bg-info/10',
      iconColor: 'text-info',
      action: () => generateAttendancePDF(false),
      loading: attendanceLoading,
    },
    {
      id: 'site-attendance',
      title: 'Site-wise Attendance',
      description: 'Attendance by site and date',
      icon: MapPin,
      gradient: 'from-primary to-primary/10',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      action: () => generateSiteAttendancePDF(false),
      loading: attendanceLoading,
    },
    {
      id: 'payroll',
      title: 'Payroll Report',
      description: 'Employee salary breakdown',
      icon: DollarSign,
      gradient: 'from-success-light to-success/10',
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      action: () => generatePayrollPDF(false),
      loading: payrollLoading,
    },
    {
      id: 'employees',
      title: 'Employee List',
      description: 'Complete employee database',
      icon: Users,
      gradient: 'from-accent-light to-accent/10',
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent',
      action: () => generateEmployeeListPDF(false),
      loading: false,
    },
  ];

  // Calculate stats for display
  const totalAttendance = attendance.length;
  const totalOT = attendance.reduce((sum, att) => sum + (att.otHours || 0), 0);
  const totalPayroll = payrollData?.totalAmount || 0;

  // Export Individual Payroll
  const exportIndividualPayroll = (employeeData) => {
    const pdf = new jsPDF();

    pdf.setFillColor(20, 83, 89);
    pdf.rect(0, 0, 210, 35, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.text('BAWABT ALMASKAN', 105, 15, { align: 'center' });
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text('REAL ESTATE - Employee Payroll Statement', 105, 22, { align: 'center' });
    pdf.text(`Period: ${format(new Date(year, month - 1), 'MMMM yyyy')}`, 105, 29, { align: 'center' });

    pdf.setTextColor(0, 0, 0);

    pdf.setFillColor(240, 240, 240);
    pdf.roundedRect(14, 42, 182, 25, 3, 3, 'F');
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('Employee Information', 20, 50);
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(10);
    pdf.text(`Name: ${employeeData.employeeName}`, 20, 57);
    pdf.text(`Profession: ${employeeData.profession}`, 20, 63);

    pdf.autoTable({
      startY: 75,
      head: [['Attendance Summary', 'Days/Hours']],
      body: [
        ['Present Days', employeeData.presentDays.toString()],
        ['Absent Days', employeeData.absentDays.toString()],
        ['Half Days', employeeData.halfDays.toString()],
        ['Overtime Hours', employeeData.totalOtHours.toFixed(1)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94], fontSize: 11, fontStyle: 'bold' },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 140 },
        1: { halign: 'right', cellWidth: 42 }
      },
      margin: { left: 14, right: 14 },
    });

    const finalY = pdf.lastAutoTable.finalY;
    pdf.autoTable({
      startY: finalY + 10,
      head: [['Salary Component', 'Amount']],
      body: [
        ['Basic Salary (Daily)', formatCurrency(employeeData.daySalary)],
        ['Overtime Salary', formatCurrency(employeeData.otSalary)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [20, 83, 89], fontSize: 11, fontStyle: 'bold' },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 140 },
        1: { halign: 'right', cellWidth: 42 }
      },
      margin: { left: 14, right: 14 },
    });

    const salaryY = pdf.lastAutoTable.finalY + 5;
    pdf.setFillColor(34, 197, 94);
    pdf.roundedRect(14, salaryY, 182, 15, 3, 3, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('TOTAL SALARY:', 20, salaryY + 10);
    pdf.text(formatCurrency(employeeData.totalSalary), 190, salaryY + 10, { align: 'right' });

    if (employeeData.sites && employeeData.sites.length > 0) {
      pdf.setTextColor(0, 0, 0);
      pdf.autoTable({
        startY: salaryY + 22,
        head: [['Site Number', 'Site Name', 'Days Worked']],
        body: employeeData.sites.map(site => [
          site.siteNumber,
          site.siteName,
          site.days.toString()
        ]),
        theme: 'grid',
        headStyles: { fillColor: [14, 165, 233], fontSize: 10 },
        margin: { left: 14, right: 14 },
      });
    }

    const footerY = pdf.internal.pageSize.height - 15;
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Generated on: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 105, footerY, { align: 'center' });
    pdf.text('BAWABT ALMASKAN - Confidential Document', 105, footerY + 5, { align: 'center' });

    pdf.save(`Payroll_${employeeData.employeeName.replace(/\s+/g, '_')}_${year}-${month}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Reports
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate and export various reports
        </p>
      </div>

      {/* Date Selectors */}
      <Card className="shadow-card border-0">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <Label htmlFor="month">Select Month (For Payroll)</Label>
              <Input
                id="month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                max={format(new Date(), 'yyyy-MM')}
              />
            </div>
            <div>
              <Label htmlFor="date">Select Date (For Attendance)</Label>
              <Input
                id="date"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div>
              <Label htmlFor="site">Select Site (For Site-wise Attendance)</Label>
              <Select
                id="site"
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
              >
                {sites.map(site => (
                  <option key={site.id} value={site.id}>
                    {site.siteNumber} - {site.siteName}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-3d border-0 overflow-hidden hover:-translate-y-1 transition-all">
          <div className="h-2 bg-gradient-to-r from-info-light to-info/10" />
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Attendance</p>
                <p className="text-2xl sm:text-3xl font-bold">{totalAttendance}</p>
              </div>
              <div className="bg-info/10 p-2 sm:p-3 rounded-xl">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-3d border-0 overflow-hidden hover:-translate-y-1 transition-all">
          <div className="h-2 bg-gradient-to-r from-success-light to-success/10" />
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">OT Hours</p>
                <p className="text-2xl sm:text-3xl font-bold">{totalOT.toFixed(1)}</p>
              </div>
              <div className="bg-success/10 p-2 sm:p-3 rounded-xl">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-3d border-0 overflow-hidden hover:-translate-y-1 transition-all">
          <div className="h-2 bg-gradient-to-r from-accent-light to-accent/10" />
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Payroll</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold">{formatCurrency(totalPayroll)}</p>
              </div>
              <div className="bg-accent/10 p-2 sm:p-3 rounded-xl">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Reports */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Export Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reports.map((report, index) => {
            const Icon = report.icon;
            return (
              <Card
                key={index}
                className="shadow-3d border-0 overflow-hidden hover:-translate-y-1 transition-all"
              >
                <div className={`h-2 bg-gradient-to-r ${report.gradient}`} />
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${report.iconBg} p-2 sm:p-3 rounded-xl`}>
                      <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${report.iconColor}`} />
                    </div>
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg mb-1">{report.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">{report.description}</p>
                  <Button
                    onClick={report.action}
                    className="w-full text-sm"
                    disabled={report.loading}
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    {report.loading ? 'Loading...' : 'Download'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Report Previews */}
      <div className="mt-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Report Previews</h2>
        <Card className="shadow-card border-0">
          <CardContent className="p-4 sm:p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full mb-4 sm:mb-6 flex overflow-x-auto">
                <TabsTrigger value="attendance" className="flex-1 min-w-[100px] text-xs sm:text-sm">Attendance</TabsTrigger>
                <TabsTrigger value="site-attendance" className="flex-1 min-w-[120px] text-xs sm:text-sm">Site Attendance</TabsTrigger>
                <TabsTrigger value="payroll" className="flex-1 min-w-[100px] text-xs sm:text-sm">Payroll</TabsTrigger>
                <TabsTrigger value="employees" className="flex-1 min-w-[100px] text-xs sm:text-sm">Employee List</TabsTrigger>
              </TabsList>

              <div className="h-[400px] sm:h-[500px] md:h-[600px] w-full border rounded-lg overflow-hidden bg-muted/20">
                {previewUrl ? (
                  <iframe
                    key={activeTab}
                    src={previewUrl}
                    className="w-full h-full"
                    title="Report Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p className="text-sm sm:text-base">{getPreviewMessage()}</p>
                  </div>
                )}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Individual Payroll Reports */}
      {payrollData && payrollData.payroll && payrollData.payroll.length > 0 && (
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Individual Payroll Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payrollData.payroll.map((emp, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors gap-3"
                >
                  <div>
                    <p className="font-medium text-sm sm:text-base">{emp.employeeName}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{emp.profession}</p>
                    <p className="text-xs sm:text-sm font-semibold text-primary mt-1">
                      {formatCurrency(emp.totalSalary)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportIndividualPayroll(emp)}
                    className="w-full sm:w-auto"
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    PDF
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
