# 🎓 FreeCourseHub

> **Discover thousands of free courses from Google, IBM, Harvard, MIT, Coursera, edX, YouTube and more — all in one place.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](docker-compose.yml)
[![Cost](https://img.shields.io/badge/Cost-$0%2Fmonth-brightgreen)](docs/gcp-deployment.md)

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Folder Structure](#folder-structure)
4. [Tech Stack](#tech-stack)
5. [Quick Start (Local)](#quick-start-local)
6. [Run with Docker](#run-with-docker)
7. [Deploy on GCP (Free Tier)](#deploy-on-gcp-free-tier)
8. [API Reference](#api-reference)
9. [Scaling Instructions](#scaling-instructions)
10. [Cost = $0 Explanation](#cost--0-explanation)
11. [Troubleshooting](#troubleshooting)

---

## Project Overview

FreeCourseHub is a **production-ready, fully containerized** course aggregation platform. It:

- Aggregates free courses from 10+ providers (Google, IBM, Harvard, MIT, Coursera, edX, YouTube, freeCodeCamp, Khan Academy, and more)
- Provides fast **fuzzy search** with Redis caching (results < 50ms on cache hit)
- Runs a **background worker** that refreshes course data daily
- Scales horizontally with **2+ backend replicas** behind an Nginx load balancer
- Costs **$0/month** on GCP free tier

---

## Architecture

```
                          Internet
                              │
                         ┌────▼────┐
                         │  Nginx  │  ← Reverse proxy + load balancer
                         │  :80    │    Round-robin to backend pool
                         └────┬────┘
               ┌──────────────┼──────────────┐
               │              │              │
         ┌─────▼──────┐  ┌────▼──────┐  ┌───▼──────┐
         │  Frontend  │  │ Backend 1 │  │Backend 2 │
         │  React/SPA │  │ Node.js   │  │Node.js   │
         │  :80       │  │ :5000     │  │:5000     │
         └────────────┘  └─────┬─────┘  └────┬─────┘
                               │              │
                          ┌────▼──────────────▼────┐
                          │         Redis          │
                          │   Cache (TTL: 1hr)     │
                          │   :6379                │
                          └────────────────────────┘
                                     ▲
                               ┌─────┴──────┐
                               │   Worker   │
                               │ Cron job   │
                               │ (Daily 3AM)│
                               └────────────┘

Data Flow:
  User → Nginx → Backend → Redis (cache hit → return immediately)
                         → In-memory DB (cache miss → search → cache → return)
  Worker → Scrapers → Dedup → Backend API → In-memory DB + Redis invalidation
```

### Request Flow

```
Browser                Nginx              Backend            Redis
  │                      │                   │                 │
  │── GET /api/search ──►│                   │                 │
  │                      │── proxy_pass ────►│                 │
  │                      │                   │── GET cache ───►│
  │                      │                   │◄── HIT ─────────│  (< 5ms)
  │◄─────────────────────│◄── 200 JSON ──────│                 │
  │                      │                   │                 │
  │                      │                   │── MISS ─────────│
  │                      │                   │── Fuse search   │
  │                      │                   │── SET cache ───►│
  │◄─────────────────────│◄── 200 JSON ──────│                 │
```

---

## Folder Structure

```
FreeCourseHub/
├── frontend/                    # React + Vite SPA
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Layout.jsx       # Navbar + Footer
│   │   │   ├── CourseCard.jsx   # Course card with ratings
│   │   │   ├── SearchBar.jsx    # Fuzzy search + suggestions
│   │   │   ├── FilterPanel.jsx  # Platform/level/duration filters
│   │   │   ├── Pagination.jsx   # Page navigation
│   │   │   ├── StatsBar.jsx     # Platform statistics
│   │   │   └── Skeletons.jsx    # Loading skeletons
│   │   ├── pages/
│   │   │   ├── HomePage.jsx     # Hero + trending courses
│   │   │   ├── ResultsPage.jsx  # Search results + filters
│   │   │   ├── CourseDetailPage.jsx  # Full course info
│   │   │   └── NotFoundPage.jsx
│   │   ├── utils/api.js         # Axios API client
│   │   ├── App.jsx              # Router
│   │   ├── main.jsx             # React entry point
│   │   └── index.css            # Tailwind + custom CSS
│   ├── nginx.frontend.conf      # SPA nginx config
│   ├── Dockerfile               # Multi-stage build
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                     # Node.js + Express API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── courses.js       # GET /api/courses/*
│   │   │   ├── search.js        # GET /api/search
│   │   │   └── health.js        # GET /api/health
│   │   ├── services/
│   │   │   ├── courseService.js # Business logic + Fuse.js search
│   │   │   └── cache.js         # Redis cache service
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   ├── utils/logger.js      # Winston logger
│   │   ├── data/courses.json    # Seed dataset (20 courses)
│   │   ├── app.js               # Express app config
│   │   └── server.js            # Entry point
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── worker/                      # Data pipeline / cron job
│   ├── src/
│   │   ├── scrapers/
│   │   │   ├── youtube.js       # YouTube/freeCodeCamp scraper
│   │   │   └── opencourse.js    # MIT OCW + Class Central
│   │   ├── utils/
│   │   │   ├── dedup.js         # Deduplication logic
│   │   │   ├── api.js           # Push to backend
│   │   │   └── logger.js
│   │   ├── pipeline.js          # Orchestrates all scrapers
│   │   └── index.js             # Cron scheduler
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── nginx/
│   ├── nginx.conf               # Reverse proxy + load balancer
│   └── Dockerfile
│
├── docker-compose.yml           # Production stack
├── docker-compose.dev.yml       # Dev stack (hot-reload)
├── .env.example                 # Root env template
├── .gitignore
└── README.md
```

---

## Tech Stack

| Layer       | Technology              | Why                                  |
|-------------|-------------------------|--------------------------------------|
| Frontend    | React 18 + Vite         | Fast HMR, modern bundling            |
| Styling     | TailwindCSS             | Utility-first, consistent design     |
| Data fetch  | React Query + Axios     | Caching, background refetch, retry   |
| Backend     | Node.js + Express       | Non-blocking I/O, fast JSON APIs     |
| Search      | Fuse.js                 | Client-side fuzzy search, zero deps  |
| Cache       | Redis 7                 | Sub-millisecond read, TTL support    |
| Worker      | node-cron + axios       | Lightweight cron, no DB required     |
| Proxy       | Nginx 1.25              | Load balancing, rate limiting, gzip  |
| Container   | Docker + Compose        | Reproducible, portable deployment    |

---

## Quick Start (Local)

### Prerequisites

- Node.js 20+ and npm
- Redis (optional — app works without it, just no caching)

### 1. Clone the repo

```bash
git clone https://github.com/yourname/FreeCourseHub.git
cd FreeCourseHub
```

### 2. Set up environment files

```bash
cp .env.example .env
cp backend/.env.example  backend/.env
cp worker/.env.example   worker/.env
cp frontend/.env.example frontend/.env
```

### 3. Start the backend

```bash
cd backend
npm install
npm run dev
# → API running at http://localhost:5000
```

### 4. Start the frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
# → App running at http://localhost:3000
```

### 5. (Optional) Start the worker

```bash
cd worker
npm install
npm start
# → Worker runs pipeline once, then daily at 3AM
```

### 6. Open your browser

```
http://localhost:3000
```

---

## Run with Docker

### Production (full stack)

```bash
# 1. Copy env files
cp .env.example .env
cp backend/.env.example backend/.env
cp worker/.env.example  worker/.env

# 2. Build and start all services
docker compose up --build -d

# 3. Check everything is running
docker compose ps

# 4. View logs
docker compose logs -f

# 5. Open in browser
open http://localhost
```

### Development (hot-reload backend + frontend)

```bash
# Start Redis + backend with hot-reload
docker compose -f docker-compose.dev.yml up --build

# Frontend dev server runs outside Docker for HMR
cd frontend && npm run dev
```

### Useful Docker commands

```bash
# Scale backend to 3 replicas
docker compose up --scale backend1=1 --scale backend2=2 -d

# Restart only backend
docker compose restart backend1 backend2

# View Redis cache
docker exec -it fch_redis redis-cli KEYS "*"

# Flush Redis cache
docker exec -it fch_redis redis-cli FLUSHALL

# Check Nginx status
docker exec -it fch_nginx nginx -t

# Run worker pipeline manually
docker exec -it fch_worker node src/index.js
```

---

## Deploy on GCP (Free Tier)

> **Total cost: $0/month** using the GCP Always Free tier.

### What you get for free

| Service              | Free Tier Limit              |
|----------------------|------------------------------|
| Compute Engine e2-micro | 1 instance/month (us-east1, us-central1, us-west1) |
| 30 GB standard persistent disk | Always free |
| 1 GB egress/month    | Always free                  |
| Cloud Run            | 2M requests/month free       |

---

### Option A: Google Compute Engine (Recommended for beginners)

#### Step 1 — Create GCP Account

1. Go to [https://cloud.google.com](https://cloud.google.com)
2. Click **"Get started for free"**
3. Enter billing info (required, but **you won't be charged** within free tier)
4. You get $300 credit for 90 days + permanent free tier

#### Step 2 — Create a VM

```bash
# Install gcloud CLI: https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Set your project (create one at console.cloud.google.com)
gcloud config set project YOUR_PROJECT_ID

# Create e2-micro VM in free tier region
gcloud compute instances create freecourse-vm \
  --machine-type=e2-micro \
  --zone=us-central1-a \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --tags=http-server,https-server

# Create firewall rules to allow HTTP
gcloud compute firewall-rules create allow-http \
  --allow=tcp:80,tcp:443 \
  --target-tags=http-server \
  --description="Allow HTTP/HTTPS traffic"
```

#### Step 3 — Assign Static IP (free while attached to VM)

```bash
# Reserve a static IP
gcloud compute addresses create freecourse-ip \
  --region=us-central1

# Get the IP address
gcloud compute addresses describe freecourse-ip \
  --region=us-central1 \
  --format="get(address)"

# Assign to your VM
gcloud compute instances delete-access-config freecourse-vm \
  --access-config-name="External NAT" \
  --zone=us-central1-a

gcloud compute instances add-access-config freecourse-vm \
  --access-config-name="External NAT" \
  --address=YOUR_STATIC_IP \
  --zone=us-central1-a
```

#### Step 4 — SSH into VM and Install Docker

```bash
# SSH into the VM
gcloud compute ssh freecourse-vm --zone=us-central1-a

# Once inside the VM:

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (no sudo needed)
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt-get install -y docker-compose-plugin

# Verify
docker --version          # Docker 24.x.x
docker compose version    # Docker Compose 2.x.x
```

#### Step 5 — Deploy FreeCourseHub

```bash
# Still inside the VM:

# Clone your repo (or upload files)
git clone https://github.com/yourname/FreeCourseHub.git
cd FreeCourseHub

# Set up environment
cp .env.example .env
cp backend/.env.example backend/.env
cp worker/.env.example  worker/.env

# Edit backend .env with production values
nano backend/.env
# Set: NODE_ENV=production
# Set: WORKER_API_KEY=your_secret_key_here (use: openssl rand -hex 32)

# Build and start (first build ~3-5 minutes)
docker compose up --build -d

# Check status
docker compose ps

# View logs
docker compose logs -f --tail=50
```

#### Step 6 — Verify Deployment

```bash
# From inside VM
curl http://localhost/api/health
# Should return: {"status":"healthy",...}

curl "http://localhost/api/search?q=python"
# Should return: {"courses":[...],...}

# From your computer (use your static IP)
curl http://YOUR_STATIC_IP/api/health
```

Your app is now live at: `http://YOUR_STATIC_IP`

#### Step 7 — (Optional) Free Domain with Cloudflare

```bash
# Option 1: Use a free .is-a.dev subdomain
# → https://github.com/is-a-dev/register

# Option 2: Free .eu.org domain
# → https://nic.eu.org

# Option 3: Use Cloudflare Tunnel (free, no exposed IP)
# → https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/

# After getting a domain, point  it to YOUR_STATIC_IP
# Then add to backend/.env:
FRONTEND_URL=https://yourdomain.com
```

---

### Option B: Cloud Run (Serverless, scales to zero)

Cloud Run is better if you have low/intermittent traffic — it scales to zero and costs nothing when idle.

```bash
# 1. Enable APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# 2. Build and push backend image
cd backend
docker build -t gcr.io/YOUR_PROJECT_ID/fch-backend:latest .
docker push gcr.io/YOUR_PROJECT_ID/fch-backend:latest

# 3. Deploy backend to Cloud Run
gcloud run deploy fch-backend \
  --image gcr.io/YOUR_PROJECT_ID/fch-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 3 \
  --set-env-vars "NODE_ENV=production,REDIS_HOST=YOUR_REDIS_HOST"

# 4. Build and push frontend
cd ../frontend
docker build -t gcr.io/YOUR_PROJECT_ID/fch-frontend:latest .
docker push gcr.io/YOUR_PROJECT_ID/fch-frontend:latest

gcloud run deploy fch-frontend \
  --image gcr.io/YOUR_PROJECT_ID/fch-frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 256Mi

# 5. For Redis, use Redis Cloud free tier (30MB free):
# → https://redis.com/try-free/
```

---

## API Reference

### Base URL
- Local: `http://localhost:5000/api`
- Production: `http://YOUR_IP/api`

### Endpoints

#### `GET /api/health`
Returns system health status including Redis connection and course stats.

```json
{
  "status": "healthy",
  "redis": { "connected": true },
  "courses": { "totalCourses": 20, "platforms": 8 }
}
```

#### `GET /api/search`
Search courses with optional filters.

| Parameter  | Type   | Default     | Description                          |
|------------|--------|-------------|--------------------------------------|
| `q`        | string | `""`        | Search query                         |
| `platform` | string | `"all"`     | Filter by platform                   |
| `level`    | string | `"all"`     | Beginner / Intermediate / Advanced   |
| `category` | string | `"all"`     | Course category                      |
| `duration` | string | `"all"`     | short / medium / long                |
| `sort`     | string | `"relevance"` | relevance / rating / popular / newest |
| `page`     | int    | `1`         | Page number                          |
| `limit`    | int    | `12`        | Results per page (max 50)            |

```bash
curl "http://localhost:5000/api/search?q=python&level=Beginner&sort=rating"
```

#### `GET /api/courses`
List all courses with pagination and filters (same filter params as `/search`).

#### `GET /api/courses/trending`
Returns top courses by popularity score.

```bash
curl "http://localhost:5000/api/courses/trending?limit=8"
```

#### `GET /api/courses/filters`
Returns all available filter options (platforms, levels, categories, tags).

#### `GET /api/courses/stats`
Returns aggregate statistics.

#### `GET /api/courses/:id`
Get a single course by ID.

```bash
curl "http://localhost:5000/api/courses/c001"
```

#### `GET /api/search/suggestions?q=pyth`
Returns up to 5 course title suggestions for autocomplete.

---

## Scaling Instructions

### Horizontal scaling (more backend instances)

```bash
# Add a third backend replica
# In docker-compose.yml, duplicate backend2 as backend3
# And add to nginx.conf upstream:
#   server backend3:5000 max_fails=3 fail_timeout=30s;

# Then:
docker compose up -d --no-deps --build backend3
docker compose reload nginx
```

### Vertical scaling (more CPU/RAM per container)

```bash
# Edit docker-compose.yml deploy.resources.limits
# Then restart:
docker compose up -d
```

### Adding a persistent database (MongoDB Atlas free tier)

```bash
# 1. Create free M0 cluster at https://cloud.mongodb.com
# 2. Get connection string
# 3. Add to backend/.env:
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/freecoursedb

# 4. Install Mongoose in backend
cd backend && npm install mongoose

# The courseService.js is already structured to support
# swapping the in-memory store for MongoDB
```

### Future Kubernetes migration

The app is designed for Kubernetes migration:
- All services are **stateless** (state lives in Redis)
- All config via **environment variables**
- Docker images follow **12-factor app** principles
- Health check endpoints: `/api/health/live` and `/api/health/ready`

```bash
# Quick k8s deployment (once you have a cluster):
kubectl create deployment fch-backend --image=gcr.io/YOUR_PROJECT/fch-backend:latest
kubectl expose deployment fch-backend --port=5000
kubectl scale deployment fch-backend --replicas=3
```

---

## Cost = $0 Explanation

| Component   | Service Used                     | Free Tier Limit        | Our Usage |
|-------------|----------------------------------|------------------------|-----------|
| VM          | GCP e2-micro (us-central1)       | 720 hrs/month forever  | ~720 hrs  |
| Disk        | 30 GB standard persistent disk   | 30 GB/month forever    | ~5 GB     |
| Network     | 1 GB egress/month                | 1 GB/month forever     | < 1 GB    |
| Redis       | Redis Cloud M0                   | 30 MB free forever     | ~5 MB     |
| Domain      | is-a-dev / eu.org                | Free                   | Free      |
| SSL         | Cloudflare / Let's Encrypt       | Free                   | Free      |
| **Total**   |                                  |                        | **$0.00** |

> ⚠️ The e2-micro free tier applies only in **us-east1, us-central1, us-west1**.
> Do not change the region or you will be charged.

---

## Troubleshooting

### Docker containers not starting

```bash
# Check logs for each service
docker compose logs backend1
docker compose logs nginx
docker compose logs redis

# Rebuild from scratch (clears cache)
docker compose down -v
docker compose up --build --force-recreate
```

### Nginx 502 Bad Gateway

The backend containers haven't passed their health checks yet.

```bash
# Check backend health
docker exec -it fch_backend1 wget -qO- http://localhost:5000/api/health/live

# Wait for healthy status
docker compose ps
# backend1 and backend2 should show "healthy"
```

### Redis connection errors

Redis errors are non-fatal — the app falls back to direct DB queries.

```bash
# Check Redis is running
docker exec -it fch_redis redis-cli ping
# Should return: PONG

# Test from backend
docker exec -it fch_backend1 sh -c "wget -qO- http://localhost:5000/api/health | grep redis"
```

### No courses showing

```bash
# Check the data file exists
docker exec -it fch_backend1 ls -la src/data/

# Manually trigger the worker
docker exec -it fch_worker node src/index.js

# Check API directly
curl http://localhost:5000/api/courses
```

### Port 80 already in use

```bash
# Find what's using port 80
sudo lsof -i :80

# Or change the port in docker-compose.yml
ports:
  - "8080:80"    # Use port 8080 instead
```

### Out of disk space on VM

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -af
docker volume prune -f

# Check what's using space
du -sh /var/lib/docker/*
```

### Build fails for frontend

```bash
# Clear npm cache
cd frontend && rm -rf node_modules package-lock.json
npm install

# Rebuild Docker image without cache
docker compose build --no-cache frontend
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/add-udemy-scraper`
3. Commit your changes: `git commit -m 'feat: add Udemy free courses scraper'`
4. Push to branch: `git push origin feature/add-udemy-scraper`
5. Open a Pull Request

---

## License

MIT © FreeCourseHub Contributors

---

*Built with ❤️ for learners everywhere. Education should be free.*
