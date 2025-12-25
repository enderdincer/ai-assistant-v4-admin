# AGENTS.md - AI Assistant v4 Admin Dashboard

Guidelines for AI coding agents working on this project.

## Project Overview

Admin dashboard for monitoring AI Assistant v4 microservices. The frontend displays service
health status (green/red indicators) and metadata. The backend connects to MQTT for real-time
health updates and exposes data via WebSocket.

**Tech Stack:** React 18 + TypeScript + Tailwind CSS v4 + Vite | Node.js + Express + MQTT.js + WS | Vitest

## Build/Lint/Test Commands

### Root (Monorepo)
```bash
npm install          # Install all dependencies
npm run dev          # Run frontend + backend concurrently
npm run build        # Build all workspaces
npm run lint         # Lint all workspaces
npm run test         # Run tests in all workspaces
```

### Frontend (`/frontend`)
```bash
npm run dev                                    # Start Vite dev server
npm run build                                  # Production build
npm run lint && npm run lint:fix               # ESLint check / auto-fix
npm run typecheck                              # TypeScript check only
npm run test                                   # Vitest watch mode
npm run test:run                               # Run tests once
npm run test:run -- path/to/file.test.tsx      # Single test file
npm run test:run -- -t "test name"             # Test by name pattern
npm run test:coverage                          # Tests with coverage
```

### Backend (`/backend`)
```bash
npm run dev                                    # Start with tsx watch
npm run build && npm run start                 # Compile and run
npm run test:run -- path/to/file.test.ts       # Single test file
```

## Code Style Guidelines

### TypeScript
- Strict mode enabled (`strict: true`)
- `interface` for objects, `type` for unions/intersections
- Explicit return types for functions
- `unknown` over `any`; use type guards
- `as const` for literal types

```typescript
interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastSeen: number;
}
```

### Imports
- Order: external packages → internal modules (`@/`) → relative imports
- Prefer named exports over default exports
- Sort alphabetically within groups

### React Components
- Functional components with hooks only
- Props interface above component with `Props` suffix
- Destructure props in function signature
- Extract logic to custom hooks

```typescript
interface ServiceCardProps {
  service: ServiceHealth;
  onClick?: () => void;
}

export function ServiceCard({ service, onClick }: ServiceCardProps) {
  return (
    <div className={`p-4 rounded-lg ${service.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}>
      <h3>{service.name}</h3>
    </div>
  );
}
```

### Tailwind CSS v4
- Use utility classes directly; avoid custom CSS
- Order: layout → spacing → typography → colors → effects
- Use template literals or clsx for conditional styling

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ServiceCard.tsx` |
| Utilities | camelCase | `mqttClient.ts` |
| Tests | `*.test.ts(x)` | `ServiceCard.test.tsx` |
| Interfaces | PascalCase | `ServiceHealth` |
| Props | PascalCase + Props | `ServiceCardProps` |
| Functions | camelCase | `handleClick` |
| Constants | SCREAMING_SNAKE | `MQTT_TOPICS` |
| Hooks | use prefix | `useServiceHealth` |

### Error Handling
- Try-catch for async operations
- Log errors with context; don't swallow silently
- Return meaningful API error responses

### WebSocket & MQTT
- Validate messages before processing
- Handle reconnection with exponential backoff
- Clean up subscriptions on unmount/disconnect
- Type all message payloads

```typescript
interface HealthMessage {
  service: string;
  machine_id: string;
  status: 'started' | 'healthy' | 'stopping';
  timestamp: number;
}
const HEALTH_TOPIC = 'all/system/health/#';
```

## Project Structure
```
ai-assistant-v4-admin/
├── frontend/src/
│   ├── components/    # React components
│   ├── hooks/         # Custom hooks
│   ├── types/         # TypeScript types
│   ├── App.tsx        # Root component
│   └── main.tsx       # Entry point
├── backend/src/
│   ├── index.ts       # Express + WS entry
│   ├── mqtt/          # MQTT client
│   └── types/         # Type definitions
├── tasks/             # Agent task definitions
└── package.json       # Monorepo root
```

## AI Assistant v4 Services

Services that publish health to MQTT (`all/system/health/{service_name}`):

| Service | Description |
|---------|-------------|
| audio_collector | Captures audio from microphone |
| transcription | Speech-to-text (STT) |
| speech | Text-to-speech (TTS) |
| assistant | LLM conversational AI |
| text_interaction | CLI text interface |
| memory | Conversation/fact storage |
| extraction | Fact extraction from conversations |

Health payload:
```json
{"service": "assistant", "machine_id": "macbook-pro-1", "status": "healthy", "timestamp": 1703520000.123}
```
