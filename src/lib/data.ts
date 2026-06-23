import type { Investor } from "./app-context";

const LOGO_TOKEN = (import.meta.env.VITE_LOGO_DEV_TOKEN as string | undefined) ?? "";
const logo = (domain: string) => `https://img.logo.dev/${domain}?token=${LOGO_TOKEN}`;

export const investors: Investor[] = [
  {
    id: "burry",
    name: "Michael Burry",
    fund: "Scion Asset Mgmt",
    netWorth: "€300M",
    photo: logo("scionasset.com"), color: "#1B4332",
    locked: false,
    bio: "Se hizo célebre por anticipar la crisis de 2008 apostando contra las hipotecas subprime. Su estilo es profundamente contrarian: busca activos infravalorados que el mercado ignora o castiga en exceso, y no teme posiciones muy concentradas. En los últimos años ha rotado hacia tech china (Alibaba, JD, Baidu) por valoraciones que considera absurdamente bajas frente a sus fundamentales, y hacia sanidad gestionada (HCA, Molina) como apuesta defensiva. Evita el growth tech estadounidense de moda, que ve sobrevalorado.",
    holdings: [
      { ticker: "BABA", name: "Alibaba", pct: 21.3, perf: 18.7 },
      { ticker: "JD", name: "JD.com", pct: 16.8, perf: 12.4 },
      { ticker: "BIDU", name: "Baidu", pct: 12.1, perf: -3.6 },
      { ticker: "HCA", name: "HCA Healthcare", pct: 9.4, perf: 14.2 },
      { ticker: "MOH", name: "Molina Healthcare", pct: 8.2, perf: 7.1 },
    ],
    sectorAffinity: [
      { sector: "Salud", direction: "favors" },
      { sector: "Tech", direction: "avoids" },
    ],
  },
  {
    id: "icahn",
    name: "Carl Icahn",
    fund: "Icahn Enterprises",
    netWorth: "€6B",
    photo: logo("icahnenterprises.com"), color: "#7B1D1D",
    locked: false,
    bio: "Inversor activista desde los años 80: compra participaciones significativas en empresas que considera mal gestionadas y presiona desde dentro —entrando en el consejo, forzando recompras o ventas de activos— para liberar valor oculto. Prioriza energía e industriales (CVR Energy, Occidental, Freeport-McMoRan) donde ve ineficiencias operativas claras, y evita sectores con ciclos de innovación rápidos donde su tesis de \"arreglar la gestión\" pesa menos.",
    holdings: [
      { ticker: "IEP", name: "Icahn Enterprises", pct: 38.2, perf: 4.8 },
      { ticker: "CVI", name: "CVR Energy", pct: 18.4, perf: -2.1 },
      { ticker: "OXY", name: "Occidental", pct: 11.7, perf: 9.8 },
      { ticker: "FCX", name: "Freeport-McMoRan", pct: 9.6, perf: 16.2 },
      { ticker: "BHC", name: "Bausch Health", pct: 6.8, perf: -8.4 },
    ],
    sectorAffinity: [
      { sector: "Energía", direction: "favors" },
      { sector: "Industriales", direction: "favors" },
    ],
  },
  {
    id: "druckenmiller",
    name: "Stanley Druckenmiller",
    fund: "Duquesne Family",
    netWorth: "€11B",
    photo: logo("duquesnefamilyoffice.com"), color: "#1E3A5F",
    locked: false,
    bio: "Discípulo de George Soros, célebre por treinta años sin un solo año en pérdidas. Su filosofía es macro pura: apuesta grande y concentrado cuando tiene alta convicción, combinando tecnología de alto crecimiento (Nvidia, Microsoft) con coberturas clásicas como oro físico ante incertidumbre macroeconómica. No diversifica por diversificar — prefiere pocas posiciones con tesis muy trabajadas antes que una cartera amplia.",
    holdings: [
      { ticker: "NVDA", name: "Nvidia", pct: 22.4, perf: 124.6 },
      { ticker: "MSFT", name: "Microsoft", pct: 14.8, perf: 18.4 },
      { ticker: "COHR", name: "Coherent", pct: 8.7, perf: 32.1 },
      { ticker: "TEVA", name: "Teva Pharma", pct: 6.4, perf: 11.2 },
      { ticker: "GLD", name: "Gold", pct: 9.1, perf: 28.1 },
    ],
    sectorAffinity: [
      { sector: "Tech", direction: "favors" },
      { sector: "Macro", direction: "favors" },
    ],
  },
  {
    id: "buffett",
    name: "Warren Buffett",
    fund: "Berkshire Hathaway",
    netWorth: "€347B",
    photo: logo("berkshirehathaway.com"), color: "#1A1A2E",
    locked: true,
    bio: "El máximo exponente del value investing, con Berkshire Hathaway desde 1965. Busca negocios con ventajas competitivas duraderas (\"moats\"), gestión honesta y precios razonables, manteniéndolos durante décadas en vez de rotar. Su cartera está dominada por consumo defensivo y financieras de calidad (Apple, Bank of America, Coca-Cola, American Express) — empresas que entiende a fondo y que generan caja de forma predecible. Evita tecnología especulativa y sectores que no comprende en profundidad.",
    holdings: [
      { ticker: "AAPL", name: "Apple Inc.", pct: 44.5, perf: 18.2 },
      { ticker: "BAC", name: "Bank of America", pct: 10.3, perf: 7.4 },
      { ticker: "AXP", name: "American Express", pct: 8.7, perf: 22.1 },
      { ticker: "KO", name: "Coca-Cola", pct: 7.4, perf: 4.6 },
      { ticker: "CVX", name: "Chevron", pct: 5.9, perf: -2.1 },
      { ticker: "OXY", name: "Occidental", pct: 4.2, perf: 9.8 },
    ],
    sectorAffinity: [
      { sector: "Banca", direction: "favors" },
      { sector: "Consumo", direction: "favors" },
      { sector: "Cripto", direction: "avoids" },
    ],
  },
  {
    id: "dalio",
    name: "Ray Dalio",
    fund: "Bridgewater Associates",
    netWorth: "€124B",
    photo: logo("bridgewater.com"), color: "#2D2D2D",
    locked: true,
    bio: "Fundador del mayor hedge fund macro del mundo y creador del \"All Weather Portfolio\": una cartera diseñada para resistir cualquier entorno económico (crecimiento, recesión, inflación o deflación) combinando renta variable global, bonos a largo plazo, oro y mercados emergentes. Su filosofía prioriza la diversificación radical y la gestión de riesgo sobre la búsqueda de rentabilidad máxima — prefiere perder menos en las caídas a ganar más en las subidas.",
    holdings: [
      { ticker: "SPY", name: "S&P 500 ETF", pct: 22.0, perf: 14.3 },
      { ticker: "IEMG", name: "Emerging Markets", pct: 18.4, perf: 6.7 },
      { ticker: "GLD", name: "Gold Trust", pct: 15.2, perf: 28.1 },
      { ticker: "TLT", name: "Long Treasuries", pct: 14.6, perf: -3.2 },
      { ticker: "VWO", name: "Vanguard EM", pct: 10.8, perf: 5.4 },
      { ticker: "PG", name: "Procter & Gamble", pct: 6.1, perf: 9.1 },
    ],
    sectorAffinity: [
      { sector: "Macro", direction: "favors" },
      { sector: "Emergentes", direction: "favors" },
    ],
  },
  {
    id: "ackman",
    name: "Bill Ackman",
    fund: "Pershing Square",
    netWorth: "€19B",
    photo: logo("pershingsquareholdings.com"), color: "#0A3D2B",
    locked: true,
    bio: "Activista con muy pocas posiciones pero extremadamente concentradas y de alta convicción, a menudo defendidas públicamente con tesis de inversión detalladas. Busca negocios de marca fuerte y flujo de caja predecible (Chipotle, Hilton, Restaurant Brands) donde ve catalizadores claros de revalorización, y no duda en presionar a la dirección si cree que el valor no se está materializando. Evita sectores cíclicos sin ventaja competitiva clara.",
    holdings: [
      { ticker: "CMG", name: "Chipotle", pct: 18.7, perf: 21.4 },
      { ticker: "HLT", name: "Hilton", pct: 14.2, perf: 16.8 },
      { ticker: "QSR", name: "Restaurant Brands", pct: 12.4, perf: 8.7 },
      { ticker: "GOOGL", name: "Alphabet", pct: 11.8, perf: 24.2 },
      { ticker: "CP", name: "Canadian Pacific", pct: 10.1, perf: 6.4 },
      { ticker: "HHC", name: "Howard Hughes", pct: 8.6, perf: 3.1 },
    ],
    sectorAffinity: [
      { sector: "Consumo", direction: "favors" },
      { sector: "Inmobiliario", direction: "favors" },
    ],
  },
  {
    id: "wood",
    name: "Cathie Wood",
    fund: "ARK Invest",
    netWorth: "€14B",
    photo: logo("ark-invest.com"), color: "#4A1942",
    locked: true,
    bio: "Apuesta exclusivamente por innovación disruptiva: inteligencia artificial, vehículos eléctricos, blockchain y automatización robótica, bajo la tesis de que estas tecnologías crecerán exponencialmente y redefinirán industrias enteras. Su cartera (Tesla, Coinbase, Palantir, Roku) es de alta volatilidad por diseño — prioriza el potencial de crecimiento a largo plazo sobre la estabilidad a corto, y evita deliberadamente sectores maduros o de bajo crecimiento.",
    holdings: [
      { ticker: "TSLA", name: "Tesla", pct: 14.2, perf: 34.8 },
      { ticker: "COIN", name: "Coinbase", pct: 11.4, perf: 48.1 },
      { ticker: "ROKU", name: "Roku", pct: 8.7, perf: 12.3 },
      { ticker: "PATH", name: "UiPath", pct: 7.1, perf: -4.6 },
      { ticker: "PLTR", name: "Palantir", pct: 6.8, perf: 87.4 },
      { ticker: "HOOD", name: "Robinhood", pct: 5.9, perf: 32.1 },
    ],
    sectorAffinity: [
      { sector: "Tech", direction: "favors" },
      { sector: "Cripto", direction: "favors" },
      { sector: "Banca", direction: "avoids" },
    ],
  },
  {
    id: "soros",
    name: "George Soros",
    fund: "Soros Fund Mgmt",
    netWorth: "€8B",
    photo: logo("soros.com"), color: "#7A5C00",
    locked: true,
    bio: "Conocido por su teoría de la \"reflexividad\" —la idea de que las percepciones de los inversores no solo reflejan la realidad del mercado, sino que la moldean activamente— y por la apuesta que rompió el Banco de Inglaterra en 1992. Opera con macroapuestas globales de alta convicción sobre divisas, tipos de interés y tendencias tecnológicas (Nasdaq, semiconductores vía TSMC), entrando y saliendo de posiciones con rapidez cuando su tesis macro cambia.",
    holdings: [
      { ticker: "QQQ", name: "Nasdaq 100", pct: 18.4, perf: 22.6 },
      { ticker: "AMZN", name: "Amazon", pct: 12.1, perf: 19.8 },
      { ticker: "SPLK", name: "Splunk", pct: 8.7, perf: 6.4 },
      { ticker: "RIVN", name: "Rivian", pct: 6.2, perf: -14.2 },
      { ticker: "TSM", name: "TSMC", pct: 9.4, perf: 38.1 },
    ],
    sectorAffinity: [
      { sector: "Macro", direction: "favors" },
      { sector: "Tech", direction: "favors" },
    ],
  },
  {
    id: "musk",
    name: "Elon Musk",
    fund: "Tesla / SpaceX",
    netWorth: "€420B",
    photo: logo("tesla.com"), color: "#1C1C1C",
    locked: true,
    bio: "Su patrimonio está concentrado casi en su totalidad en las empresas que fundó o dirige, no en una cartera de inversión tradicional. La filosofía aquí no es de gestor de fondos sino de fundador: apuestas tecnológicas de muy largo plazo y alto riesgo en vehículos eléctricos, exploración espacial e inteligencia artificial, manteniendo el control absoluto en vez de diversificar el riesgo.",
    holdings: [
      { ticker: "TSLA", name: "Tesla", pct: 62.4, perf: 34.8 },
      { ticker: "X", name: "X / xAI", pct: 18.2, perf: 12.4 },
      { ticker: "SPACEX", name: "SpaceX (privada)", pct: 14.1, perf: 28.6 },
      { ticker: "BORING", name: "Boring Co.", pct: 3.2, perf: 4.1 },
    ],
    sectorAffinity: [
      { sector: "Tech", direction: "favors" },
      { sector: "Energía", direction: "favors" },
    ],
  },
  {
    id: "thiel",
    name: "Peter Thiel",
    fund: "Founders Fund",
    netWorth: "€18B",
    photo: logo("foundersfund.com"), color: "#1A2744",
    locked: true,
    bio: "Cofundador de PayPal y Palantir, e inversor de capital riesgo contrarian: busca negocios con potencial de monopolio tecnológico en sus categorías, dispuesto a asumir pérdidas totales en la mayoría de apuestas a cambio de retornos extremos en las pocas que funcionan. Prioriza defensa y seguridad (Anduril), datos e infraestructura (Palantir) y activos no correlacionados como Bitcoin, evitando negocios sin barreras de entrada claras.",
    holdings: [
      { ticker: "PLTR", name: "Palantir", pct: 38.4, perf: 87.4 },
      { ticker: "META", name: "Meta", pct: 14.1, perf: 22.8 },
      { ticker: "ANDURIL", name: "Anduril (privada)", pct: 12.6, perf: 31.2 },
      { ticker: "STRIPE", name: "Stripe (privada)", pct: 10.4, perf: 14.6 },
      { ticker: "BTC-USD", name: "Bitcoin", pct: 8.7, perf: 42.1 },
    ],
    sectorAffinity: [
      { sector: "Tech", direction: "favors" },
      { sector: "Cripto", direction: "favors" },
    ],
  },
];



export type GlobalUser = {
  code: string;
  handle: string;
  name: string;
  strategy: string;
  perf: number;
  totalValue: number;
  isPublic: boolean;
  favoriteReferenteId: string | null;
  distribution: { ticker: string; pct: number }[];
};

export const globalUsers: GlobalUser[] = [
  { code: "47392810", handle: "@martagrowth", name: "Marta López", strategy: "GROWTH AGRESIVO", perf: 28.4, totalValue: 24210, isPublic: true, favoriteReferenteId: "wood", distribution: [{ ticker: "NVDA", pct: 32 }, { ticker: "TSLA", pct: 22 }, { ticker: "AAPL", pct: 18 }, { ticker: "MSFT", pct: 15 }, { ticker: "PLTR", pct: 13 }] },
  { code: "82910374", handle: "@javiervalue", name: "Javier Ruiz", strategy: "DIVIDENDOS EU", perf: 22.7, totalValue: 18430, isPublic: true, favoriteReferenteId: "buffett", distribution: [{ ticker: "ITX", pct: 28 }, { ticker: "BBVA", pct: 22 }, { ticker: "IBE", pct: 20 }, { ticker: "REP", pct: 18 }, { ticker: "TEF", pct: 12 }] },
  { code: "65103982", handle: "@luciatech", name: "Lucía Pérez", strategy: "TECH MOMENTUM", perf: 18.3, totalValue: 9870, isPublic: false, favoriteReferenteId: "druckenmiller", distribution: [{ ticker: "NVDA", pct: 35 }, { ticker: "MSFT", pct: 25 }, { ticker: "GOOGL", pct: 20 }, { ticker: "META", pct: 20 }] },
  { code: "31847209", handle: "@carlosbtc", name: "Carlos Vidal", strategy: "CRYPTO CORE", perf: 14.2, totalValue: 5640, isPublic: true, favoriteReferenteId: "burry", distribution: [{ ticker: "BTC", pct: 50 }, { ticker: "ETH", pct: 30 }, { ticker: "SOL", pct: 20 }] },
  { code: "98217364", handle: "@elenaesg", name: "Elena Soto", strategy: "ESG GLOBAL", perf: 9.8, totalValue: 12300, isPublic: true, favoriteReferenteId: "dalio", distribution: [{ ticker: "IBE", pct: 30 }, { ticker: "NEE", pct: 25 }, { ticker: "ORSTED", pct: 20 }, { ticker: "ENPH", pct: 25 }] },
  { code: "11203948", handle: "@pabloindex", name: "Pablo Gil", strategy: "INDEX SIMPLE", perf: 7.6, totalValue: 32100, isPublic: true, favoriteReferenteId: "buffett", distribution: [{ ticker: "SPY", pct: 60 }, { ticker: "VWO", pct: 25 }, { ticker: "GLD", pct: 15 }] },
  { code: "55720193", handle: "@noeliaai", name: "Noelia Ruiz", strategy: "AI THEMATIC", perf: 5.4, totalValue: 4200, isPublic: false, favoriteReferenteId: "wood", distribution: [{ ticker: "NVDA", pct: 40 }, { ticker: "MSFT", pct: 30 }, { ticker: "PLTR", pct: 30 }] },
  { code: "73649120", handle: "@diegobear", name: "Diego Sanz", strategy: "DEFENSIVO", perf: 3.1, totalValue: 7820, isPublic: true, favoriteReferenteId: "ackman", distribution: [{ ticker: "KO", pct: 30 }, { ticker: "JNJ", pct: 25 }, { ticker: "PG", pct: 25 }, { ticker: "WMT", pct: 20 }] },
  { code: "29183746", handle: "@sofiasmall", name: "Sofía Marín", strategy: "SMALL CAPS", perf: -2.4, totalValue: 3450, isPublic: true, favoriteReferenteId: "ackman", distribution: [{ ticker: "HOOD", pct: 35 }, { ticker: "ROKU", pct: 25 }, { ticker: "PATH", pct: 25 }, { ticker: "COIN", pct: 15 }] },
  { code: "40918273", handle: "@danielmacro", name: "Daniel Vega", strategy: "MACRO", perf: -5.8, totalValue: 6710, isPublic: true, favoriteReferenteId: "soros", distribution: [{ ticker: "TLT", pct: 40 }, { ticker: "GLD", pct: 30 }, { ticker: "DXY", pct: 30 }] },
];

export const trendingStocks = [
  { ticker: "NVDA", name: "Nvidia", users: 1284, color: "#76B900" },
  { ticker: "TSLA", name: "Tesla", users: 982, color: "#CC0000" },
  { ticker: "AAPL", name: "Apple", users: 874, color: "#1A1A2E" },
  { ticker: "BTC-USD", name: "Bitcoin", users: 712, color: "#F7931A" },
  { ticker: "MSFT", name: "Microsoft", users: 643, color: "#00A4EF" },
  { ticker: "GOOGL", name: "Alphabet", users: 521, color: "#4285F4" },
  { ticker: "META", name: "Meta", users: 487, color: "#0866FF" },
  { ticker: "ITX.MC", name: "Inditex", users: 392, color: "#1A1A2E" },
];

export const news = [
  { cat: "MERCADOS", time: "hace 24 min", title: "El IBEX 35 supera los 12.400 puntos y marca máximos del año", summary: "La banca lidera las subidas mientras Inditex aporta un nuevo récord en sesión europea." },
  { cat: "CRIPTO", time: "hace 1 h", title: "Bitcoin rompe los $74.000 con flujos récord en ETFs spot", summary: "BlackRock IBIT acumula más de $2.400M en una semana mientras la oferta en exchanges cae." },
  { cat: "TECH", time: "hace 2 h", title: "Nvidia presenta su nueva familia Blackwell B300 para inferencia", summary: "Las acciones suben un 4,2% en pre-market tras superar las expectativas del mercado." },
  { cat: "MACRO", time: "hace 3 h", title: "El BCE mantiene tipos y abre la puerta a un recorte en septiembre", summary: "Lagarde subraya la moderación de la inflación subyacente en la eurozona durante el último trimestre." },
  { cat: "EMPRESAS", time: "hace 5 h", title: "Inditex eleva ventas un 7,1% y supera las previsiones del consenso", summary: "El grupo gallego mantiene márgenes y anuncia un dividendo extraordinario para julio." },
];

export const sectors = ["Tech", "Energía", "Salud", "Banca", "Consumo", "Cripto", "Inmobiliario"];

export function findUserByCode(code: string): GlobalUser | undefined {
  return globalUsers.find((u) => u.code === code);
}
