// This is a re-routing component. 
// The actual logic is in /app/admin/blog/edit/[id]/page.tsx

import EditPostPage from "@/app/admin/contribuciones/edit/[id]/page";

export default function UserEditPostPage({ params }: { params: { id: string } }) {
    return <EditPostPage params={params} />;
}
