import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { authOptions } from 'lib/next-auth/nextAuthOptions';
import 'locales/i18n';
import BreakpointsProvider from 'providers/BreakpointsProvider';
import LocalizationProvider from 'providers/LocalizationProvider';
import NotistackProvider from 'providers/NotistackProvider';
import { SessionProvider } from 'providers/SessionProvider';
import SettingsProvider from 'providers/SettingsProvider';
import ThemeProvider from 'providers/ThemeProvider';
import { plusJakartaSans, splineSansMono } from 'theme/typography';
import App from './App';

export const metadata: Metadata = {
  title: 'Aurora',
  description: 'Admin Dashboard and Web App Template',
  icons: [
    {
      rel: 'icon',
      url: `/favicon.ico`,
    },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html
      suppressHydrationWarning
      lang="en"
      className={`${plusJakartaSans.className} ${splineSansMono.className}`}
    >
      <body>
        <InitColorSchemeScript attribute="data-aurora-color-scheme" modeStorageKey="aurora-mode" />
        <AppRouterCacheProvider>
          <SessionProvider session={session}>
            <SettingsProvider>
              <LocalizationProvider>
                <ThemeProvider>
                  <NotistackProvider>
                    <BreakpointsProvider>
                      <App>{children}</App>
                    </BreakpointsProvider>
                  </NotistackProvider>
                </ThemeProvider>
              </LocalizationProvider>
            </SettingsProvider>
          </SessionProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
