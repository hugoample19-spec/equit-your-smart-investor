import type { Investor } from "./app-context";

export const investors: Investor[] = [
  {
    id: "buffett",
    name: "Warren Buffett",
    fund: "Berkshire Hathaway",
    netWorth: "€347B",
    photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80&auto=format&fit=crop",
    locked: false,
    bio: "El Oráculo de Omaha. Value investing desde 1956.",
    holdings: [
      { ticker: "AAPL", name: "Apple Inc.", pct: 44.5, perf: 18.2 },
      { ticker: "BAC", name: "Bank of America", pct: 10.3, perf: 7.4 },
      { ticker: "AXP", name: "American Express", pct: 8.7, perf: 22.1 },
      { ticker: "KO", name: "Coca-Cola", pct: 7.4, perf: 4.6 },
      { ticker: "CVX", name: "Chevron", pct: 5.9, perf: -2.1 },
      { ticker: "OXY", name: "Occidental", pct: 4.2, perf: 9.8 },
    ],
  },
  {
    id: "dalio",
    name: "Ray Dalio",
    fund: "Bridgewater Associates",
    netWorth: "€124B",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80&auto=format&fit=crop",
    locked: false,
    bio: "Principios. All Weather Portfolio. Macro global.",
    holdings: [
      { ticker: "SPY", name: "S&P 500 ETF", pct: 22.0, perf: 14.3 },
      { ticker: "IEMG", name: "Emerging Markets", pct: 18.4, perf: 6.7 },
      { ticker: "GLD", name: "Gold Trust", pct: 15.2, perf: 28.1 },
      { ticker: "TLT", name: "Long Treasuries", pct: 14.6, perf: -3.2 },
      { ticker: "VWO", name: "Vanguard EM", pct: 10.8, perf: 5.4 },
      { ticker: "PG", name: "Procter & Gamble", pct: 6.1, perf: 9.1 },
    ],
  },
  {
    id: "musk",
    name: "Elon Musk",
    fund: "Personal Holdings",
    netWorth: "€68B",
    photo: "https://images.unsplash.com/photo-1633265486064-086b219458ec?w=600&q=80&auto=format&fit=crop",
    locked: true,
    bio: "Tesla, SpaceX, X. Concentración extrema en tech.",
    holdings: [
      { ticker: "TSLA", name: "Tesla", pct: 52.3, perf: 34.8 },
      { ticker: "SPCX", name: "SpaceX (privada)", pct: 28.1, perf: 41.2 },
      { ticker: "X", name: "X Corp", pct: 12.4, perf: -8.6 },
      { ticker: "BTC", name: "Bitcoin", pct: 4.8, perf: 62.4 },
      { ticker: "DOGE", name: "Dogecoin", pct: 2.4, perf: 18.9 },
    ],
  },
  {
    id: "wood",
    name: "Cathie Wood",
    fund: "ARK Invest",
    netWorth: "€14B",
    photo: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=80&auto=format&fit=crop",
    locked: true,
    bio: "Innovación disruptiva. Tech exponencial.",
    holdings: [
      { ticker: "TSLA", name: "Tesla", pct: 14.2, perf: 34.8 },
      { ticker: "COIN", name: "Coinbase", pct: 11.4, perf: 48.1 },
      { ticker: "ROKU", name: "Roku", pct: 8.7, perf: 12.3 },
      { ticker: "PATH", name: "UiPath", pct: 7.1, perf: -4.6 },
      { ticker: "PLTR", name: "Palantir", pct: 6.8, perf: 87.4 },
      { ticker: "HOOD", name: "Robinhood", pct: 5.9, perf: 32.1 },
    ],
  },
  {
    id: "ackman",
    name: "Bill Ackman",
    fund: "Pershing Square",
    netWorth: "€19B",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80&auto=format&fit=crop",
    locked: true,
    bio: "Activista. Posiciones concentradas y convicción.",
    holdings: [
      { ticker: "CMG", name: "Chipotle", pct: 18.7, perf: 21.4 },
      { ticker: "HLT", name: "Hilton", pct: 14.2, perf: 16.8 },
      { ticker: "QSR", name: "Restaurant Brands", pct: 12.4, perf: 8.7 },
      { ticker: "GOOGL", name: "Alphabet", pct: 11.8, perf: 24.2 },
      { ticker: "CP", name: "Canadian Pacific", pct: 10.1, perf: 6.4 },
      { ticker: "HHC", name: "Howard Hughes", pct: 8.6, perf: 3.1 },
    ],
  },
  {
    id: "lynch",
    name: "Peter Lynch",
    fund: "Fidelity Magellan",
    netWorth: "€450M",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&q=80&auto=format&fit=crop",
    locked: true,
    bio: "Invierte en lo que conoces. Tenbaggers.",
    holdings: [
      { ticker: "F", name: "Ford", pct: 12.4, perf: 4.2 },
      { ticker: "DNKN", name: "Dunkin'", pct: 10.8, perf: 11.6 },
      { ticker: "SBUX", name: "Starbucks", pct: 9.7, perf: 7.8 },
      { ticker: "MCD", name: "McDonald's", pct: 8.6, perf: 9.4 },
      { ticker: "WMT", name: "Walmart", pct: 7.9, perf: 14.2 },
    ],
  },
  {
    id: "soros",
    name: "George Soros",
    fund: "Soros Fund Mgmt",
    netWorth: "€8B",
    photo: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&q=80&auto=format&fit=crop",
    locked: true,
    bio: "Reflexividad. El hombre que rompió el Banco de Inglaterra.",
    holdings: [
      { ticker: "QQQ", name: "Nasdaq 100", pct: 18.4, perf: 22.6 },
      { ticker: "AMZN", name: "Amazon", pct: 12.1, perf: 19.8 },
      { ticker: "SPLK", name: "Splunk", pct: 8.7, perf: 6.4 },
      { ticker: "RIVN", name: "Rivian", pct: 6.2, perf: -14.2 },
      { ticker: "TSM", name: "TSMC", pct: 9.4, perf: 38.1 },
    ],
  },
  {
    id: "druckenmiller",
    name: "Stanley Druckenmiller",
    fund: "Duquesne Family",
    netWorth: "€11B",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80&auto=format&fit=crop",
    locked: true,
    bio: "Macro + concentración. Récord de 30 años sin pérdidas.",
    holdings: [
      { ticker: "NVDA", name: "Nvidia", pct: 22.4, perf: 124.6 },
      { ticker: "MSFT", name: "Microsoft", pct: 14.8, perf: 18.4 },
      { ticker: "COHR", name: "Coherent", pct: 8.7, perf: 32.1 },
      { ticker: "TEVA", name: "Teva Pharma", pct: 6.4, perf: 11.2 },
      { ticker: "GLD", name: "Gold", pct: 9.1, perf: 28.1 },
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
  { code: "31847209", handle: "@carlosbtc", name: "Carlos Vidal", strategy: "CRYPTO CORE", perf: 14.2, totalValue: 5640, isPublic: true, favoriteReferenteId: "musk", distribution: [{ ticker: "BTC", pct: 50 }, { ticker: "ETH", pct: 30 }, { ticker: "SOL", pct: 20 }] },
  { code: "98217364", handle: "@elenaesg", name: "Elena Soto", strategy: "ESG GLOBAL", perf: 9.8, totalValue: 12300, isPublic: true, favoriteReferenteId: "dalio", distribution: [{ ticker: "IBE", pct: 30 }, { ticker: "NEE", pct: 25 }, { ticker: "ORSTED", pct: 20 }, { ticker: "ENPH", pct: 25 }] },
  { code: "11203948", handle: "@pabloindex", name: "Pablo Gil", strategy: "INDEX SIMPLE", perf: 7.6, totalValue: 32100, isPublic: true, favoriteReferenteId: "buffett", distribution: [{ ticker: "SPY", pct: 60 }, { ticker: "VWO", pct: 25 }, { ticker: "GLD", pct: 15 }] },
  { code: "55720193", handle: "@noeliaai", name: "Noelia Ruiz", strategy: "AI THEMATIC", perf: 5.4, totalValue: 4200, isPublic: false, favoriteReferenteId: "wood", distribution: [{ ticker: "NVDA", pct: 40 }, { ticker: "MSFT", pct: 30 }, { ticker: "PLTR", pct: 30 }] },
  { code: "73649120", handle: "@diegobear", name: "Diego Sanz", strategy: "DEFENSIVO", perf: 3.1, totalValue: 7820, isPublic: true, favoriteReferenteId: "lynch", distribution: [{ ticker: "KO", pct: 30 }, { ticker: "JNJ", pct: 25 }, { ticker: "PG", pct: 25 }, { ticker: "WMT", pct: 20 }] },
  { code: "29183746", handle: "@sofiasmall", name: "Sofía Marín", strategy: "SMALL CAPS", perf: -2.4, totalValue: 3450, isPublic: true, favoriteReferenteId: "lynch", distribution: [{ ticker: "HOOD", pct: 35 }, { ticker: "ROKU", pct: 25 }, { ticker: "PATH", pct: 25 }, { ticker: "COIN", pct: 15 }] },
  { code: "40918273", handle: "@danielmacro", name: "Daniel Vega", strategy: "MACRO", perf: -5.8, totalValue: 6710, isPublic: true, favoriteReferenteId: "soros", distribution: [{ ticker: "TLT", pct: 40 }, { ticker: "GLD", pct: 30 }, { ticker: "DXY", pct: 30 }] },
];

export const trendingStocks = [
  { ticker: "NVDA", name: "Nvidia", users: 1284, color: "#76B900" },
  { ticker: "TSLA", name: "Tesla", users: 982, color: "#CC0000" },
  { ticker: "AAPL", name: "Apple", users: 874, color: "#1A1A2E" },
  { ticker: "BTC", name: "Bitcoin", users: 712, color: "#F7931A" },
  { ticker: "MSFT", name: "Microsoft", users: 643, color: "#00A4EF" },
  { ticker: "GOOGL", name: "Alphabet", users: 521, color: "#4285F4" },
  { ticker: "META", name: "Meta", users: 487, color: "#0866FF" },
  { ticker: "ITX", name: "Inditex", users: 392, color: "#1A1A2E" },
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
