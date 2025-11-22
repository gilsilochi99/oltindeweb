import { getAnnouncementById } from "@/lib/data";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Calendar, Megaphone, Phone, Mail, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

interface AnnouncementDetailPageProps {
    params: { 
        id: string;
    };
    searchParams: { [key: string]: string | string[] | undefined };
}

export default async function AnnouncementDetailPage({ params }: AnnouncementDetailPageProps) {
  const data = await getAnnouncementById(params.id);

  if (!data) {
    notFound();
  }

  const { announcement, entity } = data;
  const mainBranch = entity.branches?.[0];

  const entityTypePath = 'type' in entity && entity.type === 'company' ? 'companies' : 'institutions';


  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Card className="overflow-hidden">
            {announcement.image && (
                <div className="aspect-video relative">
                    <Image src={announcement.image} alt={announcement.title} fill className="object-cover" />
                </div>
            )}
            <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Megaphone className="w-4 h-4" />
                    <span>Anuncio</span>
                </div>
                <CardTitle className="text-4xl font-bold font-headline mt-2">{announcement.title}</CardTitle>
                <CardDescription className="text-lg pt-2">
                    Publicado el {new Date(announcement.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: announcement.content }} />
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Publicado por</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    {entity.logo && <Image src={entity.logo} alt={`${entity.name} logo`} width={60} height={60} className="rounded-md border bg-muted" />}
                    <div>
                        <h3 className="font-semibold text-lg">{entity.name}</h3>
                        <p className="text-sm text-muted-foreground">{entity.category}</p>
                    </div>
                </div>
                <Separator className="my-4" />
                <div className="space-y-2 text-sm">
                    {mainBranch && (
                        <>
                            {mainBranch.contact.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span>{mainBranch.contact.phone}</span>
                                </div>
                            )}
                            {mainBranch.location.address && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                    <span>{mainBranch.location.address}, {mainBranch.location.city}</span>
                                </div>
                            )}
                        </>
                    )}
                    {entity.contact.email && (
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <a href={`mailto:${entity.contact.email}`} className="text-primary hover:underline">{entity.contact.email}</a>
                        </div>
                    )}
                </div>
                <Button asChild className="mt-4">
                    <Link href={`/${entityTypePath}/${entity.id}`}><Building className="w-4 h-4 mr-2" />Ver Perfil Completo</Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
