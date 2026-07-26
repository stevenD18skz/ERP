// Utilidades compartidas del importador de Excel.

export function parseCSV(t) {
  const rows = [];
  let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}

export const num = (v) => {
  const s = String(v ?? '').trim();
  if (!s) return null;
  const n = parseFloat(s.replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? null : n;
};

// --- Correcciones ortográficas ---------------------------------------------
// Palabra tal como la escribió -> palabra corregida. Solo errores reales,
// no abreviaturas (esas se expanden en la descripción, no en el nombre).
export const TYPOS = {
  CERVESA: 'Cerveza', CERVESACLUD: 'Cerveza Club', CERV: 'Cerveza',
  BINBO: 'Bimbo', LOCOR: 'Licor', VEVIDA: 'Bebida', BEBIBA: 'Bebida',
  BEBI: 'Bebida', ARINA: 'Harina', MAIS: 'Maíz', ALBERJA: 'Arveja',
  ALKASELSE: 'Alka-Seltzer', COCACOLA: 'Coca-Cola', COCACOLO: 'Coca-Cola',
  ESPAGETI: 'Espagueti', BOLUGA: 'Beluga', HUVOS: 'Huevos',
  GUISAMAG: 'Guisa Maggi', LOZACREN: 'Loza Crem', ORIGUINAL: 'Original',
  NUTRIBELA: 'Nutribella', NUTRIBLA: 'Nutribella', SABITAL: 'Savital',
  JHONSONS: "Johnson's", JHONNIE: 'Johnnie Walker', SMIMOLT: 'Smirnoff',
  BLANQUEADOR: 'Blanqueador', BLONCOS: 'Blancos', SALDEFRUTAS: 'Sal de Frutas',
  ACETAMINOFEN: 'Acetaminofén', IBUPROFENO: 'Ibuprofeno',
  BUSCAPIA: 'Buscapina', NORABER: 'Noraver', SEVEDOL: 'Sevedol',
  GENOPRASOL: 'Omeprazol', GASTROFAS: 'Gastrofax', NOSPIRIN: 'Nospirin',
  EFERBESE: 'Efervescente', ACVIL: 'Advil', RAIDOL: 'Raidol',
  DURFLEX: 'Dorflex', PIELROJA: 'Pielroja', MALBORO: 'Marlboro',
  LUKCY: 'Lucky Strike', STARLAY: 'Starlight', MODEN: 'Modern',
  ELETRONICO: 'Electrónico', ELETRO: 'Electrónico', ELETROLIT: 'Electrolit',
  CIGARILLA: 'Cigarrillo', COLBON: 'Colbón', ALGODÓN: 'Algodón',
  JAGUAI: 'Jaguar', PRESTOBARBA: 'Prestobarba', EXATA: 'Exacta',
  DORCO: 'Dorco', PONDS: "Pond's", HIALURONICO: 'Hialurónico',
  MIRACOL: 'Miracle', ANTI: 'Anti', DCHOU: 'Dog Chow', CHAW: 'Chow',
  UMEDA: 'Húmeda', DOGURMET: 'Dog Gourmet', DOTKAT: 'Dogourmet Cat',
  NUTRECAN: 'Nutrecan', OHMAIGA: 'Oh Maiga', MIRRINGO: 'Mirringo',
  GATICOS: 'Gaticos', CACHOR: 'Cachorro', ADULTOGDE: 'Adulto Grande',
  ALPIN: 'Alpina', GORME: 'Gourmet', RIQUISIMO: 'Riquísimo',
  SAVILOE: 'Sábila', HIDRALIT: 'Hidralyte',
  SPORADE: 'Sporade', ECONOLITRO: 'Econolitro', POSTB: 'Postobón',
  POSTOBON: 'Postobón', CIFRUT: 'Cifrut', GATORADE: 'Gatorade',
  BATILADO: 'Batido', AROMATEL: 'Aromatel', FRUTIÑO: 'Frutiño',
  QUIPITO: 'Quipitos', SUNTEA: 'Suntea', PANELADA: 'Panelada',
  TRULULU: 'Trululu', FRUNA: 'Fruna', CHOCODISK: 'Chocodisk',
  GOLOCHIS: 'Golochis', BURBUJET: 'Burbujet', CHOKIS: 'Chokis',
  COCOSSETE: 'Cocosette', MINICHIS: 'Minichips', TOHS: 'Tosh',
  SALTIN: 'Saltín', FESTIVAL: 'Festival', DUCALES: 'Ducales',
  INTEG: 'Integral', CHESTRES: 'Chetos', CHOCLITO: 'Choclitos',
  DETODITO: 'De Todito', NATUCHIS: 'Natuchips', GUDIS: 'Gudis',
  BOLIQUESO: 'Boliqueso', MANIMOTO: 'Maní Moto', MAISENA: 'Maizena',
  ZUCARITAS: 'Zucaritas', CHOCOLISTO: 'Chocolisto', POPETAS: 'Popetas',
  TOSINETA: 'Tocineta', RIZADAS: 'Rizadas', PALOMITAS: 'Palomitas',
  YIROS: 'Gyros', PICADAS: 'Picadas', TAKIS: 'Takis', TITA: 'Tita',
  RAMEL: 'Ramel', VANIZ: 'Vaniz', INTIBON: 'Intibón', VARSOL: 'Varsol',
  SUPERBLU: 'Superblú', BARRIGON: 'Barrigón', GOLIAT: 'Goliat',
  PROTEX: 'Protex', PALMOLIVE: 'Palmolive', AXION: 'Axión',
  DERSA: 'Dersa', ARIEL: 'Ariel', FABULOSO: 'Fabuloso', FAB: 'Fab',
  SABRA: 'Sabra', ESPONJA: 'Esponja', SERVILLETA: 'Servilletas',
  PAÑITOS: 'Pañitos', TAPABOCAS: 'Tapabocas', TAMPON: 'Tampón',
  CONDONES: 'Condones', CURAS: 'Curas', BICARBONATO: 'Bicarbonato',
  VITAFER: 'Vitafer', OMEGA: 'Omega', HALL: 'Halls', BBB: 'Bon Bon Bum',
  TAJIN: 'Tajín', MUECAS: 'Muecas', LOCAS: 'Locas', WINNY: 'Winny',
  WINY: 'Winny', NOS: 'Nosotras', PROTET: 'Protectores',
  RAPIGEL: 'Rapigel', ELLA: 'Ella', VELADORA: 'Veladora',
  CANDELA: 'Candela', TOKAI: 'Tokai', FOSFORO: 'Fósforos',
  BOMBILLO: 'Bombillo', PILA: 'Pila', PILAS: 'Pilas',
  SACAPUNTAS: 'Sacapuntas', BORRADOR: 'Borrador', LAPIZ: 'Lápiz',
  CINTA: 'Cinta', BONDER: 'Bonder', PANELA: 'Panela',
  PALESTINA: 'Palestina', SARDINA: 'Sardina', SOBERANA: 'Soberana',
  ATUN: 'Atún', ISABEL: 'Isabel', VAN: 'Van', CANS: 'Camps',
  SALCHICHA: 'Salchicha', ZENU: 'Zenú', RICA: 'Rica', SALSA: 'Salsa',
  BARBEQU: 'Barbecue', SOYA: 'Soya', TOMATE: 'Tomate', VINAGRE: 'Vinagre',
  AVENA: 'Avena', HOJUELAS: 'Hojuelas', AZUCAR: 'Azúcar', SAL: 'Sal',
  MARINA: 'Marina', RANCHERA: 'Ranchera', LENTEJA: 'Lenteja',
  FRIJOL: 'Fríjol', ALPISTE: 'Alpiste', GIRASOL: 'Girasol',
  PIRA: 'Pira', ARROZ: 'Arroz', DIANA: 'Diana', HARINA: 'Harina',
  AMERICANA: 'Americana', PAN: 'Pan', ORO: 'Oro', LECHERA: 'Lechera',
  DOIPA: 'Doypack', KLIN: 'Klim', RODEO: 'Rodeo', ALQ: 'Alquería',
  MANTEQUILLA: 'Mantequilla', CAMPI: 'Campi', RAMA: 'Rama',
  MAN: 'Mantequilla', BUENA: 'Buena', MILO: 'Milo', CAFÉ: 'Café',
  CAFE: 'Café', COLCAFE: 'Colcafé', NESCAFE: 'Nescafé',
  CALDO: 'Caldo', GALLINA: 'Gallina', CHAO: 'Chao', PASTILLA: 'Pastilla',
  AROMATICA: 'Aromática', ARENA: 'Arena', GAT: 'Gato', ALIM: 'Alimento',
  TOSTADO: 'Tostado', JITANA: 'Gitana', TRAIDEN: 'Trident',
  DURA: 'Dura', WASS: 'Wass', SUPER: 'Super', COLG: 'Colgate',
  CEP: 'Cepillo', CEPILLO: 'Cepillo', GEL: 'Gel', BACHUE: 'Bachué',
  EGO: 'Ego', SEDAL: 'Sedal', PANTENE: 'Pantene', HYS: 'H&S',
  BALANCE: 'Balance', BAL: 'Balance', SPIDE: 'Speed', SPIDES: 'Speed',
  DESODORANTE: 'Desodorante', COPA: 'Copa', AGUAR: 'Aguardiente',
  VAZOS: 'Vasos', ONZAS: 'Onzas', PLATO: 'Plato', CUCHARA: 'Cuchara',
  FILIM: 'Film', ALUMINIO: 'Aluminio', BOLSA: 'Bolsa',
  INDUSTRIAL: 'Industrial', BASURA: 'Basura', ELITE: 'Elite',
  FAMILIA: 'Familia', TOALLA: 'Toalla', VELA: 'Vela', VELAS: 'Velas',
  AGUARCIENTE: 'Aguardiente', AGUARDI: 'Aguardiente', ANTIOQ: 'Antioqueño',
  CANE: 'Caneca', PASSPOR: 'Passport', BLAC: 'Black', BUCHANAN: "Buchanan's",
  CHIVAS: 'Chivas Regal', AÑ: 'Años', BRANDY: 'Brandy', VODKA: 'Vodka',
  RON: 'Ron', ESENCIAL: 'Esencial', GARRAFA: 'Garrafa', BOTELL: 'Botella',
  SANSON: 'Sansón', VINO: 'Vino', POKELON: 'Poker Litro', AGUILON: 'Águila Litro',
  AGUILA: 'Águila', LATON: 'Latón', ANDINA: 'Andina', CORONA: 'Corona',
  LAY: 'Light', POKER: 'Poker', AMPER: 'Amper', BIG: 'Big Cola',
  PONY: 'Pony Malta', MIMI: 'Mini', SODA: 'Soda', GLACIAL: 'Glacial',
  SPARTA: 'Sparta', SPEE: 'Speed', VIVE: 'Vive 100', HIT: 'Hit',
  VALLE: 'del Valle', JUGO: 'Jugo', LIKE: 'Like', CUATES: 'Cuates',
  LOCO: 'Loco', FOR: 'Four', BOCA: 'Boca', SOPERA: 'Sopera',
  GELATINA: 'Gelatina', AREQUIPE: 'Arequipe', YOGO: 'Yogo',
  YOGUR: 'Yogur', PREMIO: 'Premio', BON: 'Bon', YUR: 'Yur',
  BRIDGE: 'Bridge', CLU: 'Club', SOCIAL: 'Social', OREO: 'Oreo',
  GALLETA: 'Galleta', TACO: 'Tacos', TACOS: 'Tacos',
  JET: 'Jet', JUMBO: 'Jumbo', KINDER: 'Kinder', GOL: 'Gol',
  COOKIES: 'Cookies', WAFER: 'Wafer', CHOCOSO: 'Chocoso',
  PONQUE: 'Ponqué', TORTA: 'Torta', CASERA: 'Casera',
  CHOMELOS: 'Chomelos', POSTRES: 'Postres', MADERA: 'Madera',
  ALCOHOL: 'Alcohol', OSA: 'Osa', MK: 'MK', ADVIL: 'Advil',
  DOLEX: 'Dolex', GRIPA: 'Gripa', MAX: 'Max', ASPIRINA: 'Aspirina',
  FIES: 'Fiest', GAVISCON: 'Gaviscon', FEN: 'Fem', DIA: 'Día',
  FAST: 'Fast', TOTAL: 'Total', GARGANTA: 'Garganta',
  EXTRAFUERTE: 'Extra Fuerte', EXTREME: 'Extreme', COMPUESTA: 'Compuesta',
  PLUS: 'Plus', MINI: 'Mini', GDE: 'Grande', GRD: 'Grande',
  MEDI: 'Mediano', PEQ: 'Pequeño', PEQUEÑ: 'Pequeño', PEQUEÑA: 'Pequeña',
  MARGARITA: 'Margarita', DORITOS: 'Doritos', COMA: 'Coma',
  RICO: 'Rico', OLEOCALI: 'Oleocali', CREMA: 'Crema', BLANCA: 'Blanca',
  EDAD: 'Edad', ICE: 'Ice', DET: 'Detergente', DETERGENTE: 'Detergente',
  LIQUIDO: 'Líquido', LIBRA: 'Libra', KILO: 'Kilo', ACERO: 'Acero',
  BRILLO: 'Brillo', DOBLE: 'Doble', USO: 'Uso', COLORES: 'Colores',
  ENL: 'Enlatado', ENLA: 'Enlatado', TIERNO: 'Tierno', SOLA: 'Sola',
  ZANAHORIA: 'Zanahoria', ACEITE: 'Aceite', HUEVOS: 'Huevos',
  BUENAS: 'Buenas', NOCHES: 'Noches', NOCHE: 'Noche', EXTR: 'Extra',
  TELA: 'Tela', CLASICA: 'Clásica', INVISIBLE: 'Invisible',
  INTIMO: 'Íntimo', LARGOS: 'Largos', JAB: 'Jabón', JABON: 'Jabón',
  COCO: 'Coco', PURO: 'Puro', REY: 'Rey', TOP: 'Top', TERRA: 'Terra',
  PAPEL: 'Papel', CUC: 'Cuchilla', DES: 'Desechable', CHA: 'Champú',
  CHO: 'Chocolatina', CHOCOLATE: 'Chocolate', GRA: 'Grano',
  ESP: 'Esponja', BIM: 'Bimbo', ALPI: 'Alpina', ALP: 'Alpina',
  LIC: 'Licor', CIG: 'Cigarrillo', PH: 'Papel Higiénico',
  PAST: 'Pastilla', PASTA: 'Pastilla', LECHE: 'Leche', FRU: 'Refresco',
  ACE: 'Aceite', TRATAMIENTO: 'Tratamiento', BOLSAS: 'Bolsas',
  ANCHA: 'Ancha', ORIG: 'Original', LED: 'LED', VOL: 'Voltios',
  ALCALINAS: 'Alcalinas', BARATA: 'Barata', AROMATICAS: 'Aromáticas',
};

// Palabras que deben quedar en minúscula dentro del nombre.
const LOWER = new Set(['de', 'del', 'la', 'el', 'y', 'con', 'para', 'a', 'en']);
// Unidades que se normalizan en minúscula pegadas al número.
const UNIT_RE = /^(\d+(?:[.,]\d+)?)\s*(ML|L|G|GR|KG|KL|KI|K|MM|W|ONZAS?)$/i;

function fixUnit(w) {
  const m = w.match(UNIT_RE);
  if (!m) return null;
  const n = m[1];
  const u = m[2].toUpperCase();
  const map = { ML: 'ml', L: 'L', G: 'g', GR: 'g', KG: 'kg', KL: 'kg', KI: 'kg', K: 'kg', MM: 'mm', W: 'W', ONZA: 'onzas', ONZAS: 'onzas' };
  return `${n}${map[u] ?? u.toLowerCase()}`;
}

export function cleanName(raw) {
  const original = raw.trim().replace(/\s+/g, ' ');
  const words = original.split(' ');
  let changed = false;
  const out = words.map((w, i) => {
    const bare = w.replace(/[.,]+$/, '');
    const unit = fixUnit(bare);
    if (unit) { if (unit !== w) changed = true; return unit; }
    const key = bare.toUpperCase();
    if (TYPOS[key]) {
      if (TYPOS[key].toUpperCase() !== key) changed = true;
      return TYPOS[key];
    }
    const lower = bare.toLowerCase();
    if (i > 0 && LOWER.has(lower)) return lower;
    if (/^\d+$/.test(bare)) return bare;
    if (bare.length <= 1) return bare.toUpperCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });
  const name = out.join(' ').replace(/\s+/g, ' ').trim();
  return { name, original, changed: changed || name.toUpperCase() !== original.toUpperCase() };
}

// --- Categorías -------------------------------------------------------------
// Se evalúan en orden; gana la primera que coincida.
export const CATEGORIES = [
  ['Mascotas', 'MAS', /^(ALIM |ARENA GAT)/i],
  ['Salud y Farmacia', 'SAL', /^(PASTA |PAST |ALCOHOL|ALGOD|CURAS|OMEGA|VITAFER|TAPABOCAS|CONDONES|TAMPON|BICARBONATO|HALL|SUERO)/i],
  ['Cuidado Personal', 'CPE', /^(CHA |CREMA|CUC |GEL |NOS|PAÑITOS|PH |TOALLA|CEPILLO|DES BAL|DES SPIDE|DESODORANTE|JAB PROTEX|JAB PALMOLIVE|JAB COCO|JAB PURO|CONDON)/i],
  ['Desechables', 'DES', /^(DES |SERVILLETA|PAPEL ALUMINIO|BOLSA)/i],
  ['Aseo del Hogar', 'ASE', /^(DET|JAB|BLANQUEADOR|FABULOSO|ESPONJA|ESP |AROMATEL|LOZACREN|VARSOL|SUPERBLU|BLANCOS|BLONCOS|LIMPIDO)/i],
  ['Bebés', 'BBE', /^(WINNY|WINY)/i],
  ['Cigarrillos', 'CIG', /^(CIG|CANDELA|FOSFORO)/i],
  ['Licores', 'LIC', /^(LIC|LICOR|LOCOR|CERV)/i],
  ['Bebidas', 'BEB', /^(BEBIDA|BEBI|BEBIBA|VEVIDA|AROMATICA|FRU |FRUNA|BATILADO|MILO|CHOCOLISTO|CAF)/i],
  ['Galletas', 'GAL', /^(GALLETA)/i],
  ['Dulces y Chocolates', 'DUL', /^(CHO |CHOCO|CHOCOLATE|TRULULU|BBB|RAMEL|TITA|TRAIDEN|MUECAS|FRUNA)/i],
  ['Snacks', 'SNK', /^(M |BIM |TAKIS|POPETAS|MANIMOTO|PICADAS|Y |TOSTADO|Z DURA|YIROS)/i],
  ['Panadería', 'PAN', /^(BIMBO|BINBO)/i],
  ['Lácteos', 'LAC', /^(ALP|LECHE|LECHERA|MANTEQUILLA|HUEVOS|MAN LA BUENA)/i],
  ['Enlatados', 'ENL', /^(ENL|ATUN|SARDINA)/i],
  ['Aceites', 'ACE', /^(ACE |ACEITE)/i],
  ['Papelería', 'PAP', /^(LAPIZ|BORRADOR|SACAPUNTAS|COLBON|CINTA|SUPER BONDER)/i],
  ['Hogar y Varios', 'HOG', /^(BOMBILLO|PILA|VELA|INTIBON|VANIZ|CHAO)/i],
  ['Granos y Abarrotes', 'ABA', /.*/],
];

export function categorize(rawName) {
  for (const [name, code, re] of CATEGORIES) {
    if (re.test(rawName)) return { category: name, code };
  }
  return { category: 'Granos y Abarrotes', code: 'ABA' };
}

// --- Descripción ------------------------------------------------------------
const SIZE_RE = /(\d+(?:[.,]\d+)?)\s*(ml|l|g|kg|mm|w|onzas)\b/i;

export function buildDescription({ name, original, changed, category, costFromExcel }) {
  const parts = [];
  const size = name.match(SIZE_RE);
  parts.push(size
    ? `${category}. Presentación de ${size[1]}${size[2].toLowerCase()}.`
    : `${category}.`);
  if (!costFromExcel) {
    parts.push('Costo estimado en 81% del precio de venta (margen del 19% que usa la contabilidad); confirmar con factura.');
  }
  if (changed) {
    parts.push(`Nombre normalizado desde el Excel; en el archivo original figura como «${original}». Revisar que la corrección sea correcta.`);
  }
  return parts.join(' ');
}
