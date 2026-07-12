
import type { Procedure } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { Briefcase, FileText, Landmark, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";

export function ProcedureCard({ procedure }: { procedure: Procedure }) {
    return (
        <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
            <CardHeader className="flex-grow">
                <div className="flex gap-4 items-start">
                    <div className="hidden sm:block">
                        <div className="w-12 h-12 flex-shrink-0 flex justify-center items-center bg-primary/10 rounded-lg">
                            <Briefcase className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <CardTitle className="text-lg leading-tight">
                            <Link href={`/procedures/${procedure.id}`} className="hover:underline">
                                {procedure.name}
                            </Link>
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">{procedure.description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
                 <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4"/>
                    <p className="truncate">{procedure.institution}</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4"/>
                    <span>{procedure.requirements.length} {procedure.requirements.length === 1 ? 'requisito' : 'requisitos'}</span>
                 </div>
            </CardContent>
            <CardFooter>
                 <Button asChild variant="secondary" className="w-full sm:w-auto sm:ml-auto">
                    <Link href={`/procedures/${procedure.id}`}>Ver Trámite <ExternalLink className="w-4 h-4 ml-2"/></Link>
                 </Button>
            </CardFooter>
        </Card>
    );
}
