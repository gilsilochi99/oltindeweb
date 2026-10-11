'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Loader2, MailWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { getMyPrivateRentalsInfo } from '@/lib/rentals/actions';

// "Mis alquileres" (private advertiser): signed-in users only; publishing
// also needs a verified email, which the server checks on every write.
export function PrivateRentalsGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [info, setInfo] = useState<Awaited<ReturnType<typeof getMyPrivateRentalsInfo>> | null>(null);

  useEffect(() => {
    if (user) getMyPrivateRentalsInfo().then(setInfo);
  }, [user]);

  if (loading || (user && !info)) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>;
  }
  if (!user) {
    return (
      <Card className="max-w-lg"><CardContent className="py-10 text-center space-y-3">
        <p className="font-semibold">Inicie sesión para alquilar sus cosas en Oltinde</p>
        <p className="text-sm text-muted-foreground">Sillas, carpas, sonido, herramientas, un salón, un coche... publíquelo gratis y reciba solicitudes de reserva.</p>
        <Button asChild><Link href="/signin">Iniciar sesión</Link></Button>
      </CardContent></Card>
    );
  }
  return (
    <div className="space-y-4">
      {info && !info.emailVerified && (
        <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 max-w-4xl">
          <MailWarning className="w-5 h-5 shrink-0" />
          <p>Para publicar anuncios como particular, confirme primero su correo electrónico con el enlace que le enviamos al registrarse. Después vuelva a entrar en Oltinde.</p>
        </div>
      )}
      {children}
    </div>
  );
}
