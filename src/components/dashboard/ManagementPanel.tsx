
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Column<T> {
    header: string;
    accessor: (item: T) => React.ReactNode;
}

interface CustomAction<T> {
    label: string;
    icon: React.ReactNode;
    onClick: (item: T) => void;
}

interface ManagementPanelProps<T> {
    title: string;
    data: T[];
    columns: Column<T>[];
    onAddItem: () => void;
    onEditItem: (item: T) => void;
    onDeleteItem: (item: T) => void;
    addItemLabel: string;
    customActions?: CustomAction<T>[];
}

export default function ManagementPanel<T extends { id: string, name: string, isVerified?: boolean }>({ 
    title,
    data,
    columns,
    onAddItem,
    onEditItem,
    onDeleteItem,
    addItemLabel,
    customActions = [],
 }: ManagementPanelProps<T>) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>A continuación se muestran todos los elementos que ha registrado.</CardDescription>
                </div>
                <Button onClick={onAddItem}>
                    <PlusCircle className="mr-2 h-4 w-4" /> {addItemLabel}
                </Button>
            </CardHeader>
            <CardContent>
                {data.length > 0 ? (
                    <div className="divide-y divide-border">
                        {data.map((item) => (
                            <div key={item.id} className="py-4 flex items-center justify-between">
                                <div className="grid gap-1">
                                    <h3 className="font-semibold">{item.name}</h3>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        {columns.slice(1).map((col) => (
                                            <div key={col.header}>
                                                <span className="font-medium">{col.header}:</span> {col.accessor(item)}
                                            </div>
                                        ))}
                                    </div>
                                    {customActions.length > 0 && (
                                        <div className="flex items-center gap-2 mt-2">
                                            {customActions.map((action) => (
                                                <Button key={action.label} variant="outline" size="sm" onClick={() => action.onClick(item)}>
                                                    {action.icon}
                                                    {action.label}
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Abrir menú</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEditItem(item)}>
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onDeleteItem(item)} className="text-red-600">
                                            Eliminar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                        <p>No ha creado ningún elemento todavía.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
