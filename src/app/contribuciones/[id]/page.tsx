import { getPostById, getActivePublishedPosts, getUserById } from "@/lib/data";
import { getCurrentCaller, isManagerRole } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Calendar, Twitter, Linkedin, MessageSquare } from "lucide-react";
import type { Metadata, ResolvingMetadata } from 'next';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AddPostCommentForm } from "@/components/shared/AddPostCommentForm";
import { PostCommentCard } from "@/components/shared/PostCommentCard";
import { DetailShell, SidebarCard, InfoCard } from "@/components/shared/detail/StitchDetailKit";
import { ShareButtons } from "@/components/shared/ShareButtons";
import { stitch } from "@/components/shared/detail/stitch-tokens";
import { JsonLd } from "@/components/shared/JsonLd";
import { buildArticleSchema } from "@/lib/structured-data";

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id)

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
  const posts = await getActivePublishedPosts();
  return posts.map((post) => ({
    id: post.id,
  }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const post = await getPostById(id);

    if (!post || post.status !== 'published') {
        notFound();
    }

    const author = post.authorId ? await getUserById(post.authorId) : null;
    if (author?.isActive === false) {
        const caller = await getCurrentCaller();
        const isAuthorOrManager = !!caller && (caller.uid === post.authorId || isManagerRole(caller.role));
        if (!isAuthorOrManager) {
            notFound();
        }
    }

    const authorInitial = post.authorName ? post.authorName.charAt(0).toUpperCase() : <User className="w-8 h-8" />;
    const comments = post.comments || [];

    return (
        <>
        <JsonLd data={buildArticleSchema(post)} />
        <DetailShell
            sidebar={
                <>
                    <SidebarCard title="Escrito por">
                        <div className="flex items-center gap-3 mb-2">
                            <Avatar className="w-12 h-12">
                                <AvatarFallback>{authorInitial}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-sm">{post.authorName}</p>
                                {post.author?.title && <p className="text-xs text-muted-foreground">{post.author.title}</p>}
                            </div>
                        </div>
                        <p className="flex items-center gap-1.5 text-xs text-black mt-3">
                            <Calendar className="w-3.5 h-3.5" />
                            <time dateTime={post.createdAt}>
                                {new Date(post.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </time>
                        </p>
                        {post.author?.socials && (post.author.socials.linkedin || post.author.socials.twitter) && (
                            <div className="flex items-center gap-2 pt-3 mt-3 border-t">
                                {post.author.socials.linkedin && (
                                    <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-black">
                                        <Link href={post.author.socials.linkedin} target="_blank"><Linkedin className="h-4 w-4" /></Link>
                                    </Button>
                                )}
                                {post.author.socials.twitter && (
                                     <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-black">
                                        <Link href={post.author.socials.twitter} target="_blank"><Twitter className="h-4 w-4" /></Link>
                                    </Button>
                                )}
                            </div>
                        )}
                    </SidebarCard>
                </>
            }
        >
            <div className="mb-8">
                <div className="flex items-start justify-between gap-4">
                    {post.category ? (
                        <span className="bg-[#eeeeee] text-black px-3 py-1 rounded-full text-xs font-bold uppercase inline-block mb-3">
                            {post.category}
                        </span>
                    ) : <div />}
                    <ShareButtons path={`/contribuciones/${post.id}`} title={post.title} />
                </div>
                <h1 className="text-2xl md:text-[32px] md:leading-[40px] font-bold text-[#1a1c1c]">{post.title}</h1>
                <p className="text-base text-muted-foreground mt-2">{post.excerpt}</p>
            </div>

            <InfoCard>
                {post.featuredImage && (
                    <figure className="-mx-6 -mt-6 mb-6">
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
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />
            </InfoCard>

            <div className="mt-8 bg-[#f3f3f3] border border-[#e2e2e2] p-6 rounded-sm">
                <h3 className="font-bold text-[#1a1c1c] mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" style={{ color: stitch.secondary }} />
                    Comentarios ({comments.length})
                </h3>
                <div className="space-y-4">
                    {comments.length > 0 ? (
                       comments.map(comment => (
                           <PostCommentCard key={comment.id} comment={comment} />
                       ))
                    ) : (
                        <p className="text-muted-foreground text-center py-4 italic text-sm">No hay comentarios todavía. ¡Sé el primero!</p>
                    )}
                </div>
                <Separator className="my-6" />
                <AddPostCommentForm postId={post.id} />
            </div>
        </DetailShell>
        </>
    )
}
