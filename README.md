# FleetDash 🚛⚡

**FleetDash** is a production-ready, full-stack real-time vehicle fleet telemetry ingestion, analysis, and visualization platform. Built with Express, TypeScript, React, Vite, Socket.io, and MongoDB, FleetDash processes live GPS and sensor telemetry using worker threads and high-performance database patterns.

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

- **Backend**: Node.js, Express, TypeScript, Socket.io, Mongoose, Worker Threads, Winston Logging, Jest, Supertest.
- **Database**: MongoDB (Supports local MongoDB or Zero-Setup In-Memory MongoDB Server).
- **Frontend**: React 18, TypeScript, Vite, Lucide Icons, HTML5 Canvas API.
- **Simulation**: Node.js HTTP Telemetry Generator.

---

## 🚀 Quick Start

### 1. Installation
Install dependencies across workspace:

```bash
# Backend dependencies
cd backend && npm install

# Frontend dependencies
cd ../frontend && npm install
```

### 2. Launch Backend Server
Starts Express API and Socket.io server on port `5000`:

```bash
cd backend
npm run dev
```

### 3. Launch Telemetry Simulator
In a separate terminal, start simulated fleet data generation:

```bash
cd backend
npm run simulate
```

### 4. Launch Frontend Dashboard
In another terminal, start Vite development server on `http://localhost:5173`:

```bash
cd frontend
npm run dev
```

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
- `GET /vehicles/:vehicleId/telemetry` - Retrieve flattened chronological telemetry history for a vehicle (Query param: `hours`, default `24`).

---

## 📄 License

ISC License.
