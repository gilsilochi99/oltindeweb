
'use client';

import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import React from 'react';

interface ManagementPanelProps<T> {
  title: string;
  data: T[];
  columns: { header: string; accessor: (item: T) => React.ReactNode }[];
  onAddItem: () => void;
  onEditItem: (item: T) => void;
  onDeleteItem: (item: T) => void;
}

export default function ManagementPanel<T extends { id: string }>({ 
    title, 
    data, 
    columns, 
    onAddItem, 
    onEditItem, 
    onDeleteItem 
}: ManagementPanelProps<T>) {

  return (
    <div className="p-4 bg-card rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <Button onClick={onAddItem}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted">
            <tr>
              {columns.map((col, index) => (
                <th key={index} scope="col" className="px-6 py-3">
                  {col.header}
                </th>
              ))}
              <th scope="col" className="px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((item) => (
                <tr key={item.id} className="border-b hover:bg-muted/50">
                  {columns.map((col, index) => (
                    <td key={index} className="px-6 py-4">
                      {col.accessor(item)}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => onEditItem(item)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => onDeleteItem(item)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-4 text-center text-muted-foreground">
                  No data to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
