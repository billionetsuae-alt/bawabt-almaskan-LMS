import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeAPI, siteAPI } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Plus, Edit2, Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export function Employees() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialog, setDialog] = useState({ open: false, mode: 'create', employee: null });
  const [expandedRow, setExpandedRow] = useState(null);
  const { showToast } = useUIStore();
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const res = await employeeAPI.getAll();
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

  const createMutation = useMutation({
    mutationFn: employeeAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      showToast({ message: 'Employee created successfully', type: 'success' });
      setDialog({ open: false, mode: 'create', employee: null });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => employeeAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      showToast({ message: 'Employee updated successfully', type: 'success' });
      setDialog({ open: false, mode: 'create', employee: null });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: employeeAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['employees']);
      showToast({ message: 'Employee deleted successfully', type: 'success' });
    },
  });

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.profession.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      profession: formData.get('profession'),
      perDaySalary: parseFloat(formData.get('perDaySalary')),
      perHourSalary: parseFloat(formData.get('perHourSalary')),
      siteId: formData.get('siteId') || null,
      active: formData.get('active') === 'true',
      joiningDate: formData.get('joiningDate') || null,
      notes: formData.get('notes') || '',
    };

    if (dialog.mode === 'create') {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate({ id: dialog.employee.id, data });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground mt-1">
            Manage employee profiles and details
          </p>
        </div>
        <Button onClick={() => setDialog({ open: true, mode: 'create', employee: null })}>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No employees found' : 'No employees yet. Add one to get started.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Profession</th>
                    <th className="pb-3 font-medium hidden md:table-cell">Daily Rate</th>
                    <th className="pb-3 font-medium hidden lg:table-cell">Hourly Rate</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(emp => (
                    <>
                      <tr 
                        key={emp.id} 
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => setExpandedRow(expandedRow === emp.id ? null : emp.id)}
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {expandedRow === emp.id ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-medium">{emp.name}</span>
                          </div>
                        </td>
                        <td className="py-3">{emp.profession}</td>
                        <td className="py-3 hidden md:table-cell">{formatCurrency(emp.perDaySalary)}</td>
                        <td className="py-3 hidden lg:table-cell">{formatCurrency(emp.perHourSalary)}</td>
                        <td className="py-3">
                          <Badge variant={emp.active ? 'success' : 'secondary'}>
                            {emp.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDialog({ open: true, mode: 'edit', employee: emp })}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm(`Delete ${emp.name}?`)) {
                                  deleteMutation.mutate(emp.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {expandedRow === emp.id && (
                        <tr className="bg-muted/30">
                          <td colSpan="6" className="py-4 px-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Daily Rate:</span>
                                <span className="ml-2 font-medium">{formatCurrency(emp.perDaySalary)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Hourly Rate:</span>
                                <span className="ml-2 font-medium">{formatCurrency(emp.perHourSalary)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Site:</span>
                                <span className="ml-2 font-medium">
                                  {emp.siteId ? sites.find(s => s.id === emp.siteId)?.siteName || '-' : '-'}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Joining Date:</span>
                                <span className="ml-2 font-medium">{emp.joiningDate || '-'}</span>
                              </div>
                              {emp.notes && (
                                <div className="col-span-2">
                                  <span className="text-muted-foreground">Notes:</span>
                                  <span className="ml-2">{emp.notes}</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, mode: 'create', employee: null })}>
        <DialogContent onClose={() => setDialog({ open: false, mode: 'create', employee: null })}>
          <DialogHeader>
            <DialogTitle>
              {dialog.mode === 'create' ? 'Add New Employee' : 'Edit Employee'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={dialog.employee?.name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profession">Profession *</Label>
                  <Input
                    id="profession"
                    name="profession"
                    defaultValue={dialog.employee?.profession}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="perDaySalary">Per Day Salary *</Label>
                  <Input
                    id="perDaySalary"
                    name="perDaySalary"
                    type="number"
                    step="0.01"
                    defaultValue={dialog.employee?.perDaySalary}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perHourSalary">Per Hour Salary *</Label>
                  <Input
                    id="perHourSalary"
                    name="perHourSalary"
                    type="number"
                    step="0.01"
                    defaultValue={dialog.employee?.perHourSalary}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteId">Default Site</Label>
                  <Select
                    id="siteId"
                    name="siteId"
                    defaultValue={dialog.employee?.siteId || ''}
                  >
                    <option value="">No Default Site</option>
                    {sites.map(site => (
                      <option key={site.id} value={site.id}>
                        {site.siteNumber} - {site.siteName}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joiningDate">Joining Date</Label>
                  <Input
                    id="joiningDate"
                    name="joiningDate"
                    type="date"
                    defaultValue={dialog.employee?.joiningDate}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="active">Status</Label>
                <Select
                  id="active"
                  name="active"
                  defaultValue={dialog.employee?.active !== false ? 'true' : 'false'}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  name="notes"
                  defaultValue={dialog.employee?.notes}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialog({ open: false, mode: 'create', employee: null })}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {dialog.mode === 'create' ? 'Add Employee' : 'Update Employee'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
