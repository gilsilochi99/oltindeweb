
'use client';

import { ContributionForm } from "@/components/shared/ContributionForm";
import { useAuth } from "@/hooks/use-auth";
import { getPublishedPosts } from "@/lib/data";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";


function AddContributionPageLoader() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
            <div className="lg:col-span-1 space-y-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
}

export default function NewContributionPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [categories, setCategories] = useState<string[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/signin');
        }
    }, [user, loading, router]);

    useEffect(() => {
        async function fetchCategories() {
            try {
                const posts = await getPublishedPosts();
                const uniqueCategories = [...new Set(posts.map(post => post.category).filter(Boolean))] as string[];
                setCategories(uniqueCategories);
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            } finally {
                setIsDataLoading(false);
            }
        }
        fetchCategories();
    }, []);

    const handleFormSubmit = () => {
        router.push('/dashboard/contribuciones');
        router.refresh();
    };

    if (loading || isDataLoading) {
        return <AddContributionPageLoader />;
    }

    if (!user) {
        return null; 
    }

    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-3xl font-bold font-headline">Nueva Contribución</h1>
                <p className="text-muted-foreground">Complete el formulario para crear una nueva publicación.</p>
            </div>
            <ContributionForm 
                type="Create"
                userId={user.uid}
                categories={categories}
                onFormSubmit={handleFormSubmit}
            />
        </div>
    );
}
