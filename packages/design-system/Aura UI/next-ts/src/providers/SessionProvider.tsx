'use client';

import { SessionProvider as NextAuthProvider } from 'next-auth/react';
import { type ReactNode } from 'react';
import { Session } from 'next-auth';

export function SessionProvider({
  children,
  session,
}: {
  children: ReactNode;
  session?: Session | null;
}) {
  return <NextAuthProvider session={session}>{children}</NextAuthProvider>;
}
