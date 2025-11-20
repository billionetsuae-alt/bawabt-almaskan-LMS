import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { backupAPI } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Database, Download, Trash2, RotateCcw, Plus, ExternalLink, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

export function Backup() {
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, backup: null });
  const [schedulerFrequency, setSchedulerFrequency] = useState('monthly');
  const { showToast } = useUIStore();
  const queryClient = useQueryClient();

  // Fetch backups
  const { data: backupData, isLoading } = useQuery({
    queryKey: ['backups'],
    queryFn: async () => {
      const res = await backupAPI.list(50);
      return res.data;
    },
  });

  // Fetch scheduler status
  const { data: schedulerStatus } = useQuery({
    queryKey: ['scheduler-status'],
    queryFn: async () => {
      const res = await backupAPI.getSchedulerStatus();
      return res.data;
    },
  });

  // Create backup mutation
  const createMutation = useMutation({
    mutationFn: backupAPI.create,
    onSuccess: (res) => {
      queryClient.invalidateQueries(['backups']);
      showToast({ message: 'Backup created successfully', type: 'success' });
    },
    onError: (error) => {
      showToast({ message: error.response?.data?.error || 'Failed to create backup', type: 'error' });
    },
  });

  // Delete backup mutation
  const deleteMutation = useMutation({
    mutationFn: backupAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['backups']);
      showToast({ message: 'Backup deleted successfully', type: 'success' });
      setConfirmDialog({ open: false, type: null, backup: null });
    },
    onError: (error) => {
      showToast({ message: error.response?.data?.error || 'Failed to delete backup', type: 'error' });
    },
  });

  // Restore backup mutation
  const restoreMutation = useMutation({
    mutationFn: backupAPI.restore,
    onSuccess: () => {
      queryClient.invalidateQueries();
      showToast({ message: 'Data restored successfully from backup', type: 'success' });
      setConfirmDialog({ open: false, type: null, backup: null });
    },
    onError: (error) => {
      showToast({ message: error.response?.data?.error || 'Failed to restore backup', type: 'error' });
    },
  });

  // Cleanup old backups mutation
  const cleanupMutation = useMutation({
    mutationFn: () => backupAPI.cleanup(30),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['backups']);
      showToast({ message: res.data.message, type: 'success' });
    },
    onError: (error) => {
      showToast({ message: error.response?.data?.error || 'Failed to cleanup backups', type: 'error' });
    },
  });

  // Enable scheduler mutation
  const enableSchedulerMutation = useMutation({
    mutationFn: (frequency) => backupAPI.enableScheduler(frequency),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['scheduler-status']);
      showToast({ message: res.data.message, type: 'success' });
    },
    onError: (error) => {
      showToast({ message: error.response?.data?.error || 'Failed to enable scheduler', type: 'error' });
    },
  });

  // Disable scheduler mutation
  const disableSchedulerMutation = useMutation({
    mutationFn: backupAPI.disableScheduler,
    onSuccess: (res) => {
      queryClient.invalidateQueries(['scheduler-status']);
      showToast({ message: res.data.message, type: 'success' });
    },
    onError: (error) => {
      showToast({ message: error.response?.data?.error || 'Failed to disable scheduler', type: 'error' });
    },
  });

  const handleConfirm = () => {
    if (confirmDialog.type === 'delete') {
      deleteMutation.mutate(confirmDialog.backup.id);
    } else if (confirmDialog.type === 'restore') {
      restoreMutation.mutate(confirmDialog.backup.id);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${kb.toFixed(2)} KB`;
  };

  const backups = backupData?.backups || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Backup Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage Google Drive backups of your data
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => cleanupMutation.mutate()}
            variant="outline"
            disabled={cleanupMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {cleanupMutation.isPending ? 'Cleaning...' : 'Cleanup Old'}
          </Button>
          <Button 
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            {createMutation.isPending ? 'Creating...' : 'Create Backup'}
          </Button>
        </div>
      </div>

      {/* Automatic Backup Scheduler */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Automatic Backup Schedule</CardTitle>
            </div>
            {schedulerStatus?.active && (
              <Badge variant="success">Active</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Automatically create backups on a schedule to protect your data.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select
                  value={schedulerFrequency}
                  onChange={(e) => setSchedulerFrequency(e.target.value)}
                  className="flex-1"
                >
                  <option value="monthly">Monthly (1st of each month)</option>
                  <option value="weekly">Weekly (Every Sunday)</option>
                  <option value="daily">Daily (Every day at 1 AM)</option>
                </Select>
                {schedulerStatus?.active ? (
                  <Button
                    variant="destructive"
                    onClick={() => disableSchedulerMutation.mutate()}
                    disabled={disableSchedulerMutation.isPending}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    {disableSchedulerMutation.isPending ? 'Disabling...' : 'Disable'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => enableSchedulerMutation.mutate(schedulerFrequency)}
                    disabled={enableSchedulerMutation.isPending}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    {enableSchedulerMutation.isPending ? 'Enabling...' : 'Enable'}
                  </Button>
                )}
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">Current Schedule:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Frequency:</span>
                  <span className="font-medium">
                    {schedulerStatus?.active ? 'Monthly' : 'Not scheduled'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Next run:</span>
                  <span className="font-medium">
                    {schedulerStatus?.active ? '1st of next month, 2:00 AM UAE' : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Backups</p>
                <p className="text-2xl font-bold">{backups.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-lg">
                <Download className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Latest Backup</p>
                <p className="text-sm font-medium">
                  {backups[0] ? format(new Date(backups[0].createdAt), 'MMM dd, HH:mm') : 'No backups yet'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-info/10 rounded-lg">
                <Database className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Size</p>
                <p className="text-sm font-medium">
                  {formatBytes(backups.reduce((sum, b) => sum + parseInt(b.size || 0), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backups List */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading backups...</div>
          ) : backups.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No backups yet. Create your first backup to get started.</p>
              <Button onClick={() => createMutation.mutate()}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Backup
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div 
                  key={backup.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors gap-3"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-primary/10 rounded-lg mt-1">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{backup.name}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                        <span>Created: {format(new Date(backup.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                        <span>Size: {formatBytes(backup.size)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {backup.link && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(backup.link, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmDialog({ open: true, type: 'restore', backup })}
                    >
                      <RotateCcw className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Restore</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setConfirmDialog({ open: true, type: 'delete', backup })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog 
        open={confirmDialog.open} 
        onClose={() => setConfirmDialog({ open: false, type: null, backup: null })}
      >
        <DialogContent onClose={() => setConfirmDialog({ open: false, type: null, backup: null })}>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === 'delete' ? 'Delete Backup' : 'Restore Backup'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {confirmDialog.type === 'delete' ? (
              <div>
                <p className="text-muted-foreground mb-4">
                  Are you sure you want to delete this backup? This action cannot be undone.
                </p>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="font-medium">{confirmDialog.backup?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {confirmDialog.backup?.createdAt && format(new Date(confirmDialog.backup.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <p className="text-sm font-medium">Warning: This will overwrite all current data</p>
                </div>
                <p className="text-muted-foreground mb-4">
                  All current data will be replaced with data from this backup. Make sure you have created a recent backup before proceeding.
                </p>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="font-medium">{confirmDialog.backup?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {confirmDialog.backup?.createdAt && format(new Date(confirmDialog.backup.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, type: null, backup: null })}
            >
              Cancel
            </Button>
            <Button
              variant={confirmDialog.type === 'delete' ? 'destructive' : 'default'}
              onClick={handleConfirm}
              disabled={deleteMutation.isPending || restoreMutation.isPending}
            >
              {confirmDialog.type === 'delete' ? (
                deleteMutation.isPending ? 'Deleting...' : 'Delete'
              ) : (
                restoreMutation.isPending ? 'Restoring...' : 'Restore'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
