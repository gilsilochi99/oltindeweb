
import type { HealthFacility } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "../ui/badge";

const HREF_PREFIX: Record<HealthFacility['type'], string> = {
    pharmacy: '/health/pharmacies',
    clinic: '/health/clinics',
    hospital: '/health/hospitals',
};

const TYPE_LABEL: Record<HealthFacility['type'], string> = {
    pharmacy: 'Farmacia',
    clinic: 'Clínica',
    hospital: 'Hospital',
};

export function HealthFacilityCard({ facility }: { facility: HealthFacility }) {
    const href = `${HREF_PREFIX[facility.type]}/${facility.id}`;
    return (
        <Card className="w-full overflow-hidden transition-all hover:shadow-md flex flex-col">
            <CardHeader className="p-4">
                <div className="flex gap-4">
                    <div className="w-14 h-14 shrink-0">
                        <Image src={facility.image || 'https://placehold.co/100x100/CCCCCC/000000?text=' + facility.name.substring(0, 2).toUpperCase()} alt={facility.name} width={56} height={56} className="object-contain rounded bg-muted w-14 h-14" />
                    </div>
                    <div className="flex-grow min-w-0">
                        <Badge variant="secondary" className="mb-1">{TYPE_LABEL[facility.type]}</Badge>
                        <h3 className="text-lg font-bold font-headline leading-tight">
                            <Link href={href} className="hover:underline">
                                {facility.name}
                            </Link>
                        </h3>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3 flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-2">{facility.description}</p>
                {facility.branches?.[0] && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{facility.branches[0].location.city}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
