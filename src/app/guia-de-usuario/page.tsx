
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BookUser,
  Building,
  FileText,
  Gift,
  Landmark,
  Megaphone,
  MessageSquare,
  Search,
  ShieldCheck,
  Star,
  Upload,
  UserPlus,
  Bot
} from "lucide-react";
import Link from "next/link";

const sections = [
    {
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
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-bold font-headline">Guía del Usuario</CardTitle>
        <CardDescription className="max-w-3xl mt-2 text-lg">
          Descubra cómo sacar el máximo provecho de nuestra plataforma. Desde
          registrar su negocio hasta encontrar la información que necesita.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-10">
        <Accordion type="multiple" defaultValue={sections.map((_, index) => `section-${index}`)} className="w-full">
          {sections.map((section, index) => (
            <AccordionItem key={index} value={`section-${index}`}>
              <AccordionTrigger className="text-xl text-left hover:no-underline font-semibold">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <section.icon className="w-6 h-6 text-black" />
                  </div>
                  {index + 1}. {section.title}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pt-2">
                  {section.content.map((item, itemIndex) => (
                    <div key={itemIndex}>
                      <h4 className="font-semibold">{item.subtitle}</h4>
                      <p className="text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: item.text }} />
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center pt-6 border-t">
          <h2 className="text-2xl font-bold font-headline">¿Listo para Empezar?</h2>
          <p className="text-muted-foreground mt-2 mb-4">Cree una cuenta para empezar a explorar todas las posibilidades.</p>
          <Button asChild>
            <Link href="/signup">Registrarse Ahora</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
