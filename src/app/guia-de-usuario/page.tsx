import type { Metadata } from 'next';

import { Button } from "@/components/ui/button";
import {
  BookUser,
  Building,
  Bot,
  UserPlus,
  Compass,
  HeartPulse,
  UtensilsCrossed,
  GraduationCap,
  ShoppingBag,
  Store,
  KeyRound,
  CalendarCheck,
} from "lucide-react";
import Link from "next/link";
import { GuideChips, GuideSidebar, type GuideNavGroup } from "./GuideNav";

export const metadata: Metadata = {
  title: "Guía del Usuario",
  description: "Aprenda a usar Oltinde paso a paso: comprar en la tienda, alquilar casas y coches, registrar y gestionar su empresa, vender y publicar alquileres.",
  alternates: { canonical: '/guia-de-usuario' },
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-black inline-block border-b-2 border-primary pb-1 mb-3">
      {children}
    </p>
  );
}

const sections = [
    {
        id: "cuenta",
        icon: UserPlus,
        title: "Primeros Pasos: Su Cuenta en Oltinde",
        content: [
            {
                subtitle: "1. Registrarse",
                text: "Para empezar, necesita una cuenta gratuita. Haga clic en 'Registrarse' en la esquina superior derecha. Puede usar su cuenta de Google para un registro rápido o su correo electrónico y una contraseña. Una vez registrado, tendrá acceso a su Panel de Control."
            },
            {
                subtitle: "2. Iniciar Sesión",
                text: "Una vez que tenga su cuenta, puede iniciar sesión en cualquier momento para acceder a su panel, gestionar sus empresas, ver sus favoritos y más."
            },
            {
                subtitle: "3. Modo Claro y Oscuro",
                text: "Use el icono de sol/luna en la cabecera para cambiar entre modo claro, oscuro o seguir la configuración de su dispositivo automáticamente."
            },
        ]
    },
    {
        id: "tienda",
        icon: ShoppingBag,
        title: "Tienda Online: Comprar",
        content: [
            {
                subtitle: "1. Encontrar Productos",
                text: "Entre en <a href=\"/tienda\" class=\"underline\">Tienda</a> desde el menú. Busque por nombre o marca, navegue por categorías y use los filtros de precio, marca, estado (nuevo, usado, reacondicionado), ciudad del vendedor, solo en stock u ofertas."
            },
            {
                subtitle: "2. Elegir Variante y Cantidad",
                text: "En la ficha de cada producto verá fotos, precio, características y stock. Si el producto tiene tallas, colores u otras opciones, elíjalas antes de comprar: el precio y la disponibilidad cambian según la variante."
            },
            {
                subtitle: "3. Carrito con Varios Vendedores",
                text: "Pulse 'Añadir al carrito' o 'Comprar ahora'. Puede comprar a varias empresas a la vez: al tramitar, recibirá un pedido separado de cada vendedor."
            },
            {
                subtitle: "4. Entrega, Pago y Cupones",
                text: "En 'Tramitar pedido' elija para cada vendedor recogida en tienda o envío a domicilio (la tarifa depende de la ciudad) y el método de pago: efectivo al recibir o Muni Dinero. Si tiene un código de descuento, escríbalo en 'Código de descuento'. No se cobra nada en la web."
            },
            {
                subtitle: "5. Seguir su Pedido",
                text: "Tras confirmar verá su número de pedido (OLT-XXXXXX) y el progreso: pendiente, confirmado, en preparación, enviado o listo para recoger, y entregado. Con cuenta, lo encontrará en <a href=\"/dashboard/compras\" class=\"underline\">Mis Compras</a> y recibirá notificaciones. Sin cuenta, guarde el enlace de la página de confirmación."
            },
            {
                subtitle: "6. Cancelar un Pedido",
                text: "Puede cancelar mientras el vendedor no haya empezado a prepararlo (estados pendiente o confirmado). Después, contacte con el vendedor."
            },
            {
                subtitle: "7. Valorar y Preguntar",
                text: "Si recibió el producto, puede valorarlo con estrellas y un comentario: su reseña aparecerá como 'Compra verificada'. Cualquier usuario registrado puede hacer preguntas al vendedor en la ficha del producto."
            },
            {
                subtitle: "8. Lista de Deseos",
                text: "Pulse el corazón de un producto para guardarlo en su <a href=\"/tienda/deseos\" class=\"underline\">Lista de deseos</a> y comprarlo más tarde."
            },
        ]
    },
    {
        id: "vender",
        icon: Store,
        title: "Vender en la Tienda (Empresas)",
        content: [
            {
                subtitle: "1. Activar su Tienda (Premium)",
                text: "Las empresas Premium tienen la sección 'Tienda' en su Panel de Control. Desde ahí gestiona productos, pedidos, preguntas, cupones, estadísticas y ajustes."
            },
            {
                subtitle: "2. Publicar Productos",
                text: "Pulse 'Añadir producto': título, descripción, categoría, marca, hasta 12 fotos, ficha técnica y etiquetas. Para publicar necesita categoría, al menos una foto y precio. Puede guardarlo como borrador y verlo en 'Vista previa' antes."
            },
            {
                subtitle: "3. Variantes, Precios y Stock",
                text: "Active 'Tiene variantes' para tallas, colores, capacidades... Cada combinación tiene su precio, precio anterior (aparece tachado como oferta), stock, referencia y foto. El stock se descuenta solo con cada venta y se repone si se cancela; el historial queda registrado."
            },
            {
                subtitle: "4. Entrega y Pago",
                text: "En 'Ajustes' elija si ofrece recogida en tienda y/o envío a domicilio, la tarifa general y por ciudad, el envío gratis a partir de un importe, el pedido mínimo y si acepta efectivo o Muni Dinero."
            },
            {
                subtitle: "5. Gestionar Pedidos",
                text: "Recibirá una notificación con cada pedido nuevo. En 'Pedidos' confírmelo, márquelo en preparación, enviado o listo para recoger, y entregado: el cliente recibe un aviso en cada paso. Para cancelar debe indicar el motivo."
            },
            {
                subtitle: "6. Cupones de Descuento",
                text: "En 'Cupones' cree códigos de porcentaje o importe fijo, con compra mínima, número máximo de usos y fechas de validez. Compártalos con sus clientes en redes sociales o anuncios."
            },
            {
                subtitle: "7. Preguntas y Valoraciones",
                text: "Responda en 'Preguntas' a las dudas de los clientes: las respuestas se publican en la ficha. También puede responder públicamente a cada valoración desde la ficha del producto."
            },
            {
                subtitle: "8. Estadísticas",
                text: "En 'Estadísticas' vea sus ventas, ingresos netos tras la comisión de Oltinde, pedidos, ticket medio, visitas, productos más vendidos y avisos de stock bajo."
            },
        ]
    },
    {
        id: "alquiler",
        icon: KeyRound,
        title: "Alquileres: Casas y Coches",
        content: [
            {
                subtitle: "1. Buscar un Alquiler",
                text: "Entre en <a href=\"/alquiler\" class=\"underline\">Alquiler</a> desde el menú. Elija Inmuebles (casas, pisos, oficinas, locales...) o Vehículos (coches, todoterrenos, furgonetas...) y filtre por ciudad, precio, habitaciones, plazas, con o sin conductor y servicios como generador, wifi o parking."
            },
            {
                subtitle: "2. Por Noches o Días, o Por Meses",
                text: "Cada anuncio indica si se alquila por noches (inmuebles) o por días (vehículos), por meses, o de las dos formas, con su precio, el mínimo de noches o meses y la fianza si la hay. Para vehículos puede pedir conductor si la empresa lo ofrece."
            },
            {
                subtitle: "3. Preguntar por WhatsApp o Llamar",
                text: "¿Tiene dudas antes de reservar? Use los botones 'Consultar por WhatsApp' o 'Llamar' del anuncio para hablar directamente con la empresa."
            },
            {
                subtitle: "4. Solicitar la Reserva",
                text: "En 'Solicitar reserva' marque en el calendario la primera y la última noche (o día), o, por meses, el día de entrada y la duración. Verá el precio total antes de continuar. Indique su nombre y teléfono y envíe la solicitud: no necesita cuenta."
            },
            {
                subtitle: "5. Respuesta de la Empresa",
                text: "La empresa acepta o rechaza su solicitud y usted recibe un aviso. Mientras está pendiente, las fechas quedan reservadas para usted. El pago y la fianza se acuerdan directamente con la empresa: en la web no se cobra nada."
            },
            {
                subtitle: "6. Seguir o Cancelar su Reserva",
                text: "Guarde el enlace de la página de confirmación (número ALQ-XXXXXX): con él puede seguir y cancelar su solicitud. Con cuenta, todas sus reservas están en <a href=\"/dashboard/reservas\" class=\"underline\">Mis reservas</a>. Puede cancelar mientras esté pendiente o, si ya está aceptada, antes de que empiece."
            },
        ]
    },
    {
        id: "publicar-alquiler",
        icon: CalendarCheck,
        title: "Publicar Alquileres (Empresas)",
        content: [
            {
                subtitle: "1. Sección Alquileres (Premium)",
                text: "Las empresas Premium tienen la sección 'Alquileres' en su Panel de Control. Desde ahí gestionan sus anuncios, la disponibilidad y las reservas."
            },
            {
                subtitle: "2. Crear un Anuncio",
                text: "Pulse 'Nuevo anuncio' y elija qué alquila: un inmueble o un vehículo. Añada título, descripción, hasta 15 fotos (la primera es la portada), ubicación en el mapa y las características: habitaciones, baños, superficie y servicios, o marca, modelo, plazas, cambio y combustible."
            },
            {
                subtitle: "3. Precios y Modalidad",
                text: "Active el alquiler por noches o días, por meses, o los dos. Indique el precio, el mínimo (y máximo, si quiere) de noches o meses y la fianza. Para vehículos, elija si se alquila sin conductor, con conductor o ambos, y el suplemento diario por conductor."
            },
            {
                subtitle: "4. Disponibilidad",
                text: "En la pestaña 'Disponibilidad' del anuncio, marque en el calendario las fechas en que no se puede alquilar (mantenimiento, uso propio, alquilado por otra vía). Las reservas aceptadas y pendientes también bloquean el calendario automáticamente."
            },
            {
                subtitle: "5. Gestionar Reservas",
                text: "Recibirá una notificación con cada solicitud. En 'Reservas' vea los datos del cliente y acéptela o recházela: el cliente recibe un aviso. Contacte con él por teléfono o WhatsApp para acordar el pago y la entrega, y marque la reserva como finalizada al terminar."
            },
        ]
    },
    {
        id: "empresas",
        icon: Building,
        title: "Gestión de Empresas",
        content: [
             {
                subtitle: "1. Listar su Empresa",
                text: "Desde su Panel de Control, haga clic en 'Añadir Nueva Empresa'. Rellene el formulario con toda la información de su negocio. Cuantos más detalles proporcione (logo, descripción, redes sociales, sucursales), más atractivo será su perfil para los clientes. El plan gratuito le permite registrar una empresa."
            },
            {
                subtitle: "2. Reclamar una Empresa Existente",
                text: "Si su empresa ya está en nuestro directorio pero usted no la gestiona, búsquela y en su perfil encontrará un botón para 'Reclamar esta Empresa'. Nuestro equipo revisará su solicitud para otorgarle el control."
            },
            {
                subtitle: "3. Editar su Perfil",
                text: "En su Panel de Control, puede editar la información de su empresa en cualquier momento para mantenerla actualizada."
            },
            {
                subtitle: "4. Publicar Anuncios (Premium)",
                text: "Informe a sus seguidores sobre noticias, nuevos horarios o eventos. Desde el panel de su empresa, puede crear anuncios que aparecerán en su perfil y en la sección general de anuncios."
            },
            {
                subtitle: "5. Crear Ofertas (Premium)",
                text: "Atraiga más clientes con descuentos y promociones. Puede crear ofertas especiales que se mostrarán de forma destacada en su perfil y en la página principal de ofertas."
            },
             {
                subtitle: "6. Subir Documentos (Premium)",
                text: "Comparta catálogos, menús, folletos u otros documentos importantes directamente en su perfil de empresa para que los clientes puedan descargarlos."
            },
            {
                subtitle: "7. Publicar Empleos (Premium)",
                text: "Publique vacantes en la Bolsa de Trabajo indicando tipo de contrato, salario, requisitos y cómo aplicar. Aparecerán en la sección de Empleos del directorio."
            },
            {
                subtitle: "8. Organizar Eventos (Premium)",
                text: "Cree ferias, conferencias o encuentros desde el panel de su empresa. Sus seguidores recibirán una notificación cuando publique uno nuevo."
            },
            {
                subtitle: "9. Activar el Menú de su Restaurante (Premium)",
                text: "Si la categoría de su negocio es \"Restaurante\", aparecerá automáticamente la opción 'Menú' en su Panel de Control. Añada sus platos con foto, precio, tipo de comida y marque los de \"Menú del Día\". En cuanto añada un producto, el menú se publica en su perfil y los clientes ya pueden pedir. Los pedidos que reciba se gestionan desde 'Ver Pedidos', junto al menú."
            },
            {
                subtitle: "10. Vender Productos en la Tienda (Premium)",
                text: "Publique sus productos con precio, fotos y stock en la Tienda Oltinde y reciba pedidos de todo el país. Vea la guía completa en <a href=\"#vender\" class=\"underline\">Vender en la Tienda</a>."
            },
            {
                subtitle: "11. Publicar Alquileres (Premium)",
                text: "Anuncie casas, pisos, locales o vehículos de alquiler, con calendario de disponibilidad y solicitudes de reserva. Vea la guía completa en <a href=\"#publicar-alquiler\" class=\"underline\">Publicar Alquileres</a>."
            },
        ]
    },
    {
        id: "profesionales",
        icon: GraduationCap,
        title: "Profesionales Independientes",
        content: [
            {
                subtitle: "1. Publicar su Perfil",
                text: "Desde su Panel de Control, vaya a 'Perfil de Profesional' y complete su nombre, título, categoría, ciudad y una breve biografía. Es gratis y su perfil se publica de inmediato."
            },
            {
                subtitle: "2. Añadir Habilidades y Servicios",
                text: "Liste sus habilidades y los servicios que ofrece, cada uno con un precio orientativo, para que los clientes sepan exactamente qué esperar antes de contactarle."
            },
            {
                subtitle: "3. Mostrar su Portafolio",
                text: "Suba hasta 5 fotos de trabajos anteriores para generar confianza y demostrar la calidad de su trabajo."
            },
            {
                subtitle: "4. Ser Encontrado",
                text: "Su perfil aparece en la sección Profesionales y en el buscador inteligente, filtrable por categoría y ciudad. Los clientes pueden dejarle reseñas y contactarle directamente por teléfono, WhatsApp o email."
            },
        ]
    },
     {
        id: "usuarios",
        icon: BookUser,
        title: "Para Todos los Usuarios",
        content: [
             {
                subtitle: "1. Explorar y Buscar",
                text: "Utilice la barra de búsqueda principal para encontrar empresas, trámites o servicios con lenguaje natural. En las páginas de directorios, use los filtros para afinar su búsqueda por categoría o ubicación."
            },
            {
                subtitle: "2. Dejar Reseñas",
                text: "Su opinión es importante. En el perfil de cualquier empresa, institución, trámite o itinerario, puede dejar una calificación con estrellas y un comentario para compartir su experiencia con la comunidad."
            },
            {
                subtitle: "3. Guardar Favoritos",
                text: "Haga clic en el icono de la estrella (★) en cualquier empresa, trámite, institución, empleo, evento, lugar turístico o itinerario para guardarlo en su lista de Favoritos, accesible desde el menú de su cuenta."
            },
            {
                subtitle: "4. Suscribirse a Empresas y Categorías",
                text: "Use el icono de la campana (🔔) en el perfil de cualquier empresa para suscribirse a ella. También puede suscribirse a categorías completas (por ejemplo, \"Restaurantes\" o \"Construcción\") desde la sección \"Mis Suscripciones\" en su Perfil, sin necesidad de seguir cada empresa por separado. Recibirá una notificación en el sitio cada vez que una empresa o categoría a la que sigue publique un nuevo anuncio, oferta, empleo o evento."
            },
            {
                subtitle: "5. Elegir sus Notificaciones por Email",
                text: "Además de las notificaciones dentro del sitio, puede recibir un correo electrónico cuando ocurran las novedades que le interesan. Vaya a su Perfil y, en \"Configuración de Notificaciones por Email\", active o desactive cada tipo (Anuncios, Ofertas, Empleos, Eventos) de forma independiente."
            },
             {
                subtitle: "6. Crear Contribuciones",
                text: "Comparta su conocimiento escribiendo un artículo. Desde su Panel de Control, puede crear una nueva publicación. Será revisada por nuestro equipo antes de publicarse en la sección de Contribuciones."
            },
            {
                subtitle: "7. Compartir en Redes Sociales",
                text: "En la página de detalles de cualquier empresa, empleo, evento, lugar turístico o itinerario, use los botones de Facebook, X (Twitter), WhatsApp e Instagram para compartirlo fácilmente."
            },
        ]
    },
    {
        id: "turismo",
        icon: Compass,
        title: "Turismo: Lugares e Itinerarios",
        content: [
            {
                subtitle: "1. Explorar Lugares Turísticos",
                text: "Descubra playas, monumentos, museos y otros lugares en la sección Lugares Turísticos, con filtros por categoría y ciudad."
            },
            {
                subtitle: "2. Sugerir un Lugar",
                text: "¿Conoce un lugar que no está en el directorio? Vaya a 'Sugerir un Lugar', complete los datos y márquelo en el mapa. Un administrador revisará su sugerencia antes de publicarla."
            },
            {
                subtitle: "3. Explorar Itinerarios",
                text: "Vea planes de viaje creados por otros usuarios, con un mapa de recorrido numerado y una línea de tiempo día a día de cada parada."
            },
            {
                subtitle: "4. Crear su Propio Itinerario",
                text: "Desde su Panel de Control, cree un itinerario añadiendo lugares en el orden en que los visitará, con notas y horarios sugeridos para cada parada, y compártalo con la comunidad."
            },
        ]
    },
    {
        id: "salud",
        icon: HeartPulse,
        title: "Salud: Hospitales, Clínicas y Farmacias",
        content: [
            {
                subtitle: "1. Explorar Centros de Salud",
                text: "En la sección Salud encontrará hospitales, clínicas y farmacias, con sus servicios, especialidades y datos de contacto, filtrables por ciudad."
            },
            {
                subtitle: "2. Farmacias de Guardia",
                text: "En la página de Salud y en el listado de Farmacias verá cuáles están \"De Guardia Hoy\", con la opción de filtrar solo por las que están de guardia en este momento."
            },
            {
                subtitle: "3. Varias Sucursales",
                text: "Si un centro tiene varias sucursales, todas aparecen en su página de detalle con su propia dirección, teléfono y horario, además de un mapa con cada ubicación."
            },
        ]
    },
    {
        id: "comida",
        icon: UtensilsCrossed,
        title: "Comida a Domicilio",
        content: [
            {
                subtitle: "1. Ver el Menú",
                text: "En el perfil de cualquier restaurante, busque la sección Menú. Los platos están agrupados por tipo de comida, con el \"Menú del Día\" destacado arriba."
            },
            {
                subtitle: "2. Añadir al Carrito",
                text: "Pulse 'Añadir' en cada plato que desee. Solo puede pedir de un restaurante a la vez: si añade un producto de otro restaurante, se le preguntará si desea vaciar el carrito actual."
            },
            {
                subtitle: "3. Elegir Entrega",
                text: "En 'Confirmar Pedido' elija recoger su pedido en el local o recibirlo a domicilio con Situka, nuestro socio de reparto."
            },
            {
                subtitle: "4. Pagar y Enviar el Pedido",
                text: "Elija pagar directamente con el restaurante o con Muni Dinero. Al confirmar, el pedido se envía por WhatsApp al restaurante con todos los detalles, listo para que lo confirmen."
            },
        ]
    },
    {
        id: "asesor-ia",
        icon: Bot,
        title: "Asesor de Negocios IA",
        content: [
            {
                subtitle: "1. ¿Qué es?",
                text: "Es un asistente inteligente en la página de inicio que responde a sus preguntas sobre negocios en Guinea Ecuatorial. Utiliza la información de nuestro directorio para darle respuestas informadas."
            },
            {
                subtitle: "2. ¿Cómo usarlo?",
                text: "Simplemente escriba su pregunta en el cuadro de chat. Por ejemplo: '¿Qué empresas de marketing hay en Malabo?' o '¿Qué necesito para obtener un permiso de construcción?'. La IA buscará en Oltinde y le dará una respuesta útil."
            }
        ]
    },
];

// Sidebar order and short labels; sections render in this order too.
const NAV_GROUPS: { title: string; items: { id: string; label: string }[] }[] = [
  { title: "Para usuarios", items: [
    { id: "cuenta", label: "Primeros pasos" },
    { id: "usuarios", label: "Funciones para todos" },
    { id: "tienda", label: "Comprar en la Tienda" },
    { id: "alquiler", label: "Alquilar casas y coches" },
    { id: "comida", label: "Comida a domicilio" },
    { id: "salud", label: "Salud y farmacias" },
    { id: "turismo", label: "Turismo e itinerarios" },
  ] },
  { title: "Para empresas", items: [
    { id: "empresas", label: "Gestión de empresas" },
    { id: "vender", label: "Vender en la Tienda" },
    { id: "publicar-alquiler", label: "Publicar alquileres" },
    { id: "profesionales", label: "Profesionales" },
    { id: "asesor-ia", label: "Asesor de negocios IA" },
  ] },
];

const sectionById = new Map(sections.map(s => [s.id, s]));
const orderedSections = NAV_GROUPS.flatMap(g => g.items.map(i => sectionById.get(i.id)!));
const navGroups: GuideNavGroup[] = NAV_GROUPS.map(g => ({
  title: g.title,
  items: g.items.map(i => {
    const Icon = sectionById.get(i.id)!.icon;
    return { id: i.id, title: i.label, icon: <Icon /> };
  }),
}));

export default function UserGuidePage() {
  return (
    <div className="flex flex-col -m-4 md:-m-10 mb-12 md:mb-20">
      {/* Hero */}
      <section className="relative overflow-hidden py-10 md:py-14 bg-[var(--section-muted)]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/30 blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4">
          <Eyebrow>Cómo usar Oltinde</Eyebrow>
          <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight text-foreground/90">
            Guía del Usuario
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Descubra cómo sacar el máximo provecho de Oltinde: desde comprar en la tienda o alquilar una casa o un coche hasta registrar su negocio o planificar su próximo viaje.
          </p>
        </div>
      </section>

      {/* Mobile: sticky section chips */}
      <div className="lg:hidden sticky top-16 z-30 bg-background border-b px-4">
        <GuideChips groups={navGroups} />
      </div>

      <div className="container mx-auto px-4 py-10 md:py-14 grid lg:grid-cols-[250px_1fr] gap-10 xl:gap-14 items-start">
        <aside className="hidden lg:block sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
          <GuideSidebar groups={navGroups} />
        </aside>

        <div className="min-w-0 flex flex-col gap-12">
          {orderedSections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-32 lg:scroll-mt-24">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-11 h-11 rounded-md bg-primary flex items-center justify-center shrink-0">
                  <section.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold font-headline normal-case">{section.title}</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                {section.content.map((item) => (
                  <div key={item.subtitle} className="border-l-2 border-primary pl-4">
                    <h3 className="font-semibold">{item.subtitle}</h3>
                    <p className="text-sm text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: item.text }} />
                  </div>
                ))}
              </div>
              {index < orderedSections.length - 1 && <div className="mt-12 border-b" />}
            </section>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <section className="relative overflow-hidden py-16 bg-primary">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-black/5 pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-black/5 pointer-events-none" />
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case text-primary-foreground">¿Listo para empezar?</h2>
          <p className="text-primary-foreground/80 mt-2 mb-6 max-w-xl mx-auto">
            Cree una cuenta para empezar a explorar todas las posibilidades de Oltinde.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/signup">Registrarse Ahora</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
