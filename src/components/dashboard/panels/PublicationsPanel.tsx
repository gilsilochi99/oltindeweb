
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Post } from '@/lib/types';
import ManagementPanel from '@/components/dashboard/ManagementPanel';
import { useRouter } from 'next/navigation';

export default function PublicationsPanel() {
  const { user } = useAuth();
  const router = useRouter();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchPosts = async () => {
        setIsLoading(true);
        try {
          const q = query(collection(db, 'posts'), where('authorId', '==', user.id));
          const querySnapshot = await getDocs(q);
          const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
          setUserPosts(posts);
        } catch (error) {
          console.error("Error fetching posts: ", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchPosts();
    }
  }, [user]);

  const handleAddPost = () => {
    router.push('/dashboard/editor');
  };

  const handleEditPost = (item: Post) => {
    router.push(`/dashboard/editor?id=${item.id}`);
  };

  const handleDeletePost = async (item: Post) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
      try {
        await deleteDoc(doc(db, 'posts', item.id));
        setUserPosts(userPosts.filter(p => p.id !== item.id));
      } catch (error) {
        console.error("Error deleting post: ", error);
      }
    }
  };

  const postColumns = [
    { header: 'Título', accessor: (item: Post) => item.title },
    { header: 'Categoría', accessor: (item: Post) => item.category },
    { header: 'Fecha de Creación', accessor: (item: Post) => new Date(item.createdAt).toLocaleDateString() },
  ];

  return (
    <ManagementPanel
      title="Mis Publicaciones"
      data={userPosts}
      columns={postColumns}
      onAddItem={handleAddPost}
      onEditItem={handleEditPost}
      onDeleteItem={handleDeletePost}
      addItemLabel="Crear Publicación"
    />
  );
}
