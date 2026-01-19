'use client';

import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';

export default function PostDate({ createdAt }: { createdAt: string }) {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    setFormattedDate(new Date(createdAt).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }));
  }, [createdAt]);

  return (
    <p className="flex items-center gap-1.5">
      <Calendar className="w-3.5 h-3.5" />
      {formattedDate ? (
        <time dateTime={createdAt}>{formattedDate}</time>
      ) : (
        <span className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      )}
    </p>
  );
}
