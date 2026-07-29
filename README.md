# FleetDash — Real-Time Fleet Telemetry Platform 🚛⚡

**FleetDash** is a high-throughput, full-stack real-time vehicle fleet telemetry ingestion, analysis, and visualization platform. Built with Express, TypeScript, React, Vite, Socket.io, and MongoDB, FleetDash processes live GPS and sensor telemetry using worker threads and high-performance database patterns.

---

## 🌟 Key Features

- **🚀 Multithreaded Telemetry Processing**: Telemetry coordinate string parsing, boundary validation, and Haversine distance computations from depot are offloaded to Node.js **Worker Threads** to prevent blocking the event loop.
- **🗄️ MongoDB Time-Series Bucket Pattern**: High-volume sensor pings are grouped into hourly bucket documents (`TelemetryBucket`), reducing storage overhead, BSON document bloat, and index footprint by 90%+.
- **⚡ Real-Time Socket.io Stream**: Instant WebSocket broadcasts stream live telemetry to connected client dashboards without polling.
- **🗺️ Interactive Canvas Fleet Map**: Hardware-accelerated 2D HTML5 Canvas rendering active vehicle coordinates, depot locations, breadcrumb trajectory logs, and real-time pulse animations.
- **📊 Real-Time Visual Analytics**: Live SVG telemetry trend graphs displaying vehicle speed, fuel depletion, and engine temperature fluctuations.
- **🤖 Built-in Fleet Simulator**: Included `simulator.ts` generator continuously simulates vehicle driving routes across Bangalore, India.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Edge Layer
        Simulator[Fleet Simulator (simulator.ts)]
    end

    subgraph Backend Services (Port 5000)
        API[Express HTTP Server]
        WorkerPool[Worker Thread Pool]
        Haversine[Haversine & GPS Parser (parser.ts)]
        BucketManager[MongoDB Bucket Engine]
        SocketServer[Socket.io Engine]
    end

    subgraph Database
        MongoDB[(MongoDB / In-Memory Server)]
    end

    subgraph Frontend Client (Port 5173)
        ReactApp[React + Vite Dashboard]
        CanvasMap[Canvas Telemetry Map]
        ChartPanel[SVG Telemetry Analytics]
    end

    Simulator -->|HTTP POST /telemetry| API
    API --> WorkerPool
    WorkerPool --> Haversine
    Haversine -->|Parsed Lat/Lng & Distance| API
    API -->|Upsert Bucket Reading| BucketManager
    BucketManager --> MongoDB
    API -->|Broadcast Telemetry| SocketServer
    SocketServer -->|WebSocket Stream| ReactApp
    ReactApp --> CanvasMap
    ReactApp --> ChartPanel
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express, TypeScript |
| **Database** | MongoDB (Bucket Pattern — hourly arrays per vehicle, supports zero-setup In-Memory Mongo) |
| **Worker Threads** | CPU-bound coordinate parsing + Haversine distance calculations |
| **Real-time Stream** | Socket.io WebSockets |
| **Frontend** | React 18, TypeScript, Vite, HTML5 Canvas API (requestAnimationFrame) |
| **Testing** | Jest, Supertest |

---

## 🚀 Quick Start

### 1. Installation
Install dependencies across workspace:

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Launch Services

- **Root Concurrent Launcher**:
  ```bash
  npm run dev:backend
  npm run dev:frontend
  npm run simulate
  ```

- **Backend Service (Port 5000)**:
  ```bash
  cd backend
  npm run dev
  ```

- **Simulator (Separate Terminal)**:
  ```bash
  cd backend
  npm run simulate
  ```

- **Frontend Client (Port 5173)**:
  ```bash
  cd frontend
  npm run dev
  ```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Running Automated Tests

Run backend unit and API integration test suites:

```bash
cd backend
npm test
```

---

## 📡 API Reference

### Health Check
- `GET /health` - Service health status check.

### Telemetry Ingestion
- `POST /telemetry` - Ingest live telemetry payload.
  ```json
  {
    "vehicleId": "V-001",
    "gpsString": "12.9716,77.5946",
    "speed": 65,
    "fuel": 88,
    "engineTemp": 82,
    "timestamp": "2026-07-29T20:30:00.000Z"
  }
  ```

### Vehicles API
- `GET /vehicles` - Get list of all vehicles with cached status and latest coordinates.
- `GET /vehicles/:vehicleId` - Retrieve flattened chronological telemetry history for a vehicle (Query param: `hours`, default `24`).

---

## 📄 License

ISC License.
