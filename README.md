# AI Assistant v4 Admin Dashboard

Real-time monitoring dashboard for [AI Assistant v4](https://github.com/enderdincer/ai-assistant-v4) microservices. Displays service health status with visual indicators (green/red) and metadata.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   AI Assistant  │     │      MQTT       │     │    Dashboard    │
│   Microservices │────▶│     Broker      │◀────│     Backend     │
│                 │     │   (Mosquitto)   │     │  (Node.js + WS) │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                              WebSocket                  │
                                                         ▼
                                                ┌─────────────────┐
                                                │    Dashboard    │
                                                │    Frontend     │
                                                │  (React + Vite) │
                                                └─────────────────┘
```

**Services Monitored:**

- audio_collector, transcription, speech, assistant, text_interaction, memory, extraction

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for containerized deployment)

### Local Development

```bash
# Install dependencies
npm install

# Start both frontend and backend in development mode
npm run dev

# Or run separately:
npm run dev --workspace=frontend  # Frontend on http://localhost:5173
npm run dev --workspace=backend   # Backend on http://localhost:3001
```

### Docker Deployment

```bash
# Copy and configure environment
cp .env.example .env

# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose down
```

**Access:**

- Dashboard: http://localhost:8080
- Backend API: http://localhost:3001
- MQTT Broker: localhost:1883

## Configuration

All configuration is via environment variables. See `.env.example` for full documentation.

| Variable                   | Default             | Description                                  |
| -------------------------- | ------------------- | -------------------------------------------- |
| `SERVICE_TIMEOUT_MS`       | 60000               | Time (ms) before marking a service unhealthy |
| `HEALTH_CHECK_INTERVAL_MS` | 5000                | Interval (ms) to check for timeouts          |
| `FRONTEND_PORT`            | 8080                | Dashboard port (Docker)                      |
| `WS_PORT`                  | 3002                | WebSocket server port                        |
| `VITE_WS_URL`              | ws://localhost:3002 | WebSocket URL for frontend                   |

## Project Structure

```
ai-assistant-v4-admin/
├── frontend/             # React + TypeScript + Tailwind + Vite
│   ├── src/
│   │   ├── components/   # Dashboard, ServiceCard, StatusBadge
│   │   ├── hooks/        # useWebSocket, useServiceHealth
│   │   └── types/        # TypeScript interfaces
│   └── Dockerfile
├── backend/              # Node.js + Express + MQTT.js + WS
│   ├── src/
│   │   ├── mqtt/         # MQTT client
│   │   ├── services/     # ServiceHealthManager
│   │   └── types/        # TypeScript interfaces
│   └── Dockerfile
├── docker-compose.yml    # Container orchestration
└── package.json          # Monorepo root
```

## Commands

| Command             | Description              |
| ------------------- | ------------------------ |
| `npm install`       | Install all dependencies |
| `npm run dev`       | Start frontend + backend |
| `npm run build`     | Build all workspaces     |
| `npm run test`      | Run all tests            |
| `npm run lint`      | Lint all workspaces      |
| `npm run typecheck` | TypeScript check only    |

## Health Message Format

Services publish to MQTT topic `all/system/health/{service_name}`:

```json
{
  "service": "assistant",
  "machine_id": "macbook-pro-1",
  "status": "healthy",
  "timestamp": 1703520000.123
}
```

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS v4, Vite
- **Backend:** Node.js, Express, TypeScript, MQTT.js, WS
- **Infrastructure:** Docker, Nginx, Eclipse Mosquitto
- **Testing:** Vitest
