
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { summarizeCompanyReviews } from '@/ai/flows/summarize-company-reviews';
import { Skeleton } from '../ui/skeleton';
import { Bot } from 'lucide-react';

interface ReviewSummaryProps {
  companyName: string;
  reviews: string[];
  isPremium: boolean;
}

export function ReviewSummary({ companyName, reviews, isPremium }: ReviewSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reviews.length > 1 && isPremium) {
      const fetchSummary = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const result = await summarizeCompanyReviews({ companyName, reviews });
          setSummary(result.summary);
        } catch (e) {
          console.error(e);
          setError('No se pudo generar el resumen.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchSummary();
    }
  }, [companyName, reviews, isPremium]);

  if (reviews.length <= 1 || !isPremium) {
    return null; // Don't show summary for 1 or 0 reviews, or if not premium
  }

  return (
    <Card className="bg-accent/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="w-5 h-5 text-primary" />
          Resumen con IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {summary && <p className="text-sm text-foreground/90">{summary}</p>}
      </CardContent>
    </Card>
  );
}
