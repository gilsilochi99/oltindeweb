
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";

// Simple inline SVG for Google icon
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.9-4.7 1.9-3.57 0-6.45-3.05-6.45-6.8s2.88-6.8 6.45-6.8c1.93 0 3.26.74 4.18 1.59l2.48-2.48C17.23 2.1 15.02 1 12.48 1 7.1 1 3.08 5.14 3.08 10.5s4.02 9.5 9.4 9.5c2.53 0 4.54-.82 6.1-2.4s2.2-3.9 2.2-6.5c0-.6-.05-1.15-.15-1.7H12.48z" />
    </svg>
);

export default function SignUpPage() {
    const { signup, user, loading, signInWithGoogle } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && user) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);


    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
         if (!agreed) {
            setError("Debe aceptar los Términos de Servicio.");
            return;
        }
        try {
            await signup(email, password, fullName);
            toast({ title: "¡Cuenta creada con éxito!", description: "Se ha enviado un correo de verificación. Por favor, revise su bandeja de entrada." });
            router.push('/signin');
        } catch (err: any) {
            setError(err.message);
        }
    };

     const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            toast({ title: "Inicio de sesión con Google exitoso" });
            router.push('/dashboard');
        } catch (err) {
             console.error(err);
             setError("No se pudo iniciar sesión con Google.");
        }
    }
    
    if(loading || user) {
        return <div>Cargando...</div>
    }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-20rem)]">
        <Card className="w-full max-w-md mx-auto shadow-none border-0 md:shadow-sm md:border">
            <CardHeader className="text-center space-y-2">
                <CardTitle className="text-3xl font-bold font-headline">Crea tu Cuenta</CardTitle>
                <CardDescription>
                    Únase para listar su empresa y mucho más.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                    <GoogleIcon className="mr-2 h-4 w-4" />
                    Continuar con Google
                </Button>

                 <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                        O registrarse con
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="fullname">Nombre Completo</Label>
                        <Input id="fullname" type="text" placeholder="Su Nombre Completo" required value={fullName} onChange={e => setFullName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input id="email" type="email" placeholder="nombre@ejemplo.com" required value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="terms" checked={agreed} onCheckedChange={(checked) => setAgreed(checked as boolean)} />
                        <label
                            htmlFor="terms"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Acepto los <Link href="/terms" className="underline text-primary">Términos de Servicio</Link>
                        </label>
                    </div>
                     {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button type="submit" className="w-full">
                        Crear Cuenta
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm">
                    ¿Ya tiene una cuenta?{" "}
                    <Link href="/signin" className="text-primary font-semibold hover:underline">
                        Inicie sesión
                    </Link>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
