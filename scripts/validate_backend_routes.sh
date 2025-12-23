#!/bin/bash
# Validation script - run before committing backend/app/main.py changes
# Usage: ./scripts/validate_backend_routes.sh

MAIN_PY="backend/app/main.py"

echo "Validating backend routes in $MAIN_PY..."

# Required routes
REQUIRED_ROUTES=("chains" "control_tower" "admin_settings" "dashboard" "neo4j_routes" "chat" "debug" "embeddings" "sync" "auth" "files")

# Check imports
IMPORTS=$(grep "from app.api.routes import" "$MAIN_PY")
echo "Current imports: $IMPORTS"

MISSING=()
for route in "${REQUIRED_ROUTES[@]}"; do
    if ! echo "$IMPORTS" | grep -q "\b$route\b"; then
        MISSING+=("$route")
    fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
    echo "❌ MISSING IMPORTS: ${MISSING[*]}"
    exit 1
fi

# Check route registrations
for route in "chains" "control_tower" "admin_settings" "dashboard"; do
    if ! grep -q "app.include_router($route" "$MAIN_PY"; then
        echo "❌ MISSING REGISTRATION: $route.router"
        exit 1
    fi
done

echo "✅ All routes validated"
exit 0
