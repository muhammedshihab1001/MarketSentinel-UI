/**
 * MarketSentinel — Ticker Universe Constants
 *
 * Matches config/universe.json v7.0 (100 tickers).
 * Previous version had 30 tickers — 70 were blocked from
 * search and agent explain. Now aligned with the full universe.
 */

export const ALLOWED_TICKERS = [
  // Technology
  "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "AMD", "AVGO",
  "ORCL", "CRM", "NFLX", "INTC", "QCOM", "TXN", "MU", "AMAT",
  "LRCX", "ADI", "KLAC", "NOW", "ADBE", "INTU", "CDNS",

  // Financials
  "JPM", "BAC", "GS", "SPGI", "V", "MA", "MS", "WFC", "BLK",
  "AXP", "CB", "ICE", "CME", "AON", "TRV", "PGR", "MCO", "MSCI",

  // Healthcare
  "UNH", "JNJ", "LLY", "ABBV", "MRK", "TMO", "ABT", "DHR",
  "MDT", "SYK", "EW", "ISRG", "BMY", "AMGN",

  // Consumer
  "HD", "COST", "WMT", "PG", "KO", "PEP", "MCD",
  "SBUX", "NKE", "LOW", "TGT", "CL", "PM",

  // Energy
  "XOM", "CVX", "SLB", "EOG", "OXY", "MPC", "PSX", "VLO",

  // Industrials
  "CAT", "RTX", "HON", "UPS", "DE", "GE", "LMT", "NOC", "EMR", "ITW",

  // Communication
  "T", "VZ", "TMUS", "DIS", "CMCSA",

  // Materials / REITs / Utilities
  "LIN", "APD", "ECL", "AMT", "PLD",
  "NEE", "SO", "DUK", "AEP",
] as const;

export type AllowedTicker = (typeof ALLOWED_TICKERS)[number];

export const isTickerAllowed = (ticker: string): ticker is AllowedTicker => {
  return (ALLOWED_TICKERS as readonly string[]).includes(ticker.toUpperCase());
};

/**
 * Returns a sorted, deduplicated list of all tickers.
 * Useful for dropdowns and search autocomplete.
 */
export const getAllTickers = (): string[] => {
  return [...ALLOWED_TICKERS].sort();
};