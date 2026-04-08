# MarketSentinel Frontend

MarketSentinel is a React-powered intelligence dashboard for quantitative trading. It provides high-fidelity visualization for market signals, model stability, and executive portfolio exposure by interfacing with a FastAPI-based ML inference service.

---

## 🛠️ Tech Stack

- **React 18** + **Vite** (Next-gen frontend tooling)
- **TypeScript** (Static typing for reliability)
- **TailwindCSS** + **ShadCN UI** (Standardized component architecture)
- **TanStack Query** (Server state synchronization)
- **Zustand** (Local client state)
- **Framer Motion** (HUD-style micro-animations)
- **Recharts** (Performance-tuned data visualization)

---

## 🚀 Key Features

- **Intelligence Nodes**: Detailed signal explains powered by Multi-Agent LLM reasoning.
- **Stability Monitor**: Live algorithmic drift detection and stability metrics.
- **Portfolio Ledger**: Real-time Gross/Net exposure tracking with institutional-grade visualization.
- **Agent Pipeline**: Visual breakdown of agent-based rationale and political risk markers.

---

## 🏗️ Architecture Overview

The system bridges raw market telemetry with human-readable intelligence:
1.  **Backend Layer**: High-velocity ML Engine processes telemetry and triggers Multi-Agent LLM reasoning.
2.  **Communication Layer**: Typesafe FastAPI gateway consumed via the unified `src/lib/api.ts` client.
3.  **UI Layer**: React-based orchestration using `Zustand` and `React Query` for live state sync.

---

## 💻 Usage Commands

### 1. Installation
```bash
npm install
```

### 2. Development
```bash
npm run dev
```
*Application runs at `http://localhost:5173` with automatic API proxying.*

### 3. Testing
```bash
npm run test
```
*Executes the Vitest suite for component and logic validation.*

### 4. Production Build
```bash
npm run build
npm run preview
```

---

## 🐳 Docker Deployment

The project includes a multi-stage `Dockerfile` optimized for high-performance delivery via Nginx.

1.  **Build the Image**:
    ```bash
    docker build -t market-sentinel-ui .
    ```
2.  **Run the Container**:
    ```bash
    docker run -p 80:80 market-sentinel-ui
    ```

---

## 🛡️ Technical Audit & Hardening (April 2026)

The platform recently underwent a comprehensive technical audit to ensure industrial-grade stability, security, and accessibility.

### **1. "Understandable Industrial" Terminology**
To balance institutional authority with user accessibility, several key metrics and labels been standardized across the platform:
-   **Model Stability** (formerly `drift`): Clearly communicates system variance logic and algorithmic reliability.
-   **Hit Rate** (formerly `win_rate`): Aligns with institutional standard performance metrics for signal accuracy.
-   **Signal Strength** (formerly `raw_score`): Clarifies the AI consensus output on a scale of conviction.
-   **System DNA Integrity**: High-fidelity indicator of core model health and architectural consistency.
-   **Market Sentinel Nodes**: Intelligence checkpoints for signal verification and reasoning.

### **2. Platform Modules (15 Verified Pages)**
The following modules have been audited for stability, responsive layout, and performance:
1.  **Dashboard**: Central command hub for real-time market overview.
2.  **Market Signals**: Detailed list of active and historical intelligence signals.
3.  **Portfolio Analytics**: institutional-grade exposure and performance tracking.
4.  **Agent Explanation**: Visual breakdown of Multi-Agent LLM reasoning pipelines.
5.  **Drift Monitor**: High-fidelity visualization of algorithmic stability.
6.  **Model Metrics**: Deep-dive into ML model performance and telemetry.
7.  **Signal Detail**: Drilled-down views for individual market triggers.
8.  **Strategy Performance**: Backtesting and live performance comparison.
9.  **Health Center**: Unified monitoring of API, DB, Cache, and ML connectivity.
10. **Agent Pipeline**: Architecturally-accurate visualization of the reasoning engine.
11. **Monitoring**: Real-time log and infrastructure telemetry visualization.
12. **Demo Profile**: Quota-aware user context and permission management.
13. **Model Offline**: Graceful degradation state for maintenance windows.
14. **Login/Auth**: Secure access control for institutional users.
15. **Metrics View**: Specialized view for high-velocity signal telemetry.

### **3. Resilience & Security**
-   **Quota Management Engine**: Integrated demo restriction system with automated UI lockout safeguards.
-   **Global Error Boundaries**: Resilient architecture that isolates and recovers from module-specific failures.
-   **Terminology Hardening**: Elimination of jargon-heavy text to improve cross-departmental communication.
-   **Security Audit**: Verified API authentication flows and environment variable isolation.

---

## 🧑‍💻 Author
**Muhammed Shihab P**
