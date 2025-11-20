import { useQuery } from '@tanstack/react-query';
import { employeeAPI, attendanceAPI, payrollAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, DollarSign, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

export function Dashboard() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await employeeAPI.getAll();
      return res.data.filter(emp => emp.active);
    },
  });

  // Fetch today's attendance
  const { data: todayAttendance = [] } = useQuery({
    queryKey: ['attendance', today],
    queryFn: async () => {
      const res = await attendanceAPI.getAll({
        startDate: today,
        endDate: today,
      });
      return res.data;
    },
  });

  // Fetch current month payroll
  const { data: payrollData } = useQuery({
    queryKey: ['payroll', currentYear, currentMonth],
    queryFn: async () => {
      const res = await payrollAPI.calculateMonthly(currentYear, currentMonth);
      return res.data;
    },
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true, // Refetch when component mounts
  });

  // Calculate stats
  const totalEmployees = employees.length;
  const presentToday = todayAttendance.filter(att => att.status === 'Present' || att.status === 'Half-Day').length;
  const attendanceRate = totalEmployees > 0 ? ((presentToday / totalEmployees) * 100).toFixed(1) : 0;
  const totalOT = todayAttendance.reduce((sum, att) => sum + (att.otHours || 0), 0);
  const monthlyPayroll = payrollData?.totalAmount || 0;

  const stats = [
    {
      title: 'Total Employees',
      value: totalEmployees,
      subtitle: `${employees.filter(e => e.createdAt >= format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd')).length} added this month`,
      icon: Users,
      gradient: 'from-success-light to-success/10',
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      title: 'Pay Roll Summary',
      value: formatCurrency(monthlyPayroll),
      subtitle: 'This month',
      icon: DollarSign,
      gradient: 'from-accent-light to-accent/10',
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent',
    },
    {
      title: 'Present Today',
      value: presentToday,
      subtitle: `${attendanceRate}% attendance`,
      icon: Calendar,
      gradient: 'from-info-light to-info/10',
      iconBg: 'bg-info/10',
      iconColor: 'text-info',
    },
    {
      title: 'OT Hours Today',
      value: totalOT.toFixed(1),
      subtitle: `${todayAttendance.filter(att => att.otHours > 0).length} employees`,
      icon: Clock,
      gradient: 'from-warning/20 to-warning/5',
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's what's happening today
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className="overflow-hidden border-0 shadow-3d hover:shadow-card transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`h-2 bg-gradient-to-r ${stat.gradient}`} />
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      {stat.title}
                    </p>
                    <h3 className="text-3xl font-bold mb-1">
                      {stat.value}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {stat.subtitle}
                    </p>
                  </div>
                  <div className={`${stat.iconBg} p-3 rounded-xl`}>
                    <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today's Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayAttendance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No attendance marked yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-success-light rounded-lg">
                  <span className="text-sm font-medium">Present</span>
                  <span className="text-lg font-bold text-success">
                    {todayAttendance.filter(att => att.status === 'Present').length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg">
                  <span className="text-sm font-medium">Absent</span>
                  <span className="text-lg font-bold text-destructive">
                    {totalEmployees - presentToday}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
                  <span className="text-sm font-medium">Half Day</span>
                  <span className="text-lg font-bold text-warning">
                    {todayAttendance.filter(att => att.status === 'Half-Day').length}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Overtime Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalOT === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No overtime hours today</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center p-6 bg-accent-light rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">Total OT Hours</p>
                  <p className="text-4xl font-bold text-accent">{totalOT.toFixed(1)}</p>
                </div>
                <div className="text-sm text-muted-foreground text-center">
                  {todayAttendance.filter(att => att.otHours > 0).length} employees working overtime
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
