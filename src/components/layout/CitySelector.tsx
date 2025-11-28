
'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from "react";
import { getUniqueCities } from "@/lib/data";

const EquatorialGuineaFlag = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" className="w-5 h-auto rounded-sm">
        <rect fill="#3e9a00" width="900" height="600"/>
        <rect fill="#fff" y="150" width="900" height="300"/>
        <rect fill="#e30000" y="300" width="900" height="300"/>
        <path fill="#0073ce" d="M0 0v600L300 300z"/>
        <g transform="translate(450 300) scale(4)">
            <g fill="#3E9A00">
                <path d="M-10 15h20v5h-20z"/>
                <path d="M-10-25c15-25 10-25 0-50c-10 25-15 25 0 50z"/>
                <path d="M0 0L-10-25h20z"/>
            </g>
            <g fill="#fce500" transform="translate(0 -35) scale(1.5)">
                <path d="M0-10l3 9h-8l5-4-5-4h8z"/>
                <path d="M-12-10l3 9h-8l5-4-5-4h8z"/>
                <path d="M12-10l3 9h-8l5-4-5-4h8z"/>
                <path d="M-6 5l3 9h-8l5-4-5-4h8z"/>
                <path d="M6 5l3 9h-8l5-4-5-4h8z"/>
                <path d="M0 15l3 9h-8l5-4-5-4h8z"/>
            </g>
        </g>
    </svg>
);


export function CitySelector() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [cities, setCities] = useState<string[]>([]);
    
    const selectedCity = searchParams.get('city') || 'all';

    useEffect(() => {
        getUniqueCities().then(setCities);
    }, []);

    const handleCityChange = (city: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (city === 'all') {
            params.delete('city');
        } else {
            params.set('city', city);
        }
        // Reset page to 1 when filter changes
        params.delete('page'); 
        router.push(`${pathname}?${params.toString()}`);
    }

    const isAllCities = selectedCity === 'all';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1">
                    <EquatorialGuineaFlag />
                    {!isAllCities && <span>{selectedCity}</span>}
                    <ChevronsUpDown className="w-4 h-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => handleCityChange('all')}>
                    Todas las ciudades
                </DropdownMenuItem>
                {cities.map(city => (
                    <DropdownMenuItem key={city} onSelect={() => handleCityChange(city)}>
                        {city}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
