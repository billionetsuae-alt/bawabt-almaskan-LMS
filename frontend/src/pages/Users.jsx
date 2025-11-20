import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Users as UsersIcon, Plus, Edit2, Trash2, Shield, UserCog } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function Users() {
  const [dialog, setDialog] = useState({ open: false, user: null, mode: 'add' });
  const { showToast } = useUIStore();
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
  });

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/users`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setDialog({ open: false, user: null, mode: 'add' });
      showToast({ message: 'User created successfully', type: 'success' });
    },
    onError: (error) => {
      showToast({ 
        message: error.response?.data?.error || 'Failed to create user', 
        type: 'error' 
      });
    },
  });

  // Update user mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }) => {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/api/users/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setDialog({ open: false, user: null, mode: 'add' });
      showToast({ message: 'User updated successfully', type: 'success' });
    },
    onError: (error) => {
      showToast({ 
        message: error.response?.data?.error || 'Failed to update user', 
        type: 'error' 
      });
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      showToast({ message: 'User deleted successfully', type: 'success' });
    },
    onError: (error) => {
      showToast({ 
        message: error.response?.data?.error || 'Failed to delete user', 
        type: 'error' 
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      email: formData.get('email'),
      name: formData.get('name'),
      role: formData.get('role'),
    };

    if (formData.get('password')) {
      data.password = formData.get('password');
    }

    if (dialog.mode === 'edit') {
      updateMutation.mutate({ id: dialog.user.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (user) => {
    if (user.role === 'manager') {
      showToast({ message: 'Cannot delete manager account', type: 'error' });
      return;
    }
    if (confirm(`Delete user ${user.name}?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const managers = users.filter(u => u.role === 'manager');
  const supervisors = users.filter(u => u.role === 'supervisor');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage supervisor accounts
          </p>
        </div>
        <Button onClick={() => setDialog({ open: true, user: null, mode: 'add' })}>
          <Plus className="h-4 w-4 mr-2" />
          Add Supervisor
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Managers */}
          <Card className="shadow-3d border-0 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary to-success/50" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Managers ({managers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {managers.map(user => (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between p-4 bg-success-light rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/20 p-2 rounded-lg">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Badge variant="success">Manager</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Supervisors */}
          <Card className="shadow-3d border-0 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-accent to-accent/50" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-accent" />
                Supervisors ({supervisors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {supervisors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCog className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No supervisors yet</p>
                  <p className="text-sm mt-1">Add your first supervisor</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {supervisors.map(user => (
                    <div 
                      key={user.id} 
                      className="flex items-center justify-between p-4 bg-accent-light rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-accent/20 p-2 rounded-lg">
                          <UserCog className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDialog({ open: true, user, mode: 'edit' })}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(user)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, user: null, mode: 'add' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog.mode === 'edit' ? 'Edit User' : 'Add Supervisor'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={dialog.user?.name}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={dialog.user?.email}
                placeholder="john@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                id="role"
                name="role"
                defaultValue={dialog.user?.role || 'supervisor'}
                required
              >
                <option value="supervisor">Supervisor</option>
                <option value="manager">Manager</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password {dialog.mode === 'edit' && '(leave blank to keep current)'}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required={dialog.mode === 'add'}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialog({ open: false, user: null, mode: 'add' })}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {dialog.mode === 'edit' ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
