
import type { JobPosting } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { MapPin, Briefcase, Clock } from "lucide-react";

export function JobCard({ job }: { job: JobPosting }) {
    return (
        <Card className="w-full overflow-hidden transition-all hover:shadow-md flex flex-col">
            <CardHeader className="p-4">
                <div className="flex gap-4">
                    <div className="w-14 h-14 shrink-0">
                        <Link href={`/companies/${job.companyId}`}>
                            <Image src={job.companyLogo} alt={`${job.companyName} logo`} width={56} height={56} className="object-contain bg-muted border" />
                        </Link>
                    </div>
                    <div className="flex-grow min-w-0">
                        <Link href={`/companies/${job.companyId}`} className="text-sm text-primary font-semibold hover:underline">
                            {job.companyName}
                        </Link>
                        <h3 className="text-lg font-bold font-headline leading-tight mt-1">
                            <Link href={`/jobs/${job.id}`} className="hover:underline">
                                {job.title}
                            </Link>
                        </h3>
                    </div>
                    {job.status === 'closed' && (
                        <Badge variant="destructive" className="shrink-0 h-fit">Cerrado</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3 flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{job.city}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{job.employmentType}</span>
                    </div>
                    {job.sector && (
                        <div className="flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5" />
                            <span>{job.sector}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
