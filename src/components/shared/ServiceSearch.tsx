
"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Institution } from "@/lib/types"

export function ServiceSearch({ institutions }: { institutions: Institution[] }) {
  return (
    <div className="w-full max-w-3xl mx-auto">
        <form className="relative bg-background rounded-lg shadow-md border">
            <div className="flex flex-col md:flex-row items-center p-2 gap-2">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Qué estás buscando?"
                        className="pl-10 w-full h-12 text-base bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                </div>
                <div className="hidden md:block w-px h-8 bg-border" />
                <div className="relative flex-grow w-full">
                    <Select defaultValue="all">
                        <SelectTrigger className="w-full h-12 text-base bg-transparent border-none focus:ring-0 focus:ring-offset-0">
                            <SelectValue placeholder="Institución" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las Instituciones</SelectItem>
                            {institutions.map(inst => (
                                <SelectItem key={inst.id} value={inst.name}>{inst.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button type="submit" size="lg" className="w-full md:w-auto h-12">
                    <Search className="w-5 h-5 md:mr-2" />
                    <span className="hidden md:inline">Buscar</span>
                </Button>
            </div>
        </form>
    </div>
  )
}

