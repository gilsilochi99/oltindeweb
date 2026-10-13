import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { Easing, FadeIn, SlideInDown } from 'react-native-reanimated';
import { Plus, Star, X } from 'lucide-react-native';
import { useAuth } from '../hooks/use-auth';
import { useCompaniesByOwner } from '../hooks/use-queries';
import { companyHasFeature, type Company, type PremiumFeature } from '../lib/types';
import { BUSINESS_PUBLISH, COMPANY_PUBLISH, PERSONAL_PUBLISH, type PublishOption } from '../lib/publish-options';
import { WEB_APP_URL } from '../lib/config';
import { openExternal } from '../lib/links';
import { tick } from './ui/motion';

// The + button in the tab bar opens this sheet: everything a person can add,
// for themselves or for their company. Same content as the web's PublishSheet.
const PublishContext = createContext<{ open: () => void }>({ open: () => {} });

export const usePublishSheet = () => useContext(PublishContext);

export function PublishProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <PublishContext.Provider value={{ open: () => setVisible(true) }}>
      {children}
      <Modal visible={visible} transparent statusBarTranslucent animationType="none" onRequestClose={() => setVisible(false)}>
        {visible ? <PublishSheetBody onClose={() => setVisible(false)} /> : null}
      </Modal>
    </PublishContext.Provider>
  );
}

const ease = Easing.out(Easing.cubic);

// The category allows it (Premium aside); mirrors the web's categoryAllowsFeature
// fallback, where the menu is only for restaurants.
function categoryAllows(company: Company, feature: PremiumFeature) {
  if (company.premiumFeatures) return company.premiumFeatures[feature] !== false;
  return feature !== 'menu' || (company.category ?? '').toLowerCase().includes('restaurant');
}

function PublishSheetBody({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: companies, isLoading } = useCompaniesByOwner(user?.uid ?? '');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    if (companies?.length && !companies.some((c) => c.id === selectedId)) setSelectedId(companies[0].id);
  }, [companies, selectedId]);
  const company = companies?.find((c) => c.id === selectedId) ?? null;

  const go = (href: string) => {
    tick('selection');
    onClose();
    router.push(href as never);
  };
  // "Ofertas y anuncios" share one screen.
  const has = (c: Company, f: PremiumFeature) => companyHasFeature(c, f) || (f === 'offers' && companyHasFeature(c, 'announcements'));
  const allows = (c: Company, f: PremiumFeature) => categoryAllows(c, f) || (f === 'offers' && categoryAllows(c, 'announcements'));

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <Animated.View entering={FadeIn.duration(200)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Cerrar" />
      </Animated.View>
      <Animated.View
        entering={SlideInDown.duration(280).easing(ease)}
       
        style={{ maxHeight: '85%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <View className="flex-row items-center justify-between px-5 pb-1 pt-4">
          <View>
            <Text className="text-lg font-semibold text-foreground">Publicar en Oltinde</Text>
            <Text className="text-sm text-foreground/60">¿Qué quiere añadir?</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Cerrar" className="h-9 w-9 items-center justify-center rounded-full bg-muted">
            <X size={18} color="#1A1C1C" />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="px-5 pb-2">
          <Text className="mb-2 mt-4 text-xs font-semibold text-foreground/60">Para usted</Text>
          <TileGrid>
            {PERSONAL_PUBLISH.map((o) => <Tile key={o.href} option={o} onPress={() => go(o.href)} />)}
          </TileGrid>

          <Text className="mb-2 mt-6 text-xs font-semibold text-foreground/60">Para su empresa</Text>
          {isLoading ? (
            <Text className="text-sm text-foreground/60">Cargando sus empresas…</Text>
          ) : !company ? (
            <>
              <TileGrid>
                <Tile option={COMPANY_PUBLISH} onPress={() => go(COMPANY_PUBLISH.href)} />
              </TileGrid>
              <Text className="mt-2 text-xs text-foreground/60">
                Con una empresa Premium también puede publicar productos, alquileres, empleos, ofertas, eventos y más.
              </Text>
            </>
          ) : (
            <>
              {companies!.length > 1 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
                  {companies!.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => { tick('selection'); setSelectedId(c.id); }}
                      className={`rounded-full border px-3 py-1.5 ${c.id === company.id ? 'border-black bg-black' : 'border-border bg-card'}`}
                    >
                      <Text className={`text-sm ${c.id === company.id ? 'text-white' : 'text-foreground'}`} numberOfLines={1}>{c.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}
              <TileGrid>
                {BUSINESS_PUBLISH.filter((f) => allows(company, f.feature)).map((f) =>
                  has(company, f.feature) ? (
                    <Tile key={f.feature} option={{ label: f.label, hint: company.name, icon: f.icon, href: '' }} onPress={() => go(`/business/${company.id}/${f.path}`)} />
                  ) : (
                    <Tile
                      key={f.feature}
                      premium
                      option={{ label: f.label, hint: 'Con Premium', icon: f.icon, href: '' }}
                      onPress={() => { onClose(); openExternal(`${WEB_APP_URL}/para-empresas#planes`); }}
                    />
                  ),
                )}
              </TileGrid>
              <Pressable onPress={() => go(COMPANY_PUBLISH.href)} className="mt-3 flex-row items-center gap-1 self-start py-1">
                <Plus size={16} color="#1A1C1C" />
                <Text className="text-sm text-foreground underline">Registrar otra empresa</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function TileGrid({ children }: { children: ReactNode }) {
  return <View className="flex-row flex-wrap" style={{ gap: 10 }}>{children}</View>;
}

function Tile({ option: { label, hint, icon: Icon }, premium, onPress }: { option: PublishOption; premium?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-3 active:bg-muted"
      style={{ width: '48%', opacity: premium ? 0.7 : 1 }}
    >
      <View className={`h-10 w-10 items-center justify-center rounded-full ${premium ? 'bg-muted' : 'bg-primary'}`}>
        <Icon size={18} color="#000" />
        <View className="absolute -bottom-0.5 -right-0.5 h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-black">
          {premium ? <Star size={10} color="#FFCD00" fill="#FFCD00" /> : <Plus size={11} color="#fff" strokeWidth={3} />}
        </View>
      </View>
      <View className="flex-1">
        <Text className="text-[13px] font-semibold leading-4 text-foreground" numberOfLines={2}>{label}</Text>
        <Text className="text-[11px] text-foreground/60" numberOfLines={1}>{hint}</Text>
      </View>
    </Pressable>
  );
}
