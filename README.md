# FleetDash — Real-Time Fleet Telemetry Platform 🚛⚡

**FleetDash** is a high-throughput, full-stack real-time vehicle fleet telemetry ingestion, analysis, and visualization platform. Built with Express, TypeScript, React, Vite, Socket.io, MongoDB, and Redis, FleetDash processes live GPS and sensor telemetry using worker threads, the MongoDB Bucket Pattern, and a compact binary WebSocket transport.

Built around one core principle: **every pipeline stage is decoupled by a broker, so a slow stage (database write, geofence math, DOM paint) never blocks the stage before it.**

---

## 🌟 Key Features

- **🚀 Multithreaded Telemetry Processing**: Coordinate string parsing, boundary validation, and Haversine distance computation are offloaded to Node.js **Worker Threads** so the event loop stays free for I/O.
- **🗄️ MongoDB Bucket Pattern**: High-volume sensor pings are grouped into hourly bucket documents (`TelemetryBucket`) with `_id:false` readings and a 72-hour TTL index — drastically reducing write amplification, BSON bloat, and index footprint.
- **⚡ Redis Pub/Sub Broadcasting**: Ingestion is decoupled from delivery via Redis channels (`telemetry:ingest`, `telemetry:global`, `geofence:breach`), with graceful fallback to direct Socket.io emit when Redis is unavailable.
- **🎛️ Binary WebSocket Transport**: Telemetry is encoded as 32-byte (per-vehicle) and 49-byte (global) `ArrayBuffer` frames instead of verbose JSON — a fraction of the wire size at scale.
- **🚧 Turf.js Geofencing**: Circle and polygon zones with entry/exit **transition** detection; alerts fire only on state changes, with severity mapping.
- **🗺️ Custom Canvas Fleet Map**: Hardware-accelerated HTML5 Canvas rendering driven by `requestAnimationFrame` — vehicle heading-arrows, depot marker, breadcrumb trajectories, geofence zones, and pulse animations at ~60 FPS (no mapping library).
- **📊 Real-Time Analytics**: SVG telemetry trend graphs (speed, fuel, engine temperature) plus an Analytics page with KPI cards, bar charts, a speed timeline, and a leaderboard.
- **🤖 Built-in Fleet Simulator**: A dependency-free Node generator simulates 10 vehicles driving around Bangalore, posting telemetry every 3 seconds to any target server.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Edge Layer
        Simulator[Fleet Simulator (simulator.ts)]
    end

    subgraph Backend["Backend Services (Port 5000)"]
        API[Express HTTP Server]
        Validator[express-validator]
        WorkerPool[Worker Thread]
        Parser[GPS Parser + Haversine (parser.ts)]
        BucketManager[MongoDB Bucket Engine]
        Geofence[GeofenceService (Turf.js)]
        RedisBroker[Redis Pub/Sub]
        SocketServer[Socket.io + Binary Encoder]
    end

    subgraph Database
        MongoDB[(MongoDB / In-Memory Server)]
    end

    subgraph Frontend["Frontend Client (Port 5173)"]
        ReactApp[React + Vite Dashboard]
        SocketClient[Socket.io Client + Binary Decoder]
        CanvasMap[Canvas Telemetry Map]
        ChartPanel[SVG Analytics]
    end

    Simulator -->|POST /telemetry| API
    API --> Validator
    Validator --> WorkerPool
    WorkerPool --> Parser
    Parser -->|parsed lat/lng + distance| API
    API -->|upsert bucket + vehicle| BucketManager
    BucketManager --> MongoDB
    API --> Geofence
    API -->|publish| RedisBroker
    RedisBroker -->|subscribe + encode to binary| SocketServer
    API -.->|direct emit fallback| SocketServer
    SocketServer -->|WebSocket binary stream| SocketClient
    SocketClient --> CanvasMap
    SocketClient --> ChartPanel
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express 4, TypeScript 5 |
| **Database** | MongoDB (Mongoose 8) — Bucket Pattern, TTL auto-purge, zero-setup In-Memory Mongo |
| **CPU Offload** | Node `worker_threads` (coordinate parsing + Haversine) |
| **Messaging** | Redis Pub/Sub (ioredis 5) with graceful degradation |
| **Realtime** | Socket.io 4 with binary `ArrayBuffer` transport |
| **Geospatial** | @turf/turf 7 (distance, point-in-polygon) |
| **Frontend** | React 18, Vite 5, react-router-dom 7, axios, socket.io-client, lucide-react |
| **Rendering** | HTML5 Canvas + `requestAnimationFrame`; SVG telemetry charts |
| **Validation / Logging** | express-validator / Winston |
| **Testing** | Jest, ts-jest, Supertest, mongodb-memory-server |
| **Load Testing** | k6 |
| **Deployment** | Render (web service + static site), MongoDB Atlas |

---

## 📁 Project Structure

```
fleetdash/
├── backend/
│   ├── src/
│   │   ├── config/         # MongoDB + Redis connection setup
│   │   ├── controllers/    # telemetry, vehicle, geofence, analytics handlers
│   │   ├── middleware/     # express-validator rules + centralized error handler
│   │   ├── models/         # TelemetryBucket (bucket pattern) + Vehicle read-model
│   │   ├── routes/         # API route namespaces
│   │   ├── services/       # geofenceService, telemetryBroadcast (Redis → Socket.io)
│   │   ├── utils/          # binaryProtocol encoder, Winston logger
│   │   ├── workers/        # workerPool + parser (Haversine + validation)
│   │   ├── app.ts          # Express app wiring
│   │   ├── server.ts       # HTTP + Socket.io bootstrap
│   │   └── seed.ts         # Database seeder (10 demo vehicles)
│   └── tests/              # Jest suites (api, binaryProtocol, geofenceService, workerPool)
├── frontend/
│   └── src/
│       ├── components/     # Navbar, Sidebar, MapPlaceholder, TelemetryChart, ...
│       ├── pages/          # Dashboard, Vehicles, Geofences, Analytics, Settings
│       ├── services/       # api client + binaryProtocol decoder
│       └── App.tsx         # routing + realtime wiring
├── simulator.ts            # standalone telemetry generator
└── render.yaml             # Render Blueprint
```

---

## 🚀 Quick Start

### 1. Installation

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Launch Services

- **Backend Service (Port 5000)** — with zero-setup in-memory MongoDB:
  ```bash
  cd backend
  # macOS / Linux
  USE_IN_MEMORY_DB=true npm run dev
  # Windows PowerShell
  $env:USE_IN_MEMORY_DB='true'; npm run dev
  ```

- **Simulator (Separate Terminal)**:
  ```bash
  cd backend
  npm run simulate
  ```
  To stream telemetry to a deployed/remote backend instead of localhost:
  ```bash
  # Windows PowerShell
  $env:SIMULATOR_URL="https://your-backend.onrender.com/telemetry"
  npm run simulate
  ```

- **Frontend Client (Port 5173)**:
  ```bash
  cd frontend
  npm run dev
  ```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Seed Demo Data (Optional)

Insert 10 fleet vehicles directly into MongoDB:

```bash
cd backend
$env:MONGO_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/fleetdash"
npm run seed
```

---

## ⚙️ Environment Variables

| Variable | Service | Default | Purpose |
|---|---|---|---|
| `MONGO_URI` | Backend | `mongodb://127.0.0.1:27017/fleetdash` | MongoDB connection string (**must include the database name**) |
| `USE_IN_MEMORY_DB` | Backend | `false` | Boot a zero-setup in-memory MongoDB |
| `REDIS_ENABLED` | Backend | `true` | Set `false` to skip Redis and use direct Socket.io broadcast |
| `REDIS_URL` | Backend | `redis://localhost:6379` | Redis connection string |
| `PORT` | Backend | `5000` | HTTP port (Render injects this automatically) |
| `NODE_ENV` | Backend | `development` | `production` loads the compiled worker |
| `SIMULATOR_URL` | Simulator | `http://localhost:5000/telemetry` | Telemetry ingestion endpoint |
| `VITE_API_BASE_URL` | Frontend | `/api` (dev proxy) | Backend base URL (no `/api` suffix in production) |
| `VITE_SOCKET_URL` | Frontend | `http://<host>:5000` | Socket.io server URL |
