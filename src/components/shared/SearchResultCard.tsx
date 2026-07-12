
'use client';

import type { Company, Institution, Procedure, Service } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Building, Landmark, FileText, Briefcase, ExternalLink, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type SearchableItem = (Company | Institution | Procedure | Service) & { entityType: 'company' | 'institution' | 'procedure' | 'service' };

const createSlug = (name: string) => name.toLowerCase().replace(/ /g, '-');

function getHref(item: SearchableItem): string {
    switch (item.entityType) {
        case 'company': return `/companies/${item.id}`;
        case 'institution': return `/institutions/${item.id}`;
        case 'procedure': return `/procedures/${item.id}`;
        case 'service': return `/services/${createSlug(item.name)}`;
    }
}

function getIcon(type: SearchableItem['entityType']) {
    switch (type) {
        case 'company': return <Building className="w-5 h-5 text-primary" />;
        case 'institution': return <Landmark className="w-5 h-5 text-primary" />;
        case 'procedure': return <FileText className="w-5 h-5 text-primary" />;
        case 'service': return <Briefcase className="w-5 h-5 text-primary" />;
    }
}

export function SearchResultCard({ item }: { item: SearchableItem }) {
    const href = getHref(item);
    const icon = getIcon(item.entityType);

    const hasLogo = 'logo' in item && item.logo;
    const hasBranches = 'branches' in item && item.branches && item.branches.length > 0;
    const mainBranch = hasBranches ? (item as Company | Institution).branches[0] : null;

    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-muted rounded-lg">
                        {hasLogo ? (
                            <Image src={(item as Company | Institution).logo} alt={item.name} width={48} height={48} className="object-contain" />
                        ) : (
                            icon
                        )}
                    </div>
                    <div className="flex-1">
                        <Badge variant="secondary" className="mb-2">{item.entityType}</Badge>
                        <h3 className="font-bold text-lg leading-tight">
                            <Link href={href} className="hover:underline">{item.name}</Link>
                        </h3>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-3">
                    {item.description}
                </p>
                {mainBranch && (
                     <p className="text-sm text-muted-foreground flex items-center gap-2 pt-2">
                        <MapPin className="w-4 h-4"/>
                        {mainBranch.location.city}
                    </p>
                )}
            </CardContent>
            <div className="p-6 pt-0">
                 <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={href}>
                        Ver Detalles <ExternalLink className="w-4 h-4 ml-2" />
                    </Link>
                </Button>
            </div>
        </Card>
    );
}
