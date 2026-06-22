#!/usr/bin/env bash
set -euo pipefail

# One-time GCP setup for Cloud Run + GitHub Actions deploys.
#
# Usage:
#   export GCP_PROJECT_ID=your-project-id
#   export GCP_REGION=us-central1          # optional, default us-central1
#   ./scripts/setup-gcp.sh
#
# Then create a JSON key for the deploy service account and add it to GitHub:
#   GitHub repo → Settings → Secrets → GCP_SA_KEY

PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-us-central1}"
REPOSITORY="${ARTIFACT_REGISTRY_REPO:-bank-transaction-extractor}"
SERVICE_ACCOUNT="${GCP_DEPLOY_SA:-github-cloud-run-deploy}"
CLOUD_RUN_RUNTIME_SA="${CLOUD_RUN_RUNTIME_SA:-bank-statement-api-runtime}"

if [[ -z "$PROJECT_ID" ]]; then
  echo "Set GCP_PROJECT_ID before running this script."
  exit 1
fi

echo "Using project: $PROJECT_ID"
echo "Region: $REGION"

gcloud config set project "$PROJECT_ID"

echo "Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com

echo "Creating Artifact Registry repository (if missing)..."
if ! gcloud artifacts repositories describe "$REPOSITORY" --location="$REGION" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$REPOSITORY" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Bank transaction extractor images"
fi

echo "Creating GitHub Actions deploy service account (if missing)..."
if ! gcloud iam service-accounts describe "${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$SERVICE_ACCOUNT" \
    --display-name="GitHub Actions Cloud Run deploy"
fi

DEPLOY_SA_EMAIL="${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com"

for ROLE in roles/run.admin roles/artifactregistry.admin roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${DEPLOY_SA_EMAIL}" \
    --role="$ROLE" \
    --quiet >/dev/null
done

echo "Creating Cloud Run runtime service account (if missing)..."
if ! gcloud iam service-accounts describe "${CLOUD_RUN_RUNTIME_SA}@${PROJECT_ID}.iam.gserviceaccount.com" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$CLOUD_RUN_RUNTIME_SA" \
    --display-name="Bank statement API runtime"
fi

RUNTIME_SA_EMAIL="${CLOUD_RUN_RUNTIME_SA}@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME_SA_EMAIL}" \
  --role="roles/run.invoker" \
  --quiet >/dev/null

KEY_FILE="./gcp-deploy-sa-key.json"
echo "Creating deploy service account key → ${KEY_FILE}"
gcloud iam service-accounts keys create "$KEY_FILE" \
  --iam-account="$DEPLOY_SA_EMAIL"

cat <<EOF

Setup complete.

Add these GitHub repository secrets:
  GCP_PROJECT_ID        = ${PROJECT_ID}
  GCP_SA_KEY            = contents of ${KEY_FILE}
  GCP_REGION            = ${REGION}            (optional GitHub variable)
  GEMINI_API_KEY        = your Gemini key
  API_KEY               = random secret for x-api-key header

Bank credentials (BANK_USERNAME, BANK_PASSWORD) are passed per request in the API body, not stored in Cloud Run.

Optional GitHub repository secrets / variables:
  BANK_ACCOUNT_NUMBER   = default account if omitted from API request
  CLOUD_RUN_SERVICE     = bank-statement-api
  ARTIFACT_REGISTRY_REPO = ${REPOSITORY}
  CLOUD_RUN_RUNTIME_SA  = ${RUNTIME_SA_EMAIL}

Delete ${KEY_FILE} after copying it into GitHub secrets.

Push to main to trigger the deploy workflow.
EOF
