
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { resetPasswordForEmail } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setIsSubmitting(true);

        const result = await resetPasswordForEmail(email);

        if (result.success) {
            setSuccess(true);
            toast({ title: "Correo Enviado", description: result.message });
        } else {
            setError(result.message || 'Ocurrió un error desconocido.');
            toast({ title: "Error", description: result.message, variant: 'destructive' });
        }

        setIsSubmitting(false);
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]">
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-2xl font-bold font-headline">Restablecer Contraseña</CardTitle>
                    <CardDescription>
                        Introduzca su correo electrónico para recibir un enlace para restablecer su contraseña.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <div className="text-center space-y-4">
                            <p>Se ha enviado un correo electrónico a <strong>{email}</strong> con instrucciones para restablecer su contraseña. Por favor, revise su bandeja de entrada.</p>
                            <Button asChild>
                                <Link href="/signin">Volver a Iniciar Sesión</Link>
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="nombre@ejemplo.com" 
                                    required 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                    disabled={isSubmitting}
                                />
                            </div>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enviar Correo de Restablecimiento
                            </Button>
                        </form>
                    )}
                    <div className="mt-6 text-center text-sm">
                        ¿Recuerda su contraseña?{" "}
                        <Link href="/signin" className="text-primary font-semibold hover:underline">
                            Iniciar sesión
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
