import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { siteAPI, siteExpenseAPI } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';

export function Sites() {
  const [dialog, setDialog] = useState({ open: false, mode: 'create', site: null });
  const [expenseDialog, setExpenseDialog] = useState({ open: false, site: null });
  const { showToast } = useUIStore();
  const queryClient = useQueryClient();

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const res = await siteAPI.getAll();
      return res.data;
    },
  });

  const { data: siteExpenses = [] } = useQuery({
    queryKey: ['site-expenses'],
    queryFn: async () => {
      const res = await siteExpenseAPI.getAll();
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: siteAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['sites']);
      showToast({ message: 'Site created successfully', type: 'success' });
      setDialog({ open: false, mode: 'create', site: null });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => siteAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sites']);
      showToast({ message: 'Site updated successfully', type: 'success' });
      setDialog({ open: false, mode: 'create', site: null });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: siteAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['sites']);
      showToast({ message: 'Site deleted successfully', type: 'success' });
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: siteExpenseAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['site-expenses']);
      showToast({ message: 'Expense added successfully', type: 'success' });
      setExpenseDialog({ open: false, site: null });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      siteNumber: formData.get('siteNumber'),
      siteName: formData.get('siteName'),
      location: formData.get('location') || '',
      active: formData.get('active') === 'true',
    };

    if (dialog.mode === 'create') {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate({ id: dialog.site.id, data });
    }
  };

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    if (!expenseDialog.site) return;

    const formData = new FormData(e.target);
    const amountValue = parseFloat(formData.get('amount')) || 0;

    const data = {
      siteId: expenseDialog.site.id,
      siteNumber: expenseDialog.site.siteNumber,
      amount: amountValue,
      date: formData.get('date'),
      category: formData.get('category') || '',
      notes: formData.get('notes') || '',
    };

    createExpenseMutation.mutate(data);
  };

  const expenseTotals = useMemo(() => {
    const totals = {};
    for (const expense of siteExpenses) {
      const key = expense.siteId;
      const amount = typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount) || 0;
      totals[key] = (totals[key] || 0) + amount;
    }
    return totals;
  }, [siteExpenses]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Sites</h1>
          <p className="text-muted-foreground mt-1">
            Manage work site locations
          </p>
        </div>
        <Button onClick={() => setDialog({ open: true, mode: 'create', site: null })}>
          <Plus className="h-4 w-4 mr-2" />
          Add Site
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : sites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No sites yet. Add one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map(site => (
            <Card key={site.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{site.siteNumber}</h3>
                      <p className="text-sm text-muted-foreground">{site.siteName}</p>
                      {site.location && (
                        <p className="text-xs text-muted-foreground mt-1">{site.location}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Total Expense:{' '}
                        <span className="font-semibold">
                          {expenseTotals[site.id]
                            ? expenseTotals[site.id].toLocaleString()
                            : '0'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Badge variant={site.active ? 'success' : 'secondary'}>
                    {site.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setDialog({ open: true, mode: 'edit', site })}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setExpenseDialog({ open: true, site })}
                  >
                    Add Expense
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm(`Delete ${site.siteName}?`)) {
                        deleteMutation.mutate(site.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Site Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, mode: 'create', site: null })}>
        <DialogContent onClose={() => setDialog({ open: false, mode: 'create', site: null })}>
          <DialogHeader>
            <DialogTitle>
              {dialog.mode === 'create' ? 'Add New Site' : 'Edit Site'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 p-6">
              <div className="space-y-2">
                <Label htmlFor="siteNumber">Site Number *</Label>
                <Input
                  id="siteNumber"
                  name="siteNumber"
                  placeholder="e.g., SITE-001"
                  defaultValue={dialog.site?.siteNumber}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name *</Label>
                <Input
                  id="siteName"
                  name="siteName"
                  placeholder="e.g., Downtown Construction"
                  defaultValue={dialog.site?.siteName}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g., 123 Main Street"
                  defaultValue={dialog.site?.location}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="active">Status</Label>
                <Select
                  id="active"
                  name="active"
                  defaultValue={dialog.site?.active !== false ? 'true' : 'false'}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialog({ open: false, mode: 'create', site: null })}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {dialog.mode === 'create' ? 'Add Site' : 'Update Site'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Site Expense Dialog */}
      <Dialog open={expenseDialog.open} onClose={() => setExpenseDialog({ open: false, site: null })}>
        <DialogContent onClose={() => setExpenseDialog({ open: false, site: null })}>
          <DialogHeader>
            <DialogTitle>
              Add Expense for {expenseDialog.site?.siteNumber} - {expenseDialog.site?.siteName}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleExpenseSubmit}>
            <div className="space-y-4 p-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Expense Type / Category</Label>
                <Input
                  id="category"
                  name="category"
                  placeholder="e.g., Materials, Transport"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  name="notes"
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setExpenseDialog({ open: false, site: null })}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createExpenseMutation.isPending}
              >
                Add Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
