import type { Post } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { User, Calendar } from "lucide-react";

export function PostCard({ post }: { post: Post }) {
    return (
        <Card className="flex flex-col overflow-hidden group h-full">
            <Link href={`/contribuciones/${post.id}`} className="block">
                <div className="aspect-video overflow-hidden">
                    <Image
                        src={post.featuredImage}
                        alt={post.title}
                        width={600}
                        height={338}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                </div>
            </Link>
            <CardContent className="p-6 flex flex-col flex-grow">
                <div className="flex-grow">
                    <h3 className="text-lg font-bold font-headline leading-tight">
                        <Link href={`/contribuciones/${post.id}`} className="hover:text-black transition-colors">{post.title}</Link>
                    </h3>
                    <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{post.excerpt}</p>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        <span>{post.authorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <time dateTime={post.createdAt}>
                            {new Date(post.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                        </time>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
