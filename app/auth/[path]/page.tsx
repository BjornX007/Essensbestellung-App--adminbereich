// app/auth/[path]/page.tsx
import { AuthView } from '@neondatabase/auth/react';

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;
  return (
    <main>
      <AuthView path={path} /> {/* handles sign-in, sign-up, reset password automatically */}
    </main>
  );
}