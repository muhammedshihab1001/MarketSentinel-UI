# MarketSentinel Frontend UI

Production-grade React frontend for the MarketSentinel Quantitative Trading Platform. This dashboard interfaces with the FastAPI ML inference service to visualize market signals, portfolio exposure, strategy performance, and agent explanations.

## Tech Stack
- **React 18** + **Vite**
- **TypeScript**
- **TailwindCSS** + **ShadCN UI** (Styling & Components)
- **TanStack Query** (Server State Management)
- **Zustand** (Global Client State)
- **Axios** (API Client)
- **Recharts** (Data Visualization)
- **Vitest** (Testing)

## Prerequisites
- Node.js 18+ 
- npm or yarn or pnpm

## Installation

1. Clone the repository and navigate to the UI folder:
   ```bash
   cd d:/frontend/market-sentinel-ui
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Environment Setup
Copy the `.env.example` file to create your `.env` configuration:
```bash
cp .env.example .env
```

Ensure `VITE_API_BASE_URL` points to your running FastAPI server (default is `http://localhost:8000`).

## Running Locally

Start the Vite development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`. 
The `vite.config.ts` includes proxy settings to forward API calls natively to the `localhost:8000` FastAPI service avoiding CORS issues during local development.

## Testing

Run unit tests via Vitest:
```bash
npm run test
```

## Building for Production

Create an optimized production build:
```bash
npm run build
```
The bundled assets will be generated in the `dist/` directory. You can preview the production build locally via:
```bash
npm run preview
```

## Docker Deployment (Production)

The included `Dockerfile` utilizes a multi-stage build, compiling the React application and serving it with Nginx.

1. Build the Docker image:
   ```bash
   docker build -t market-sentinel-ui .
   ```
2. Run the Docker container:
   ```bash
   docker run -p 80:80 market-sentinel-ui
   ```
The app will be accessible at `http://localhost:80`.
