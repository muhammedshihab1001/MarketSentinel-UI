<div align="center">

# 🛡️ MarketSentinel UI

**Real-time AI-powered market intelligence dashboard for quantitative trading**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](#)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](#)
[![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite)](#)
[![License](https://img.shields.io/badge/license-Private-red)](#)

> A premium HUD-style dashboard interfacing with a FastAPI + XGBoost ML backend to deliver live market signals, agent reasoning, drift detection, and portfolio analytics.

</div>

---

## 📸 Screenshots

> **To populate these screenshots:** Run `npm run dev`, navigate to each page, take a full-page screenshot, and save it to `public/screenshots/` using the filenames below.

&nbsp;

### 🏠 Dashboard
![Dashboard](public/screenshots/dashboard.png)
> Central command hub — live signal counts, exposure metrics, top-5 opportunities, and market bias chart.

&nbsp;

### 📡 Market Signals
![Market Signals](public/screenshots/market-signals.png)
> Full grid of LONG / SHORT / NEUTRAL signals with direction filters, search, and live sync.

&nbsp;

### 🔍 Signal Detail
![Signal Detail](public/screenshots/signal-detail.png)
> Per-ticker drilldown with price history chart, agent votes, and full rationale breakdown.

&nbsp;

### 🤖 Agent Analysis
![Agent Analysis](public/screenshots/agent-analysis.png)
> Multi-agent LLM reasoning panel: AI Intelligence Report, Political Risk Score, and volatility tags.

&nbsp;

### 📊 Portfolio Analytics
![Portfolio Analytics](public/screenshots/portfolio-analytics.png)
> Real-time gross / net exposure tracking with position breakdown and weight distribution.

&nbsp;

### 📈 Strategy Performance
![Strategy Performance](public/screenshots/strategy-performance.png)
> Historical returns, risk metrics (Sharpe, Sortino, Calmar), drawdown, and success rate.

&nbsp;

### 🧠 AI Model
![AI Model](public/screenshots/ai-model.png)
> Model version, feature importance rankings, IC stats, and signal quality grade.

&nbsp;

### 🌊 Drift Monitor
![Drift Monitor](public/screenshots/drift-monitor.png)
> Live algorithmic drift state, severity score, exposure scaling, and drift history.

&nbsp;

### 💚 Health Center
![Health Center](public/screenshots/health-center.png)
> Unified API, database, Redis cache, and ML model connectivity status.

&nbsp;

### 🖥️ System Monitor
![System Monitor](public/screenshots/monitoring.png)
> Prometheus metrics, request history sparklines, per-endpoint traffic bars, and cache hit rate.

&nbsp;

### 📉 Metrics View
![Metrics View](public/screenshots/metrics.png)
> High-velocity signal telemetry and real-time model output monitoring.

&nbsp;

### 👤 Demo Profile
![Demo Profile](public/screenshots/demo-profile.png)
> Quota-aware user context, feature usage tracker, and access permission management.

&nbsp;

### 🔐 Login
![Login](public/screenshots/login.png)
> Secure access control for owner and demo users.

---

## 📋 Overview

**MarketSentinel UI** is a React 18 + TypeScript frontend for an institutional-grade quantitative trading intelligence system. It connects to a FastAPI backend running an XGBoost ensemble model + Multi-Agent LLM reasoning pipeline to deliver:

- **Live buy/sell/neutral signals** for a universe of monitored equities
- **AI-powered rationale** from a multi-agent system (Signal Agent, Technical Risk Agent, Portfolio Decision Agent, Political Risk Agent)
- **Model drift detection** with automatic weight scaling and alerts
- **Portfolio exposure tracking** with gross/net breakdown
- **Backtested strategy performance** reporting

The interface is designed as a professional dark-mode HUD — optimized for traders, analysts, and quantitative researchers.

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| 🔴 **Live Signal Grid** | Real-time LONG / SHORT / NEUTRAL signals with direction filters and ticker search |
| 🤖 **LLM Intelligence Reports** | 4-panel AI analysis: Summary, Rationale, Outlook, Risk Commentary |
| 🌊 **Drift Detection** | Live stability monitoring with severity scoring and exposure auto-scaling |
| 📊 **Portfolio Ledger** | Gross/Net exposure gauges with institutional-grade breakdowns |
| 🧠 **Model Telemetry** | Feature importance, IC stats, signal quality grade, artifact integrity hashes |
| 🛡️ **Political Risk Scan** | GDELT-powered political risk scoring for individual tickers |
| 📈 **Performance Backtesting** | Total Return, Sharpe, Sortino, Calmar, Max Loss, Success Rate |
| 💚 **System Health** | Unified health monitor for API, DB, Redis, and ML model |
| 🖥️ **Prometheus Monitoring** | Live API request histograms, error rates, cache efficiency, inference counts |
| 🔐 **Role-Based Access** | Owner (full) and Demo (quota-limited) user modes with automatic lockout UI |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                MarketSentinel UI (React 18)              │
│                                                         │
│  ┌───────────────┐    ┌────────────────────────────┐    │
│  │  Pages (15)   │    │  Shared Components         │    │
│  │  Dashboard    │    │  SignalCard, SignalBadge    │    │
│  │  Market Sig.  │    │  MetricCard, DriftIndicator│    │
│  │  Agent Expl.  │    │  SignalExplanation          │    │
│  │  Portfolio    │    │  NeuralScanner, DemoBanner  │    │
│  │  Model / Perf │    └────────────────────────────┘    │
│  └───────┬───────┘                                      │
│          │                                              │
│  ┌───────▼───────────────────────────────────────────┐  │
│  │          State Layer                               │  │
│  │  TanStack Query (server state + cache + polling)   │  │
│  │  Zustand (selectedTicker, auth, usage)             │  │
│  └───────┬────────────────────────────────────────────┘  │
│          │                                              │
│  ┌───────▼───────────────────────────────────────────┐  │
│  │          API Client (src/lib/api.ts)               │  │
│  │  Axios + typed wrappers for all backend endpoints  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTPS / JSON
            ┌─────────────▼───────────────┐
            │    FastAPI Backend           │
            │  XGBoost ML engine           │
            │  Multi-Agent LLM pipeline    │
            │  Drift detector              │
            │  Prometheus metrics          │
            └─────────────────────────────┘
```

---

## 📁 Project Structure

```
market-sentinel-ui/
├── public/
│   └── screenshots/          ← Place page screenshots here
│       └── PLACE_SCREENSHOTS_HERE.md
├── src/
│   ├── App.tsx               ← Route definitions
│   ├── main.tsx              ← Entry point
│   ├── index.css             ← Global design tokens + glassmorphism styles
│   ├── api/                  ← (legacy) API helpers
│   ├── charts/               ← Recharts chart components
│   │   └── SignalDistributionPieChart.tsx
│   ├── components/           ← Shared UI components
│   │   ├── DriftIndicator.tsx
│   │   ├── MetricCard.tsx
│   │   ├── NeuralScanner.tsx
│   │   ├── SignalBadge.tsx
│   │   ├── SignalCard.tsx
│   │   ├── SignalExplanation.tsx
│   │   ├── DemoBanner.tsx
│   │   ├── LockedFeature.tsx
│   │   └── ui/               ← ShadCN base components
│   ├── layouts/
│   │   └── DashboardLayout.tsx  ← Sidebar + nav shell
│   ├── lib/
│   │   ├── api.ts            ← Typed API client (all endpoints)
│   │   ├── queryKeys.ts      ← TanStack Query key registry
│   │   └── utils.ts          ← cn(), formatPercent()
│   ├── pages/                ← One file per route
│   │   ├── Dashboard.tsx
│   │   ├── MarketSignals.tsx
│   │   ├── SignalDetail.tsx
│   │   ├── AgentExplanation.tsx
│   │   ├── PortfolioAnalytics.tsx
│   │   ├── StrategyPerformance.tsx
│   │   ├── Model.tsx
│   │   ├── Drift.tsx
│   │   ├── Health.tsx
│   │   ├── Monitoring.tsx
│   │   ├── Metrics.tsx
│   │   ├── DemoProfile.tsx
│   │   ├── Login.tsx
│   │   └── ModelOffline.tsx
│   ├── store/
│   │   ├── index.ts          ← App store (selectedTicker)
│   │   └── authStore.ts      ← Auth + feature quota store
│   └── types/
│       └── index.ts          ← All TypeScript types aligned to backend
├── Dockerfile                ← Multi-stage Nginx production image
├── vite.config.ts            ← Dev proxy + build config
├── tailwind.config.js
└── package.json
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 7 |
| Language | TypeScript 5 |
| Styling | TailwindCSS + ShadCN UI |
| Animations | Framer Motion |
| Charts | Recharts |
| Server State | TanStack Query (React Query v5) |
| Client State | Zustand |
| HTTP Client | Axios |
| Build | Vite + TypeScript compiler |
| Testing | Vitest + React Testing Library |
| Deployment | Docker (Nginx multi-stage) |

---

## 💻 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- A running MarketSentinel backend at `http://localhost:8000` (or configured via `VITE_API_URL`)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/muhammedshihab1001/MarketSentinel-UI.git
cd MarketSentinel-UI

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and set VITE_API_URL to your backend URL
```

### Development

```bash
npm run dev
```
Application runs at `http://localhost:5173` with automatic API proxying to the backend.

### Production Build

```bash
npm run build     # TypeScript compile + Vite bundle
npm run preview   # Preview the production build locally
```

### Run Tests

```bash
npm run test
```

---

## 🐳 Docker Deployment

The project includes a multi-stage `Dockerfile` optimized for production delivery via Nginx.

```bash
# Build the Docker image
docker build -t market-sentinel-ui .

# Run the container
docker run -p 80:80 market-sentinel-ui
```

The Nginx configuration serves the React SPA and handles client-side routing correctly.

---

## 🌐 Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Backend FastAPI base URL |

Configure in `.env` (copy from `.env.example`).

---

## 📡 API Endpoints Consumed

| Endpoint | Purpose |
|---|---|
| `GET /prediction/snapshot` | Live signal snapshot (signals, drift, meta) |
| `GET /agent/explain/:ticker` | Per-ticker agent explanation + LLM report |
| `GET /agent/political-risk/:ticker` | Political risk score via GDELT |
| `GET /agent/agents` | Agent registry (names, weights) |
| `GET /prediction/snapshot/live` | Live snapshot for agent rationale |
| `GET /model/info` | Model version and artifact hashes |
| `GET /model/features` | Feature importance ranking |
| `GET /model/ic-stats` | Information Coefficient stats (30-day) |
| `GET /performance` | Strategy performance metrics |
| `GET /portfolio` | Portfolio position and exposure data |
| `GET /drift` | Drift state and severity |
| `GET /health/ready` | System health (DB, Redis, model) |
| `GET /metrics` | Prometheus metrics (text format) |
| `GET /equity/history/:ticker` | OHLCV price history |

---

## 🔐 Access Modes

| Mode | Access | Features |
|---|---|---|
| **Owner** | Username + password login | Full access to all pages including system monitoring |
| **Demo** | Public demo token | Quota-limited access; some pages show `LockedFeature` after limit |

---

## 📄 Pages Reference

| Page | Route | Description |
|---|---|---|
| Dashboard | `/` | Signal overview, top-5 opportunities, exposure gauges |
| Market Signals | `/signals` | Full signal grid with filters |
| Signal Detail | `/signals/:ticker` | Per-ticker detail with price chart |
| Agent Analysis | `/agent-explain` | LLM intelligence report, political risk, rationale |
| Portfolio Analytics | `/portfolio` | Gross/Net exposure, position ledger |
| Strategy Performance | `/performance` | Historical returns and risk scores |
| AI Model | `/model` | Feature importance, IC telemetry, artifact hashes |
| Drift Monitor | `/drift` | Algorithmic drift detection and state history |
| Health Center | `/health` | System connectivity status |
| System Monitor | `/monitoring` | Prometheus metrics, request charts |
| Metrics View | `/metrics` | High-velocity signal telemetry |
| Demo Profile | `/profile` | User quota and permission management |
| Login | `/login` | Authentication |
| Model Offline | `/model-offline` | Graceful degradation view |

---

## 🧑‍💻 Author

**Muhammed Shihab P**

---

<div align="center">

*Built for institutional-grade market intelligence. Not financial advice.*

</div>
