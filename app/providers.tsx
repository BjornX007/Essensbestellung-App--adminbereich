'use client';
import { authClient } from '@/app/lib/auth/client';
import { NeonAuthUIProvider } from '@neondatabase/auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NeonAuthUIProvider authClient={authClient} emailOTP>
      {children}
    </NeonAuthUIProvider>
  );
}