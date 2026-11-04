import { AppProvider } from '@/components/providers/AppProvider';
import { AppShell } from '@/components/layout/AppShell';
import { AuthProvider } from '@/lib/auth';
import { AuthGate } from '@/components/auth/AuthGate';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* Data only loads for signed-in, registered staff */}
      <AuthGate>
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </AuthGate>
    </AuthProvider>
  );
}
