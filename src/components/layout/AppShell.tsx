
import type React from 'react';
import AppShellClient from './AppShellClient';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 bg-background">
      <AppShellClient>{children}</AppShellClient>
    </main>
  );
}
