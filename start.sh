#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────
#  FreeCourseHub — Quick Start Script
#  Usage: chmod +x start.sh && ./start.sh
# ──────────────────────────────────────────────────────────
set -euo pipefail

BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

info()    { echo -e "${CYAN}[INFO]${RESET}  $1"; }
success() { echo -e "${GREEN}[OK]${RESET}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $1"; }
error()   { echo -e "${RED}[ERROR]${RESET} $1"; exit 1; }

echo -e "${BOLD}"
echo "╔══════════════════════════════════════╗"
echo "║       FreeCourseHub Setup            ║"
echo "║   Free Course Aggregation Platform   ║"
echo "╚══════════════════════════════════════╝"
echo -e "${RESET}"

# ── Check prerequisites ───────────────────────────────────
info "Checking prerequisites..."

command -v docker  >/dev/null 2>&1 || error "Docker not found. Install at https://docs.docker.com/get-docker/"
command -v docker  >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 || \
  command -v docker-compose >/dev/null 2>&1 || \
  error "Docker Compose not found. Install Docker Desktop or 'sudo apt install docker-compose-plugin'"

success "Docker $(docker --version | awk '{print $3}' | tr -d ',')"
success "Docker Compose found"

# ── Setup env files ───────────────────────────────────────
info "Setting up environment files..."

setup_env() {
  local src="$1" dst="$2"
  if [ ! -f "$dst" ]; then
    cp "$src" "$dst"
    success "Created $dst"
  else
    warn "$dst already exists — skipping"
  fi
}

setup_env .env.example           .env
setup_env backend/.env.example   backend/.env
setup_env worker/.env.example    worker/.env
setup_env frontend/.env.example  frontend/.env

# ── Generate a random WORKER_API_KEY if not set ───────────
if grep -q "change_this_secret_key" backend/.env 2>/dev/null; then
  if command -v openssl >/dev/null 2>&1; then
    KEY=$(openssl rand -hex 32)
    sed -i.bak "s/change_this_secret_key_in_production/$KEY/" backend/.env worker/.env
    rm -f backend/.env.bak worker/.env.bak
    success "Generated random WORKER_API_KEY"
  else
    warn "Could not auto-generate WORKER_API_KEY — please set it manually in backend/.env and worker/.env"
  fi
fi

# ── Build and start ───────────────────────────────────────
echo ""
info "Building Docker images (first run may take 3–5 minutes)..."

# Use 'docker compose' (v2) or 'docker-compose' (v1)
COMPOSE_CMD="docker compose"
if ! docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
fi

$COMPOSE_CMD up --build -d

# ── Wait for health checks ────────────────────────────────
echo ""
info "Waiting for services to become healthy..."

MAX_WAIT=120
ELAPSED=0

wait_for_health() {
  local name="$1" url="$2"
  local tries=0
  while [ $tries -lt 20 ]; do
    if curl -sf "$url" >/dev/null 2>&1; then
      success "$name is healthy"
      return 0
    fi
    sleep 3
    tries=$((tries + 1))
    ELAPSED=$((ELAPSED + 3))
    [ $ELAPSED -ge $MAX_WAIT ] && { warn "$name health check timed out"; return 1; }
    echo -n "."
  done
}

echo -n "  Waiting for backend"
wait_for_health "Backend"  "http://localhost/api/health/live" || true
echo ""
echo -n "  Waiting for Nginx"
wait_for_health "Nginx"    "http://localhost/health" || true
echo ""

# ── Final status ──────────────────────────────────────────
echo ""
echo -e "${BOLD}Service Status:${RESET}"
$COMPOSE_CMD ps

echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════╗"
echo "║      FreeCourseHub is Live! 🎓       ║"
echo "╚══════════════════════════════════════╝${RESET}"
echo ""
echo -e "  ${BOLD}App:${RESET}    http://localhost"
echo -e "  ${BOLD}API:${RESET}    http://localhost/api/courses"
echo -e "  ${BOLD}Health:${RESET} http://localhost/api/health"
echo -e "  ${BOLD}Search:${RESET} http://localhost/api/search?q=python"
echo ""
echo -e "  ${CYAN}Logs:${RESET}   docker compose logs -f"
echo -e "  ${CYAN}Stop:${RESET}   docker compose down"
echo -e "  ${CYAN}Restart:${RESET} docker compose restart"
echo ""
