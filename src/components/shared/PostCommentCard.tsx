'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { PostComment } from "@/lib/types";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { User } from "lucide-react";
import { useEffect, useState } from "react";

export function PostCommentCard({ comment }: { comment: PostComment }) {
  const authorInitial = comment.authorName ? comment.authorName.charAt(0).toUpperCase() : <User />;
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    setFormattedDate(new Date(comment.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }));
  }, [comment.createdAt]);

  return (
    <Card className="bg-muted/50">
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{authorInitial}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{comment.authorName}</p>
              {formattedDate ? (
                <p className="text-xs text-muted-foreground">{formattedDate}</p>
              ) : (
                <div className="h-4 w-24 mt-1 bg-gray-200 rounded animate-pulse" />
              )}
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-foreground/90">{comment.comment}</p>
      </CardContent>
    </Card>
  );
}
