
import RoleBasedGuard from '@/components/auth/RoleBasedGuard';
import AnnouncementsPanel from '@/components/dashboard/panels/AnnouncementsPanel';

export default function EditorDashboard() {
  return (
    <RoleBasedGuard role="editor">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Editor Dashboard</h1>
        <AnnouncementsPanel />
      </div>
    </RoleBasedGuard>
  );
}
