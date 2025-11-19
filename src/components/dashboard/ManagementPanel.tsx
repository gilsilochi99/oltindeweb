
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlusCircle, MoreHorizontal } from 'lucide-react';

interface ManagementPanelProps<T> {
  title: string;
  data: T[];
  columns: { header: string; accessor: (item: T) => React.ReactNode }[];
  onAddItem?: () => void;
  onEditItem?: (item: T) => void;
  onDeleteItem?: (item: T) => void;
  addItemLabel?: string;
  customActions?: { label: string; onClick: (item: T) => void; icon: React.ReactNode }[];
}

export default function ManagementPanel<T extends { id: string }>({ 
  title, 
  data, 
  columns, 
  onAddItem, 
  onEditItem, 
  onDeleteItem, 
  addItemLabel = "Añadir Nuevo", 
  customActions = [] 
}: ManagementPanelProps<T>) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {onAddItem && (
          <Button onClick={onAddItem} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            {addItemLabel}
          </Button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col, index) => <TableHead key={index}>{col.header}</TableHead>)}
            {(onEditItem || onDeleteItem || customActions.length > 0) && <TableHead className="text-right">Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              {columns.map((col, index) => <TableCell key={index}>{col.accessor(item)}</TableCell>)}
              {(onEditItem || onDeleteItem || customActions.length > 0) && (
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      {onEditItem && (
                        <DropdownMenuItem onClick={() => onEditItem(item)}>
                          Editar
                        </DropdownMenuItem>
                      )}
                      {customActions.map(action => (
                        <DropdownMenuItem key={action.label} onClick={() => action.onClick(item)}>
                          {action.icon}
                          <span className="ml-2">{action.label}</span>
                        </DropdownMenuItem>
                      ))}
                      {(onEditItem || customActions.length > 0) && onDeleteItem && <DropdownMenuSeparator />}
                      {onDeleteItem && (
                        <DropdownMenuItem onClick={() => onDeleteItem(item)} className="text-red-600">
                          Eliminar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {data.length === 0 && (
        <div className="text-center p-4 text-muted-foreground">
          No hay elementos para mostrar.
        </div>
      )}
    </div>
  );
}
