const bannerTarjeta = "img/banner-tarjeta.jpg";
const bannerCompras = "img/banner-compras.jpg";
const pSmartphone = "img/p-smartphone.jpg";
const pSmartwatch = "img/p-smartwatch.jpg";
const pPerfume = "img/p-perfume.jpg";
const pAudifonos = "img/p-audifonos.jpg";
const pLicuadora = "img/p-licuadora.jpg";
const pMochila = "img/p-mochila.jpg";
const pLaptop = "img/p-laptop.jpg";
const pFreidora = "img/p-freidora.jpg";
const bPolleria = "img/b-polleria.jpg";
const bCafe = "img/b-cafe.jpg";
const bGym = "img/b-gym.jpg";
const bFarmacia = "img/b-farmacia.jpg";
const bModa = "img/b-moda.jpg";
const pTv = "img/p-tv.jpg";
const pCafetera = "img/p-cafetera.jpg";
const pBicicleta = "img/p-bicicleta.jpg";
const pConsola = "img/p-consola.jpg";
const bCine = "img/b-cine.jpg";
const bSuper = "img/b-super.jpg";
const bSushi = "img/b-sushi.jpg";
const bAuto = "img/b-auto.jpg";

export const user = {
  nombre: "Ana",
  nivel: "Oro",
  /** Puntos acumulados en los últimos 12 meses (define el nivel) */
  puntosNivel: 260000,
  puntos: 260000,
  carrito: 2,
};

/** Equivalencia usada en todo el prototipo: 20 puntos = S/ 1.00 */
export const PUNTOS_POR_DOLAR = 20;
/** Precio de compra de puntos: S/ 0.07 por punto */
export const PRECIO_POR_PUNTO = 0.07;

export type NavItem = {
  label: string;
  to?: string;
  children?: { label: string; to?: string }[];
};

export const navItems: NavItem[] = [
  { label: "Inicio", to: "/" },
  { label: "Canjea tus puntos", to: "/canjea" },
  {
    label: "Beneficios",
    children: [
      { label: "Catálogo de beneficios", to: "/beneficios" },
      { label: "Mis beneficios", to: "/mis-beneficios" },
    ],
  },
  {
    label: "Mis puntos",
    children: [
      { label: "Historial de puntos", to: "/mis-puntos/historial" },
      { label: "Compra de puntos", to: "/mis-puntos/compra" },
      { label: "Mi nivel", to: "/mi-nivel" },
    ],
  },
  { label: "Mis compras", to: "/mis-compras" },
  { label: "Contáctanos", to: "/contacto" },
];

/** Banner full-width: solo imagen (y un link opcional). */
export type Slide = {
  id: string;
  imagen: string;
  /** Versión para pantallas pequeñas (opcional). */
  imagenMovil?: string | undefined;
  alt: string;
  to?: string;
};

export const slides: Slide[] = [
  { id: "tarjeta", imagen: bannerTarjeta, alt: "Clientes pagando con su tarjeta de Financiera Confianza", to: "/canjea" },
  { id: "compras", imagen: bannerCompras, alt: "Familia acumulando puntos con sus compras", to: "/mi-nivel" },
];

export const slidesBeneficios: Slide[] = [
  { id: "ben-tarjeta", imagen: bannerTarjeta, alt: "Beneficios con tu tarjeta de Financiera Confianza", to: "/beneficios" },
  { id: "ben-compras", imagen: bannerCompras, alt: "Descuentos en tus tiendas favoritas", to: "/beneficios" },
];

export const slidesProductos: Slide[] = [
  { id: "prod-compras", imagen: bannerCompras, alt: "Canjea tus puntos Club Confianza", to: "/canjea" },
];

export type Subcategoria = { slug: string; label: string };
export type CategoriaProducto = {
  slug: string;
  label: string;
  icon: string;
  /** SVG propio (data URL) que reemplaza al ícono; lo sube el administrador. */
  imagen?: string;
  subcategorias: Subcategoria[];
};

export const categoriasProducto: CategoriaProducto[] = [
  {
    slug: "tecnologia",
    label: "Tecnología",
    icon: "Laptop",
    subcategorias: [
      { slug: "celulares", label: "Celulares" },
      { slug: "tv-audio", label: "TV y audio" },
      { slug: "wearables", label: "Wearables" },
    ],
  },
  {
    slug: "hogar",
    label: "Hogar",
    icon: "Sofa",
    subcategorias: [
      { slug: "cocina", label: "Cocina" },
      { slug: "electrodomesticos", label: "Electrodomésticos" },
      { slug: "muebles-deco", label: "Muebles y deco" },
    ],
  },
  {
    slug: "gift-cards",
    label: "Gift Cards",
    icon: "Gift",
    subcategorias: [
      { slug: "restaurantes", label: "Restaurantes" },
      { slug: "supermercados", label: "Supermercados" },
      { slug: "moda-gc", label: "Moda" },
    ],
  },
  {
    slug: "movilidad",
    label: "Movilidad",
    icon: "Bike",
    subcategorias: [
      { slug: "bicicletas", label: "Bicicletas" },
      { slug: "accesorios", label: "Accesorios" },
    ],
  },
  {
    slug: "entretenimiento",
    label: "Entretenimiento",
    icon: "Ticket",
    subcategorias: [
      { slug: "gaming", label: "Gaming" },
      { slug: "cine", label: "Cine y shows" },
    ],
  },
  {
    slug: "bienestar",
    label: "Bienestar",
    icon: "Dumbbell",
    subcategorias: [
      { slug: "gimnasio", label: "Gimnasio" },
      { slug: "cuidado-personal", label: "Cuidado personal" },
    ],
  },
  {
    slug: "jardin",
    label: "Jardín y exteriores",
    icon: "Trees",
    subcategorias: [
      { slug: "riego", label: "Riego" },
      { slug: "cesped", label: "Césped y podadoras" },
      { slug: "muebles-exterior", label: "Muebles de exterior" },
    ],
  },
  {
    slug: "seguridad",
    label: "Seguridad",
    icon: "ShieldCheck",
    subcategorias: [
      { slug: "camaras", label: "Cámaras" },
      { slug: "cerraduras", label: "Cerraduras" },
      { slug: "alarmas", label: "Alarmas" },
    ],
  },
  {
    slug: "automotriz",
    label: "Automotriz",
    icon: "Car",
    subcategorias: [
      { slug: "llantas", label: "Llantas" },
      { slug: "lubricantes", label: "Lubricantes" },
      { slug: "accesorios-auto", label: "Accesorios" },
    ],
  },
  {
    slug: "oficina",
    label: "Oficina",
    icon: "Briefcase",
    subcategorias: [
      { slug: "sillas", label: "Sillas" },
      { slug: "escritorios", label: "Escritorios" },
      { slug: "papeleria", label: "Papelería" },
    ],
  },
];

export const subcategoriasDe = (slug: string | null): Subcategoria[] =>
  categoriasProducto.find((c) => c.slug === slug)?.subcategorias ?? [];

export const labelSubcategoria = (categoria: string, sub: string) =>
  subcategoriasDe(categoria).find((s) => s.slug === sub)?.label ?? sub;

export const categoriasBeneficio = [
  { slug: "restaurantes", label: "Restaurantes", icon: "UtensilsCrossed" },
  { slug: "cafeterias", label: "Cafeterías", icon: "Coffee" },
  { slug: "entretenimiento", label: "Entretenimiento", icon: "Clapperboard" },
  { slug: "fitness", label: "Fitness", icon: "Dumbbell" },
  { slug: "salud", label: "Salud", icon: "HeartPulse" },
  { slug: "moda", label: "Moda", icon: "Shirt" },
  { slug: "supermercado", label: "Supermercado", icon: "ShoppingBasket" },
  { slug: "automotriz", label: "Automotriz", icon: "Car" },
  { slug: "tecnologia", label: "Tecnología", icon: "Laptop" },
  { slug: "belleza", label: "Belleza y spa", icon: "Sparkles" },
  { slug: "educacion", label: "Educación", icon: "GraduationCap" },
  { slug: "mascotas", label: "Mascotas", icon: "PawPrint" },
  { slug: "hogar", label: "Hogar", icon: "Sofa" },
  { slug: "delivery", label: "Delivery", icon: "Bike" },
  { slug: "seguros", label: "Seguros", icon: "ShieldCheck" },
  { slug: "gift-cards", label: "Gift Cards", icon: "Gift" },
] as const;

export type Producto = {
  id: string;
  marca: string;
  marcaUrl: string;
  nombre: string;
  puntos: number;
  precio: number;
  imagen: string;
  galeria: string[];
  categoria: string;
  categoriaLabel: string;
  subcategoria: string;
  subcategoriaLabel: string;
  descripcion: string;
  digital: boolean;
  consideraciones: string[];
  especificaciones: string[];
  /** Promoción (se calcula en el servidor): valores originales, insignia y etiqueta propia opcional. */
  puntosOriginal?: number | undefined;
  precioOriginal?: number | undefined;
  promoEtiqueta?: string | undefined;
  etiqueta?: string | undefined;
  etiquetaColor?: string | undefined;
};

const consideracionesBase = [
  "No acumulable con otras promociones.",
  "Válido hasta el 31/12/2026.",
  "El canje se procesa en un máximo de 72 horas hábiles.",
];

const especificacionesBase = [
  "Producto nuevo, con garantía oficial de marca en Perú.",
  "Incluye caja, manual y accesorios originales.",
  "Envío a todo el país o retiro en tu agencia de Financiera Confianza más cercana.",
  "Cambios y devoluciones dentro de los 7 días.",
];

const catLabel = (slug: string) => categoriasProducto.find((c) => c.slug === slug)?.label ?? slug;

const p = (
  id: string,
  marca: string,
  nombre: string,
  precio: number,
  imagen: string,
  categoria: string,
  subcategoria: string,
  descripcion: string,
  digital = false,
  galeria: string[] = [],
): Producto => ({
  id,
  marca,
  marcaUrl: `https://www.${marca.toLowerCase().replace(/[^a-z]/g, "")}.com.pe`,
  nombre,
  puntos: Math.round(precio * PUNTOS_POR_DOLAR),
  precio,
  imagen,
  galeria: [imagen, ...galeria],
  categoria,
  categoriaLabel: catLabel(categoria),
  subcategoria,
  subcategoriaLabel: labelSubcategoria(categoria, subcategoria),
  descripcion,
  digital,
  consideraciones: consideracionesBase,
  especificaciones: especificacionesBase,
});

export const productos: Producto[] = [
  p(
    "p1",
    "HP",
    "Laptop Pavilion 15 Core i5",
    2399,
    pLaptop,
    "tecnologia",
    "celulares",
    "Laptop con procesador Core i5, 16GB de RAM y SSD de 512GB, ideal para el día a día.",
    false,
    [pSmartphone],
  ),
  p(
    "p2",
    "Oster",
    "Freidora de aire digital 5.5L",
    439,
    pFreidora,
    "hogar",
    "electrodomesticos",
    "Freidora de aire con panel digital, 8 programas y canasta antiadherente.",
    false,
    [pLicuadora],
  ),
  p(
    "p4",
    "Xiaomi",
    "Parlante Bluetooth portátil",
    219,
    pAudifonos,
    "tecnologia",
    "tv-audio",
    "Parlante inalámbrico resistente al agua con 12 horas de reproducción.",
    false,
    [pSmartphone],
  ),
  p(
    "p6",
    "Philips",
    "Cepillo dental eléctrico Sonicare",
    329,
    pPerfume,
    "bienestar",
    "cuidado-personal",
    "Cepillo eléctrico con sensor de presión, dos modos y estuche de viaje.",
    false,
    [pPerfume],
  ),
  p(
    "p7",
    "Samsung",
    "Galaxy A56 128GB",
    1199,
    pSmartphone,
    "tecnologia",
    "celulares",
    'Pantalla Super AMOLED de 6.6", cámara triple de 50MP y batería de 5000 mAh.',
    false,
    [pSmartwatch, pAudifonos],
  ),
  p(
    "p8",
    "LG",
    'Smart TV UHD 55" ThinQ',
    1799,
    pTv,
    "tecnologia",
    "tv-audio",
    "Televisor 4K con HDR10, WebOS y asistentes de voz integrados.",
    false,
    [pConsola],
  ),
  p(
    "p9",
    "Sony",
    "Audífonos WH-CH720N",
    399,
    pAudifonos,
    "tecnologia",
    "tv-audio",
    "Audífonos inalámbricos con cancelación activa de ruido y 35 h de autonomía.",
    false,
    [pSmartphone],
  ),
  p(
    "p10",
    "Huawei",
    "Watch GT 5 Active",
    729,
    pSmartwatch,
    "tecnologia",
    "wearables",
    "Reloj inteligente con GPS, monitoreo de sueño y hasta 14 días de batería.",
    false,
    [pSmartphone],
  ),
  p(
    "p11",
    "Oster",
    "Licuadora Pro 1200W",
    259,
    pLicuadora,
    "hogar",
    "cocina",
    "Licuadora de alto rendimiento con vaso de vidrio de 1.5 L y 6 velocidades.",
    false,
    [pCafetera],
  ),
  p(
    "p12",
    "Oster",
    "Cafetera espresso Prima",
    329,
    pCafetera,
    "hogar",
    "cocina",
    "Cafetera espresso de 15 bares con vaporizador para leche.",
    false,
    [pLicuadora],
  ),
  p(
    "p13",
    "Mabe",
    "Cocina de inducción 4 zonas",
    1499,
    pLicuadora,
    "hogar",
    "electrodomesticos",
    "Cocina de inducción con horno eléctrico, control táctil y bloqueo de seguridad.",
    false,
    [pCafetera],
  ),
  p(
    "p14",
    "Bembos",
    "Gift Card Bembos S/ 100",
    100,
    bPolleria,
    "gift-cards",
    "restaurantes",
    "Saldo digital para disfrutar en los restaurantes afiliados al programa Club Confianza.",
    true,
    [bSushi],
  ),
  p(
    "p15",
    "Plaza Vea",
    "Gift Card S/ 100",
    100,
    bSuper,
    "gift-cards",
    "supermercados",
    "Tarjeta de regalo digital válida en locales Plaza Vea y Vivanda a nivel nacional.",
    true,
    [bSuper],
  ),
  p(
    "p16",
    "Saga Falabella",
    "Gift Card moda S/ 200",
    200,
    bModa,
    "gift-cards",
    "moda-gc",
    "Tarjeta digital para usar en moda de temporada, en tienda física y en la web.",
    true,
    [bModa],
  ),
  p(
    "p17",
    "Oxford",
    "Bicicleta montañera aro 29",
    1299,
    pBicicleta,
    "movilidad",
    "bicicletas",
    "Bicicleta de aluminio con 21 cambios Shimano y frenos de disco mecánicos.",
    false,
    [pMochila],
  ),
  p(
    "p18",
    "Totto",
    "Mochila urbana 25L",
    219,
    pMochila,
    "movilidad",
    "accesorios",
    'Mochila resistente al agua con compartimento acolchado para laptop de 15".',
    false,
    [pBicicleta],
  ),
  p(
    "p19",
    "Sony",
    "Consola PlayStation 5 Slim",
    2399,
    pConsola,
    "entretenimiento",
    "gaming",
    "Consola de nueva generación con lector de discos y control DualSense.",
    false,
    [pTv],
  ),
  p(
    "p20",
    "Cineplanet",
    "Gift Card 2 entradas 2D",
    44,
    bCine,
    "entretenimiento",
    "cine",
    "Código digital canjeable por dos entradas 2D en cualquier sede del país.",
    true,
    [bCine],
  ),
  p(
    "p21",
    "Smart Fit",
    "Membresía Black 3 meses",
    329,
    bGym,
    "bienestar",
    "gimnasio",
    "Acceso ilimitado a todas las sedes, clases y entrenamientos.",
    true,
    [bGym],
  ),
  p(
    "p22",
    "Carolina Herrera",
    "212 VIP Men 100ml",
    349,
    pPerfume,
    "bienestar",
    "cuidado-personal",
    "Eau de toilette de notas amaderadas, un clásico para el día a día.",
    false,
    [bModa],
  ),
];

/** Selecciona por posición original del catálogo (p1 = 0, p2 = 1…); los productos retirados se omiten. */
const pick = (order: number[]) => order.map((i) => productos.find((x) => x.id === `p${i + 1}`)).filter((x): x is (typeof productos)[number] => !!x);

export const productosPorTab: Record<string, Producto[]> = {
  Destacados: productos.slice(0, 10),
  "Más vistos": pick([3, 0, 9, 5, 1, 7, 4, 8, 2, 6]),
  Novedades: pick([23, 20, 18, 16, 14, 13, 12, 11, 10, 22]),
};

export const tabs = ["Destacados", "Más vistos", "Novedades"];

export type Beneficio = {
  id: string;
  marca: string;
  marcaUrl: string;
  nombre: string;
  descuento: string;
  categoria: string;
  categoriaSlug: string;
  imagen: string;
  galeria: string[];
  descripcion: string;
  pasos: string[];
  especificaciones: string[];
  terminos: string;
  /** "cupon" = canje con cupón QR; "compra" = se agrega al carrito y se paga */
  tipo: "cupon" | "compra";
  puntos?: number | undefined;
  precio?: number | undefined;
  /** true = no se puede canjear con puntos, solo pago con tarjeta */
  soloDinero?: boolean | undefined;
  /** Promoción (se calcula en el servidor): valores originales, insignia y etiqueta propia opcional. */
  puntosOriginal?: number | undefined;
  precioOriginal?: number | undefined;
  promoEtiqueta?: string | undefined;
  etiqueta?: string | undefined;
  etiquetaColor?: string | undefined;
  /** Vigencia (AAAA-MM-DD, inclusive). Sin fecha = sin límite por ese lado. */
  desde?: string | undefined;
  hasta?: string | undefined;
  /** Regla propia del cupón; lo que falte parte de 3 h, sin límite y 3 meses. */
  cupon?: { horas?: number | undefined; limite?: number | undefined; meses?: number | undefined } | undefined;
  /** "unico" (por defecto): códigos del comercio, uno por participante. "compartido": un mismo código para todos. */
  modoCodigo?: "unico" | "compartido" | undefined;
  codigoCompartido?: string | undefined;
  /** Máximo de usos del código compartido (0 o vacío = sin máximo) y cuántos van. */
  usosMaximos?: number | undefined;
  usos?: number | undefined;
  /** Provincias donde está disponible. Vacío = todo el país. */
  provincias?: string[] | undefined;
  /** Solo en lo que ve el participante: estado según las fechas y regla efectiva del cupón. */
  vigencia?: "programado" | "vigente" | "vencido" | undefined;
  reglaCupon?: { horas: number; limite: number; meses: number } | undefined;
};

const pasosBase = [
  "Genera el cupón para reservar",
  "Acércate al local con tu DNI en físico.",
  "Presenta el cupón",
  "¡Disfruta!",
];

const terminosBase =
  "Promoción válida del 01/01/2026 al 31/12/2026 en todos los locales participantes en Perú. El descuento aplica sobre el precio regular y no es acumulable con otras promociones, descuentos o cupones vigentes. El cliente deberá presentar el cupón digital generado a través de la plataforma Club Confianza antes de efectuar el pago. Cada cupón tiene una validez de 3 horas desde su generación y puede utilizarse una sola vez. El cupón debe presentarse junto con un documento de identidad vigente. Limitado a un cupón por persona por día. El comercio se reserva el derecho de modificar o cancelar la promoción sin previo aviso.";

const especBase = [
  "No acumulable con otras promociones.",
  "Local: Av. Javier Prado Este 1234, San Isidro, Lima.",
  "Válido hasta el 31/12/2026.",
  "Válido para consumo en local y para llevar.",
];

const b = (
  id: string,
  marca: string,
  nombre: string,
  descuento: string,
  categoria: string,
  categoriaSlug: string,
  imagen: string,
  descripcion: string,
  tipo: "cupon" | "compra" = "cupon",
  puntos?: number,
  precio?: number,
  galeria: string[] = [],
  soloDinero = false,
): Beneficio => ({
  id,
  marca,
  marcaUrl: `https://www.${marca.toLowerCase().replace(/[^a-z]/g, "")}.com.pe`,
  nombre,
  descuento,
  categoria,
  categoriaSlug,
  imagen,
  galeria: [imagen, ...galeria],
  descripcion,
  pasos: pasosBase,
  especificaciones: especBase,
  terminos: terminosBase,
  tipo,
  puntos,
  precio,
  soloDinero,
});

export const beneficios: Beneficio[] = [
  b(
    "b1",
    "Norky's",
    "30% dscto. en combo familiar",
    "30%",
    "Restaurante",
    "restaurantes",
    bPolleria,
    "Disfruta de un combo familiar con papas y ensalada para compartir.",
    "cupon",
    undefined,
    undefined,
    [bSushi],
  ),
  b(
    "b2",
    "Juan Valdez",
    "2x1 en bebidas grandes de lunes a jueves",
    "2x1",
    "Cafetería",
    "cafeterias",
    bCafe,
    "Lleva dos bebidas grandes de la carta pagando solo una, de lunes a jueves.",
  ),
  b(
    "b3",
    "Smart Fit",
    "50% dscto. en la primera mensualidad",
    "50%",
    "Fitness",
    "fitness",
    bGym,
    "Inicia tu plan Black con la mitad de descuento en tu primer mes.",
  ),
  b(
    "b4",
    "Inkafarma",
    "25% dscto. en cuidado personal",
    "25%",
    "Salud",
    "salud",
    bFarmacia,
    "Descuento en toda la línea de cuidado personal y dermocosmética.",
  ),
  b(
    "b5",
    "Saga Falabella",
    "20% dscto. en moda de temporada",
    "20%",
    "Moda",
    "moda",
    bModa,
    "Renueva tu clóset con descuento en las marcas de la nueva colección.",
  ),
  b(
    "b7",
    "Cineplanet",
    "2x1 en entradas 2D de lunes a miércoles",
    "2x1",
    "Entretenimiento",
    "entretenimiento",
    bCine,
    "Dos entradas al precio de una en funciones 2D de inicio de semana.",
    "compra",
    880,
    44,
    [bCine],
  ),
  b(
    "b8",
    "Plaza Vea",
    "15% dscto. en frutas y verduras los viernes",
    "15%",
    "Supermercado",
    "supermercado",
    bSuper,
    "Ahorra en tu compra semanal de productos frescos todos los viernes.",
  ),
  b(
    "b9",
    "Edo Sushi Bar",
    "35% dscto. en tablas para compartir",
    "35%",
    "Restaurante",
    "restaurantes",
    bSushi,
    "Descuento en las tablas de makis y nigiris para dos o más personas.",
    "cupon",
    undefined,
    undefined,
    [bSushi],
  ),
  b(
    "b10",
    "Lavauto Express",
    "40% dscto. en lavado premium de tu auto",
    "40%",
    "Automotriz",
    "automotriz",
    bAuto,
    "Lavado completo con encerado y aspirado profundo para tu vehículo.",
  ),
  b(
    "b11",
    "La Mar",
    "15% dscto. en cena gourmet para 2",
    "15%",
    "Restaurante",
    "restaurantes",
    bSushi,
    "Disfruta de una cena de 5 tiempos con maridaje, con cupos limitados.",
    "cupon",
    undefined,
    undefined,
    [bPolleria],
  ),
  b(
    "b13",
    "Hiraoka",
    "20% dscto. en accesorios tecnológicos",
    "20%",
    "Tecnología",
    "tecnologia",
    pAudifonos,
    "Descuento en audífonos, teclados y accesorios seleccionados de la tienda.",
  ),
  b(
    "b14",
    "Spa Miraflores",
    "30% dscto. en spa y masajes",
    "30%",
    "Belleza y spa",
    "belleza",
    bModa,
    "Relájate con masajes descontracturantes y rituales de spa en sedes seleccionadas.",
  ),
  b(
    "b15",
    "ICPNA",
    "25% dscto. en cursos de inglés",
    "25%",
    "Educación",
    "educacion",
    bCafe,
    "Descuento en la matrícula de programas de idiomas presenciales y virtuales.",
  ),
  b(
    "b16",
    "Kivet",
    "15% dscto. en alimento para mascotas",
    "15%",
    "Mascotas",
    "mascotas",
    bSuper,
    "Ahorra en alimento premium y accesorios para perros y gatos.",
  ),
  b(
    "b17",
    "Maestro",
    "10% dscto. en decoración del hogar",
    "10%",
    "Hogar",
    "hogar",
    bModa,
    "Renueva tus ambientes con descuento en muebles y decoración seleccionada.",
  ),
  b(
    "b18",
    "Rappi",
    "S/ 15 de dscto. en tu primer pedido",
    "S/ 15",
    "Delivery",
    "delivery",
    bPolleria,
    "Cupón de descuento en restaurantes afiliados a Rappi.",
  ),
  b(
    "b19",
    "Rímac Seguros",
    "20% dscto. en seguro vehicular",
    "20%",
    "Seguros",
    "seguros",
    bAuto,
    "Descuento en la primera cuota de tu seguro vehicular full.",
  ),
  b(
    "b20",
    "Cineplanet",
    "Gift Card canguil + gaseosa",
    "2x1",
    "Gift Cards",
    "gift-cards",
    bCine,
    "Combo dulce para dos personas al canjear tu gift card digital.",
    "compra",
    740,
    37,
    [bCine],
  ),
];

export type Direccion = {
  id: string;
  alias: string;
  recibe: string;
  telefono: string;
  direccion: string;
  distrito: string;
  /** Provincia (de la lista oficial del país) a la que se envía. */
  provincia?: string;
  /** Punto elegido en el mapa (opcional). */
  lat?: number;
  lng?: number;
};

export const direccionesIniciales: Direccion[] = [
  {
    id: "d1",
    alias: "Casa",
    recibe: "Ana Torres",
    telefono: "999 654 321",
    direccion: "Av. Javier Prado Este 1234, Dpto. 501",
    distrito: "San Isidro, Lima",
  },
  {
    id: "d2",
    alias: "Obra",
    recibe: "Ana Torres",
    telefono: "999 654 321",
    direccion: "Av. Ejército 236, Piso 8",
    distrito: "Yanahuara, Arequipa",
  },
];

export const correosIniciales = ["ana.torres@dominio.com", "atorres@empresa.com.pe"];

export const formatPuntos = (n: number) => Math.round(n).toLocaleString("es-PE").replace(/,/g, " ");

export const formatUSD = (n: number) =>
  `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const puntosADolares = (puntos: number) => puntos / PUNTOS_POR_DOLAR;

/** Beneficios exclusivos: los que se compran (con puntos, puntos + dinero o solo dinero) */
export const beneficiosExclusivos = beneficios.filter((x) => x.tipo === "compra");
