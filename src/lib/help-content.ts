// Help content shared by the FAQ page, the user guide and the Oltinde
// assistant (src/lib/assistant.ts), so editing it here updates all three.
// Texts may contain simple HTML links (<a href="/tienda">).

export type GuideIcon = 'UserPlus' | 'ShoppingBag' | 'Store' | 'KeyRound' | 'CalendarCheck' | 'Building' | 'GraduationCap' | 'BookUser' | 'Compass' | 'HeartPulse' | 'UtensilsCrossed' | 'Bot';
export type GuideSection = { id: string; icon: GuideIcon; title: string; content: { subtitle: string; text: string }[] };

export const GUIDE_SECTIONS: GuideSection[] = [
    {
        id: "cuenta",
        icon: 'UserPlus',
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
        icon: 'ShoppingBag',
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
        icon: 'Store',
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
        icon: 'KeyRound',
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
        icon: 'CalendarCheck',
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
        icon: 'Building',
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
        icon: 'GraduationCap',
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
        icon: 'BookUser',
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
        icon: 'Compass',
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
        icon: 'HeartPulse',
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
        icon: 'UtensilsCrossed',
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
        icon: 'Bot',
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

export const FAQ_ITEMS: { id?: string; question: string; answer: string }[] = [
    {
        question: "¿Qué es Oltinde?",
        answer: "Oltinde es el directorio digital más completo de Guinea Ecuatorial. Nuestro objetivo es conectar a la comunidad con empresas, servicios, instituciones y trámites de manera fácil, rápida y fiable."
    },
    {
        question: "¿Qué es la Tienda Oltinde?",
        answer: "Es nuestra nueva tienda online: un marketplace donde las empresas de Guinea Ecuatorial venden sus productos con precio en XAF, fotos y stock. Puede comprar a varias empresas en un solo pedido. Entre desde <a href='/tienda' class='text-black hover:underline'>Tienda</a> en el menú."
    },
    {
        question: "¿Cómo pago en la Tienda? ¿Es seguro?",
        answer: "En la web no se cobra nada ni se piden datos de tarjeta. Usted elige pagar en efectivo al recibir o recoger el pedido, o con Muni Dinero, y lo coordina directamente con el vendedor."
    },
    {
        question: "¿Cómo recibo mi compra y cuánto cuesta el envío?",
        answer: "Cada vendedor indica si ofrece recogida en tienda (gratis) y/o envío a domicilio. La tarifa de envío depende de su ciudad y algunos vendedores lo hacen gratis a partir de cierto importe. Lo verá antes de confirmar el pedido."
    },
    {
        question: "¿Necesito una cuenta para comprar?",
        answer: "No es obligatorio: puede comprar como invitado indicando su nombre y teléfono, y seguir el pedido con el enlace de la página de confirmación. Con una <a href='/signup' class='text-black hover:underline'>cuenta gratuita</a> verá todos sus pedidos en <a href='/dashboard/compras' class='text-black hover:underline'>Mis Compras</a>, recibirá notificaciones, podrá valorar productos y usar la lista de deseos."
    },
    {
        question: "¿Puedo cancelar un pedido de la Tienda?",
        answer: "Sí, mientras el vendedor no haya empezado a prepararlo (pedido pendiente o confirmado), desde Mis Compras o desde el enlace de su pedido. Después, contacte directamente con el vendedor."
    },
    {
        question: "¿Cómo vendo mis productos en Oltinde?",
        answer: "Las empresas <a href='/para-empresas' class='text-black hover:underline'>Premium</a> tienen la sección 'Tienda' en su panel: publican productos con variantes, precios y stock, configuran envíos y pagos, gestionan pedidos, crean cupones y ven sus estadísticas. Consulte la <a href='/guia-de-usuario#vender' class='text-black hover:underline'>guía para vendedores</a>."
    },
    {
        question: "¿Qué es Alquileres?",
        answer: "Es la nueva sección de <a href='/alquiler' class='text-black hover:underline'>Alquiler</a>: casas, pisos, oficinas y locales, y también coches, todoterrenos y furgonetas, publicados por empresas verificadas. Hay alquileres por noches o días, con calendario de disponibilidad, y alquileres por meses."
    },
    {
        question: "¿Cómo reservo una casa o un coche?",
        answer: "En el anuncio, elija 'Por noches' (o 'Por días' para vehículos) o 'Por meses', marque las fechas en el calendario y envíe la solicitud con su nombre y teléfono. La empresa la acepta o la rechaza y usted recibe un aviso. Mientras está pendiente, las fechas quedan reservadas para usted. Si tiene dudas antes de reservar, use los botones de WhatsApp o Llamar del anuncio."
    },
    {
        question: "¿Cómo se paga un alquiler? ¿Y la fianza?",
        answer: "En la web no se cobra nada. El precio total aparece antes de enviar la solicitud; el pago y la fianza (si la hay, se devuelve al final) se acuerdan directamente con la empresa cuando acepta la reserva."
    },
    {
        question: "¿Puedo cancelar una reserva de alquiler?",
        answer: "Sí. Mientras esté pendiente, o aceptada pero aún no haya empezado, cancélela desde <a href='/dashboard/reservas' class='text-black hover:underline'>Mis reservas</a> o desde el enlace de su reserva (no necesita cuenta). Las fechas quedan libres de nuevo."
    },
    {
        question: "¿Cómo publico mis inmuebles o vehículos en alquiler?",
        answer: "Las empresas <a href='/para-empresas' class='text-black hover:underline'>Premium</a> tienen la sección 'Alquileres' en su panel: publican anuncios con fotos y precios, marcan en el calendario las fechas no disponibles y aceptan o rechazan las solicitudes. Consulte la <a href='/guia-de-usuario#publicar-alquiler' class='text-black hover:underline'>guía para anunciantes</a>."
    },
    {
        question: "¿Cuánto cuesta listar mi empresa?",
        answer: "El registro y listado básico en Oltinde es completamente gratuito. También ofrecemos un plan <a href='/para-empresas' class='text-black hover:underline'>Premium</a> opcional con herramientas avanzadas (tienda online, alquileres, documentos, ofertas, anuncios, empleos y eventos) para destacar aún más su negocio."
    },
    {
        question: "¿Cómo registro mi empresa en el directorio?",
        answer: "Es muy sencillo. Primero, <a href='/signup' class='text-black hover:underline'>cree una cuenta de usuario gratuita</a>. Luego, desde su panel de control, podrá acceder al formulario para añadir su empresa. Complete la información y envíela para su revisión."
    },
     {
        question: "¿Cómo sé si la información de una empresa es de confianza?",
        answer: "Busque la insignia de 'Verificado' en el perfil de la empresa. Esta insignia significa que nuestro equipo ha confirmado: nombre legal y CIF válidos, al menos un método de contacto confirmado, y la ubicación de al menos una sede."
    },
    {
        question: "¿La información sobre los trámites está actualizada?",
        answer: "Nos esforzamos por mantener la información de los trámites lo más actualizada posible. Sin embargo, los requisitos y costos pueden cambiar. Siempre recomendamos confirmar los detalles con la institución responsable antes de iniciar cualquier procedimiento."
    },
    {
        question: "¿Cómo me entero de las nuevas ofertas y anuncios?",
        answer: "Puede visitar las secciones de <a href='/offers' class='text-black hover:underline'>Ofertas</a> y <a href='/announcements' class='text-black hover:underline'>Anuncios</a>. Para recibir notificaciones directas, puede suscribirse a sus empresas o categorías de interés haciendo clic en el botón 'Suscribirse' en sus perfiles."
    },
    {
        question: "¿Puedo publicar ofertas de empleo?",
        answer: "Sí. Con una cuenta <a href='/para-empresas' class='text-black hover:underline'>Premium</a>, puede publicar vacantes en la <a href='/jobs' class='text-black hover:underline'>Bolsa de Trabajo</a> desde el panel de su empresa: tipo de contrato, salario, requisitos y cómo aplicar."
    },
    {
        question: "¿Cómo organizo un evento?",
        answer: "Las empresas Premium pueden crear eventos (ferias, conferencias, encuentros) desde su panel de control. Aparecerán en la sección de <a href='/events' class='text-black hover:underline'>Eventos</a> y notificaremos a sus seguidores."
    },
    {
        question: "¿Qué son los Itinerarios?",
        answer: "Los <a href='/itineraries' class='text-black hover:underline'>Itinerarios</a> son planes de viaje creados por la comunidad, con un mapa y un recorrido paso a paso por varios <a href='/places' class='text-black hover:underline'>Lugares Turísticos</a>. Cualquier usuario registrado puede crear el suyo y compartirlo."
    },
    {
        question: "¿Puedo sugerir un lugar turístico que no está en el directorio?",
        answer: "¡Claro! Vaya a <a href='/places/suggest' class='text-black hover:underline'>Sugerir un Lugar</a>, complete los datos y márquelo en el mapa. Un administrador revisará su sugerencia antes de publicarla."
    },
    {
        question: "¿Puedo dejar una reseña sobre una empresa o un trámite?",
        answer: "¡Sí! Su opinión es muy valiosa. Puede dejar una reseña y una calificación en la página de detalles de cualquier empresa, institución o trámite. Para ello, necesitará tener una cuenta de usuario."
    },
    {
        id: "verificacion",
        question: "¿Qué es el proceso de verificación?",
        answer: "La verificación es una revisión manual que realiza nuestro equipo para asegurar que la información en el directorio sea precisa y confiable. Concretamente, confirmamos: nombre legal y CIF válidos, al menos un método de contacto confirmado, y la ubicación de al menos una sede. Las empresas verificadas obtienen una insignia de confianza en su perfil, lo que aumenta la credibilidad ante los clientes."
    },
    {
        question: "¿Puedo editar la información de mi empresa más tarde?",
        answer: "¡Por supuesto! Una vez que su empresa esté listada, tendrá acceso a un panel de control donde podrá actualizar toda su información, gestionar reseñas, publicar anuncios y ofertas en cualquier momento."
    },
    {
        question: "¿Cómo puedo reportar información incorrecta en un perfil?",
        answer: "Si encuentra datos incorrectos o desactualizados en el perfil de una empresa, institución o trámite, puede usar el botón 'Reportar Información Incorrecta' en la página de detalles correspondiente. Agradecemos su colaboración para mantener la calidad de nuestro directorio."
    },
    {
        question: "¿Oltinde tiene modo oscuro?",
        answer: "Sí. Puede cambiar entre modo claro, oscuro o seguir la configuración de su dispositivo desde el icono de sol/luna en la cabecera del sitio."
    },
    {
        question: "¿Puedo compartir una empresa, empleo o itinerario en redes sociales?",
        answer: "Sí. En la página de detalles de cualquier empresa, empleo, evento, itinerario o lugar turístico encontrará botones para compartir en Facebook, X (Twitter), WhatsApp e Instagram."
    },
    {
        question: "¿Cómo sé qué farmacia está de guardia hoy?",
        answer: "En la sección <a href='/health' class='text-black hover:underline'>Salud</a> y en <a href='/health/pharmacies' class='text-black hover:underline'>Farmacias</a> puede ver cuáles están \"De Guardia Hoy\" y filtrar solo por esas. Los administradores actualizan el calendario de guardia cada mes."
    },
    {
        question: "¿Cómo pido comida a domicilio en Oltinde?",
        answer: "Entre en el perfil de un restaurante y busque la sección Menú. Añada los platos que desee al carrito, elija recoger en el local o entrega con Situka, y confirme el pedido: se enviará automáticamente por WhatsApp al restaurante."
    },
    {
        question: "¿Puedo pagar mi pedido de comida en línea?",
        answer: "Puede elegir pagar directamente con el restaurante (efectivo o coordinado por WhatsApp) o con Muni Dinero. El cobro automático por Muni Dinero está en preparación; por ahora, el pago se coordina directamente con el restaurante."
    },
    {
        question: "¿Cómo activo el menú de comida para mi restaurante?",
        answer: "Registre o edite su negocio con la categoría \"Restaurante\". Con una cuenta <a href='/para-empresas' class='text-black hover:underline'>Premium</a>, verá la opción 'Menú' en su panel de control para añadir sus platos y empezar a recibir pedidos."
    },
    {
        question: "¿Puedo publicar mi perfil como profesional independiente?",
        answer: "Sí, y es gratis. Cree una cuenta, vaya a su <a href='/dashboard/professional' class='text-black hover:underline'>Panel de Profesional</a> y complete su título, categoría, habilidades, servicios con precio orientativo y ejemplos de trabajos realizados. Su perfil se publica de inmediato en <a href='/professionals' class='text-black hover:underline'>Profesionales</a> y en el buscador."
    },
    {
        question: "¿Cómo encuentro un profesional o técnico de confianza?",
        answer: "Visite la sección <a href='/professionals' class='text-black hover:underline'>Profesionales</a> y filtre por categoría o ciudad, o simplemente pregúntele al buscador algo como \"electricistas en Malabo\". Puede contactar directamente por teléfono, WhatsApp o email desde el perfil de cada profesional."
    },
];

const stripHtml = (s: string) => s.replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g, '$2 ($1)').replace(/<[^>]+>/g, '');

// Plain-text version for the assistant's context.
export function helpAsText(): string {
  const guideText = GUIDE_SECTIONS.map((s) => `## ${s.title}\n${s.content.map((c) => `- ${c.subtitle}: ${stripHtml(c.text)}`).join('\n')}`).join('\n\n');
  const faqText = FAQ_ITEMS.map((q) => `- ${q.question} ${stripHtml(q.answer)}`).join('\n');
  return `# Guía de usuario de Oltinde\n\n${guideText}\n\n# Preguntas frecuentes\n${faqText}`;
}
