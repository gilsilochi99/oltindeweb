

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUniqueCategories } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function AdminCategoriesPage() {
    const categories = await getUniqueCategories();
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline">Gestionar Categorías</h1>
                <p className="text-muted-foreground">A continuación se muestran todas las categorías en uso en el sitio y el número de elementos en cada una.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Categorías ({categories.length})</CardTitle>
                    <CardDescription>Estas categorías se generan a partir de los datos de empresas, instituciones y trámites.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre de la Categoría</TableHead>
                                <TableHead className="text-center">Empresas</TableHead>
                                <TableHead className="text-center">Instituciones</TableHead>
                                <TableHead className="text-center">Trámites</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.map(category => (
                                <TableRow key={category.name}>
                                    <TableCell className="font-medium">{category.name}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={category.companyCount > 0 ? "default" : "outline"} className="w-12 justify-center">
                                            {category.companyCount}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={category.institutionCount > 0 ? "default" : "outline"} className="w-12 justify-center">
                                            {category.institutionCount}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={category.procedureCount > 0 ? "default" : "outline"} className="w-12 justify-center">
                                            {category.procedureCount}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
