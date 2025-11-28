
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Building, Landmark, FileText, Briefcase, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '../ui/popover';
import { getCompanies, getInstitutions, getProcedures, getServices } from '@/lib/data';
import type { Company, Institution, Procedure, Service } from '@/lib/types';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';

interface SearchResult {
    id: string;
    name: string;
    type: 'company' | 'institution' | 'procedure' | 'service';
    href: string;
}

const createSlug = (name: string) => name.toLowerCase().replace(/ /g, '-');


export function GlobalHeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [allData, setAllData] = useState<{
      companies: Company[],
      institutions: Institution[],
      procedures: Procedure[],
      services: Service[]
  }>({ companies: [], institutions: [], procedures: [], services: []});
  
  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        const [companies, institutions, procedures, services] = await Promise.all([
            getCompanies(),
            getInstitutions(),
            getProcedures(),
            getServices()
        ]);
        setAllData({ companies, institutions, procedures, services });
        setIsLoading(false);
    }
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const params = new URLSearchParams();
    params.set('q', query);
    router.push(`/search?${params.toString()}`);
    setOpen(false);
  };

  const handleSelect = (href: string) => {
      router.push(href);
      setOpen(false);
      setQuery('');
  }
  
  const filteredQuery = query.trim().toLowerCase();

  const companyResults: SearchResult[] = !filteredQuery ? [] : allData.companies
    .filter(c => c.name.toLowerCase().includes(filteredQuery))
    .slice(0, 5)
    .map(c => ({ id: c.id, name: c.name, type: 'company', href: `/companies/${c.id}` }));

  const institutionResults: SearchResult[] = !filteredQuery ? [] : allData.institutions
    .filter(i => i.name.toLowerCase().includes(filteredQuery))
    .slice(0, 5)
    .map(i => ({ id: i.id, name: i.name, type: 'institution', href: `/institutions/${i.id}` }));
    
  const procedureResults: SearchResult[] = !filteredQuery ? [] : allData.procedures
    .filter(p => p.name.toLowerCase().includes(filteredQuery))
    .slice(0, 5)
    .map(p => ({ id: p.id, name: p.name, type: 'procedure', href: `/procedures/${p.id}` }));

  const serviceResults: SearchResult[] = !filteredQuery ? [] : allData.services
    .filter(s => s.name.toLowerCase().includes(filteredQuery))
    .slice(0, 5)
    .map(s => ({ id: s.id, name: s.name, type: 'service', href: `/services/${createSlug(s.name)}` }));
    
  const hasResults = companyResults.length > 0 || institutionResults.length > 0 || procedureResults.length > 0 || serviceResults.length > 0;
  
  const defaultCompanyResults: SearchResult[] = allData.companies.filter(c => c.isFeatured).slice(0, 3).map(c => ({ id: c.id, name: c.name, type: 'company', href: `/companies/${c.id}` }));
  const defaultServiceResults: SearchResult[] = allData.services.slice(0, 3).map(s => ({ id: s.id, name: s.name, type: 'service', href: `/services/${createSlug(s.name)}` }));


  return (
    <form onSubmit={handleSearch}>
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverAnchor asChild>
                <div 
                    className="flex w-full rounded-md border-2 border-primary bg-background overflow-hidden shadow-lg p-1 gap-1"
                >
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                        type="search"
                        placeholder="Buscar empresas, trámites, servicios..."
                        className="pl-10 w-full h-12 bg-transparent border-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setOpen(true)}
                        />
                         {query && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={() => {
                                    setQuery('');
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    
                    <Button 
                        type="submit" 
                        size="lg" 
                        className="h-12 rounded-md font-bold px-8"
                    >
                        BUSCAR
                    </Button>
                </div>
            </PopoverAnchor>

            <PopoverContent 
                className="w-[--radix-popover-trigger-width] p-0" 
                onOpenAutoFocus={(e) => e.preventDefault()} // prevent focus stealing
            >
                <Command>
                    <CommandList>
                        {isLoading && <div className="p-2 space-y-2"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /></div>}
                        
                        {!filteredQuery && (
                          <>
                            {defaultCompanyResults.length > 0 && (
                                <CommandGroup heading="Empresas Destacadas">
                                    {defaultCompanyResults.map(item => (
                                        <CommandItem key={item.id} onSelect={() => handleSelect(item.href)} value={item.name}>
                                            <Building className="mr-2 h-4 w-4" />
                                            <span>{item.name}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                             {defaultServiceResults.length > 0 && (
                                <CommandGroup heading="Servicios Populares">
                                    {defaultServiceResults.map(item => (
                                        <CommandItem key={item.id} onSelect={() => handleSelect(item.href)} value={item.name}>
                                            <Briefcase className="mr-2 h-4 w-4" />
                                            <span>{item.name}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                          </>
                        )}

                        {filteredQuery && !hasResults && !isLoading && (
                             <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                        )}
                       
                        {companyResults.length > 0 && (
                            <CommandGroup heading="Empresas">
                                {companyResults.map(item => (
                                    <CommandItem key={item.id} onSelect={() => handleSelect(item.href)} value={item.name}>
                                        <Building className="mr-2 h-4 w-4" />
                                        <span>{item.name}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                        {institutionResults.length > 0 && (
                             <CommandGroup heading="Instituciones">
                                {institutionResults.map(item => (
                                    <CommandItem key={item.id} onSelect={() => handleSelect(item.href)} value={item.name}>
                                        <Landmark className="mr-2 h-4 w-4" />
                                        <span>{item.name}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                        {procedureResults.length > 0 && (
                             <CommandGroup heading="Trámites">
                                {procedureResults.map(item => (
                                    <CommandItem key={item.id} onSelect={() => handleSelect(item.href)} value={item.name}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        <span>{item.name}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                        {serviceResults.length > 0 && (
                             <CommandGroup heading="Servicios">
                                {serviceResults.map(item => (
                                    <CommandItem key={item.id} onSelect={() => handleSelect(item.href)} value={item.name}>
                                        <Briefcase className="mr-2 h-4 w-4" />
                                        <span>{item.name}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}

                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    </form>
  );
}
