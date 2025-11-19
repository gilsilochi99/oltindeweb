
import RoleBasedGuard from '@/components/auth/RoleBasedGuard';
import CompaniesPanel from '@/components/dashboard/panels/CompaniesPanel';

export default function ManagerDashboard() {
  return (
    <RoleBasedGuard role="manager">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Manager Dashboard</h1>
        <CompaniesPanel />
      </div>
    </RoleBasedGuard>
  );
}
