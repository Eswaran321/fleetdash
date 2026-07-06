# FleetDash — Real-Time Fleet Telemetry Dashboard

A high-throughput fleet tracking system that ingests GPS/sensor data from vehicles, processes it through a decoupled pipeline (Express → worker_threads → MongoDB → Redis Pub/Sub → Socket.io), and renders live positions on a Canvas map at 60 FPS.

## Architecture

```
Simulator ──POST──> Express API ──> worker_threads ──> MongoDB ──> Redis Pub/Sub ──> Socket.io ──> React Canvas
  (5 vehicles      (ingestion       (parse GPS,      (hourly       (decouples      (binary         (60 FPS
   every 3s)        endpoint)        haversine)       bucket        writes from     ArrayBuffer      rendering)
                                                      pattern)      broadcast)      transport)
```

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB (Bucket Pattern — hourly arrays per vehicle) |
| Worker Threads | CPU-bound coordinate parsing + Haversine distance |
| Messaging | Redis Pub/Sub (decouples ingestion from broadcast) |
| Realtime | Socket.io with binary ArrayBuffer transport |
| Frontend | React, TypeScript, Vite, Canvas (requestAnimationFrame) |
| Testing/Load | Jest, Supertest, k6 |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (or use `USE_IN_MEMORY_DB=true` for zero-setup in-memory Mongo)
- Redis (optional — falls back to direct Socket.io broadcast)

### 1. Backend

```bash
cd backend
npm install

# Start with in-memory MongoDB (no external Mongo needed)
$env:USE_IN_MEMORY_DB='true'; npx ts-node src/server.ts
```

### 2. Simulator (separate terminal)

```bash
cd backend
npx ts-node ../simulator.ts
```

### 3. Frontend (separate terminal)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Using Redis (optional)

If Redis is running on `localhost:6379`, the backend automatically uses it for decoupled Pub/Sub broadcast.

```bash
# Install Redis via WSL
wsl sudo apt install redis-server -y
wsl sudo service redis-server start

# Or via Docker
docker run -d -p 6379:6379 --name redis redis
```

## Binary Protocol

Telemetry is transmitted over Socket.io as compact `ArrayBuffer` payloads instead of JSON.

### Per-Vehicle Channel (`telemetry:<id>`) — 32 bytes

| Offset | Bytes | Type | Field |
|---|---|---|---|
| 0 | 8 | Float64 | timestamp (epoch ms) |
| 8 | 8 | Float64 | lat |
| 16 | 8 | Float64 | lng |
| 24 | 2 | Uint16 | speed (×10) |
| 26 | 1 | Uint8 | fuel % |
| 27 | 1 | Uint8 | engine temp °C |
| 28 | 4 | Float32 | distance from depot (km) |

### Global Channel (`telemetry_global`) — 49 bytes

Same as above + 16-byte vehicle ID (null-padded) + 1-byte status.

## Project Structure

```
fleetdash/
├── backend/
│   └── src/
│       ├── config/          # DB & Redis connections
│       ├── controllers/     # Telemetry & vehicle route handlers
│       ├── middleware/       # Validation & error handling
│       ├── models/          # Mongoose schemas (Bucket Pattern)
│       ├── routes/          # Express route definitions
│       ├── services/        # Redis → Socket.io bridge
│       ├── utils/           # Logger, binary protocol encoder
│       └── workers/         # Worker thread pool (GPS parsing)
├── frontend/
│   └── src/
│       ├── components/      # React components
│       ├── services/        # API client, binary protocol decoder
│       └── types/           # TypeScript interfaces
└── simulator.ts             # Vehicle telemetry simulator
```

## Team

| Member | Role | Owns |
|---|---|---|
| M1 | Backend Core Engineer | Express API, worker_threads, MongoDB, k6 |
| **M2** | **Realtime Infra Engineer** | **Redis Pub/Sub, Socket.io, binary transport, CI/CD** |
| M3 | Geospatial & QA Engineer | Turf.js geofencing, Jest, load validation |
| M4 | Frontend Engineer | React, Canvas rendering, rAF batching |
