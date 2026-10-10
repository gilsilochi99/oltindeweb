import { Fragment, type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Bot } from 'lucide-react-native';
import type { AssistantAnswer } from '../../lib/assistant';
import type { RankedResults } from '../../lib/search-engine';
import { appRouteForLink } from '../../lib/notification-links';
import { ListCard } from '../ui/ListCard';
import { ProductCard } from '../shop/ProductCard';
import { RentalCard } from '../rentals/RentalCard';
import { averageRating } from '../ui/StarRating';

const PER_GROUP = 4;

// Links in stored texts are website paths; open the matching app screen.
function openLink(href: string) {
  if (href.startsWith('/')) router.push(appRouteForLink(href) as never);
}

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) {
      const href = m[2];
      out.push(
        <Text key={`${key}-${i++}`} className="font-semibold text-secondary underline" onPress={() => openLink(href)}>
          {m[1]}
        </Text>,
      );
    } else {
      out.push(<Text key={`${key}-${i++}`} className="font-semibold">{m[3]}</Text>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// Small Markdown (links, bold, lists, paragraphs), as on the web.
export function AssistantMarkdown({ text }: { text: string }) {
  return (
    <View className="gap-2">
      {text.split(/\n{2,}/).map((block, b) => (
        <Text key={b} className="text-[15px] leading-6 text-foreground">
          {block.split('\n').filter((l) => l.trim()).map((l, j) => {
            const bullet = l.match(/^\s*([-*•]|\d+[.)])\s+/);
            const body = l.replace(/^\s*([-*•]|\d+[.)])\s+/, '').replace(/^#+\s*/, '');
            return (
              <Fragment key={j}>
                {j > 0 ? '\n' : ''}
                {bullet ? (/\d/.test(bullet[1]) ? `${bullet[1]} ` : '• ') : ''}
                {inline(body, `${b}-${j}`)}
              </Fragment>
            );
          })}
        </Text>
      ))}
    </View>
  );
}

type Item = {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  verified?: boolean;
  rating?: number;
  reviewCount?: number;
  phone?: string;
  href: string;
};

// The same card for every kind of directory result (as the section lists use).
function groups(r: RankedResults): { key: string; title: string; items: Item[] }[] {
  const city = (b?: { location?: { city?: string } }[]) => b?.[0]?.location?.city;
  const phone = (b?: { contact?: { phone?: string } }[]) => b?.[0]?.contact?.phone;
  const health = (f: RankedResults['pharmacies'][number]): Item => ({ id: f.id, title: f.name, subtitle: city(f.branches), image: f.image, phone: phone(f.branches), href: `/health/${f.id}` });
  return [
    { key: 'companies', title: 'Empresas', items: r.companies.map((c) => ({ id: c.id, title: c.name, subtitle: [c.category, city(c.branches)].filter(Boolean).join(' · '), image: c.logo, verified: c.isVerified, rating: averageRating(c.reviews), reviewCount: c.reviews?.length, phone: phone(c.branches), href: `/companies/${c.id}` })) },
    { key: 'pharmacies', title: 'Farmacias', items: r.pharmacies.map(health) },
    { key: 'institutions', title: 'Instituciones', items: r.institutions.map((i) => ({ id: i.id, title: i.name, subtitle: i.category, image: i.logo, href: `/institutions/${i.id}` })) },
    { key: 'procedures', title: 'Trámites', items: r.procedures.map((p) => ({ id: p.id, title: p.name, subtitle: p.category, href: `/procedures/${p.id}` })) },
    { key: 'professionals', title: 'Profesionales', items: r.professionals.map((p) => ({ id: p.id, title: p.displayName, subtitle: [p.title, p.city].filter(Boolean).join(' · '), image: p.photo, href: `/professionals/${p.id}` })) },
    { key: 'services', title: 'Servicios', items: r.services.map((s) => ({ id: s.id, title: s.name, subtitle: s.category, href: `/services/${s.id}` })) },
    { key: 'food', title: 'Comida', items: r.foodItems.map((m) => ({ id: m.id, title: m.name, subtitle: m.companyName, image: m.image || m.companyLogo, href: `/companies/${m.companyId}` })) },
    { key: 'offers', title: 'Ofertas', items: r.offers.map((o) => ({ id: o.id, title: o.title, subtitle: o.companyName, image: o.image || o.companyLogo, href: `/offers/${o.id}` })) },
    { key: 'jobs', title: 'Empleos', items: r.jobs.map((j) => ({ id: j.id, title: j.title, subtitle: j.companyName, image: j.companyLogo, href: `/jobs/${j.id}` })) },
    { key: 'events', title: 'Eventos', items: r.events.map((e) => ({ id: e.id, title: e.title, subtitle: e.city, image: e.organizerLogo, href: `/events/${e.id}` })) },
    { key: 'places', title: 'Lugares turísticos', items: r.places.map((p) => ({ id: p.id, title: p.name, subtitle: p.category, image: p.image, href: `/places/${p.id}` })) },
    { key: 'itineraries', title: 'Itinerarios', items: r.itineraries.map((it) => ({ id: it.id, title: it.title, subtitle: it.city, image: it.coverImage, href: `/itineraries/${it.id}` })) },
    { key: 'clinics', title: 'Clínicas', items: r.clinics.map(health) },
    { key: 'hospitals', title: 'Hospitales', items: r.hospitals.map(health) },
    { key: 'posts', title: 'Publicaciones', items: r.posts.map((p) => ({ id: p.id, title: p.title, subtitle: p.authorName, image: p.featuredImage, href: `/contribuciones/${p.id}` })) },
  ].filter((g) => g.items.length);
}

function Heading({ children }: { children: string }) {
  return <Text className="text-xs font-semibold text-muted-foreground">{children}</Text>;
}

// One answer of the assistant: its opening sentence, the stored text, the
// results as cards, and its closing question.
export function AssistantAnswerView({ reply }: { reply: AssistantAnswer }) {
  const found = reply.results ? groups(reply.results) : [];
  const hasCards = found.length > 0 || reply.products.length > 0 || reply.rentals.length > 0;
  return (
    <View className="gap-3">
      <View className="flex-row items-start gap-2">
        <View className="mt-0.5 h-7 w-7 items-center justify-center rounded-full bg-primary">
          <Bot size={14} color="#000" />
        </View>
        <View className="flex-1 gap-2.5">
          {reply.intro ? <Text className="text-[15px] leading-6 text-foreground">{reply.intro}</Text> : null}
          {reply.body ? <AssistantMarkdown text={reply.body} /> : null}
          {hasCards && reply.body && !reply.body.trim().endsWith(':') ? <Text className="text-sm text-muted-foreground">También he encontrado en Oltinde:</Text> : null}
        </View>
      </View>

      {found.map((g) => (
        <View key={g.key} className="gap-2">
          <Heading>{g.title}</Heading>
          {g.items.slice(0, PER_GROUP).map((item, i) => (
            <ListCard
              key={item.id}
              index={i}
              image={item.image}
              title={item.title}
              subtitle={item.subtitle}
              verified={item.verified}
              rating={item.rating}
              reviewCount={item.reviewCount}
              phone={item.phone}
              onPress={() => router.push(item.href as never)}
            />
          ))}
        </View>
      ))}

      {reply.products.length ? (
        <View className="gap-2">
          <Heading>Productos en la Tienda</Heading>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
            {reply.products.map((p) => <ProductCard key={p.id} product={p} />)}
          </ScrollView>
        </View>
      ) : null}
      {reply.rentals.length ? (
        <View className="gap-2">
          <Heading>Alquileres</Heading>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
            {reply.rentals.map((l) => <RentalCard key={l.id} listing={l} />)}
          </ScrollView>
        </View>
      ) : null}

      {reply.cierre ? <Text className="pl-9 text-[15px] leading-6 text-foreground">{reply.cierre}</Text> : null}
    </View>
  );
}
