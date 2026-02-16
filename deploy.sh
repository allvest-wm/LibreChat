#!/bin/bash
# =============================================================
# deploy.sh
# Validates helm-values-corrected.yaml against the target env
# Checks: DOMAIN_CLIENT | OPENID_ISSUER | OPENID_CLIENT_SECRET | baseURL | repository
# Usage: ./deploy.sh <env>
# Supported envs: dev | uat | staging
# =============================================================

# ----------- Colors -----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ----------- Script root -----------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HELM_VALUES_FILE="$SCRIPT_DIR/kubernetes_deploy/helm-values-corrected.yaml"

# ----------- Input validation -----------
ENV_INPUT=$(echo "${1}" | tr '[:upper:]' '[:lower:]')

if [ -z "$ENV_INPUT" ]; then
    echo -e "${YELLOW}Usage: ./deploy.sh <env>${NC}"
    echo -e "${YELLOW}Supported environments: dev | uat | staging${NC}"
    exit 1
fi

case "$ENV_INPUT" in
    dev|uat|staging) ;;
    *)
        echo -e "${RED}[ERROR] Invalid environment: '${1}'${NC}"
        echo -e "${YELLOW}Supported environments: dev | uat | staging${NC}"
        exit 1
        ;;
esac

# ----------- File check -----------
if [ ! -f "$HELM_VALUES_FILE" ]; then
    echo -e "${RED}[ERROR] File not found: $HELM_VALUES_FILE${NC}"
    echo -e "${YELLOW}Make sure 'helm-values-corrected.yaml' exists in the project root.${NC}"
    exit 1
fi

# ----------- GAR Registry (constant across all envs) -----------
REGISTRY="asia-south1-docker.pkg.dev"

# =============================================================
# Expected values per environment
# =============================================================
case "$ENV_INPUT" in
    dev)
        EXPECTED_DOMAIN_CLIENT="https://intelligent-chatbot-frontend-dev.allvestfinance.in"
        EXPECTED_OPENID_ISSUER="https://keycloak-non-prod.allvestfinance.in/realms/DEV"
        EXPECTED_OPENID_CLIENT_SECRET="sXpwiQasPPhO8SaZmaZ14i2tUi23Wht7"
        EXPECTED_BASEURL="https://intelligent-chatbot-adapter-api-dev.allvestfinance.in"
        EXPECTED_REPOSITORY="project-avs-ops/prj-avs-gar-staging/librechat"
        ;;
    uat)
        EXPECTED_DOMAIN_CLIENT="https://intelligent-chatbot-frontend-uat.allvestfinance.in"
        EXPECTED_OPENID_ISSUER="https://sso-uat.allvestfinance.in/realms/UAT"
        EXPECTED_OPENID_CLIENT_SECRET="sXpwiQasPPhO8SaZmaZ14i2tUi23Wht7"
        EXPECTED_BASEURL="https://intelligent-chatbot-adapter-api-uat.allvestfinance.in"
        EXPECTED_REPOSITORY="project-avs-ops/prj-avs-gar-uat/librechat"
        ;;
    staging)
        EXPECTED_DOMAIN_CLIENT="https://intelligent-chatbot-frontend-stage.allvestfinance.in"
        EXPECTED_OPENID_ISSUER="https://keycloak-dev.allvestfinance.in/realms/STAGE"
        EXPECTED_OPENID_CLIENT_SECRET="9E9oZTmMYIuTVFT0wNr9snqRaTTgAYs7"
        EXPECTED_BASEURL="https://intelligent-chatbot-adapter-api-stage.allvestfinance.in"
        EXPECTED_REPOSITORY="project-av-net/prj-av-gar-dev/librechat"
        ;;
esac

# =============================================================
# Helper: extract a key's value from the YAML file
# Usage: extract_value "KEY_NAME"
# =============================================================
extract_value() {
    local KEY="$1"
    grep -m 1 "${KEY}:" "$HELM_VALUES_FILE" \
        | sed "s/.*${KEY}:[[:space:]]*//" \
        | sed 's/^"//;s/"$//' \
        | xargs
}

# =============================================================
# Helper: validate one field
# Sets VALIDATION_RESULT to "PASS" or "FAIL"
# Usage: validate "LABEL" "ACTUAL" "EXPECTED"
# =============================================================
validate() {
    local LABEL="$1"
    local ACTUAL="$2"
    local EXPECTED="$3"

    echo -e "${BOLD}${CYAN}  ${LABEL}${NC}"
    echo -e "    Expected : ${GREEN}${EXPECTED}${NC}"
    echo -e "    Actual   : ${CYAN}${ACTUAL}${NC}"

    if [ "$ACTUAL" == "$EXPECTED" ]; then
        echo -e "    Status   : ${GREEN}[✅ PASS]${NC}"
        VALIDATION_RESULT="PASS"
    else
        echo -e "    Status   : ${RED}[❌ FAIL] — Value does not match '${ENV_INPUT}' environment${NC}"
        echo -e "    ${RED}➤ Update ${LABEL} to: ${EXPECTED}${NC}"
        VALIDATION_RESULT="FAIL"
    fi
    echo ""
}

# =============================================================
# Helper: run a shell command with logging
# Prints the command before running. Exits immediately on failure.
# Usage: run_cmd "step label" "command"
# =============================================================
run_cmd() {
    local STEP_LABEL="$1"
    local CMD="$2"

    echo -e "${BOLD}${CYAN}  ➤ Step ${STEP_LABEL}${NC}"
    echo -e "    ${YELLOW}Running : ${CMD}${NC}"

    eval "$CMD"

    if [ $? -ne 0 ]; then
        echo ""
        echo -e "${RED}=============================================${NC}"
        echo -e "${RED}  [❌ FAILED] Step ${STEP_LABEL} failed.${NC}"
        echo -e "${RED}  Command  : ${CMD}${NC}"
        echo -e "${RED}=============================================${NC}"
        exit 1
    fi

    echo -e "    ${GREEN}[✅ Done]${NC}"
    echo ""
}

# =============================================================
# Read actual values from YAML
# =============================================================
ACTUAL_DOMAIN_CLIENT=$(extract_value "DOMAIN_CLIENT")
ACTUAL_OPENID_ISSUER=$(extract_value "OPENID_ISSUER")
ACTUAL_OPENID_CLIENT_SECRET=$(extract_value "OPENID_CLIENT_SECRET")
ACTUAL_BASEURL=$(extract_value "baseURL")
# repository needs special handling — a commented-out "# repository:" line exists above the active one
# so we strip comment lines first, then grep
ACTUAL_REPOSITORY=$(grep -v '^\s*#' "$HELM_VALUES_FILE" | grep -m 1 "repository:" | sed 's/.*repository:[[:space:]]*//' | sed 's/^"//;s/"$//' | xargs)

# ----------- Sanity check: keys must exist -----------
MISSING_KEYS=""
[ -z "$ACTUAL_DOMAIN_CLIENT" ]        && MISSING_KEYS="${MISSING_KEYS} DOMAIN_CLIENT"
[ -z "$ACTUAL_OPENID_ISSUER" ]        && MISSING_KEYS="${MISSING_KEYS} OPENID_ISSUER"
[ -z "$ACTUAL_OPENID_CLIENT_SECRET" ] && MISSING_KEYS="${MISSING_KEYS} OPENID_CLIENT_SECRET"
[ -z "$ACTUAL_BASEURL" ]              && MISSING_KEYS="${MISSING_KEYS} baseURL"
[ -z "$ACTUAL_REPOSITORY" ]           && MISSING_KEYS="${MISSING_KEYS} repository"

if [ -n "$MISSING_KEYS" ]; then
    echo -e "${RED}[ERROR] The following keys were not found in $HELM_VALUES_FILE:${NC}"
    echo -e "${RED}  ${MISSING_KEYS}${NC}"
    exit 1
fi

# =============================================================
# Run validations
# =============================================================
TOTAL_FAIL=0

echo ""
echo -e "${CYAN}=============================================${NC}"
echo -e "${CYAN}  Helm Values Validation — deploy.sh${NC}"
echo -e "${CYAN}=============================================${NC}"
echo -e "${CYAN}  Environment : ${NC}${ENV_INPUT}"
echo -e "${CYAN}  File        : ${NC}${HELM_VALUES_FILE}"
echo -e "${CYAN}=============================================${NC}"
echo ""

# --- 1. DOMAIN_CLIENT ---
validate "DOMAIN_CLIENT" "$ACTUAL_DOMAIN_CLIENT" "$EXPECTED_DOMAIN_CLIENT"
[ "$VALIDATION_RESULT" == "FAIL" ] && TOTAL_FAIL=$((TOTAL_FAIL + 1))

# --- 2. OPENID_ISSUER ---
validate "OPENID_ISSUER" "$ACTUAL_OPENID_ISSUER" "$EXPECTED_OPENID_ISSUER"
[ "$VALIDATION_RESULT" == "FAIL" ] && TOTAL_FAIL=$((TOTAL_FAIL + 1))

# --- 3. OPENID_CLIENT_SECRET ---
validate "OPENID_CLIENT_SECRET" "$ACTUAL_OPENID_CLIENT_SECRET" "$EXPECTED_OPENID_CLIENT_SECRET"
[ "$VALIDATION_RESULT" == "FAIL" ] && TOTAL_FAIL=$((TOTAL_FAIL + 1))

# --- 4. baseURL (configYamlContent) ---
validate "baseURL" "$ACTUAL_BASEURL" "$EXPECTED_BASEURL"
[ "$VALIDATION_RESULT" == "FAIL" ] && TOTAL_FAIL=$((TOTAL_FAIL + 1))

# --- 5. repository (image) ---
validate "image.repository" "$ACTUAL_REPOSITORY" "$EXPECTED_REPOSITORY"
[ "$VALIDATION_RESULT" == "FAIL" ] && TOTAL_FAIL=$((TOTAL_FAIL + 1))

# =============================================================
# Final Summary
# =============================================================
echo -e "${CYAN}=============================================${NC}"
echo -e "${CYAN}  SUMMARY${NC}"
echo -e "${CYAN}=============================================${NC}"

if [ "$TOTAL_FAIL" -eq 0 ]; then
    echo -e "  ${GREEN}${BOLD}All 5 checks PASSED for '${ENV_INPUT}' environment. ✅${NC}"
    echo -e "${CYAN}=============================================${NC}"

    # ---------------------------------------------------------
    # Docker image path — built from constants already defined
    # ---------------------------------------------------------
    IMAGE_TAG="${REGISTRY}/${EXPECTED_REPOSITORY}:latest"

    echo ""
    echo -e "${CYAN}=============================================${NC}"
    echo -e "${CYAN}  Docker Build & Push — ${ENV_INPUT}${NC}"
    echo -e "${CYAN}=============================================${NC}"
    echo -e "  Registry   : ${CYAN}${REGISTRY}${NC}"
    echo -e "  Repository : ${CYAN}${EXPECTED_REPOSITORY}${NC}"
    echo -e "  Full Tag   : ${CYAN}${IMAGE_TAG}${NC}"
    echo -e "${CYAN}=============================================${NC}"
    echo ""

    # ---------------------------------------------------------
    # Confirmation prompt — default NO
    # ---------------------------------------------------------
    echo -e "${YELLOW}  The following commands will be executed:${NC}"
    echo -e "    1. docker build --platform=linux/amd64 -f Dockerfile.multi -t librechat:latest ."
    echo -e "    2. docker tag librechat ${IMAGE_TAG}"
    echo -e "    3. docker push ${IMAGE_TAG}"
    echo -e "    4. helm upgrade --install librechat (namespace: librechat)"
    echo ""
    read -rp "  $(echo -e "${BOLD}${GREEN}Proceed with build & push? (y/N)${NC}") " CONFIRM
    echo ""

    case "$CONFIRM" in
        y|Y|yes|Yes|YES) ;;
        *)
            echo -e "${YELLOW}  Deployment cancelled by user.${NC}"
            echo -e "${CYAN}=============================================${NC}"
            exit 0
            ;;
    esac

    # ---------------------------------------------------------
    # Execute docker commands
    # ---------------------------------------------------------
    echo -e "${CYAN}=============================================${NC}"
    echo -e "${CYAN}  Executing Docker Commands${NC}"
    echo -e "${CYAN}=============================================${NC}"
    echo ""

    # Step 1 — Build
    run_cmd "1/4 — Build" "docker build --platform=linux/amd64 -f Dockerfile.multi -t librechat:latest ."

    # Step 2 — Tag
    run_cmd "2/4 — Tag" "docker tag librechat ${IMAGE_TAG}"

    # Step 3 — Push
    run_cmd "3/4 — Push" "docker push ${IMAGE_TAG}"

    # ---------------------------------------------------------
    # Step 4 — Helm upgrade/install (same for all envs)
    # ---------------------------------------------------------
    echo -e "${CYAN}=============================================${NC}"
    echo -e "${CYAN}  Helm Upgrade / Install${NC}"
    echo -e "${CYAN}=============================================${NC}"
    echo ""

    HELM_CMD="helm upgrade --install librechat \
  oci://ghcr.io/danny-avila/librechat-chart/librechat \
  --values kubernetes_deploy/helm-values-corrected.yaml \
  --set mongodb.image.repository=bitnamilegacy/mongodb \
  --set mongodb.image.tag=8.0.13-debian-12-r0 \
  --namespace librechat"

    run_cmd "4/4 — Helm Upgrade" "$HELM_CMD"

    # ---------------------------------------------------------
    # All done
    # ---------------------------------------------------------
    echo -e "${CYAN}=============================================${NC}"
    echo -e "${GREEN}${BOLD}  ✅ Deployment completed successfully for '${ENV_INPUT}'!${NC}"
    echo -e "  ${GREEN}Image pushed : ${IMAGE_TAG}${NC}"
    echo -e "  ${GREEN}Helm release : librechat (namespace: librechat)${NC}"
    echo -e "${CYAN}=============================================${NC}"
    exit 0
else
    echo -e "  ${RED}${BOLD}${TOTAL_FAIL} of 5 check(s) FAILED for '${ENV_INPUT}' environment. ❌${NC}"
    echo -e "  ${YELLOW}Please fix the values shown above in helm-values-corrected.yaml${NC}"
    echo -e "${CYAN}=============================================${NC}"
    exit 1
fi