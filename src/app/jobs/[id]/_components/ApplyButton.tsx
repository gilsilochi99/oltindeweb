
'use client';

import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { incrementJobApplicationClicks } from "@/lib/actions";

export function ApplyButton({ jobId, applyHref, isLink }: { jobId: string; applyHref: string; isLink: boolean }) {
    const handleClick = () => {
        incrementJobApplicationClicks(jobId);
    };

    return (
        <Button asChild size="lg" className="w-full sm:w-auto">
            <a href={applyHref} target={isLink ? '_blank' : undefined} rel="noopener noreferrer" onClick={handleClick}>
                Aplicar Ahora {isLink && <ExternalLink className="w-4 h-4 ml-2" />}
            </a>
        </Button>
    );
}
