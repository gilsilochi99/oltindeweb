
'use client';

import { getProfessionals } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ProfessionalVerificationSwitch } from "./_components/ProfessionalVerificationSwitch";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, useMemo } from "react";
import type { Professional } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export default function AdminProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const professionalsData = await getProfessionals();
      setProfessionals(professionalsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredProfessionals = useMemo(() => {
    return professionals.filter(professional =>
      professional.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [professionals, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-headline">Gestionar Profesionales</h1>
        <p className="text-muted-foreground">Verificar o revisar perfiles de profesionales independientes.</p>
      </div>
      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Todos los Profesionales ({filteredProfessionals.length})</CardTitle>
                    <CardDescription>A continuación se muestran todos los perfiles profesionales en la plataforma.</CardDescription>
                </div>
                <Input
                    placeholder="Buscar por nombre..."
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
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Verificado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfessionals.map((professional) => (
                  <TableRow key={professional.id}>
                    <TableCell className="font-medium">{professional.displayName}</TableCell>
                    <TableCell>{professional.category}</TableCell>
                    <TableCell>{professional.city}</TableCell>
                    <TableCell>
                      {professional.isVerified ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Verificado</Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-yellow-100 text-yellow-800">No Verificado</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <ProfessionalVerificationSwitch professionalId={professional.id} isVerified={professional.isVerified} />
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/professionals/${professional.id}`} target="_blank">
                                    Ver Perfil Público <ExternalLink className="ml-2 h-3 w-3" />
                                </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
