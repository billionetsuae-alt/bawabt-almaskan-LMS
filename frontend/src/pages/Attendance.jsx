import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceAPI, employeeAPI, siteAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Plus, Check, X, Edit2, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { formatDate } from '@/lib/utils';

export function Attendance() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkRecords, setBulkRecords] = useState({});
  const [editDialog, setEditDialog] = useState({ open: false, record: null });
  const [markDialog, setMarkDialog] = useState({ open: false, employee: null });
  
  const { user } = useAuthStore();
  const { showToast } = useUIStore();
  const queryClient = useQueryClient();
  const isManager = user?.role === 'manager';

  // Queries
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await employeeAPI.getAll();
      return res.data.filter(emp => emp.active);
    },
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const res = await siteAPI.getAll();
      return res.data.filter(site => site.active);
    },
  });

  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ['attendance', selectedDate],
    queryFn: async () => {
      const res = await attendanceAPI.getAll({
        startDate: selectedDate,
        endDate: selectedDate,
      });
      return res.data;
    },
  });

  // Mutations
  const markMutation = useMutation({
    mutationFn: attendanceAPI.mark,
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance']);
      showToast({ message: 'Attendance marked successfully', type: 'success' });
      setMarkDialog({ open: false, employee: null });
    },
    onError: (error) => {
      showToast({ 
        message: error.response?.data?.error || 'Failed to mark attendance', 
        type: 'error' 
      });
    },
  });

  const bulkMarkMutation = useMutation({
    mutationFn: attendanceAPI.markBulk,
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance']);
      showToast({ message: 'Attendance marked successfully', type: 'success' });
      setBulkMode(false);
      setBulkRecords({});
    },
    onError: (error) => {
      showToast({ 
        message: error.response?.data?.error || 'Failed to mark attendance', 
        type: 'error' 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => attendanceAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance']);
      showToast({ message: 'Attendance updated', type: 'success' });
      setEditDialog({ open: false, record: null });
    },
  });

  const approveMutation = useMutation({
    mutationFn: attendanceAPI.approve,
    onSuccess: () => {
      queryClient.invalidateQueries(['attendance']);
      showToast({ message: 'Attendance approved', type: 'success' });
    },
  });

  // Initialize bulk records
  useEffect(() => {
    if (bulkMode) {
      const records = {};
      employees.forEach(emp => {
        const existing = attendance.find(att => att.employeeId === emp.id);
        if (!existing) {
          records[emp.id] = {
            employeeId: emp.id,
            status: 'Present',
            otHours: 0,
            siteId: sites[0]?.id || '',
            notes: '',
          };
        }
      });
      setBulkRecords(records);
    }
  }, [bulkMode, employees, attendance, sites]);

  const handleBulkSubmit = () => {
    const records = Object.values(bulkRecords);
    if (records.length === 0) {
      showToast({ message: 'No records to submit', type: 'warning' });
      return;
    }
    bulkMarkMutation.mutate({ date: selectedDate, records });
  };

  const handleIndividualMark = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    markMutation.mutate({
      employeeId: markDialog.employee.id,
      date: selectedDate,
      status: formData.get('status'),
      otHours: parseFloat(formData.get('otHours')) || 0,
      siteId: formData.get('siteId'),
      notes: formData.get('notes') || '',
    });
  };

  const updateBulkRecord = (empId, field, value) => {
    setBulkRecords(prev => ({
      ...prev,
      [empId]: { ...prev[empId], [field]: value },
    }));
  };

  const getEmployeeAttendance = (empId) => {
    return attendance.find(att => att.employeeId === empId);
  };

  const getStatusBadge = (status) => {
    const variants = {
      Present: 'success',
      Absent: 'destructive',
      'Half-Day': 'warning',
    };
    const labels = {
      Present: 'P',
      Absent: 'A',
      'Half-Day': 'H',
    };
    return <Badge variant={variants[status]}>{labels[status] || status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground mt-1">
            Mark and manage daily attendance
          </p>
        </div>
        {!isManager && (
          <Button onClick={() => setBulkMode(!bulkMode)}>
            {bulkMode ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {bulkMode ? 'Cancel' : 'Bulk Mark'}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="date">Select Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div className="text-sm text-muted-foreground sm:pt-6">
              {attendance.length} / {employees.length} marked
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-2">No employees found</p>
              <p className="text-sm text-muted-foreground">
                {isManager 
                  ? 'Add employees from the Employees page to start marking attendance.'
                  : 'Ask your manager to add employees first.'}
              </p>
            </div>
          ) : sites.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-2">No sites found</p>
              <p className="text-sm text-muted-foreground">
                {isManager 
                  ? 'Add sites from the Sites page before marking attendance.'
                  : 'Ask your manager to add sites first.'}
              </p>
            </div>
          ) : bulkMode ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Employee</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">OT Hours</th>
                      <th className="pb-3 font-medium">Site</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(bulkRecords).map(empId => {
                      const emp = employees.find(e => e.id === empId);
                      if (!emp) return null;
                      
                      return (
                        <tr key={empId} className="border-b">
                          <td className="py-3">
                            <div>
                              <div className="font-medium">{emp.name}</div>
                              <div className="text-sm text-muted-foreground">{emp.profession}</div>
                            </div>
                          </td>
                          <td className="py-3">
                            <Select
                              value={bulkRecords[empId].status}
                              onChange={(e) => updateBulkRecord(empId, 'status', e.target.value)}
                              className="w-20"
                            >
                              <option value="Present">P</option>
                              <option value="Absent">A</option>
                              <option value="Half-Day">H</option>
                            </Select>
                          </td>
                          <td className="py-3">
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              value={bulkRecords[empId].otHours}
                              onChange={(e) => updateBulkRecord(empId, 'otHours', parseFloat(e.target.value))}
                              className="w-20"
                            />
                          </td>
                          <td className="py-3">
                            <Select
                              value={bulkRecords[empId].siteId}
                              onChange={(e) => updateBulkRecord(empId, 'siteId', e.target.value)}
                              className="w-full sm:w-auto"
                            >
                              {sites.map(site => (
                                <option key={site.id} value={site.id}>
                                  {site.siteNumber} - {site.siteName}
                                </option>
                              ))}
                            </Select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setBulkMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBulkSubmit} disabled={bulkMarkMutation.isPending}>
                  {bulkMarkMutation.isPending ? 'Submitting...' : 'Submit All'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Employee</th>
                    <th className="pb-3 font-medium w-16">Status</th>
                    <th className="pb-3 font-medium w-12">OT</th>
                    <th className="pb-3 font-medium w-16">Site</th>
                    <th className="pb-3 font-medium w-12 text-center">
                      <Check className="h-4 w-4 inline" />
                    </th>
                    <th className="pb-3 font-medium w-20">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => {
                    const att = getEmployeeAttendance(emp.id);
                    return (
                      <tr key={emp.id} className="border-b hover:bg-muted/50">
                        <td className="py-3">
                          <div>
                            <div className="font-medium">{emp.name}</div>
                            <div className="text-sm text-muted-foreground">{emp.profession}</div>
                          </div>
                        </td>
                        <td className="py-3">
                          {att ? getStatusBadge(att.status) : <span className="text-muted-foreground">-</span>}
                        </td>
                        <td className="py-3">
                          {att ? att.otHours : '-'}
                        </td>
                        <td className="py-3">
                          {att && att.siteId ? sites.find(s => s.id === att.siteId)?.siteNumber || '-' : '-'}
                        </td>
                        <td className="py-3 text-center">
                          {att ? (
                            att.approved ? (
                              <Check className="h-5 w-5 text-success inline" title="Approved" />
                            ) : (
                              <Clock className="h-5 w-5 text-warning inline" title="Pending" />
                            )
                          ) : '-'}
                        </td>
                        <td className="py-3">
                          {!att ? (
                            <Button
                              size="sm"
                              onClick={() => setMarkDialog({ open: true, employee: emp })}
                              variant="outline"
                            >
                              Mark
                            </Button>
                          ) : isManager && !att.approved ? (
                            <Button
                              size="sm"
                              onClick={() => approveMutation.mutate(att.id)}
                            >
                              Approve
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Mark Dialog */}
      <Dialog open={markDialog.open} onClose={() => setMarkDialog({ open: false, employee: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
          </DialogHeader>
          {markDialog.employee && (
            <form onSubmit={handleIndividualMark} className="space-y-4">
              <div className="space-y-2">
                <Label>Employee</Label>
                <p className="font-medium">{markDialog.employee.name}</p>
                <p className="text-sm text-muted-foreground">{markDialog.employee.profession}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select id="status" name="status" required>
                  <option value="Present">P - Present</option>
                  <option value="Absent">A - Absent</option>
                  <option value="Half-Day">H - Half Day</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otHours">OT Hours</Label>
                <Input
                  id="otHours"
                  name="otHours"
                  type="number"
                  min="0"
                  step="0.5"
                  defaultValue="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteId">Site</Label>
                <Select id="siteId" name="siteId" required>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>
                      {site.siteNumber} - {site.siteName}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  name="notes"
                  placeholder="Add any notes..."
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMarkDialog({ open: false, employee: null })}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={markMutation.isPending}>
                  {markMutation.isPending ? 'Marking...' : 'Mark Attendance'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
