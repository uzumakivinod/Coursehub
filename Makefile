# ──────────────────────────────────────────────────────────
#  FreeCourseHub — Makefile
#  Usage: make <target>
# ──────────────────────────────────────────────────────────

.PHONY: help setup dev prod down logs clean test health redis-cli worker-run scale

## Show this help
help:
	@echo ""
	@echo "FreeCourseHub — Available Commands"
	@echo "════════════════════════════════════"
	@grep -E '^## ' Makefile | sed 's/## /  /'
	@echo ""

## Copy .env files and generate secrets
setup:
	@echo "Setting up environment files..."
	@[ -f .env ]           || cp .env.example .env
	@[ -f backend/.env ]   || cp backend/.env.example backend/.env
	@[ -f worker/.env ]    || cp worker/.env.example  worker/.env
	@[ -f frontend/.env ]  || cp frontend/.env.example frontend/.env
	@KEY=$$(openssl rand -hex 32 2>/dev/null || echo "dev_key_$$$$") && \
	  sed -i.bak "s/change_this_secret_key_in_production/$$KEY/" backend/.env worker/.env && \
	  rm -f backend/.env.bak worker/.env.bak
	@echo "✓ Environment ready"

## Start dev stack (Redis + backend hot-reload)
dev: setup
	docker compose -f docker-compose.dev.yml up --build

## Start production stack (full)
prod: setup
	docker compose up --build -d
	@echo "✓ Production stack running at http://localhost"

## Stop all containers
down:
	docker compose down
	docker compose -f docker-compose.dev.yml down

## View logs (all services)
logs:
	docker compose logs -f --tail=100

## View backend logs only
logs-backend:
	docker compose logs -f backend1 backend2

## View Nginx logs
logs-nginx:
	docker compose logs -f nginx

## Run health check
health:
	@curl -sf http://localhost/api/health | python3 -m json.tool 2>/dev/null || \
	  curl -s http://localhost/api/health
	@echo ""

## Test API endpoints
test-api:
	@echo "Testing API endpoints..."
	@curl -sf http://localhost/api/health/live       && echo "✓ Health live"
	@curl -sf http://localhost/api/health/ready      && echo "✓ Health ready"
	@curl -sf "http://localhost/api/courses?limit=3" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'✓ Courses: {d[\"pagination\"][\"total\"]} total')"
	@curl -sf "http://localhost/api/search?q=python" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'✓ Search: {d[\"pagination\"][\"total\"]} results')"
	@curl -sf http://localhost/api/courses/trending  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'✓ Trending: {len(d[\"courses\"])} courses')"
	@echo "All API tests passed! ✓"

## Open Redis CLI
redis-cli:
	docker exec -it fch_redis redis-cli

## Show Redis cache stats
redis-stats:
	@docker exec -it fch_redis redis-cli INFO stats | grep -E "keyspace_hits|keyspace_misses|connected_clients"
	@echo "Cache keys:"
	@docker exec -it fch_redis redis-cli DBSIZE

## Flush Redis cache
redis-flush:
	docker exec -it fch_redis redis-cli FLUSHALL
	@echo "✓ Redis cache cleared"

## Run worker pipeline manually
worker-run:
	docker exec -it fch_worker node src/index.js

## Scale backend to N replicas (usage: make scale N=3)
scale:
	@N=$${N:-2}; \
	  docker compose up -d --scale backend1=1 --scale backend2=$$N
	@echo "✓ Scaled backend replicas"

## Clean up everything (containers, images, volumes)
clean: down
	docker system prune -af
	docker volume prune -f
	@echo "✓ Docker cleanup complete"

## Build all images without starting
build:
	docker compose build --parallel

## Restart a specific service (usage: make restart SVC=backend1)
restart:
	docker compose restart $${SVC:-backend1}

## Show running containers and resource usage
status:
	@docker compose ps
	@echo ""
	@docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null | head -10

## Install dependencies locally (no Docker)
install:
	cd backend  && npm install
	cd frontend && npm install
	cd worker   && npm install
	@echo "✓ All dependencies installed"

## Run frontend dev server locally (no Docker)
frontend-dev:
	cd frontend && npm run dev

## Run backend dev server locally (no Docker)  
backend-dev:
	cd backend && npm run dev

## Deploy to GCP (set GCP_PROJECT env var first)
deploy-gcp:
	chmod +x deploy-gcp.sh
	./deploy-gcp.sh
