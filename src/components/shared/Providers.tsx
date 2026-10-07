
'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/hooks/use-auth';
import { CityPreferenceProvider } from '@/hooks/use-city-preference';
import { FoodCartProvider } from '@/hooks/use-food-cart';
import { ShopCartProvider } from '@/hooks/use-shop-cart';

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
              <FoodCartProvider>
                <ShopCartProvider>
                  {children}
                </ShopCartProvider>
              </FoodCartProvider>
            </CityPreferenceProvider>
          </AuthProvider>
        </ThemeProvider>
    )
}
