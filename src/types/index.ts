/**
 * MarketSentinel API Response Types
 * Aligned with actual FastAPI backend response shapes.
 *
 * Key fixes from previous version:
 * - SnapshotResponse: removed phantom fields (top_5, decision_report,
 *   agents sub-object on signals). Matched to actual pipeline output.
 * - SignalItem: no agents object — backend returns flat signal rows.
 * - HealthReadyResponse: aligned to actual /health/ready response.
 * - AgentExplainResponse: matched to actual /agent/explain shape.
 * - PerformanceResponse: matched to actual /performance shape.
 */

// =========================================================
// SHARED ENUMS
// =========================================================

export type DriftState = 'none' | 'soft' | 'hard' | 'baseline_missing' | 'detector_failure';
export type SignalDirection = 'LONG' | 'SHORT' | 'NEUTRAL';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type VolatilityRegime = 'low_volatility' | 'normal' | 'high_volatility';

// =========================================================
// HEALTH
// =========================================================

export interface HealthReadyResponse {
  ready: boolean;
  models_loaded: boolean;
  redis_connected: boolean;
  db_connected: boolean;
  data_synced: boolean;
  model_version: string;
  uptime_seconds: number;
  artifact_hash: string;
  // Optional fields — present on some versions
  schema_signature?: string;
  boot_id?: string;
  drift_baseline_loaded?: boolean;
}

// =========================================================
// UNIVERSE
// =========================================================

export interface UniverseResponse {
  version: string;
  description: string;
  tickers: string[];
  count: number;
  universe_hash: string;
}

// =========================================================
// MODEL
// =========================================================

export interface ModelInfoResponse {
  model_version: string;
  schema_signature: string;
  artifact_hash: string;
  dataset_hash: string;
  training_code_hash: string;
  feature_checksum: string;
  feature_count: number;
}

export interface ModelDiagnosticsResponse {
  model_version: string;
  artifact_hash: string;
  schema_signature: string;
  training_fingerprint: string;
  training_cols: number;
  param_checksum: string;
  booster_checksum: string;
  best_iteration: number;
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
}

export interface FeatureImportanceResponse {
  model_version: string;
  feature_checksum: string;
  best_iteration: number;
  importance: FeatureImportanceItem[];
}

// =========================================================
// DRIFT
// =========================================================

export interface DriftResponse {
  drift_detected: boolean;
  severity_score: number;
  drift_state: DriftState;
  drift_confidence: number;
  exposure_scale: number;
  retrain_required: boolean;
  cooldown_active: boolean;
  cooldown_remaining_seconds: number;
  baseline_exists: boolean;
  model_version: string;
  served_from_cache: boolean;
  latency_ms: number;
}

// =========================================================
// SNAPSHOT — matches actual pipeline output
//
// IMPORTANT: signals[] does NOT have an agents sub-object.
// There is no top_5 at root level.
// There is no decision_report.
// Use executive_summary.top_5_tickers for top tickers.
// =========================================================

export interface SignalItem {
  ticker: string;
  date: string;
  raw_model_score: number;
  hybrid_consensus_score: number;
  weight: number;
}

export interface SnapshotMeta {
  model_version: string;
  drift_state: DriftState;
  long_signals: number;
  short_signals: number;
  avg_hybrid_score: number;
  latency_ms: number;
}

export interface Top5RationaleItem {
  rank: number;
  ticker: string;
  signal: SignalDirection;
  hybrid_score: number;
  raw_model_score: number;
  weight: number;
  confidence: number;
  risk_level: RiskLevel;
  governance_score: number;
  volatility_regime: VolatilityRegime;
  technical_bias: string;
  drift_context: string;
  political_context: string;
  agent_scores: {
    signal_agent: number;
    technical_agent: number;
    raw_model: number;
  };
  agents_approved: string[];
  agents_flagged: string[];
  warnings: string[];
  selection_reason: string;
}

export interface ExecutiveSummary {
  top_5_tickers: string[];
  top_5_rationale: Top5RationaleItem[];   // pipeline v5.9+
  portfolio_bias: string;
  gross_exposure: number;
  net_exposure: number;
}

export interface SnapshotDrift {
  drift_detected: boolean;
  severity_score: number;
  drift_state: DriftState;
  exposure_scale: number;
  drift_confidence: number;
}

export interface SnapshotData {
  snapshot_date: string;
  model_version: string;
  drift: SnapshotDrift;
  signals: SignalItem[];
}

export interface SnapshotResponse {
  meta: SnapshotMeta;
  executive_summary: ExecutiveSummary;
  snapshot: SnapshotData;
}

// =========================================================
// PORTFOLIO
// =========================================================

export interface PortfolioPosition {
  ticker: string;
  weight: number;
  signal: SignalDirection;
}

export interface PortfolioResponse {
  snapshot_date: string;
  gross_exposure: number;
  net_exposure: number;
  long_count: number;
  short_count: number;
  neutral_count: number;
  approved_trades: number;
  rejected_trades: number;
  drift_detected: boolean;
  drift_state: DriftState;
  portfolio_health_score: number;
  positions: PortfolioPosition[];
  top_5_preview: Array<{ ticker: string; score: number; weight: number }>;
}

// =========================================================
// AGENT EXPLAIN — matches actual /agent/explain response
// =========================================================

export interface LLMOutput {
  llm_enabled: boolean;
  message?: string;
  error?: string;
  model?: string;
  latency?: number;
  timestamp?: string;
  cached?: boolean;
  structured?: {
    summary: string;
    rationale: string;
    risk_commentary: string;
    outlook: string;
  };
}

export interface AgentExplainData {
  ticker: string;
  snapshot_date: string;
  raw_model_score: number;
  weight: number;
  hybrid_consensus_score: number;
  signal: SignalDirection;
  confidence_numeric: number | null;
  governance_score: number | null;
  risk_level: RiskLevel;
  volatility_regime: VolatilityRegime;
  technical_bias: string;
  drift_state: DriftState;
  warnings: string[];
  explanation: string;
  selection_reason?: string;
  in_top_5?: boolean;
  agents_approved?: string[];
  agents_flagged?: string[];
  agent_scores?: Record<string, number>;
  llm: LLMOutput | null;
  rank?: number;
  latency_ms?: number;
}

export interface AgentExplainResponse {
  success: boolean;
  data: AgentExplainData;
}

export type PoliticalRiskEvent = string;

export interface PoliticalRiskData {
  ticker: string;
  political_risk_score: number;
  political_risk_label: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNAVAILABLE';
  top_events: PoliticalRiskEvent[];
  source: string;
  gdelt_status: string;   // political risk agent v4.2+
  served_from_cache: boolean;
  latency_ms: number;
}

export interface PoliticalRiskResponse {
  success: boolean;
  data: PoliticalRiskData;
}

export interface AgentInfo {
  name: string;
  description: string;
  weight: number;
}

export interface AgentListResponse {
  success: boolean;
  data: {
    agents: Record<string, AgentInfo>;
  };
}

// =========================================================
// PERFORMANCE — matches actual /performance response
// =========================================================

export interface PerformanceMetrics {
  cumulative_return: number;
  annual_return?: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;
  max_drawdown: number;
  volatility_ann: number;
  hit_rate: number;
}

export interface PerformanceResponse {
  tickers_requested: number;
  tickers_computed: number;
  lookback_days: number;
  data_source: string;
  metrics: PerformanceMetrics;
}

// =========================================================
// EQUITY
// =========================================================

export interface OHLCVPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface EquityReturns {
  '5d_return': number;
  '20d_return': number;
  volatility_20d_ann: number;
}

export interface EquityResponse {
  ticker: string;
  ohlcv: OHLCVPoint;
  returns: EquityReturns;
  data_source: string;
  rows_available: number;
}

export interface EquityHistoryResponse {
  ticker: string;
  days_requested: number;
  rows_returned: number;
  data_source: string;
  history: OHLCVPoint[];
}

// =========================================================
// AUTH
// =========================================================

export interface FeatureUsage {
  used: number;
  limit: number;
  remaining: number;
  locked: boolean;
}

export interface UsageState {
  features: Record<string, FeatureUsage>;
  fully_locked: boolean;
  reset_in_seconds: number;
  limit_per_feature: number;
}

export interface AuthMeResponse {
  authenticated: boolean;
  role: 'owner' | 'demo' | null;
  username?: string | null;
  usage?: UsageState | null;
}