# AI Assistant v4 Admin Dashboard - Development Plan

**Generated:** 2025-12-25  
**Status:** Planning Phase  
**Estimated Time:** 8-12 hours

---

## 1. Executive Summary

Build a real-time admin dashboard that monitors 7 microservices from AI Assistant v4. The system uses MQTT for service health collection, WebSocket for real-time frontend updates, and displays a visual dashboard with green/red health indicators.

### Key Technologies
- **Frontend:** React 18, TypeScript, Tailwind CSS v4, Vite, Vitest
- **Backend:** Node.js, Express, MQTT.js, WS, Vitest
- **Architecture:** Monorepo with npm workspaces

---

## 2. System Architecture

### Data Flow
```
[Microservices] 
    ↓ (MQTT publish to all/system/health/*)
[MQTT Broker]
    ↓ (Subscribe)
[Backend - MQTT Client]
    ↓ (Process & Store in Memory)
[Backend - Service Health Manager]
    ↓ (Broadcast via WebSocket)
[Frontend - WebSocket Client]
    ↓ (Update React State)
[Dashboard UI - Service Cards]
```

### Component Architecture

#### Backend Components
1. **Express Server** - HTTP API and health endpoint
2. **MQTT Client** - Subscribe to service health topics
3. **Service Health Manager** - In-memory state management & timeout detection
4. **WebSocket Server** - Broadcast updates to connected clients
5. **Configuration** - Environment-based settings

#### Frontend Components
1. **WebSocket Hook** - Connect and manage WebSocket connection
2. **Service Health Hook** - Manage service state and updates
3. **Dashboard Layout** - Main container for service cards
4. **Service Card** - Individual service display with visual indicators
5. **Status Badge** - Reusable health status indicator
6. **Timestamp Formatter** - Utility for displaying relative times

---

## 3. File Structure to Create

### Backend Files

```
backend/
├── src/
│   ├── index.ts                          # Main entry point - Express + WebSocket + MQTT orchestration
│   ├── config/
│   │   └── env.ts                        # Environment variable validation & defaults
│   ├── mqtt/
│   │   ├── client.ts                     # MQTT client connection & subscription
│   │   └── messageHandler.ts            # Parse and validate MQTT messages
│   ├── services/
│   │   ├── ServiceHealthManager.ts       # Core state management + timeout detection
│   │   └── WebSocketBroadcaster.ts      # Manage WebSocket connections + broadcasts
│   ├── types/
│   │   ├── ServiceHealth.ts              # Service health data types
│   │   ├── MqttMessage.ts                # MQTT message payload types
│   │   └── WebSocketMessage.ts           # WebSocket message types
│   ├── utils/
│   │   ├── logger.ts                     # Simple console logger
│   │   └── validators.ts                 # Type guards for runtime validation
│   └── __tests__/
│       ├── ServiceHealthManager.test.ts
│       ├── messageHandler.test.ts
│       └── validators.test.ts
├── tsconfig.json                          # TypeScript configuration
├── .env.example                           # Example environment variables
└── package.json                           # Already exists
```

### Frontend Files

```
frontend/
├── src/
│   ├── main.tsx                          # Entry point - React DOM render
│   ├── App.tsx                           # Root component - WebSocket provider
│   ├── components/
│   │   ├── Dashboard.tsx                 # Main dashboard layout
│   │   ├── ServiceCard.tsx               # Individual service card
│   │   ├── StatusBadge.tsx               # Health status indicator
│   │   ├── ConnectionStatus.tsx          # WebSocket connection indicator
│   │   └── __tests__/
│   │       ├── ServiceCard.test.tsx
│   │       ├── StatusBadge.test.tsx
│   │       └── Dashboard.test.tsx
│   ├── hooks/
│   │   ├── useWebSocket.ts               # WebSocket connection management
│   │   ├── useServiceHealth.ts           # Service state management
│   │   └── __tests__/
│   │       ├── useWebSocket.test.ts
│   │       └── useServiceHealth.test.ts
│   ├── types/
│   │   ├── ServiceHealth.ts              # Shared types (mirror backend)
│   │   └── WebSocketMessage.ts           # WebSocket message types
│   ├── utils/
│   │   ├── formatTimestamp.ts            # Relative time formatting
│   │   ├── constants.ts                  # Service names, timeouts, etc.
│   │   └── __tests__/
│   │       └── formatTimestamp.test.ts
│   ├── index.css                         # Global styles + Tailwind imports
│   └── vite-env.d.ts                     # Vite type declarations
├── index.html                             # HTML entry point
├── tsconfig.json                          # TypeScript configuration
├── tsconfig.node.json                     # TypeScript config for Vite config
├── vite.config.ts                         # Vite + Vitest configuration
├── eslint.config.js                       # ESLint flat config
├── .env.example                           # Example environment variables
└── package.json                           # Already exists
```

### Root Files
```
/
├── .env.example                           # Combined example for both workspaces
└── README.md                              # Setup and usage instructions
```

---

## 4. Key Components & Modules

### 4.1 Backend Components

#### **ServiceHealthManager** (Core State Management)
**File:** `backend/src/services/ServiceHealthManager.ts`

**Responsibilities:**
- Store current state of all services in memory
- Update service health from MQTT messages
- Run interval check for service timeouts (60s since last heartbeat)
- Emit events when state changes

**Key Methods:**
```typescript
class ServiceHealthManager {
  private services: Map<string, ServiceHealthState>
  private readonly TIMEOUT_MS = 60000
  
  updateService(message: HealthMessage): void
  getServiceState(serviceName: string): ServiceHealthState | undefined
  getAllServices(): ServiceHealthState[]
  startTimeoutMonitoring(): void
  private checkTimeouts(): void
}
```

**State Structure:**
```typescript
interface ServiceHealthState {
  name: string
  status: 'healthy' | 'unhealthy' | 'unknown'
  machineId: string | null
  lastSeen: number  // Unix timestamp in milliseconds
  lastStatus: 'started' | 'healthy' | 'stopping' | null
}
```

#### **MQTT Client** 
**File:** `backend/src/mqtt/client.ts`

**Responsibilities:**
- Connect to MQTT broker with reconnection logic
- Subscribe to `all/system/health/#` wildcard topic
- Forward messages to handler
- Handle connection errors and reconnection

**Configuration:**
```typescript
interface MqttConfig {
  brokerUrl: string
  clientId: string
  reconnectPeriod: number
  connectTimeout: number
}
```

#### **WebSocketBroadcaster**
**File:** `backend/src/services/WebSocketBroadcaster.ts`

**Responsibilities:**
- Manage WebSocket server and client connections
- Broadcast service updates to all connected clients
- Handle client connect/disconnect
- Send initial state on client connection

**Message Types:**
```typescript
type WSMessage = 
  | { type: 'init', data: ServiceHealthState[] }
  | { type: 'update', data: ServiceHealthState }
  | { type: 'heartbeat' }
```

---

### 4.2 Frontend Components

#### **useWebSocket Hook**
**File:** `frontend/src/hooks/useWebSocket.ts`

**Responsibilities:**
- Establish WebSocket connection to backend
- Handle reconnection with exponential backoff
- Parse incoming messages
- Provide connection status

**Return Value:**
```typescript
interface UseWebSocketReturn {
  messages: WebSocketMessage[]
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  reconnect: () => void
}
```

**Features:**
- Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Connection status tracking
- Message queue during reconnection
- Cleanup on unmount

#### **useServiceHealth Hook**
**File:** `frontend/src/hooks/useServiceHealth.ts`

**Responsibilities:**
- Consume WebSocket messages
- Maintain service health state
- Handle init and update messages
- Provide service lookup and list

**Return Value:**
```typescript
interface UseServiceHealthReturn {
  services: Map<string, ServiceHealthState>
  getService: (name: string) => ServiceHealthState | undefined
  isLoading: boolean
}
```

#### **Dashboard Component**
**File:** `frontend/src/components/Dashboard.tsx`

**Responsibilities:**
- Main layout container
- Display all service cards in responsive grid
- Show connection status
- Handle empty states

**Layout:**
- Responsive grid: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
- Header with connection status indicator
- Service cards sorted alphabetically

#### **ServiceCard Component**
**File:** `frontend/src/components/ServiceCard.tsx`

**Responsibilities:**
- Display single service information
- Visual health indicator (green/red glow effect)
- Show name, status, machine ID, last seen time
- Responsive design

**Visual States:**
- **Healthy:** Green background with glow effect, green dot
- **Unhealthy:** Red background with glow effect, red dot
- **Unknown:** Gray background, gray dot

**Props:**
```typescript
interface ServiceCardProps {
  service: ServiceHealthState
  onClick?: () => void  // Future: show details modal
}
```

**Tailwind Styling:**
```typescript
// Healthy state
className="bg-green-500/20 border-2 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]"

// Unhealthy state  
className="bg-red-500/20 border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
```

---

## 5. Data Types & Interfaces

### Shared Types (Backend & Frontend)

```typescript
// Service health status from MQTT
type ServiceStatus = 'started' | 'healthy' | 'stopping'

// Computed service state
type ServiceHealthStatus = 'healthy' | 'unhealthy' | 'unknown'

// MQTT message payload
interface HealthMessage {
  service: string
  machine_id: string
  status: ServiceStatus
  timestamp: number  // Unix timestamp (seconds with decimal)
}

// Service state in application
interface ServiceHealthState {
  name: string
  status: ServiceHealthStatus
  machineId: string | null
  lastSeen: number  // Unix timestamp in milliseconds
  lastStatus: ServiceStatus | null
}

// WebSocket messages
type WebSocketMessage = 
  | { type: 'init'; data: ServiceHealthState[] }
  | { type: 'update'; data: ServiceHealthState }
  | { type: 'heartbeat' }
```

### Type Mapping Logic

**MQTT Status → Application Status:**
- `started` → `healthy` (service just started, consider healthy)
- `healthy` → `healthy` (service reports healthy)
- `stopping` → `unhealthy` (service shutting down)
- Timeout (no message in 60s) → `unhealthy`
- Never seen → `unknown`

---

## 6. Configuration & Environment Variables

### Backend Environment Variables
**File:** `backend/.env.example`

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# MQTT Configuration
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_CLIENT_ID=admin-dashboard-backend
MQTT_RECONNECT_PERIOD=1000
MQTT_CONNECT_TIMEOUT=30000

# WebSocket Configuration
WS_PORT=3002
WS_HEARTBEAT_INTERVAL=30000

# Service Monitoring
SERVICE_TIMEOUT_MS=60000
HEALTH_CHECK_INTERVAL_MS=5000
```

### Frontend Environment Variables
**File:** `frontend/.env.example`

```bash
# API Configuration
VITE_WS_URL=ws://localhost:3002
VITE_API_URL=http://localhost:3001

# Connection Settings
VITE_WS_RECONNECT_DELAY=1000
VITE_WS_MAX_RECONNECT_DELAY=30000
```

### Environment Validation
Use runtime validation in `backend/src/config/env.ts`:

```typescript
export interface Config {
  port: number
  wsPort: number
  mqttBrokerUrl: string
  mqttClientId: string
  serviceTimeoutMs: number
  healthCheckIntervalMs: number
}

export function loadConfig(): Config {
  const config: Config = {
    port: parseInt(process.env.PORT || '3001', 10),
    wsPort: parseInt(process.env.WS_PORT || '3002', 10),
    mqttBrokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
    mqttClientId: process.env.MQTT_CLIENT_ID || 'admin-dashboard-backend',
    serviceTimeoutMs: parseInt(process.env.SERVICE_TIMEOUT_MS || '60000', 10),
    healthCheckIntervalMs: parseInt(process.env.HEALTH_CHECK_INTERVAL_MS || '5000', 10),
  }
  
  // Validate required fields
  if (!config.mqttBrokerUrl) {
    throw new Error('MQTT_BROKER_URL is required')
  }
  
  return config
}
```

---

## 7. Implementation Order

### Phase 1: Backend Foundation (2-3 hours)

#### Step 1.1: Project Configuration
- [ ] Create `backend/tsconfig.json`
- [ ] Create `backend/.env.example` with all variables
- [ ] Create `backend/.env` (gitignored) with local values
- [ ] Create `backend/eslint.config.js`

#### Step 1.2: Type Definitions
- [ ] `backend/src/types/ServiceHealth.ts` - Core data types
- [ ] `backend/src/types/MqttMessage.ts` - MQTT payload types
- [ ] `backend/src/types/WebSocketMessage.ts` - WS message types

#### Step 1.3: Configuration & Utilities
- [ ] `backend/src/config/env.ts` - Environment loader with validation
- [ ] `backend/src/utils/logger.ts` - Simple console logger
- [ ] `backend/src/utils/validators.ts` - Runtime type guards

#### Step 1.4: Core Services
- [ ] `backend/src/services/ServiceHealthManager.ts` - State management
  - Implement service state storage (Map)
  - Implement updateService() method
  - Implement timeout checking logic
  - Add event emitter for state changes
  - Write unit tests

#### Step 1.5: MQTT Integration
- [ ] `backend/src/mqtt/messageHandler.ts` - Message parsing & validation
  - Validate incoming MQTT message structure
  - Parse timestamp (handle seconds → milliseconds conversion)
  - Extract service name from topic
  - Write unit tests
- [ ] `backend/src/mqtt/client.ts` - MQTT client
  - Connect to broker with config
  - Subscribe to `all/system/health/#`
  - Forward messages to handler
  - Handle reconnection

#### Step 1.6: WebSocket Server
- [ ] `backend/src/services/WebSocketBroadcaster.ts` - WebSocket management
  - Create WebSocket server
  - Track connected clients
  - Send initial state on connect
  - Broadcast updates to all clients
  - Handle client disconnect

#### Step 1.7: HTTP Server & Orchestration
- [ ] `backend/src/index.ts` - Main entry point
  - Initialize Express server
  - Create health check endpoint: `GET /health`
  - Create service list endpoint: `GET /api/services`
  - Initialize MQTT client
  - Initialize WebSocket server
  - Connect MQTT → ServiceHealthManager → WebSocket pipeline
  - Graceful shutdown handling

**Validation:**
- [ ] Run backend with `npm run dev`
- [ ] Check logs for MQTT connection
- [ ] Test `curl http://localhost:3001/health`
- [ ] Connect with WebSocket client (e.g., `wscat -c ws://localhost:3002`)
- [ ] Verify messages when services publish to MQTT

---

### Phase 2: Frontend Foundation (2-3 hours)

#### Step 2.1: Project Configuration
- [ ] Create `frontend/tsconfig.json`
- [ ] Create `frontend/tsconfig.node.json` for Vite config
- [ ] Create `frontend/vite.config.ts` (Vite + React + Vitest)
- [ ] Create `frontend/eslint.config.js`
- [ ] Create `frontend/.env.example` with WS_URL
- [ ] Create `frontend/.env` (gitignored)
- [ ] Create `frontend/index.html` with root div
- [ ] Create `frontend/src/vite-env.d.ts`

#### Step 2.2: Styles
- [ ] Create `frontend/src/index.css`
  - Import Tailwind directives
  - Add custom global styles if needed
  - Define CSS variables for theme

#### Step 2.3: Type Definitions (Mirror Backend)
- [ ] `frontend/src/types/ServiceHealth.ts` - Copy from backend
- [ ] `frontend/src/types/WebSocketMessage.ts` - Copy from backend

#### Step 2.4: Utilities
- [ ] `frontend/src/utils/constants.ts` - Service names, config
  ```typescript
  export const SERVICE_NAMES = [
    'audio_collector',
    'transcription', 
    'speech',
    'assistant',
    'text_interaction',
    'memory',
    'extraction'
  ] as const
  
  export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3002'
  export const RECONNECT_DELAY = 1000
  export const MAX_RECONNECT_DELAY = 30000
  ```
- [ ] `frontend/src/utils/formatTimestamp.ts` - Relative time formatter
  ```typescript
  export function formatRelativeTime(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }
  ```
- [ ] Write unit tests for formatTimestamp

#### Step 2.5: Custom Hooks
- [ ] `frontend/src/hooks/useWebSocket.ts` - WebSocket connection
  - Connect to backend WebSocket
  - Handle open, close, error events
  - Implement exponential backoff reconnection
  - Parse and queue messages
  - Track connection status
  - Cleanup on unmount
  - Write unit tests

- [ ] `frontend/src/hooks/useServiceHealth.ts` - Service state management
  - Use useWebSocket hook
  - Handle 'init' message (set all services)
  - Handle 'update' message (update single service)
  - Store services in Map for efficient lookup
  - Provide getService() helper
  - Write unit tests

---

### Phase 3: UI Components (2-3 hours)

#### Step 3.1: Basic Components
- [ ] `frontend/src/components/StatusBadge.tsx`
  - Props: `status: ServiceHealthStatus`
  - Display colored dot + text
  - Colors: green (healthy), red (unhealthy), gray (unknown)
  - Write tests

- [ ] `frontend/src/components/ConnectionStatus.tsx`
  - Props: `status: 'connecting' | 'connected' | 'disconnected' | 'error'`
  - Small indicator in header
  - Show icon + text
  - Different colors per state
  - Write tests

#### Step 3.2: Service Card
- [ ] `frontend/src/components/ServiceCard.tsx`
  - Display service name (formatted: "audio_collector" → "Audio Collector")
  - Show StatusBadge
  - Show machine_id (truncated if too long)
  - Show last seen time (use formatRelativeTime)
  - Glowing border effect based on status
  - Responsive padding and sizing
  - Optional onClick handler for future expansion
  - Write tests with mock data

**Styling Reference:**
```tsx
<div className={`
  p-6 rounded-lg border-2 transition-all duration-300
  ${status === 'healthy' 
    ? 'bg-green-500/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' 
    : status === 'unhealthy'
    ? 'bg-red-500/20 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
    : 'bg-gray-500/20 border-gray-500'
  }
`}>
```

#### Step 3.3: Dashboard Layout
- [ ] `frontend/src/components/Dashboard.tsx`
  - Use useServiceHealth hook
  - Show ConnectionStatus in header
  - Display grid of ServiceCards
  - Responsive grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
  - Sort services alphabetically
  - Show loading state while connecting
  - Show empty state if no services
  - Write tests

#### Step 3.4: Root Component
- [ ] `frontend/src/App.tsx`
  - Simple container
  - Render Dashboard component
  - Add header with title "AI Assistant v4 - Admin Dashboard"
  - Add footer with timestamp or version

- [ ] `frontend/src/main.tsx`
  - Import React and ReactDOM
  - Import index.css
  - Import App component
  - Render to #root

**Validation:**
- [ ] Run frontend with `npm run dev`
- [ ] Verify Tailwind styles load correctly
- [ ] Check WebSocket connection in DevTools
- [ ] Verify service cards display with mock data

---

### Phase 4: Integration & Testing (2-3 hours)

#### Step 4.1: End-to-End Integration
- [ ] Start MQTT broker (if not already running)
  ```bash
  # Using Docker
  docker run -it -p 1883:1883 eclipse-mosquitto
  ```
- [ ] Start backend: `npm run dev:backend`
- [ ] Start frontend: `npm run dev:frontend`
- [ ] Publish test MQTT messages:
  ```bash
  mosquitto_pub -t "all/system/health/assistant" -m '{"service":"assistant","machine_id":"test-1","status":"healthy","timestamp":1703520000.123}'
  ```
- [ ] Verify service card updates in real-time
- [ ] Test timeout: stop publishing, wait 60s, verify status → unhealthy
- [ ] Test reconnection: restart backend, verify frontend reconnects

#### Step 4.2: Unit Tests
- [ ] Backend tests:
  - [ ] ServiceHealthManager.test.ts - State management and timeout logic
  - [ ] messageHandler.test.ts - MQTT message parsing
  - [ ] validators.test.ts - Type guard functions
  - [ ] Run: `npm run test:run --workspace=backend`
  - [ ] Target: >80% coverage

- [ ] Frontend tests:
  - [ ] useWebSocket.test.ts - Connection and reconnection logic
  - [ ] useServiceHealth.test.ts - State updates from messages
  - [ ] ServiceCard.test.tsx - Rendering and styling
  - [ ] StatusBadge.test.tsx - Status variants
  - [ ] formatTimestamp.test.ts - Time formatting
  - [ ] Run: `npm run test:run --workspace=frontend`
  - [ ] Target: >80% coverage

#### Step 4.3: Error Handling & Edge Cases
- [ ] Backend:
  - [ ] Handle malformed MQTT messages (invalid JSON)
  - [ ] Handle missing fields in MQTT message
  - [ ] Handle MQTT broker disconnect/reconnect
  - [ ] Handle WebSocket client disconnect
  - [ ] Graceful shutdown (close connections)
  - [ ] Handle multiple messages from same service (update existing)

- [ ] Frontend:
  - [ ] Handle WebSocket disconnect with reconnection
  - [ ] Handle connection timeout
  - [ ] Handle invalid WebSocket messages
  - [ ] Handle service appearing/disappearing
  - [ ] Handle rapid updates (debounce if needed)
  - [ ] Handle very long machine IDs (truncate)

#### Step 4.4: Code Quality
- [ ] Run linters: `npm run lint`
- [ ] Run type checking: `npm run typecheck`
- [ ] Fix all warnings and errors
- [ ] Run formatters if configured
- [ ] Check for console.log statements (replace with logger)
- [ ] Review TODO comments

---

### Phase 5: Documentation & Polish (1-2 hours)

#### Step 5.1: Documentation
- [ ] Create comprehensive `README.md` in root:
  - Project overview
  - Architecture diagram (ASCII art or link to image)
  - Prerequisites (Node.js version, MQTT broker)
  - Installation instructions
  - Environment variable documentation
  - Development commands
  - Testing commands
  - Deployment considerations
  - Troubleshooting section

- [ ] Create `backend/README.md`:
  - Backend-specific setup
  - API endpoints documentation
  - MQTT topic structure
  - WebSocket message format
  - Environment variables

- [ ] Create `frontend/README.md`:
  - Frontend-specific setup
  - Component structure
  - Styling guidelines
  - Testing approach

- [ ] Add JSDoc comments to key functions and types

#### Step 5.2: Configuration Examples
- [ ] Ensure `.env.example` files are complete in both packages
- [ ] Create root `.env.example` with combined variables
- [ ] Document any optional vs. required variables
- [ ] Add comments explaining each variable

#### Step 5.3: Developer Experience
- [ ] Add helpful console logs on startup:
  - Backend: MQTT connection status, WebSocket port, Express port
  - Frontend: WebSocket URL, connection status
- [ ] Add error messages with actionable guidance
- [ ] Verify hot reload works in both frontend and backend
- [ ] Test full development workflow from clean install

#### Step 5.4: Final Polish
- [ ] Test responsive design on different screen sizes
- [ ] Verify color contrast for accessibility
- [ ] Add loading spinners where appropriate
- [ ] Add transition animations (already in ServiceCard)
- [ ] Verify all services show up in alphabetical order
- [ ] Test with all 7 services publishing simultaneously
- [ ] Performance check: verify no memory leaks with long-running sessions

---

## 8. Testing Strategy

### Backend Testing

#### Unit Tests (Vitest)
- **ServiceHealthManager**: Mock Date.now() to test timeout logic
- **messageHandler**: Test valid/invalid MQTT payloads
- **validators**: Test type guards with various inputs

#### Integration Tests
- Start test MQTT broker (or mock)
- Publish messages, verify state updates
- Test WebSocket broadcasting

### Frontend Testing

#### Unit Tests (Vitest + React Testing Library)
- **useWebSocket**: Mock WebSocket API, test reconnection
- **useServiceHealth**: Mock messages, test state updates
- **ServiceCard**: Test rendering variants (healthy/unhealthy/unknown)
- **formatTimestamp**: Test edge cases (0s, 59s, 60s, etc.)

#### Component Tests
- Render Dashboard with mock data
- Test ConnectionStatus states
- Test StatusBadge variants
- Verify Tailwind classes applied correctly

### End-to-End Testing (Manual)
- Full flow: MQTT → Backend → WebSocket → Frontend
- Test timeout scenario
- Test reconnection scenarios
- Test with all 7 services

---

## 9. Key Implementation Considerations

### 9.1 Service Timeout Detection

**Challenge:** Detect when a service hasn't sent a heartbeat in 60 seconds.

**Solution:**
- In `ServiceHealthManager`, run `setInterval` every 5 seconds
- Check each service's `lastSeen` timestamp
- If `Date.now() - lastSeen > 60000`, mark as unhealthy
- Emit update event to trigger WebSocket broadcast

```typescript
private checkTimeouts(): void {
  const now = Date.now()
  let hasChanges = false
  
  for (const [name, service] of this.services.entries()) {
    if (service.status === 'healthy' && (now - service.lastSeen) > this.TIMEOUT_MS) {
      service.status = 'unhealthy'
      hasChanges = true
      this.emit('serviceUpdated', service)
    }
  }
}

startTimeoutMonitoring(): void {
  setInterval(() => this.checkTimeouts(), 5000)
}
```

### 9.2 WebSocket Reconnection (Frontend)

**Challenge:** Handle WebSocket disconnect gracefully with exponential backoff.

**Solution:**
```typescript
const [reconnectDelay, setReconnectDelay] = useState(INITIAL_DELAY)

const connect = useCallback(() => {
  const ws = new WebSocket(WS_URL)
  
  ws.onopen = () => {
    setStatus('connected')
    setReconnectDelay(INITIAL_DELAY) // Reset on successful connection
  }
  
  ws.onclose = () => {
    setStatus('disconnected')
    // Exponential backoff
    setTimeout(() => {
      setReconnectDelay(prev => Math.min(prev * 2, MAX_DELAY))
      connect()
    }, reconnectDelay)
  }
  
  ws.onerror = () => setStatus('error')
  
  // ... message handling
}, [reconnectDelay])
```

### 9.3 Timestamp Conversion

**Challenge:** MQTT messages have Unix timestamps in seconds with decimals. JavaScript uses milliseconds.

**Solution:**
```typescript
// In messageHandler.ts
export function parseMqttMessage(payload: string): HealthMessage {
  const parsed = JSON.parse(payload)
  
  // Validate schema
  if (!isValidHealthMessage(parsed)) {
    throw new Error('Invalid health message format')
  }
  
  // Convert seconds → milliseconds
  return {
    ...parsed,
    timestamp: Math.floor(parsed.timestamp * 1000)
  }
}
```

### 9.4 Service Name Formatting

**Challenge:** Service names from MQTT are snake_case, want to display as "Title Case".

**Solution:**
```typescript
// In ServiceCard.tsx
function formatServiceName(name: string): string {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
```

### 9.5 Initial Service State

**Challenge:** When backend starts, it doesn't know about services until they publish.

**Solution:**
- Option A: Pre-populate with known service names (from constants) with status 'unknown'
- Option B: Only show services after they publish at least once

**Recommendation:** Use Option B for simplicity. Services will appear as they start publishing.

If Option A is preferred:
```typescript
// In ServiceHealthManager constructor
private initializeServices(): void {
  const knownServices = [
    'audio_collector', 'transcription', 'speech', 
    'assistant', 'text_interaction', 'memory', 'extraction'
  ]
  
  for (const name of knownServices) {
    this.services.set(name, {
      name,
      status: 'unknown',
      machineId: null,
      lastSeen: 0,
      lastStatus: null
    })
  }
}
```

### 9.6 Multiple Instances of Same Service

**Challenge:** Multiple machines might run the same service (e.g., multiple assistants).

**Current Scope:** Out of scope for MVP. Show only one instance per service type.

**Future Enhancement:** Track per machine_id, display multiple cards per service.

```typescript
// Future: Use composite key
const key = `${service}:${machine_id}`
this.services.set(key, state)
```

### 9.7 Message Validation

**Challenge:** Runtime validation of MQTT and WebSocket messages.

**Solution:** Type guards in validators.ts:
```typescript
export function isHealthMessage(value: unknown): value is HealthMessage {
  if (typeof value !== 'object' || value === null) return false
  
  const obj = value as Record<string, unknown>
  
  return (
    typeof obj.service === 'string' &&
    typeof obj.machine_id === 'string' &&
    (obj.status === 'started' || obj.status === 'healthy' || obj.status === 'stopping') &&
    typeof obj.timestamp === 'number'
  )
}
```

### 9.8 Graceful Shutdown

**Challenge:** Properly close connections when backend stops.

**Solution:**
```typescript
// In index.ts
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...')
  
  // Close WebSocket server
  wss.close()
  
  // Disconnect MQTT client
  await mqttClient.endAsync()
  
  // Close Express server
  httpServer.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
```

---

## 10. Potential Challenges & Mitigations

### Challenge 1: MQTT Broker Not Available
**Symptom:** Backend can't connect, throws errors repeatedly.

**Mitigation:**
- Add retry logic with max attempts
- Log clear error message with broker URL
- Provide fallback: start HTTP/WS server even if MQTT fails (show warning)
- Document how to start local MQTT broker

### Challenge 2: WebSocket Connection Drops
**Symptom:** Frontend shows disconnected, data stops updating.

**Mitigation:**
- Implement exponential backoff reconnection (already planned)
- Show clear connection status indicator
- Queue messages on backend if client temporarily disconnected (advanced)
- Add manual reconnect button

### Challenge 3: Service Timeout False Positives
**Symptom:** Service marked unhealthy but is actually running.

**Mitigation:**
- Ensure timeout threshold (60s) is longer than service heartbeat interval
- Document expected heartbeat frequency for services
- Add logging when service times out
- Consider configurable timeout per service (future)

### Challenge 4: Race Conditions with Rapid Updates
**Symptom:** UI flickers, services appear/disappear.

**Mitigation:**
- Use React state updates correctly (functional updates)
- Debounce UI updates if needed
- Use stable keys for list rendering
- Test with rapid message publishing

### Challenge 5: Browser Tab Inactive
**Symptom:** WebSocket might disconnect when tab inactive.

**Mitigation:**
- Implement ping/pong heartbeat on WebSocket
- Reconnect when tab becomes active (visibility API)
- Show warning if connection old

### Challenge 6: Large Number of Services
**Symptom:** UI becomes cluttered with many services.

**Future Mitigation:**
- Add filtering/search
- Add grouping by status
- Add pagination or virtual scrolling
- Current scope: 7 services, no issue

---

## 11. Future Enhancements (Out of Scope for MVP)

### Phase 2 Features
1. **Service Details Modal**: Click service card to see full details, logs, metrics
2. **Historical Data**: Store service health history in database (PostgreSQL/TimescaleDB)
3. **Charts & Graphs**: Uptime percentage, response time graphs
4. **Alerts & Notifications**: Browser notifications, email alerts on service down
5. **Multi-Instance Support**: Track multiple instances of same service
6. **Authentication**: Login system, role-based access
7. **API for Programmatic Access**: REST API for querying service status
8. **Custom Health Checks**: Backend ping services directly
9. **Service Actions**: Restart, stop, view logs from dashboard
10. **Dark Mode Toggle**: User preference for light/dark theme

### Technical Improvements
1. **State Persistence**: Save service state to disk, restore on restart
2. **Rate Limiting**: Prevent flood of WebSocket messages
3. **Message Compression**: Use binary protocol or compression for WebSocket
4. **Clustering**: Run multiple backend instances with shared state (Redis)
5. **Metrics**: Expose Prometheus metrics from backend
6. **Logging**: Structured logging with log levels (winston, pino)
7. **Tracing**: Distributed tracing for debugging

---

## 12. Success Criteria

### Functional Requirements
- ✅ Backend connects to MQTT broker successfully
- ✅ Backend subscribes to `all/system/health/#` topic
- ✅ Backend parses and validates MQTT messages
- ✅ Backend stores service state in memory
- ✅ Backend detects service timeouts (>60s no heartbeat)
- ✅ Backend broadcasts updates via WebSocket
- ✅ Frontend connects to WebSocket
- ✅ Frontend displays all 7 services as cards
- ✅ Frontend shows green indicator for healthy services
- ✅ Frontend shows red indicator for unhealthy services
- ✅ Frontend updates in real-time when service status changes
- ✅ Frontend shows last seen time (relative format)
- ✅ Frontend reconnects automatically on disconnect

### Non-Functional Requirements
- ✅ TypeScript strict mode enabled, no `any` types
- ✅ All code follows style guide in AGENTS.md
- ✅ Unit test coverage >80% for both packages
- ✅ No linting errors or warnings
- ✅ UI is responsive (mobile, tablet, desktop)
- ✅ WebSocket reconnects within 30s of disconnect
- ✅ Service timeout detected within 5s of threshold (60s + 5s check interval)

### Documentation Requirements
- ✅ README.md with setup instructions
- ✅ API documentation (endpoints, WebSocket messages)
- ✅ Environment variables documented
- ✅ Architecture diagram or description
- ✅ JSDoc comments on key functions

---

## 13. Command Quick Reference

### Development
```bash
# Root - Run both frontend and backend
npm run dev

# Individual packages
npm run dev:frontend
npm run dev:backend

# Build all
npm run build

# Lint all
npm run lint
npm run lint:fix

# Test all
npm run test
npm run test:run

# Type check
npm run typecheck
```

### Testing
```bash
# Backend tests
cd backend
npm run test:run
npm run test:coverage
npm run test:run -- src/__tests__/ServiceHealthManager.test.ts

# Frontend tests
cd frontend
npm run test:run
npm run test:coverage
npm run test:run -- src/components/__tests__/ServiceCard.test.tsx
npm run test:run -- -t "should format service name"
```

### MQTT Testing (Manual)
```bash
# Start MQTT broker (Docker)
docker run -it -p 1883:1883 eclipse-mosquitto

# Publish test message
mosquitto_pub -t "all/system/health/assistant" \
  -m '{"service":"assistant","machine_id":"test-machine","status":"healthy","timestamp":1703520000.123}'

# Subscribe to see all messages (debugging)
mosquitto_sub -t "all/system/health/#"
```

### WebSocket Testing (Manual)
```bash
# Install wscat globally
npm install -g wscat

# Connect to backend WebSocket
wscat -c ws://localhost:3002

# You should see initial state message, then updates
```

---

## 14. Dependencies Summary

### Backend Dependencies (Already Installed)
```json
{
  "express": "^4.21.2",      // HTTP server
  "ws": "^8.18.0",           // WebSocket server
  "mqtt": "^5.10.3",         // MQTT client
  "dotenv": "^16.4.7"        // Environment variables
}
```

### Frontend Dependencies (Already Installed)
```json
{
  "react": "^18.3.1",        // UI library
  "react-dom": "^18.3.1",    // React DOM rendering
  "tailwindcss": "^4.0.0"    // Utility-first CSS
}
```

### Additional Dependencies Needed
None! All required dependencies are already installed.

---

## 15. Time Estimates

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Backend Foundation | Config, types, services, MQTT, WebSocket, HTTP | 2-3 hours |
| Phase 2: Frontend Foundation | Config, types, hooks, utils | 2-3 hours |
| Phase 3: UI Components | StatusBadge, ServiceCard, Dashboard, App | 2-3 hours |
| Phase 4: Integration & Testing | E2E testing, unit tests, error handling | 2-3 hours |
| Phase 5: Documentation & Polish | README, comments, final testing | 1-2 hours |
| **Total** | | **9-14 hours** |

**Note:** Times assume familiarity with the tech stack. Add buffer for debugging and unexpected issues.

---

## 16. Getting Started Checklist

Before starting development:

- [ ] Ensure Node.js 18+ installed (`node --version`)
- [ ] Ensure npm 9+ installed (`npm --version`)
- [ ] Clone repository
- [ ] Run `npm install` in root (installs all workspace dependencies)
- [ ] Install MQTT broker (or have access to one):
  - Local: `docker run -it -p 1883:1883 eclipse-mosquitto`
  - Or use cloud broker (HiveMQ, CloudMQTT, etc.)
- [ ] Copy `.env.example` to `.env` in backend and frontend
- [ ] Update MQTT broker URL in backend `.env`
- [ ] Verify builds: `npm run build` (should succeed)
- [ ] Verify lints: `npm run lint` (should pass)
- [ ] Read AGENTS.md thoroughly
- [ ] Review this plan and ask questions if anything unclear

---

## 17. Next Steps

1. **Review this plan** with team/stakeholders
2. **Set up development environment** (checklist above)
3. **Start Phase 1** - Backend foundation
4. **Iterate through phases** sequentially
5. **Test frequently** - don't wait until end
6. **Commit often** - small, logical commits
7. **Update this plan** if requirements change

---

## Appendix A: File Templates

### Backend tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Frontend tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Frontend vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

---

**End of Development Plan**

This plan provides a comprehensive roadmap for building the AI Assistant v4 Admin Dashboard. Follow the phases sequentially, test frequently, and refer back to this document as needed. Good luck! 🚀
