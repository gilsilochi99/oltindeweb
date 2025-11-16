
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getUsers, getCompanies, getInstitutions } from "@/lib/data";
import { Briefcase, Landmark, Users, MessageSquare } from "lucide-react";

export default async function AdminDashboardPage() {
  const users = await getUsers();
  const companies = await getCompanies();
  const institutions = await getInstitutions();
  const totalReviews = companies.reduce((acc, company) => acc + (company.reviews?.length || 0), 0)
    + institutions.reduce((acc, inst) => acc + (inst.reviews?.length || 0), 0);


  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold font-headline">Panel de Administración</h1>
        <p className="text-muted-foreground">Una vista general del contenido de la plataforma.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Empresas Totales
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
            <p className="text-xs text-muted-foreground">
              Empresas listadas en el directorio.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Instituciones
            </CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{institutions.length}</div>
             <p className="text-xs text-muted-foreground">
              Instituciones listadas en el directorio.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Registrados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de usuarios en la plataforma.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reseñas Totales
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReviews}</div>
            <p className="text-xs text-muted-foreground">
              Total de reseñas en la plataforma.
            </p>
          </CardContent>
        </Card>
      </div>
       <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>Próximamente se mostrarán las últimas acciones de los usuarios.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center text-muted-foreground py-8">
                El registro de actividad estará disponible aquí.
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
