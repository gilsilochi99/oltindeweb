

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getUsers } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RoleManager } from "./_components/RoleManager";
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { AppUser } from '@/lib/types';
import { UserForm } from './_components/UserForm';
import { UserPremiumSwitch } from './_components/UserPremiumSwitch';
import { Input } from '@/components/ui/input';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    fetchData();
  };

  const getRoleVariant = (role: AppUser['role']) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'manager':
        return 'secondary';
      case 'editor':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-headline">Gestionar Usuarios</h1>
          <p className="text-muted-foreground">Ver y gestionar los usuarios de la plataforma.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Añadir Usuario
        </Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
              <div>
                  <CardTitle>Todos los Usuarios ({filteredUsers.length})</CardTitle>
                  <CardDescription>A continuación se muestran todos los usuarios registrados en Oltinde.</CardDescription>
              </div>
              <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
              />
          </div>
        </CardHeader>
        <CardContent>
           {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-center">Premium</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                              <AvatarFallback>{user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span>{user.displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleVariant(user.role)}>
                        {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Usuario'}
                      </Badge>
                    </TableCell>
                     <TableCell className="text-center">
                        <UserPremiumSwitch userId={user.id} isPremium={user.isPremium || false} />
                    </TableCell>
                    <TableCell className="text-right">
                      <RoleManager userId={user.id} currentRole={user.role || 'user'} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Añadir Nuevo Usuario</DialogTitle>
                <DialogDescription>
                    Complete los detalles del usuario a continuación.
                </DialogDescription>
            </DialogHeader>
            <UserForm onFormSubmit={handleFormSubmit} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
