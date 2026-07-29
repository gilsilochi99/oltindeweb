
import { Button } from "@/components/ui/button";
import {
  BookUser,
  Building,
  Bot,
  UserPlus,
  Compass,
  HeartPulse,
  UtensilsCrossed,
  HardHat,
} from "lucide-react";
import Link from "next/link";

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
        ]
    },
    {
        id: "profesionales",
        icon: HardHat,
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

export default function UserGuidePage() {
  return (
    <div className="flex flex-col gap-16 md:gap-20 -m-4 md:-m-10 mb-12 md:mb-20">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-20 bg-[var(--section-muted)]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-secondary/10 blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <Eyebrow>Cómo usar Oltinde</Eyebrow>
          <h1 className="text-3xl md:text-5xl font-bold font-headline tracking-tight text-foreground/90">
            Guía del Usuario
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubra cómo sacar el máximo provecho de Oltinde: desde registrar su negocio hasta planificar su próximo viaje.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-card text-sm font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
              >
                <section.icon className="w-4 h-4" />
                {section.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Sections */}
      <div className="container mx-auto px-4 flex flex-col gap-16">
        {sections.map((section, index) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-md bg-primary flex items-center justify-center shrink-0">
                <section.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold font-headline normal-case">{section.title}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
              {section.content.map((item) => (
                <div key={item.subtitle} className="border-l-2 border-primary pl-4">
                  <h3 className="font-semibold">{item.subtitle}</h3>
                  <p className="text-sm text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: item.text }} />
                </div>
              ))}
            </div>
            {index < sections.length - 1 && <div className="mt-16 border-b" />}
          </section>
        ))}
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
