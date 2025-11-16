
'use client';

import { useState, useEffect, useTransition } from 'react';
import { getUniqueCities } from '@/lib/data';
import { addCity, deleteCity } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function AddCityForm({ onCityAdded }: { onCityAdded: () => void }) {
    const [newCity, setNewCity] = useState('');
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCity.trim()) return;

        startTransition(async () => {
            const result = await addCity(newCity.trim());
            if (result.success) {
                toast({ title: 'Ciudad añadida' });
                setNewCity('');
                onCityAdded();
            } else {
                toast({ title: 'Error', description: result.message, variant: 'destructive' });
            }
        });
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input 
                placeholder="Nombre de la nueva ciudad" 
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                disabled={isPending}
            />
            <Button type="submit" disabled={isPending || !newCity.trim()}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <PlusCircle className="w-4 h-4"/>}
                <span className="ml-2 hidden sm:inline">Añadir</span>
            </Button>
        </form>
    );
}


export default function AdminLocationsPage() {
    const [cities, setCities] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchCities = async () => {
        setIsLoading(true);
        const cityData = await getUniqueCities();
        setCities(cityData);
        setIsLoading(false);
    }

    useEffect(() => {
        fetchCities();
    }, []);

    const handleDelete = async (city: string) => {
        if (!confirm(`¿Está seguro de que desea eliminar "${city}"? Esta acción no se puede deshacer.`)) {
            return;
        }
        const result = await deleteCity(city);
        if (result.success) {
            toast({ title: "Ciudad eliminada" });
            fetchCities();
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline">Gestionar Ubicaciones (Ciudades)</h1>
                <p className="text-muted-foreground">Añada o elimine ciudades que aparecerán en los formularios y filtros de todo el sitio.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Añadir Nueva Ciudad</CardTitle>
                </CardHeader>
                <CardContent>
                    <AddCityForm onCityAdded={fetchCities} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Ciudades ({cities.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {cities.map(city => (
                                <div key={city} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                                    <span className="font-medium">{city}</span>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(city)}>
                                        <Trash2 className="w-4 h-4"/>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                     {cities.length === 0 && !isLoading && (
                        <p className="text-center text-muted-foreground py-8">No hay ciudades añadidas.</p>
                     )}
                </CardContent>
            </Card>
        </div>
    )
}
