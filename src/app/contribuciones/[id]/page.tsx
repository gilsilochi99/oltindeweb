import { getPostById, getPublishedPosts } from "@/lib/data";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Twitter, Linkedin, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata, ResolvingMetadata } from 'next';
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AddPostCommentForm } from "@/components/shared/AddPostCommentForm";
import { PostCommentCard } from "@/components/shared/PostCommentCard";
import PostDate from "@/components/shared/PostDate";

type Props = {
  params: { id: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const post = await getPostById(params.id)

  if (!post) {
    return {
      title: 'Artículo no encontrado'
    }
  }
 
  return {
    title: post.title,
    description: post.excerpt,
  }
}

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({
    id: post.id,
  }));
}

export default async function BlogPostPage({ params }: Props) {
    const post = await getPostById(params.id);

    if (!post || post.status !== 'published') {
        notFound();
    }
    
    const authorInitial = post.authorName ? post.authorName.charAt(0).toUpperCase() : <User className="w-8 h-8" />;
    const comments = post.comments || [];


    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card className="overflow-hidden">
                <article>
                    <header className="p-6 md:p-10 space-y-4">
                        {post.category && <Badge>{post.category}</Badge>}
                        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tighter leading-tight pt-2">{post.title}</h1>
                        <p className="text-lg text-muted-foreground">{post.excerpt}</p>
                        <div className="flex items-center gap-4 pt-4">
                            <Avatar>
                                <AvatarFallback>{authorInitial}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{post.authorName}</p>
                                <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                                    {post.author?.title && <span>{post.author.title}</span>}
                                    <PostDate createdAt={post.createdAt} />
                                </div>
                            </div>
                        </div>
                         {post.author?.socials && typeof post.author.socials === 'object' && (post.author.socials.linkedin || post.author.socials.twitter) && (
                            <div className="flex items-center gap-2 pt-2">
                                {post.author.socials.linkedin && (
                                    <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-primary">
                                        <Link href={post.author.socials.linkedin} target="_blank"><Linkedin className="h-4 w-4" /></Link>
                                    </Button>
                                )}
                                {post.author.socials.twitter && (
                                     <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-primary">
                                        <Link href={post.author.socials.twitter} target="_blank"><Twitter className="h-4 w-4" /></Link>
                                    </Button>
                                )}
                            </div>
                        )}
                    </header>
                    
                    {post.featuredImage && (
                        <figure>
                            <Image 
                                src={post.featuredImage}
                                alt={post.title}
                                width={1200}
                                height={630}
                                className="w-full object-cover aspect-video"
                            />
                            {post.imageDescription && (
                                <figcaption className="p-2 px-6 text-left text-xs text-muted-foreground bg-secondary">
                                    {post.imageDescription}
                                </figcaption>
                            )}
                        </figure>
                    )}

                    <div 
                        className="prose dark:prose-invert max-w-none p-6 md:p-10"
                        dangerouslySetInnerHTML={{ __html: post.content }} 
                    />
                </article>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-6 h-6"/>
                        Comentarios ({comments.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {comments.length > 0 ? (
                           comments.map(comment => (
                               <PostCommentCard key={comment.id} comment={comment} />
                           ))
                        ) : (
                            <p className="text-muted-foreground text-center py-4">No hay comentarios todavía. ¡Sé el primero!</p>
                        )}
                    </div>
                    <Separator className="my-6" />
                    <AddPostCommentForm postId={post.id} />
                </CardContent>
            </Card>

            {post.author && (
                <Card>
                    <CardContent className="p-6 flex items-center gap-6">
                        <Avatar className="w-20 h-20 text-3xl">
                            <AvatarFallback>{authorInitial}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">ESCRITO POR</p>
                            <h3 className="text-xl font-bold">{post.author.displayName}</h3>
                            {post.author.title && <p className="text-muted-foreground">{post.author.title}</p>}
                            {post.author?.socials && typeof post.author.socials === 'object' && (post.author.socials.linkedin || post.author.socials.twitter) && (
                                <div className="flex items-center gap-1 pt-1">
                                    {post.author.socials.linkedin && (
                                        <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-primary">
                                            <Link href={post.author.socials.linkedin} target="_blank"><Linkedin className="h-4 w-4" /></Link>
                                        </Button>
                                    )}
                                    {post.author.socials.twitter && (
                                        <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-primary">
                                            <Link href={post.author.socials.twitter} target="_blank"><Twitter className="h-4 w-4" /></Link>
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
