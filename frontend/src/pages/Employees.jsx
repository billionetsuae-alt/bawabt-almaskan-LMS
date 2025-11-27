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
import { Plus, Edit2, Trash2, Search, FileText, Download, X } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export function Employees() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialog, setDialog] = useState({ open: false, mode: 'create', employee: null });
  const [detailEmployee, setDetailEmployee] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
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

  const handleOpenIdProof = async (employee) => {
    try {
      const res = await employeeAPI.downloadIdProof(employee.id);
      const blobUrl = URL.createObjectURL(res.data);
      window.open(blobUrl);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (error) {
      console.error('Open ID proof error:', error);
      showToast({ message: 'Failed to open identity proof', type: 'error' });
    }
  };

  const handleDownloadIdProof = async (employee) => {
    try {
      const res = await employeeAPI.downloadIdProof(employee.id);
      const blob = res.data;
      const contentType = res.headers['content-type'] || 'application/octet-stream';

      let ext = 'bin';
      if (contentType.includes('pdf')) ext = 'pdf';
      else if (contentType.includes('jpeg')) ext = 'jpg';
      else if (contentType.includes('png')) ext = 'png';
      else if (contentType.includes('webp')) ext = 'webp';

      const safeName = (employee.name || 'employee').toString().replace(/[^a-z0-9-_]+/gi, '_');
      const filename = `${safeName}_id_proof.${ext}`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download ID proof error:', error);
      showToast({ message: 'Failed to download identity proof', type: 'error' });
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.profession.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const siteId = formData.get('siteId');
    formData.set('siteId', siteId || '');

    const joiningDate = formData.get('joiningDate');
    formData.set('joiningDate', joiningDate || '');

    const notes = formData.get('notes');
    formData.set('notes', notes || '');

    const active = formData.get('active') || 'true';
    formData.set('active', active);

    if (dialog.mode === 'create') {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate({ id: dialog.employee.id, data: formData });
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
                    <th className="pb-3 font-medium hidden sm:table-cell">Profession</th>
                    <th className="pb-3 font-medium hidden md:table-cell">Daily Rate</th>
                    <th className="pb-3 font-medium hidden lg:table-cell">Hourly Rate</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(emp => (
                    <tr
                      key={emp.id}
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => setDetailEmployee(emp)}
                    >
                      <td className="py-3">
                        <div className="flex items-start gap-2">
                          <div className="flex flex-col">
                            <span className="font-medium break-words">{emp.name}</span>
                            <span className="text-sm text-muted-foreground sm:hidden break-words">
                              {emp.profession}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 hidden sm:table-cell">{emp.profession}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Detail Dialog */}
      <Dialog open={!!detailEmployee} onClose={() => setDetailEmployee(null)}>
        <DialogContent className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle>Employee Details</DialogTitle>
              <button
                type="button"
                onClick={() => setDetailEmployee(null)}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>
          {detailEmployee && (
            <div className="space-y-6">
              <div className="flex flex-row gap-4 items-start">
                {detailEmployee.photoUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={detailEmployee.photoUrl}
                      alt={detailEmployee.name}
                      className="h-24 w-24 rounded-xl object-cover shadow-md border cursor-pointer"
                      onClick={() => setPhotoPreviewUrl(detailEmployee.photoUrl)}
                    />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <p className="text-lg font-semibold break-words">{detailEmployee.name}</p>
                  <p className="text-sm text-muted-foreground break-words">{detailEmployee.profession}</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm mt-2">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={detailEmployee.active ? 'success' : 'secondary'}>
                      {detailEmployee.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="text-sm mt-2">
                    <span className="text-muted-foreground">Emirates ID:</span>
                    <span className="ml-2 font-medium break-words">
                      {detailEmployee.emiratesId || '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Daily Rate:</span>
                  <span className="ml-2 font-medium">{formatCurrency(detailEmployee.perDaySalary)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Hourly Rate:</span>
                  <span className="ml-2 font-medium">{formatCurrency(detailEmployee.perHourSalary)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Site:</span>
                  <span className="ml-2 font-medium">
                    {detailEmployee.siteId
                      ? sites.find(s => s.id === detailEmployee.siteId)?.siteName || '-'
                      : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Joining Date:</span>
                  <span className="ml-2 font-medium">{detailEmployee.joiningDate || '-'}</span>
                </div>
              </div>

              {detailEmployee.idProofUrl && (
                <div className="space-y-2 text-sm">
                  <p className="text-sm font-medium">Identity Proof</p>
                  {(() => {
                    const originalUrl = detailEmployee.idProofUrl;
                    const lowerUrl = originalUrl.toLowerCase();
                    const looksLikePdf = lowerUrl.includes('.pdf') || lowerUrl.includes('/raw/upload/');

                    if (looksLikePdf) {
                      let previewUrl = originalUrl;

                      try {
                        const parsed = new URL(originalUrl);
                        const parts = parsed.pathname.split('/');
                        const cloudName = parts[1];

                        if (parsed.hostname.includes('res.cloudinary.com') && cloudName) {
                          const encodedSource = encodeURIComponent(originalUrl);
                          previewUrl = `https://res.cloudinary.com/${cloudName}/image/fetch/f_auto,q_auto,w_1200/${encodedSource}`;
                        }
                      } catch {
                        // keep original previewUrl
                      }

                      return (
                        <div className="space-y-3">
                          <div className="border rounded-lg overflow-hidden w-full">
                            <img
                              src={previewUrl}
                              alt="Identity proof PDF preview"
                              className="w-full max-h-80 object-contain bg-muted"
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <button
                              type="button"
                              onClick={() => handleOpenIdProof(detailEmployee)}
                              className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              Open PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadIdProof(detailEmployee)}
                              className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="border rounded-lg overflow-hidden w-full">
                        <img
                          src={originalUrl}
                          alt="Identity proof"
                          className="w-full max-h-80 object-contain bg-muted"
                        />
                      </div>
                    );
                  })()}
                </div>
              )}

              {detailEmployee.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Notes:</span>
                  <span className="ml-2 break-words">{detailEmployee.notes}</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Employee Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, mode: 'create', employee: null })}>
        <DialogContent onClose={() => setDialog({ open: false, mode: 'create', employee: null })}>
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle>
                {dialog.mode === 'create' ? 'Add New Employee' : 'Edit Employee'}
              </DialogTitle>
              <button
                type="button"
                onClick={() => setDialog({ open: false, mode: 'create', employee: null })}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit} encType="multipart/form-data">
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
                  <Label htmlFor="emiratesId">Emirates ID</Label>
                  <Input
                    id="emiratesId"
                    name="emiratesId"
                    defaultValue={dialog.employee?.emiratesId || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photo">Photo</Label>
                  <Input
                    id="photo"
                    name="photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                  />
                  {dialog.mode === 'edit' && dialog.employee?.photoUrl && (
                    <p className="text-xs text-muted-foreground">
                      Current photo will be kept if you do not upload a new one.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idProof">Identity Proof</Label>
                <Input
                  id="idProof"
                  name="idProof"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                />
                {dialog.mode === 'edit' && dialog.employee?.idProofUrl && (
                  <p className="text-xs text-muted-foreground">
                    Existing identity proof will be kept if you do not upload a new file.
                  </p>
                )}
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

      {photoPreviewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setPhotoPreviewUrl(null)}
        >
          <img
            src={photoPreviewUrl}
            alt="Employee photo"
            className="max-h-[90vh] max-w-[90vw] rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
