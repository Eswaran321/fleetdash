# FleetDash — Workflow Design & 4-Member Team Division

## 1. System Workflow (End-to-End Data Flow)

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  Vehicle GPS │────▶│  Ingestion API    │────▶│  worker_threads    │
│  Devices     │     │  (Express)        │     │  (parse/validate)  │
└─────────────┘     └──────────────────┘     └─────────┬──────────┘
                                                          ▼
                                              ┌───────────────────┐
                                              │ MongoDB (Bucket    │
                                              │ Pattern - hourly   │
                                              │ arrays per vehicle)│
                                              └─────────┬──────────┘
                                                          ▼
                                              ┌───────────────────┐
                                              │ Turf.js Geofence   │
                                              │ Breach Check       │
                                              └─────────┬──────────┘
                                                          ▼
                                              ┌───────────────────┐
                                              │ Redis Pub/Sub      │
                                              │ (decouples writes  │
                                              │ from broadcast)    │
                                              └─────────┬──────────┘
                                                          ▼
                                              ┌───────────────────┐
                                              │ Socket.io Server   │
                                              │ (ArrayBuffer /     │
                                              │ binary transport)  │
                                              └─────────┬──────────┘
                                                          ▼
                                              ┌───────────────────┐
                                              │ React Client       │
                                              │ Socket.io listener │
                                              └─────────┬──────────┘
                                                          ▼
                                              ┌───────────────────┐
                                              │ Canvas Renderer     │
                                              │ (requestAnimation- │
                                              │ Frame batching)    │
                                              └───────────────────┘
```

**Key principle driving the workflow:** every stage is decoupled by a queue/broker so that a slow stage (DB write, geofence math, DOM paint) never blocks the stage before it. This is what lets the system absorb thousands of concurrent coordinate updates without dropping data or freezing the UI.

---

## 2. Team Structure — 4 Members

Each member owns a vertical slice end-to-end (not just "frontend guy" / "backend guy") so there's a clear single owner per pipeline stage, with two shared checkpoints (Mid-Project & Final Review) where everyone integrates.

| Member | Role | Owns |
|---|---|---|
| **M1 – Backend Core Engineer** | Ingestion & Data Layer | Express API, worker_threads, MongoDB Bucket Pattern, k6 load testing |
| **M2 – Realtime Infra Engineer** | Messaging & Transport | Redis Pub/Sub, Socket.io server, ArrayBuffer binary payloads, CI/CD |
| **M3 – Geospatial & QA Engineer** | Business Logic & Testing | Turf.js geofence logic, alert triggers, Jest/Supertest coverage |
| **M4 – Frontend Engineer** | UI & Rendering | React TS scaffold, Socket.io client, Canvas + rAF rendering, UI polish |

---

## 3. Week-by-Week Task Division

### Week 1 — Foundations

| Member | Tasks |
|---|---|
| **M1** | Scaffold Express server; design MongoDB Bucket Pattern schemas (hourly-array-per-vehicle); write seed scripts |
| **M2** | Set up project repo/CI skeleton; provision Redis instance/cluster locally; draft Socket.io server boilerplate |
| **M3** | Write k6 load-testing scripts against M1's ingestion endpoint stub; define alert-schema/data contract for breach events |
| **M4** | Scaffold React + TypeScript app; build static dashboard layout and map container component |

**Checkpoint:** M1 + M3 sync on ingestion endpoint contract; M4 shares component structure with M2 for socket event naming.

---

### Week 2 — Connectivity

| Member | Tasks |
|---|---|
| **M1** | Implement worker_threads pool to offload coordinate parsing from the main event loop; wire parsed data into Mongo bucket writer |
| **M2** | Deploy Redis Pub/Sub layer; build Socket.io server with ArrayBuffer-based binary emission; connect Redis subscriber → Socket.io broadcast |
| **M3** | Extend k6 scripts to simulate 2,000 req/sec; start unit-testing M1's parsing/bucket logic with Jest |
| **M4** | Connect Socket.io client; build hooks to receive high-frequency binary arrays and decode them into vehicle position objects |

**Mid-Project Review (shared deliverable):**
- M1 + M3: prove Mongo index queries < 5ms and 2,000 req/sec ingestion with zero data loss (M1 builds it, M3 validates it under load).
- M2 + M4: confirm end-to-end socket path (Redis → Socket.io → client hook) delivers binary payloads correctly, and that the frontend architecture is ready for Canvas integration.

---

### Week 3 — Core Differentiators

| Member | Tasks |
|---|---|
| **M1** | Optimize Mongo bucket writes under sustained load; support M3 with data access needed for geofence checks |
| **M2** | Harden Redis/Socket.io layer for sustained throughput; start CI/CD pipeline (build/test/deploy stages) |
| **M3** | Implement Turf.js boundary-intersection checks; build geofence breach alert triggers and pipe them into the Redis broadcast channel |
| **M4** | Build the Canvas rendering layer driven by requestAnimationFrame; batch spatial point updates; decouple rendering from React state |

**Checkpoint:** M3's breach alerts must reach M4's UI as a distinguishable event (e.g., a separate socket channel/message type) — this is the integration point to test together.

---

### Week 4 — Hardening & Delivery

| Member | Tasks |
|---|---|
| **M1** | Final performance tuning; document ingestion architecture |
| **M2** | Finalize CI/CD pipeline; deployment configs (env vars, Redis/Mongo connection pooling in prod) |
| **M3** | Complete Jest/Supertest coverage across ingestion, bucket writes, and geofence logic; run final k6 load validation |
| **M4** | UI/UX polish; verify viewport sustains ~60 FPS with thousands of live objects; fix any rendering jank |

**Final Project Review (whole team):**
- Backend trio (M1/M2/M3) demonstrate the pipeline parsing and routing massive concurrent spatial streams without data loss.
- M4 demonstrates a steady 60 FPS viewport rendering thousands of live objects, with geofence alerts flashing correctly in real time.

---

## 4. Cross-Cutting Notes

- **Daily sync point:** Since M1→M2→M3→M4 form a pipeline, a short daily standup focused on "what does the next person need from me" avoids integration surprises late in the week.
- **Contracts before code:** Define the socket message schema (binary layout) and the breach-alert message shape in Week 1, before M2 and M4 build against it — this is the #1 source of late-stage rework in event-driven systems.
- **Shared ownership at reviews:** Both reviews are intentionally cross-team so no one person can pass/fail a milestone alone — it forces integration testing rather than four isolated demos.
