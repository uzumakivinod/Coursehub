#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────
#  FreeCourseHub — GCP Deployment Script
#  Deploys to GCP e2-micro (free tier) using gcloud CLI
#
#  Prerequisites:
#    1. gcloud CLI installed: https://cloud.google.com/sdk/docs/install
#    2. gcloud auth login  (run once)
#    3. A GCP project created at https://console.cloud.google.com
#
#  Usage:
#    chmod +x deploy-gcp.sh
#    GCP_PROJECT=your-project-id ./deploy-gcp.sh
# ──────────────────────────────────────────────────────────
set -euo pipefail

# ── Config (edit these) ───────────────────────────────────
GCP_PROJECT="${GCP_PROJECT:-your-project-id}"
GCP_ZONE="${GCP_ZONE:-us-central1-a}"        # ← FREE TIER ZONE (do not change region)
GCP_REGION="${GCP_REGION:-us-central1}"
VM_NAME="${VM_NAME:-freecourse-vm}"
MACHINE_TYPE="e2-micro"                       # ← FREE TIER MACHINE (do not change)
DISK_SIZE="30GB"                              # ← FREE TIER LIMIT
IMAGE_FAMILY="ubuntu-2204-lts"
IMAGE_PROJECT="ubuntu-os-cloud"
STATIC_IP_NAME="freecourse-static-ip"
FIREWALL_TAG="freecourse-http"
REPO_URL="${REPO_URL:-https://github.com/yourname/FreeCourseHub.git}"

BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

info()    { echo -e "${CYAN}[GCP]${RESET}   $1"; }
success() { echo -e "${GREEN}[OK]${RESET}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $1"; }
error()   { echo -e "${RED}[ERROR]${RESET} $1"; exit 1; }
step()    { echo -e "\n${BOLD}━━ $1 ━━${RESET}"; }

# ── Validate ──────────────────────────────────────────────
[ "$GCP_PROJECT" = "your-project-id" ] && \
  error "Set GCP_PROJECT: export GCP_PROJECT=my-project-123"

command -v gcloud >/dev/null 2>&1 || \
  error "gcloud not found. Install: https://cloud.google.com/sdk/docs/install"

# ── Set project ───────────────────────────────────────────
step "Step 1 — Configure gcloud"
gcloud config set project "$GCP_PROJECT"
success "Project: $GCP_PROJECT"

# ── Enable APIs ───────────────────────────────────────────
step "Step 2 — Enable required APIs"
gcloud services enable compute.googleapis.com --quiet
success "Compute Engine API enabled"

# ── Reserve static IP ────────────────────────────────────
step "Step 3 — Reserve Static IP (free while attached)"
if ! gcloud compute addresses describe "$STATIC_IP_NAME" --region="$GCP_REGION" &>/dev/null; then
  gcloud compute addresses create "$STATIC_IP_NAME" --region="$GCP_REGION" --quiet
  success "Static IP reserved: $STATIC_IP_NAME"
else
  warn "Static IP $STATIC_IP_NAME already exists"
fi

STATIC_IP=$(gcloud compute addresses describe "$STATIC_IP_NAME" \
  --region="$GCP_REGION" --format="get(address)")
success "Static IP: $STATIC_IP"

# ── Firewall rules ────────────────────────────────────────
step "Step 4 — Configure firewall rules"
if ! gcloud compute firewall-rules describe allow-http-freecourse &>/dev/null; then
  gcloud compute firewall-rules create allow-http-freecourse \
    --allow=tcp:80,tcp:443 \
    --target-tags="$FIREWALL_TAG" \
    --description="FreeCourseHub HTTP/HTTPS" \
    --quiet
  success "Firewall rule created: allow-http-freecourse"
else
  warn "Firewall rule already exists"
fi

# ── Create VM ────────────────────────────────────────────
step "Step 5 — Create e2-micro VM (FREE TIER)"
if ! gcloud compute instances describe "$VM_NAME" --zone="$GCP_ZONE" &>/dev/null; then
  gcloud compute instances create "$VM_NAME" \
    --machine-type="$MACHINE_TYPE" \
    --zone="$GCP_ZONE" \
    --image-family="$IMAGE_FAMILY" \
    --image-project="$IMAGE_PROJECT" \
    --boot-disk-size="$DISK_SIZE" \
    --boot-disk-type=pd-standard \
    --tags="$FIREWALL_TAG,http-server,https-server" \
    --address="$STATIC_IP" \
    --quiet
  success "VM created: $VM_NAME ($MACHINE_TYPE)"
  info "Waiting 30s for VM to initialize..."
  sleep 30
else
  warn "VM $VM_NAME already exists"
fi

# ── Remote setup script ───────────────────────────────────
step "Step 6 — Install Docker on VM"
SETUP_SCRIPT=$(cat <<'REMOTE_EOF'
#!/bin/bash
set -e
echo "=== Installing Docker ==="
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo apt-get install -y docker-compose-plugin git curl 2>/dev/null || true

echo "=== Docker version ==="
docker --version

echo "=== Docker Compose version ==="
docker compose version
REMOTE_EOF
)

gcloud compute ssh "$VM_NAME" \
  --zone="$GCP_ZONE" \
  --command="$SETUP_SCRIPT" \
  --quiet

success "Docker installed on VM"

# ── Deploy app ────────────────────────────────────────────
step "Step 7 — Deploy FreeCourseHub"
DEPLOY_SCRIPT=$(cat <<REMOTE_EOF
#!/bin/bash
set -e

# Clone or update repo
if [ -d "FreeCourseHub" ]; then
  echo "Updating existing repo..."
  cd FreeCourseHub && git pull
else
  echo "Cloning repo..."
  git clone $REPO_URL FreeCourseHub
  cd FreeCourseHub
fi

# Setup env files
[ -f .env ]            || cp .env.example .env
[ -f backend/.env ]    || cp backend/.env.example backend/.env
[ -f worker/.env ]     || cp worker/.env.example  worker/.env
[ -f frontend/.env ]   || cp frontend/.env.example frontend/.env

# Generate random worker key
KEY=\$(openssl rand -hex 32 2>/dev/null || echo "change_me_\$(date +%s)")
sed -i "s/change_this_secret_key_in_production/\$KEY/g" backend/.env worker/.env 2>/dev/null || true

# Build and start
echo "Building and starting services..."
docker compose up --build -d

echo "=== Container status ==="
docker compose ps

echo "=== Waiting for health ==="
sleep 20
curl -sf http://localhost/api/health | python3 -m json.tool 2>/dev/null || \
  curl -sf http://localhost/api/health || echo "Health check pending..."
REMOTE_EOF
)

gcloud compute ssh "$VM_NAME" \
  --zone="$GCP_ZONE" \
  --command="$DEPLOY_SCRIPT" \
  --quiet

success "FreeCourseHub deployed!"

# ── Summary ───────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════╗"
echo "║   FreeCourseHub Deployed on GCP! 🚀         ║"
echo "╚══════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  ${BOLD}App URL:${RESET}    http://$STATIC_IP"
echo -e "  ${BOLD}API URL:${RESET}    http://$STATIC_IP/api"
echo -e "  ${BOLD}Health:${RESET}     http://$STATIC_IP/api/health"
echo -e "  ${BOLD}GCP Zone:${RESET}   $GCP_ZONE"
echo -e "  ${BOLD}Machine:${RESET}    $MACHINE_TYPE (FREE TIER ✓)"
echo -e "  ${BOLD}Cost:${RESET}       \$0.00/month ✓"
echo ""
echo -e "  ${CYAN}SSH into VM:${RESET}"
echo -e "  gcloud compute ssh $VM_NAME --zone=$GCP_ZONE"
echo ""
echo -e "  ${CYAN}View logs:${RESET}"
echo -e "  gcloud compute ssh $VM_NAME --zone=$GCP_ZONE --command='cd FreeCourseHub && docker compose logs -f'"
echo ""
echo -e "  ${YELLOW}⚠️  Free tier note: Only us-east1, us-central1, us-west1 are free.${RESET}"
echo -e "  ${YELLOW}   Do NOT change GCP_ZONE to another region or charges will apply.${RESET}"
echo ""
