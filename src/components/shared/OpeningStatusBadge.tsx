
'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Branch } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Clock } from 'lucide-react';

interface OpeningStatusBadgeProps {
  branch: Branch | undefined | null;
  className?: string;
}

const dayMapping: { [key: string]: number } = {
  'domingo': 0,
  'lunes': 1,
  'martes': 2,
  'miércoles': 3,
  'jueves': 4,
  'viernes': 5,
  'sábado': 6,
};

function parseTime(timeStr: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
}

function checkIsOpen(workingHours: Branch['workingHours']) {
    if (!workingHours || workingHours.length === 0) return null;

    const now = new Date();
    const currentDay = now.getDay(); // Sunday - 0, Monday - 1, etc.
    const currentTime = now.getHours() * 60 + now.getMinutes();

    for (const schedule of workingHours) {
        const dayString = schedule.day.toLowerCase().trim();
        const hourString = schedule.hours.toLowerCase().trim();

        if (hourString === 'cerrado') continue;
        
        const [startStr, endStr] = hourString.split('-').map(s => s.trim());
        if (!startStr || !endStr) continue;

        const startTime = parseTime(startStr);
        const endTime = parseTime(endStr);
        
        const startTotalMinutes = startTime.hours * 60 + startTime.minutes;
        const endTotalMinutes = endTime.hours * 60 + endTime.minutes;

        // Handle day ranges like "Lunes - Viernes"
        if (dayString.includes('-')) {
            const [startDayStr, endDayStr] = dayString.split('-').map(s => s.trim());
            const startDay = dayMapping[startDayStr.normalize("NFD").replace(/[\u0300-\u036f]/g, "")];
            const endDay = dayMapping[endDayStr.normalize("NFD").replace(/[\u0300-\u036f]/g, "")];

            if (currentDay >= startDay && currentDay <= endDay) {
                 if (currentTime >= startTotalMinutes && currentTime < endTotalMinutes) {
                    return true;
                }
            }
        } else { // Handle single days
             const scheduleDay = dayMapping[dayString.normalize("NFD").replace(/[\u0300-\u036f]/g, "")];
             if (currentDay === scheduleDay) {
                if (currentTime >= startTotalMinutes && currentTime < endTotalMinutes) {
                    return true;
                }
            }
        }
    }
    
    return false;
}


export function OpeningStatusBadge({ branch, className }: OpeningStatusBadgeProps) {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);

  useEffect(() => {
    if (!branch?.workingHours) {
        setIsOpen(null);
        return;
    }
    
    // Initial check
    setIsOpen(checkIsOpen(branch.workingHours));

    // Update every minute
    const interval = setInterval(() => {
      setIsOpen(checkIsOpen(branch.workingHours));
    }, 60000);

    return () => clearInterval(interval);
  }, [branch]);

  if (isOpen === null) {
    return null; // Don't render anything if no hours are available
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className={className}>
          <Clock className={cn("w-4 h-4", isOpen ? 'text-green-600' : 'text-red-600')} />
          <span className="sr-only">{isOpen ? 'Abierto Ahora' : 'Cerrado Ahora'}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isOpen ? 'Abierto Ahora' : 'Cerrado Ahora'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
