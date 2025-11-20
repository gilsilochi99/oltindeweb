
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ManagementPanel from '@/components/dashboard/ManagementPanel';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Post } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PublicationsPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const q = query(collection(db, 'posts'), where('authorId', '==', user.id));
      const querySnapshot = await getDocs(q);
      const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setPosts(postsData);
    } catch (error) {
      console.error("Error fetching posts: ", error);
      toast({ title: "Error", description: "No se pudieron cargar sus publicaciones.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleAddItem = () => {
    router.push('/dashboard/contribuciones/new');
  };

  const handleEditItem = (item: Post) => {
    router.push(`/dashboard/contribuciones/${item.id}/edit`);
  };

  const handleDeleteItem = async (item: Post) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
      try {
        await deleteDoc(doc(db, 'posts', item.id));
        setPosts(currentPosts => currentPosts.filter(p => p.id !== item.id));
        toast({ title: "Publicación Eliminada", description: "La publicación ha sido eliminada." });
      } catch (error) {
        console.error("Error deleting post: ", error);
        toast({ title: "Error", description: "No se pudo eliminar la publicación.", variant: "destructive" });
      }
    }
  };

  const columns = [
    { header: 'Título', accessor: (item: Post) => item.title },
    { header: 'Categoría', accessor: (item: Post) => item.category },
    { header: 'Fecha de Creación', accessor: (item: Post) => new Date(item.createdAt).toLocaleDateString() },
  ];

   if (isLoading) {
      return (
          <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin" />
          </div>
      );
  }

  return (
      <ManagementPanel
        title="Mis Publicaciones"
        data={posts}
        columns={columns}
        onAddItem={handleAddItem}
        onEditItem={handleEditItem}
        onDeleteItem={handleDeleteItem}
        addItemLabel="Nueva Publicación"
      />
  );
}
