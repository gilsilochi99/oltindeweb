
'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/hooks/use-auth';
import { CityPreferenceProvider } from '@/hooks/use-city-preference';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <CityPreferenceProvider>
              {children}
            </CityPreferenceProvider>
          </AuthProvider>
        </ThemeProvider>
    )
}
