#!/bin/bash
# JOSOOR Memory ETL - Cron Setup Script
# Installs nightly Memory ETL as a cron job

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ETL_SCRIPT="/home/mosab/projects/chatmodule/backend/scripts/nightly_memory_etl.py"
VENV_PYTHON="/home/mosab/projects/chatmodule/backend/.venv/bin/python"
LOG_FILE="/home/mosab/projects/chatmodule/backend/logs/memory_etl_cron.log"

if [ ! -f "$ETL_SCRIPT" ]; then
    echo "❌ ETL script not found: $ETL_SCRIPT"
    exit 1
fi

if [ ! -x "$VENV_PYTHON" ]; then
    echo "❌ Python venv not found: $VENV_PYTHON"
    exit 1
fi

# Create logs directory
mkdir -p "$(dirname "$LOG_FILE")"

# Cron job: Run every day at 2 AM
# Format: minute hour day month dayofweek command
CRON_JOB="0 2 * * * cd /home/mosab/projects/chatmodule/backend && $VENV_PYTHON $ETL_SCRIPT >> $LOG_FILE 2>&1"

echo "📝 Installing cron job..."
echo "   Runs daily at 2 AM UTC"
echo "   Command: $CRON_JOB"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$ETL_SCRIPT"; then
    echo "⚠️  Cron job already installed"
    echo ""
    echo "Current cron entry:"
    crontab -l | grep "$ETL_SCRIPT"
else
    # Add cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Cron job installed successfully"
fi

echo ""
echo "📊 Your crontab:"
crontab -l | grep "$ETL_SCRIPT" || echo "(no entry found)"

echo ""
echo "📝 Logs will be saved to: $LOG_FILE"
echo ""
echo "📝 To view logs:"
echo "  tail -f $LOG_FILE"
echo ""
echo "📝 To remove the cron job:"
echo "  crontab -e"
echo "  # Delete the JOSOOR Memory ETL line"
