#!/usr/bin/env bash
# Quick script to test Supabase sign-up using frontend/.env values
set -euo pipefail
ENV_FILE="frontend/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE"
  exit 2
fi
# shellcheck disable=SC1090
source "$ENV_FILE"

if [ -z "${REACT_APP_SUPABASE_URL:-}" ] || [ -z "${REACT_APP_SUPABASE_ANON_KEY:-}" ]; then
  echo "REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY missing in $ENV_FILE"
  exit 2
fi

EMAIL="test+robot_$(date +%s)@example.com"
PASSWORD="Test1234!"

echo "Testing signup to: $REACT_APP_SUPABASE_URL"
echo "Attempting register for: $EMAIL"

RESP=$(curl -sS -w "\nHTTP_STATUS:%{http_code}" -X POST "$REACT_APP_SUPABASE_URL/auth/v1/signup" \
  -H "apikey: $REACT_APP_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{ \"email\": \"$EMAIL\", \"password\": \"$PASSWORD\", \"options\": { \"data\": { \"full_name\": \"Robot Test\" } } }")

echo "Response:"
echo "$RESP"

echo "Script complete. If signup succeeded, you should receive JSON with user/session or confirmation info."
