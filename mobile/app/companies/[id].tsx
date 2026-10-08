import { Linking, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Download,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Share2,
} from 'lucide-react-native';
import type { ActionItem } from '../../src/components/ui/ActionBar';
import { useCompany, useActiveJobPostings, useEvents, useMenuItemsByCompany, useServices } from '../../src/hooks/use-queries';
import { RestaurantMenu } from '../../src/components/food/RestaurantMenu';
import { useAuth } from '../../src/hooks/use-auth';
import { WEB_APP_URL } from '../../src/lib/config';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { DetailHeader } from '../../src/components/ui/DetailHeader';
import { OpenStatusBadge } from '../../src/components/ui/OpenStatusBadge';
import { DetailTabs, type DetailTab } from '../../src/components/ui/DetailTabs';
import { Section } from '../../src/components/ui/Section';
import { ListCard } from '../../src/components/ui/ListCard';
import { ReviewList } from '../../src/components/ui/ReviewList';
import { ReviewForm } from '../../src/components/ui/ReviewForm';
import { ClaimButton } from '../../src/components/ui/ClaimButton';
import { Badge } from '../../src/components/ui/Badge';
import { averageRating } from '../../src/components/ui/StarRating';
import { useQuery } from '@tanstack/react-query';
import { useWindowDimensions } from 'react-native';
import { searchProducts } from '../../src/lib/shop';
import { searchRentals } from '../../src/lib/rentals';
import { ProductCard } from '../../src/components/shop/ProductCard';
import { RentalCard } from '../../src/components/rentals/RentalCard';

// Razón social/Forma jurídica/CIF/Año de constitución describe a formal
// corporate registration (S.A., S.L....) — meaningless (and usually just
// placeholder "N/A" data from bulk imports) for informal small businesses
// like a single pharmacy or repair shop, so hide them there. Mirrors web's
// src/app/companies/[id]/page.tsx INFORMAL_CATEGORIES.
const INFORMAL_CATEGORIES = ['farmacia', 'restaurante', 'taller', 'clinica', 'clínica', 'hospital'];

const SOCIAL_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X (Twitter)',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
};

export default function CompanyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: company, isLoading } = useCompany(id);
  const { width } = useWindowDimensions();
  const { user, isFavorite, addFavorite, removeFavorite } = useAuth();
  const { data: allJobs } = useActiveJobPostings();
  const { data: allEvents } = useEvents();
  const { data: menuItems } = useMenuItemsByCompany(id);
  const { data: allServices } = useServices();
  const { data: shopProducts } = useQuery({ queryKey: ['shop', 'company', id], queryFn: () => searchProducts({ companyId: id }), enabled: !!id });
  const { data: companyRentals } = useQuery({ queryKey: ['rentals', 'company', id], queryFn: () => searchRentals({ companyId: id }), enabled: !!id });

  if (isLoading) return <LoadingState />;
  if (!company) return <EmptyState title="Empresa no encontrada" />;

  const favorite = isFavorite('company', company.id);
  const toggleFavorite = () => {
    if (!user) return;
    favorite ? removeFavorite('company', company.id) : addFavorite('company', company.id);
  };

  const mainBranch = company.branches?.[0];
  const whatsapp = company.contact?.socialMedia?.whatsapp;
  const actions: ActionItem[] = [
    mainBranch?.contact?.phone && {
      icon: Phone,
      label: 'Llamar',
      onPress: () => Linking.openURL(`tel:${mainBranch.contact.phone}`),
    },
    whatsapp && {
      icon: MessageCircle,
      label: 'WhatsApp',
      onPress: () => Linking.openURL(`https://wa.me/${whatsapp}`),
    },
    mainBranch?.location && {
      icon: Navigation,
      label: 'Cómo llegar',
      onPress: () =>
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${mainBranch.location.lat},${mainBranch.location.lng}`),
    },
    company.contact?.website && {
      icon: Globe,
      label: 'Sitio web',
      onPress: () => Linking.openURL(company.contact.website!),
    },
    {
      icon: Share2,
      label: 'Compartir',
      onPress: () =>
        Share.share({ message: `${company.name} en Oltinde: ${WEB_APP_URL}/companies/${company.id}` }),
    },
  ].filter(Boolean) as ActionItem[];

  const companyJobs = (allJobs ?? []).filter((j) => j.companyId === company.id && j.status === 'open');
  const companyEvents = (allEvents ?? []).filter(
    (e) => e.organizerType === 'company' && e.organizerId === company.id && e.status === 'scheduled',
  );
  const offers = [...(company.offers ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const announcements = [...(company.announcements ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const showCorporateFields = !INFORMAL_CATEGORIES.some((cat) => company.category?.toLowerCase().includes(cat));

  const details: { label: string; value: string }[] = [
    showCorporateFields && company.legalForm && { label: 'Forma jurídica', value: company.legalForm },
    showCorporateFields && company.cif && { label: 'CIF', value: company.cif },
    showCorporateFields && company.yearEstablished && { label: 'Año de constitución', value: String(company.yearEstablished) },
    company.companySize && { label: 'Tamaño', value: company.companySize },
    company.capitalOwnership && { label: 'Propiedad', value: company.capitalOwnership },
    company.geographicScope && { label: 'Alcance', value: company.geographicScope },
    company.purpose && { label: 'Finalidad', value: company.purpose },
    company.fiscalRegime && { label: 'Régimen fiscal', value: company.fiscalRegime },
  ].filter(Boolean) as { label: string; value: string }[];

  const serviceIds = new Set<string>();
  (company.branches ?? []).forEach((branch) => branch.servicesOffered?.forEach((sid) => serviceIds.add(sid)));
  const serviceNames = (allServices ?? []).filter((s) => serviceIds.has(s.id)).map((s) => s.name);

  const socialLinks = Object.entries(company.contact?.socialMedia ?? {}).filter(
    ([platform, url]) => platform !== 'whatsapp' && url,
  ) as [string, string][];

  const hasNews = offers.length > 0 || announcements.length > 0 || companyJobs.length > 0 || companyEvents.length > 0;

  const infoTab = (
    <View>
      {company.companySize || company.geographicScope ? (
        <View className="flex-row flex-wrap gap-2 px-4 pb-2 pt-4">
          {company.companySize ? <Badge label={company.companySize} /> : null}
          {company.geographicScope ? <Badge label={company.geographicScope} /> : null}
        </View>
      ) : null}

      <Section title="Sobre la empresa">
        <Text className="text-sm leading-5 text-foreground">{company.description}</Text>
      </Section>

      {company.highlights && company.highlights.length > 0 ? (
        <Section title="Destacados">
          <View className="gap-1.5">
            {company.highlights.map((h, i) => (
              <Text key={i} className="text-sm text-foreground">
                • {h.text}
              </Text>
            ))}
          </View>
        </Section>
      ) : null}

      {details.length > 0 ? (
        <Section title="Detalles">
          <View className="flex-row flex-wrap gap-x-6 gap-y-3">
            {details.map((d) => (
              <View key={d.label} style={{ minWidth: '42%' }}>
                <Text className="text-xs text-muted-foreground">{d.label}</Text>
                <Text className="text-sm font-medium text-foreground">{d.value}</Text>
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      {serviceNames.length > 0 ? (
        <Section title="Servicios">
          <View className="gap-2">
            {serviceNames.map((name) => (
              <View key={name} className="flex-row items-start gap-2">
                <CheckCircle2 size={16} color="#1976D2" style={{ marginTop: 1 }} />
                <Text className="flex-1 text-sm text-foreground">{name}</Text>
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      {company.products && company.products.length > 0 ? (
        <Section title="Productos">
          <View className="gap-3">
            {company.products.map((product) => (
              <View key={product.id} className="flex-row gap-3 rounded-lg border border-border bg-card p-3">
                {product.image ? (
                  <Image source={{ uri: product.image }} style={{ width: 56, height: 56, borderRadius: 8 }} contentFit="cover" />
                ) : null}
                <View className="flex-1 justify-center">
                  <Text className="text-sm font-semibold text-foreground">{product.name}</Text>
                  {product.description ? (
                    <Text className="text-xs text-muted-foreground" numberOfLines={2}>
                      {product.description}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      <Section title="Contacto">
        <View className="gap-2.5">
          {company.contact?.email ? (
            <Pressable onPress={() => Linking.openURL(`mailto:${company.contact.email}`)}>
              <View className="flex-row items-center gap-2">
                <Mail size={16} color="#374151" />
                <Text className="text-sm text-foreground">{company.contact.email}</Text>
              </View>
            </Pressable>
          ) : null}
          {company.contact?.website ? (
            <Pressable onPress={() => Linking.openURL(company.contact.website!)}>
              <View className="flex-row items-center gap-2">
                <Globe size={16} color="#374151" />
                <Text className="text-sm text-foreground">{company.contact.website}</Text>
              </View>
            </Pressable>
          ) : null}
          {socialLinks.length > 0 ? (
            <View className="flex-row flex-wrap gap-2 pt-1">
              {socialLinks.map(([platform, url]) => (
                <Pressable
                  key={platform}
                  onPress={() => Linking.openURL(url)}
                  className="flex-row items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5"
                >
                  <ExternalLink size={13} color="#374151" />
                  <Text className="text-xs font-medium text-foreground">{SOCIAL_LABELS[platform] ?? platform}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </Section>

      {company.branches && company.branches.length > 0 ? (
        <Section title="Sucursales">
          <View className="gap-3">
            {company.branches.map((branch) => (
              <View key={branch.id} className="gap-1.5 rounded-lg border border-border bg-card p-3">
                <Text className="text-sm font-semibold text-foreground">{branch.name}</Text>
                <View className="flex-row items-start gap-2">
                  <MapPin size={14} color="#8A8A8A" />
                  <Text className="flex-1 text-sm text-muted-foreground">
                    {branch.location?.address}, {branch.location?.city}
                  </Text>
                </View>
                {branch.contact?.phone ? (
                  <Pressable onPress={() => Linking.openURL(`tel:${branch.contact.phone}`)}>
                    <View className="flex-row items-center gap-2">
                      <Phone size={14} color="#8A8A8A" />
                      <Text className="text-sm text-muted-foreground">{branch.contact.phone}</Text>
                    </View>
                  </Pressable>
                ) : null}
                {branch.workingHours && branch.workingHours.length > 0 ? (
                  <View className="mt-1 gap-0.5 border-t border-border pt-1.5">
                    {branch.workingHours.map((wh, i) => (
                      <View key={i} className="flex-row justify-between">
                        <Text className="text-xs text-muted-foreground">{wh.day}</Text>
                        <Text className="text-xs text-muted-foreground">{wh.hours}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      {company.documents && company.documents.length > 0 ? (
        <Section title="Documentos">
          <View className="gap-2">
            {company.documents.map((doc) => (
              <Pressable
                key={doc.id}
                onPress={() => Linking.openURL(doc.url)}
                className="flex-row items-center justify-between rounded-lg border border-border bg-card p-3"
              >
                <Text className="flex-1 text-sm font-medium text-foreground" numberOfLines={1}>
                  {doc.name}
                </Text>
                <Download size={16} color="#8A8A8A" />
              </Pressable>
            ))}
          </View>
        </Section>
      ) : null}

      {!company.ownerId ? (
        <View className="px-4 pt-4">
          <ClaimButton companyId={company.id} companyName={company.name} />
        </View>
      ) : null}
    </View>
  );

  const galleryTab = (
    <View className="flex-row flex-wrap gap-2 p-4">
      {(company.gallery ?? []).map((uri, i) => (
        <Image key={i} source={{ uri }} style={{ width: '48.5%', aspectRatio: 1, borderRadius: 12 }} contentFit="cover" />
      ))}
    </View>
  );

  const newsTab = (
    <View>
      {offers.length > 0 ? (
        <Section title={`Ofertas (${offers.length})`}>
          <View className="gap-2.5">
            {offers.map((offer) => (
              <ListCard
                key={offer.id}
                image={offer.image || company.logo}
                title={offer.title}
                subtitle={offer.description}
                meta={<Badge label={offer.discount} variant="primary" />}
                onPress={() => router.push(`/offers/${offer.id}`)}
              />
            ))}
          </View>
        </Section>
      ) : null}

      {announcements.length > 0 ? (
        <Section title={`Anuncios (${announcements.length})`}>
          <View className="gap-2.5">
            {announcements.map((a) => (
              <ListCard
                key={a.id}
                image={a.image || company.logo}
                title={a.title}
                subtitle={a.content}
                onPress={() => router.push(`/announcements/${a.id}`)}
              />
            ))}
          </View>
        </Section>
      ) : null}

      {companyJobs.length > 0 ? (
        <Section title={`Empleos (${companyJobs.length})`}>
          <View className="gap-2.5">
            {companyJobs.map((job) => (
              <ListCard
                key={job.id}
                image={company.logo}
                title={job.title}
                subtitle={`${job.employmentType} · ${job.city}`}
                meta={
                  <View className="flex-row items-center gap-1.5">
                    <Briefcase size={13} color="#8A8A8A" />
                  </View>
                }
                onPress={() => router.push(`/jobs/${job.id}`)}
              />
            ))}
          </View>
        </Section>
      ) : null}

      {companyEvents.length > 0 ? (
        <Section title={`Eventos (${companyEvents.length})`}>
          <View className="gap-2.5">
            {companyEvents.map((event) => (
              <ListCard
                key={event.id}
                image={company.logo}
                title={event.title}
                subtitle={event.city}
                meta={
                  <View className="flex-row items-center gap-1.5">
                    <CalendarDays size={13} color="#8A8A8A" />
                  </View>
                }
                onPress={() => router.push(`/events/${event.id}`)}
              />
            ))}
          </View>
        </Section>
      ) : null}
    </View>
  );

  const reviewsTab = (
    <View className="px-4 py-5">
      <View className="gap-4">
        <ReviewForm entityType="companies" entityId={company.id} />
        <ReviewList reviews={company.reviews} />
      </View>
    </View>
  );

  const tabs: DetailTab[] = [{ key: 'info', label: 'Información', content: infoTab }];
  if (menuItems && menuItems.length > 0) {
    tabs.push({ key: 'menu', label: 'Menú', content: <Section title="Menú"><RestaurantMenu items={menuItems} companyId={company.id} companyName={company.name} /></Section> });
  }
  if (shopProducts && shopProducts.total > 0) {
    tabs.push({
      key: 'shop',
      label: `Tienda (${shopProducts.total})`,
      content: (
        <View className="flex-row flex-wrap gap-3 p-4">
          {shopProducts.items.map((p) => <ProductCard key={p.id} product={p} width={(width - 32 - 12) / 2} />)}
          {shopProducts.total > shopProducts.items.length ? (
            <Pressable onPress={() => router.push({ pathname: '/tienda/buscar', params: { companyId: company.id, title: company.name } })} className="w-full py-2">
              <Text className="text-center text-sm font-semibold text-secondary">Ver los {shopProducts.total} productos</Text>
            </Pressable>
          ) : null}
        </View>
      ),
    });
  }
  if (companyRentals && companyRentals.total > 0) {
    tabs.push({
      key: 'rentals',
      label: `Alquileres (${companyRentals.total})`,
      content: (
        <View className="gap-3 p-4">
          {companyRentals.items.map((l) => <RentalCard key={l.id} listing={l} width="full" />)}
        </View>
      ),
    });
  }
  if (company.gallery && company.gallery.length > 0) {
    tabs.push({ key: 'gallery', label: `Fotos (${company.gallery.length})`, content: galleryTab });
  }
  const newsCount = offers.length + announcements.length + companyJobs.length + companyEvents.length;
  if (hasNews) {
    tabs.push({ key: 'news', label: `Novedades (${newsCount})`, content: newsTab });
  }
  tabs.push({ key: 'reviews', label: `Reseñas (${company.reviews.length})`, content: reviewsTab });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: company.name }} />
      <ScrollView>
        <DetailHeader
          logo={company.logo}
          title={company.name}
          category={company.category}
          rating={averageRating(company.reviews)}
          reviewCount={company.reviews.length}
          verified={company.isVerified}
          isFavorite={favorite}
          onToggleFavorite={toggleFavorite}
          actions={actions}
        />
        <View className="px-4 pb-1">
          <OpenStatusBadge branch={mainBranch} />
        </View>
        <DetailTabs tabs={tabs} />
      </ScrollView>
    </SafeAreaView>
  );
}
