import { getActivePublishedPosts, getUsers } from "@/lib/data";
import { ContributionsPageClient } from "./ContributionsPageClient";

export default async function ContribucionesPage() {
    const [posts, usersData] = await Promise.all([
        getActivePublishedPosts(),
        getUsers()
    ]);

    const categories = [...new Set(posts.map(p => p.category).filter(Boolean) as string[])];
    const authorIdsWithPosts = new Set(posts.map(p => p.authorId));
    const authors = usersData.filter(u => authorIdsWithPosts.has(u.id));

    return <ContributionsPageClient posts={posts} authors={authors} categories={categories} />;
}
