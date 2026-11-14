/**
 * Provincias → ciudades (cantones) como valores fijos: la ciudad depende de la provincia y no se escribe a mano.
 * Hoy están cargados Ecuador y Perú; para otro país no hay lista y el formulario pide la ciudad como texto validado.
 */
const lista = (s: string) => s.split("|").map((x) => x.trim());

const ECUADOR: Record<string, string[]> = {
  Azuay: lista("Cuenca|Camilo Ponce Enríquez|Chordeleg|El Pan|Girón|Guachapala|Gualaceo|Nabón|Oña|Paute|Pucará|San Fernando|Santa Isabel|Sevilla de Oro|Sigsig"),
  Bolívar: lista("Guaranda|Caluma|Chillanes|Chimbo|Echeandía|Las Naves|San Miguel"),
  Cañar: lista("Azogues|Biblián|Cañar|Déleg|El Tambo|La Troncal|Suscal"),
  Carchi: lista("Tulcán|Bolívar|Espejo|Mira|Montúfar|San Pedro de Huaca"),
  Chimborazo: lista("Riobamba|Alausí|Chambo|Chunchi|Colta|Cumandá|Guamote|Guano|Pallatanga|Penipe"),
  Cotopaxi: lista("Latacunga|La Maná|Pangua|Pujilí|Salcedo|Saquisilí|Sigchos"),
  "El Oro": lista("Machala|Arenillas|Atahualpa|Balsas|Chilla|El Guabo|Huaquillas|Las Lajas|Marcabelí|Pasaje|Piñas|Portovelo|Santa Rosa|Zaruma"),
  Esmeraldas: lista("Esmeraldas|Atacames|Eloy Alfaro|Muisne|Quinindé|Río Verde|San Lorenzo"),
  Galápagos: lista("Puerto Baquerizo Moreno|Puerto Ayora|Puerto Villamil"),
  Guayas: lista("Guayaquil|Balao|Balzar|Colimes|Coronel Marcelino Maridueña|Daule|Durán|El Empalme|El Triunfo|General Antonio Elizalde|Isidro Ayora|Lomas de Sargentillo|Milagro|Naranjal|Naranjito|Nobol|Palestina|Pedro Carbo|Playas|Salitre|Samborondón|Santa Lucía|Simón Bolívar|Yaguachi"),
  Imbabura: lista("Ibarra|Antonio Ante|Cotacachi|Otavalo|Pimampiro|San Miguel de Urcuquí"),
  Loja: lista("Loja|Calvas|Catamayo|Celica|Chaguarpamba|Espíndola|Gonzanamá|Macará|Olmedo|Paltas|Pindal|Puyango|Quilanga|Saraguro|Sozoranga|Zapotillo"),
  "Los Ríos": lista("Babahoyo|Baba|Buena Fe|Mocache|Montalvo|Palenque|Puebloviejo|Quevedo|Quinsaloma|Urdaneta|Valencia|Ventanas|Vinces"),
  Manabí: lista("Portoviejo|Manta|Bolívar|Chone|El Carmen|Flavio Alfaro|Jama|Jaramijó|Jipijapa|Junín|Montecristi|Olmedo|Paján|Pedernales|Pichincha|Rocafuerte|San Vicente|Santa Ana|Sucre|Tosagua|24 de Mayo"),
  "Morona Santiago": lista("Macas|Gualaquiza|Huamboya|Limón Indanza|Logroño|Pablo Sexto|Palora|San Juan Bosco|Santiago de Méndez|Sucúa|Taisha|Tiwintza"),
  Napo: lista("Tena|Archidona|Carlos Julio Arosemena Tola|El Chaco|Quijos"),
  Orellana: lista("Francisco de Orellana (Coca)|Aguarico|La Joya de los Sachas|Loreto"),
  Pastaza: lista("Puyo|Arajuno|Mera|Santa Clara"),
  Pichincha: lista("Quito|Cayambe|Machachi|Pedro Moncayo|Pedro Vicente Maldonado|Puerto Quito|San Miguel de los Bancos|Sangolquí"),
  "Santa Elena": lista("Santa Elena|La Libertad|Salinas"),
  "Santo Domingo de los Tsáchilas": lista("Santo Domingo|La Concordia"),
  Sucumbíos: lista("Nueva Loja (Lago Agrio)|Cascales|Cuyabeno|Gonzalo Pizarro|Putumayo|Shushufindi|Sucumbíos"),
  Tungurahua: lista("Ambato|Baños de Agua Santa|Cevallos|Mocha|Patate|Quero|San Pedro de Pelileo|Santiago de Píllaro|Tisaleo"),
  "Zamora Chinchipe": lista("Zamora|Centinela del Cóndor|Chinchipe|El Pangui|Nangaritza|Palanda|Paquisha|Yacuambi|Yantzaza"),
};

const PERU: Record<string, string[]> = {
  Amazonas: lista("Chachapoyas|Bagua|Bagua Grande|Jumbilla|Lamud|Luya|Mendoza|Nieva"),
  Áncash: lista("Huaraz|Casma|Chimbote|Caraz|Carhuaz|Huari|Nuevo Chimbote|Yungay"),
  Apurímac: lista("Abancay|Andahuaylas|Chalhuanca|Chincheros|Cotabambas|Curahuasi|Tambobamba"),
  Arequipa: lista("Arequipa|Camaná|Caylloma|Cayma|Cerro Colorado|Characato|Mollendo|Yanahuara|Cocachacra"),
  Ayacucho: lista("Ayacucho|Cangallo|Huanta|Huamanga|Puquio|San Miguel|Coracora"),
  Cajamarca: lista("Cajamarca|Celendín|Chota|Jaén|San Ignacio|San Marcos|Cutervo"),
  Callao: lista("Callao|Bellavista|Carmen de la Legua|La Perla|La Punta|Ventanilla"),
  Cusco: lista("Cusco|Calca|Espinar|La Convención|Quillabamba|Urubamba|Sicuani|Paucartambo"),
  Huancavelica: lista("Huancavelica|Acobamba|Angaraes|Castrovirreyna|Churcampa|Tayacaja"),
  Huánuco: lista("Huánuco|Ambo|Dos de Mayo|Leoncio Prado|Tingo María|Pachitea|Yarowilca"),
  Ica: lista("Ica|Chincha Alta|Nasca|Palpa|Pisco|Paracas|Parcona"),
  Junín: lista("Huancayo|Chanchamayo|La Merced|Jauja|Junín|Satipo|Tarma|Concepción|Chupaca"),
  "La Libertad": lista("Trujillo|Ascope|Chepén|Pacasmayo|Otuzco|Pataz|Virú|Huamachuco|La Esperanza"),
  Lambayeque: lista("Chiclayo|Ferreñafe|Lambayeque|José Leonardo Ortiz|La Victoria|Monsefú|Pimentel"),
  Lima: lista("Lima|Barranca|Cañete|Huaral|Huacho|Huaura|Callao|Miraflores|San Isidro|Surco|La Molina|San Borja|Barranco|Jesús María|San Miguel|Los Olivos|Comas|San Juan de Lurigancho|Ate|Chorrillos"),
  Loreto: lista("Iquitos|Alto Amazonas|Maynas|Nauta|Requena|Yurimaguas|Ucayali"),
  "Madre de Dios": lista("Puerto Maldonado|Iñapari|Iberia|Tambopata|Manu"),
  Moquegua: lista("Moquegua|Ilo|Mariscal Nieto|General Sánchez Cerro|Omate"),
  Pasco: lista("Cerro de Pasco|Chaupimarca|Oxapampa|Daniel Alcides Carrión|Yanahuanca"),
  Piura: lista("Piura|Castilla|Paita|Sullana|Talara|Sechura|Tambo Grande|Ayabaca|Huancabamba"),
  Puno: lista("Puno|Juliaca|Azángaro|Ayaviri|Ilave|Juli|Yunguyo|Sandia"),
  "San Martín": lista("Moyobamba|Rioja|Tarapoto|Bellavista|Juanjuí|Lamas|Tocache|Picota"),
  Tacna: lista("Tacna|Candarave|Jorge Basadre|Tarata|Pocollay|Ciudad Nueva"),
  Tumbes: lista("Tumbes|Zarumilla|Contralmirante Villar|Aguas Verdes|Zorritos"),
  Ucayali: lista("Pucallpa|Atalaya|Coronel Portillo|Padre Abad|Aguaytía|Purús"),
};

const POR_PAIS: Record<string, Record<string, string[]>> = { EC: ECUADOR, PE: PERU };

/** Ciudades de una provincia; vacío si no hay lista cargada para ese país o provincia. */
export const ciudadesDe = (pais: string, provincia: string): string[] => POR_PAIS[pais]?.[provincia] ?? [];
/** ¿Hay ciudades como lista fija para este país? (si no, la ciudad se escribe). */
export const hayCiudadesFijas = (pais: string) => !!POR_PAIS[pais];

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
/** Busca en la lista de la provincia la ciudad que corresponde a un texto libre (p. ej. "Quito, Pichincha" del mapa). */
export function ciudadCoincidente(pais: string, provincia: string, texto: string): string {
  const t = sinTildes(texto);
  if (!t) return "";
  const ciudades = ciudadesDe(pais, provincia);
  const exacta = ciudades.find((c) => t === sinTildes(c));
  if (exacta) return exacta;
  // «Ciudad, Provincia»: manda la primera parte (la más específica). Así «Miraflores, Lima» da Miraflores y no Lima.
  for (const parte of t.split(/[,/-]/).map((p) => p.trim())) {
    const c = ciudades.find((x) => sinTildes(x.replace(/\s*\(.*\)/, "")) === parte);
    if (c) return c;
  }
  return "";
}
