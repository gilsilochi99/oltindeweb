
import type { AnnouncementWithCompany } from "@/app/announcements/page";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export function AnnouncementCard({ announcement }: { announcement: AnnouncementWithCompany }) {
  return (
    <Card className="w-full overflow-hidden transition-all hover:shadow-md flex flex-col">
        <CardHeader className="p-4">
            <div className="flex gap-4">
                <div className="w-16 h-16 shrink-0">
                    <Link href={`/companies/${announcement.companyId}`}>
                        <Image src={announcement.companyLogo} alt={`${announcement.companyName} logo`} width={64} height={64} className="object-contain bg-muted border" />
                    </Link>
                </div>
                <div className="flex-grow">
                     <div className="flex justify-between items-start">
                        <div>
                            <Link href={`/companies/${announcement.companyId}`} className="text-sm text-primary font-semibold hover:underline">
                                {announcement.companyName}
                            </Link>
                            <h3 className="text-lg font-bold font-headline leading-tight mt-1">
                                <Link href={`/announcements/${announcement.id}`} className="hover:underline">
                                    {announcement.title}
                                </Link>
                            </h3>
                        </div>
                    </div>
                     <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{announcement.content}</p>
                </div>
                 {announcement.image && (
                    <div className="w-20 h-20 shrink-0 hidden sm:block">
                        <Link href={`/announcements/${announcement.id}`}>
                            <Image src={announcement.image} alt={announcement.title} width={80} height={80} className="object-cover bg-muted border rounded-md" />
                        </Link>
                    </div>
                )}
            </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3 flex-grow">
             <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-1.5"/>
                <span>
                    Publicado el {new Date(announcement.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
            </div>
        </CardContent>
    </Card>
  );
}
