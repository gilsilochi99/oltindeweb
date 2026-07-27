
'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, notFound } from 'next/navigation';
import { getCompanyById, getMenuItemsByCompany } from '@/lib/data';
import { deleteMenuItem, toggleMenuItemAvailable } from '@/lib/actions';
import type { Company, MenuItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, UtensilsCrossed, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

export default function CompanyMenuPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const companyData = await getCompanyById(companyId);
    if (!companyData || companyData.ownerId !== user.uid) {
      notFound();
      return;
    }
    const menuItems = await getMenuItemsByCompany(companyId);
    setCompany(companyData);
    setItems(menuItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setIsLoading(false);
  }, [user, companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (itemId: string) => {
    if (!user) return;
    const result = await deleteMenuItem(itemId, user.uid);
    if (result.success) {
      toast({ title: 'Producto eliminado' });
      fetchData();
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };

  const handleToggleAvailable = async (itemId: string) => {
    if (!user) return;
    const result = await toggleMenuItemAvailable(itemId, user.uid);
    if (result.success) {
      toast({ title: result.available ? 'Producto marcado como disponible' : 'Producto marcado como agotado' });
      fetchData();
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Gestionar Menú</h1>
          <p className="text-muted-foreground">
            Para la empresa: <Link href={`/companies/${company.id}`} className="font-semibold text-black hover:underline">{company.name}</Link>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/companies/${companyId}/orders`}>Ver Pedidos</Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/companies/${companyId}/menu/new`}>
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Producto
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Productos del Menú ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="relative overflow-hidden">
                  <CardContent className="p-4 flex gap-4">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} width={80} height={80} className="w-20 h-20 rounded-md object-cover shrink-0" />
                    ) : (
                      <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <UtensilsCrossed className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-bold flex items-center gap-2">
                            {item.name}
                            {item.isMenuDelDia && <Badge variant="secondary" className="bg-primary/20">Menú del Día</Badge>}
                            {!item.available && <Badge variant="outline" className="text-destructive border-destructive">Agotado</Badge>}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.foodType}</p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                        </div>
                        <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 shrink-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/companies/${companyId}/menu/${item.id}`}>Editar</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleAvailable(item.id)}>
                                {item.available ? 'Marcar como agotado' : 'Marcar como disponible'}
                              </DropdownMenuItem>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                              </AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente este producto del menú.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item.id)}>Sí, eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <p className="font-semibold mt-2">{item.price.toLocaleString('es-ES')} XAF</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No hay productos en el menú todavía.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
