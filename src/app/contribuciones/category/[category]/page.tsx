import { getActivePublishedPosts, getUsers } from "@/lib/data";
import { ContributionsPageClient } from "../../ContributionsPageClient";
import { slugify } from "@/lib/slug";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ category: string }>;
};

export async function generateStaticParams() {
  const posts = await getActivePublishedPosts();
  const categories = [...new Set(posts.map((p) => p.category).filter(Boolean) as string[])];
  return categories.map((category) => ({ category: slugify(category) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const posts = await getActivePublishedPosts();
  const categories = [...new Set(posts.map((p) => p.category).filter(Boolean) as string[])];
  const match = categories.find((c) => slugify(c) === slug);

  if (!match) {
    return { title: "Categoría no encontrada" };
  }

  return {
    title: `Contribuciones sobre ${match} en Guinea Ecuatorial`,
    description: `Artículos y guías sobre ${match} en Oltinde, Guinea Ecuatorial.`,
  };
}

export default async function ContributionCategoryPage({ params }: Props) {
  const { category: slug } = await params;

  const [posts, usersData] = await Promise.all([
    getActivePublishedPosts(),
    getUsers(),
  ]);

  const categories = [...new Set(posts.map((p) => p.category).filter(Boolean) as string[])];
  const match = categories.find((c) => slugify(c) === slug);
  if (!match) {
    notFound();
  }

  const authorIdsWithPosts = new Set(posts.map((p) => p.authorId));
  const authors = usersData.filter((u) => authorIdsWithPosts.has(u.id));

  return <ContributionsPageClient posts={posts} authors={authors} categories={categories} initialCategory={match} />;
}
