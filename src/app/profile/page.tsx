
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, User, Mail, Shield, Linkedin, Twitter, Bell, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile, updateUserNotificationSettings } from '@/lib/actions';
import { getUniqueCategories, getCompanyById } from '@/lib/data';
import type { Company } from '@/lib/types';
import { useTransition, useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';

const profileFormSchema = z.object({
    displayName: z.string().min(2, "El nombre es demasiado corto."),
    title: z.string().optional(),
    socials: z.object({
        linkedin: z.string().url("URL de LinkedIn no válida.").optional().or(z.literal('')),
        twitter: z.string().url("URL de Twitter no válida.").optional().or(z.literal('')),
    }).optional(),
});

const notificationSettingsSchema = z.object({
  email: z.object({
    newOffers: z.boolean().default(false),
    newAnnouncements: z.boolean().default(false),
    newJobs: z.boolean().default(false),
    newEvents: z.boolean().default(false),
  }),
});


type ProfileFormValues = z.infer<typeof profileFormSchema>;
type NotificationSettingsFormValues = z.infer<typeof notificationSettingsSchema>;

export default function ProfilePage() {
  const { user, loading, isAdmin, signout, subscriptions, addSubscription, removeSubscription } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isSettingsPending, startSettingsTransition] = useTransition();
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [subscribedCompanies, setSubscribedCompanies] = useState<Company[]>([]);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
        displayName: '',
        title: '',
        socials: { linkedin: '', twitter: '' }
    },
  });

  const notificationsForm = useForm<NotificationSettingsFormValues>({
      resolver: zodResolver(notificationSettingsSchema),
      defaultValues: {
        email: {
          newOffers: false,
          newAnnouncements: false,
          newJobs: false,
          newEvents: false,
        }
      }
  })

  useEffect(() => {
    if (user) {
      profileForm.reset({
        displayName: user.displayName || '',
        title: user.title || '',
        socials: {
            linkedin: user.socials?.linkedin || '',
            twitter: user.socials?.twitter || '',
        }
      });
      notificationsForm.reset({
        email: {
            newOffers: user.notificationSettings?.email?.newOffers || false,
            newAnnouncements: user.notificationSettings?.email?.newAnnouncements || false,
            newJobs: user.notificationSettings?.email?.newJobs || false,
            newEvents: user.notificationSettings?.email?.newEvents || false,
        }
      })
    }
  }, [user, profileForm, notificationsForm]);

  useEffect(() => {
    getUniqueCategories().then(categories => setAvailableCategories(categories.map(c => c.name)));
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.all(subscriptions.companies.map(id => getCompanyById(id)))
      .then(companies => setSubscribedCompanies(companies.filter(Boolean) as Company[]));
  }, [user, subscriptions.companies]);

  const handleAddCategory = async () => {
    if (!selectedCategory) return;
    await addSubscription('category', selectedCategory);
    toast({ title: `Suscrito a la categoría "${selectedCategory}"` });
    setSelectedCategory('');
  };

  const handleRemoveCategory = async (category: string) => {
    await removeSubscription('category', category);
    toast({ title: `Suscripción a "${category}" cancelada` });
  };

  const handleRemoveCompany = async (companyId: string, companyName: string) => {
    await removeSubscription('company', companyId);
    toast({ title: `Suscripción a ${companyName} cancelada` });
  };

  const unsubscribedCategories = availableCategories.filter(c => !subscriptions.categories.includes(c));

  const onProfileSubmit = (values: ProfileFormValues) => {
    if (!user) return;
    startTransition(async () => {
        const result = await updateUserProfile(user.uid, values);
        if (result.success) {
            toast({ title: 'Perfil Actualizado', description: 'Sus cambios han sido guardados.' });
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    });
  }
  
   const onNotificationsSubmit = (values: NotificationSettingsFormValues) => {
    if (!user) return;
    startSettingsTransition(async () => {
        const result = await updateUserNotificationSettings(user.uid, values);
        if (result.success) {
            toast({ title: 'Configuración Guardada', description: 'Sus preferencias de notificación han sido actualizadas.' });
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push('/signin');
    return null;
  }

  const userInitial = user.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="w-8 h-8" />;

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="h-24 w-24 text-4xl">
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl">{user.displayName}</CardTitle>
              <CardDescription className="text-lg">{user.email}</CardDescription>
            </div>
            {isAdmin && <Badge><Shield className="w-3 h-3 mr-1.5"/>Administrador</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6 p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold">Información del Perfil y Autor</h3>
                     <FormField
                        control={profileForm.control}
                        name="displayName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre Completo</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={profileForm.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cargo Profesional (para contribuciones)</FormLabel>
                                <FormControl><Input placeholder="Ej: CEO, Fundador, Experto en Marketing" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                            control={profileForm.control}
                            name="socials.linkedin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Perfil de LinkedIn</FormLabel>
                                     <div className="relative">
                                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <FormControl><Input className="pl-9" {...field} /></FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={profileForm.control}
                            name="socials.twitter"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Perfil de Twitter (X)</FormLabel>
                                     <div className="relative">
                                        <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <FormControl><Input className="pl-9" {...field} /></FormControl>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Cambios de Perfil
                    </Button>
                </form>
            </Form>

            <div className="space-y-6 p-4 border rounded-lg">
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Mis Suscripciones</h3>
                    <p className="text-sm text-muted-foreground">
                        Siga categorías o empresas para recibir una notificación cada vez que publiquen una nueva oferta, anuncio, empleo o evento.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>Categorías</Label>
                    <div className="flex gap-2">
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Añadir una categoría..." />
                            </SelectTrigger>
                            <SelectContent>
                                {unsubscribedCategories.map(category => (
                                    <SelectItem key={category} value={category}>{category}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="button" onClick={handleAddCategory} disabled={!selectedCategory}>Añadir</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {subscriptions.categories.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No sigue ninguna categoría todavía.</p>
                        ) : subscriptions.categories.map(category => (
                            <Badge key={category} variant="secondary" className="gap-1.5 pl-3">
                                {category}
                                <button type="button" onClick={() => handleRemoveCategory(category)} className="hover:text-destructive" aria-label={`Cancelar suscripción a ${category}`}>
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Empresas</Label>
                    <p className="text-sm text-muted-foreground">
                        Visite el perfil de una empresa y pulse el icono de la campana <Bell className="w-3.5 h-3.5 inline-block" /> para seguirla.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {subscribedCompanies.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No sigue ninguna empresa todavía.</p>
                        ) : subscribedCompanies.map(company => (
                            <Badge key={company.id} variant="secondary" className="gap-1.5 pl-3">
                                <Link href={`/companies/${company.id}`} className="hover:underline">{company.name}</Link>
                                <button type="button" onClick={() => handleRemoveCompany(company.id, company.name)} className="hover:text-destructive" aria-label={`Cancelar suscripción a ${company.name}`}>
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>

            <Form {...notificationsForm}>
                <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-6 p-4 border rounded-lg">
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Configuración de Notificaciones por Email</h3>
                        <p className="text-sm text-muted-foreground">Elija qué notificaciones desea recibir en su correo electrónico.</p>
                    </div>
                     <FormField
                        control={notificationsForm.control}
                        name="email.newAnnouncements"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        Nuevos Anuncios
                                    </FormLabel>
                                    <FormDescription>
                                        Recibir un email cuando las empresas o categorías a las que sigue publiquen un nuevo anuncio.
                                    </FormDescription>
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={notificationsForm.control}
                        name="email.newOffers"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        Nuevas Ofertas
                                    </FormLabel>
                                    <FormDescription>
                                        Recibir un email cuando las empresas o categorías a las que sigue publiquen una nueva oferta o descuento.
                                    </FormDescription>
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={notificationsForm.control}
                        name="email.newJobs"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        Nuevos Empleos
                                    </FormLabel>
                                    <FormDescription>
                                        Recibir un email cuando las empresas o categorías a las que sigue publiquen una nueva oferta de empleo.
                                    </FormDescription>
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={notificationsForm.control}
                        name="email.newEvents"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        Nuevos Eventos
                                    </FormLabel>
                                    <FormDescription>
                                        Recibir un email cuando las empresas o categorías a las que sigue organicen un nuevo evento.
                                    </FormDescription>
                                </div>
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isSettingsPending}>
                        {isSettingsPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Configuración de Notificaciones
                    </Button>
                </form>
            </Form>

            <div className="flex flex-col items-center space-y-4 pt-4 border-t mt-6">
                <Button onClick={() => router.push('/dashboard')}>Ir al Panel de Control</Button>
                <Button variant="ghost" onClick={signout}>Cerrar Sesión</Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
