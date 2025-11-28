
'use client';

import { useAuth } from '@/hooks/use-auth';

export default function UserProfilePanel() {
  const { user } = useAuth();

  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4">Mi Perfil</h2>
      <div>
        <p><strong>Correo Electrónico:</strong> {user.email}</p>
        <p><strong>Rol:</strong> {user.role}</p>
        <p><strong>Premium:</strong> {user.isPremium ? 'Sí' : 'No'}</p>
      </div>
    </div>
  );
}
