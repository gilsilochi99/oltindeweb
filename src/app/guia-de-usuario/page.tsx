
import { Button } from "@/components/ui/button";
import {
  BookUser,
  Building,
  Bot,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

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
        ]
    },
     {
        id: "usuarios",
        icon: BookUser,
        title: "Para Todos los Usuarios",
        content: [
             {
                subtitle: "1. Explorar y Buscar",
                text: "Utilice la barra de búsqueda principal para encontrar empresas, trámites o servicios. En las páginas de directorios (Empresas, Instituciones, Trámites), use los filtros para afinar su búsqueda por categoría o ubicación."
            },
            {
                subtitle: "2. Dejar Reseñas",
                text: "Su opinión es importante. En el perfil de cualquier empresa, institución o trámite, puede dejar una calificación con estrellas y un comentario para compartir su experiencia con la comunidad."
            },
            {
                subtitle: "3. Guardar Favoritos",
                text: "Haga clic en el icono de la estrella (★) en cualquier empresa, trámite, institución, empleo o evento para guardarlo en su lista de Favoritos, accesible desde el menú de su cuenta."
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
      <section className="py-12 md:py-20" style={{ backgroundColor: '#F9F8F6' }}>
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold font-headline tracking-tight text-foreground/90">
            Guía del Usuario
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubra cómo sacar el máximo provecho de Oltinde: desde registrar su negocio hasta encontrar la información que necesita.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-white text-sm font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
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
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
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
