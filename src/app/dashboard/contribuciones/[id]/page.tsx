
'use client';

import { ContributionForm } from "@/components/shared/ContributionForm";
import { useAuth } from "@/hooks/use-auth";
import { getPostById, getPublishedPosts } from "@/lib/data";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Post } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";


function EditContributionPageLoader() {
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

export default function EditContributionPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const postId = params.id as string;

    const [post, setPost] = useState<Post | null>(null);
    const [categories, setCategories] = useState<string[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/signin');
        }
    }, [user, loading, router]);

    useEffect(() => {
        async function fetchData() {
            if (!postId) return;
            try {
                const [postData, posts] = await Promise.all([
                    getPostById(postId),
                    getPublishedPosts(),
                ]);

                if (!postData) {
                    setError("No se encontró la contribución.");
                    return;
                }

                setPost(postData);
                const uniqueCategories = [...new Set(posts.map(p => p.category).filter(Boolean))] as string[];
                setCategories(uniqueCategories);

            } catch (err) {
                console.error("Failed to fetch data:", err);
                setError("Ocurrió un error al cargar los datos.");
            } finally {
                setIsDataLoading(false);
            }
        }
        fetchData();
    }, [postId]);

    const handleFormSubmit = () => {
        router.push('/dashboard/contribuciones');
        router.refresh();
    };

    if (loading || isDataLoading) {
        return <EditContributionPageLoader />;
    }
    
    if (!user) {
        return null;
    }

    if (error) {
        return <p className="text-destructive text-center">{error}</p>;
    }

    if (!post) {
        return <p className="text-center">Cargando datos de la contribución...</p>;
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Editar Contribución</h1>
                <p className="text-muted-foreground">Modifique los detalles de su publicación.</p>
            </div>
            <ContributionForm 
                type="Update"
                initialData={post}
                categories={categories}
                onFormSubmit={handleFormSubmit}
            />
        </div>
    );
}
