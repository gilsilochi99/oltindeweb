
import RoleBasedGuard from '@/components/auth/RoleBasedGuard';
import PublicationsPanel from '@/components/dashboard/panels/PublicationsPanel';

export default function EditorDashboard() {
  return (
    <RoleBasedGuard role="editor">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Panel de Editor</h1>
        <PublicationsPanel />
      </div>
    </RoleBasedGuard>
  );
}
