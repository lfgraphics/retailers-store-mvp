'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Trash2, UserPlus, Shield } from 'lucide-react';

interface AdminUser {
  _id: string;
  username: string;
  name: string;
  role: 'super_admin' | 'admin';
  createdAt: string;
}

export default function AdminsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    username: '',
    password: '',
    role: 'admin',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/retailer/login');
      return;
    }
    if (user?.role === 'retailer') { // In AuthContext, admin user has role 'retailer'
      fetchAdmins();
    }
  }, [user, isLoading, router]);

  const fetchAdmins = async () => {
    try {
      const data = await apiClient.get('/api/retailer/admins');
      setAdmins(data.admins);
    } catch (error) {
      console.error('Failed to fetch admins');
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleCreateAdmin = async () => {
    try {
      await apiClient.post('/api/retailer/admins', newAdmin);
      toast.success('Admin created successfully');
      setIsDialogOpen(false);
      setNewAdmin({ name: '', username: '', password: '', role: 'admin' });
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create admin');
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) return;
    try {
      await apiClient.delete(`/api/retailer/admins/${id}`);
      toast.success('Admin deleted successfully');
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete admin');
    }
  };

  if (isLoading || loadingAdmins) return <div className="p-8">Loading...</div>;

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Management</h1>
          <p className="text-muted-foreground">Manage access to the store dashboard</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add New Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Admin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input 
                  value={newAdmin.name} 
                  onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input 
                  value={newAdmin.username} 
                  onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
                  placeholder="johndoe"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input 
                  type="password"
                  value={newAdmin.password} 
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select 
                  value={newAdmin.role} 
                  onValueChange={(val) => setNewAdmin({...newAdmin, role: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleCreateAdmin}>Create Admin</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin._id}>
                  <TableCell className="font-medium">{admin.name}</TableCell>
                  <TableCell>{admin.username}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {admin.role === 'super_admin' && <Shield className="h-3 w-3 text-primary" />}
                      <span className="capitalize">{admin.role.replace('_', ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteAdmin(admin._id)}
                      disabled={admin._id === user?.id} // Prevent deleting self
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
