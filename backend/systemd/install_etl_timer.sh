#!/bin/bash
# Install JOSOOR Memory ETL as a systemd service/timer

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_FILE="$SCRIPT_DIR/josoor-memory-etl.service"
TIMER_FILE="$SCRIPT_DIR/josoor-memory-etl.timer"
SYSTEMD_USER_DIR="$HOME/.config/systemd/user"

echo "📦 Installing JOSOOR Memory ETL as systemd service..."

# Create user systemd directory if missing
mkdir -p "$SYSTEMD_USER_DIR"

# Copy service and timer
cp "$SERVICE_FILE" "$SYSTEMD_USER_DIR/"
cp "$TIMER_FILE" "$SYSTEMD_USER_DIR/"

echo "✅ Service files installed to $SYSTEMD_USER_DIR"

# Reload systemd daemon
systemctl --user daemon-reload
echo "✅ Systemd daemon reloaded"

# Enable timer to start on login
systemctl --user enable josoor-memory-etl.timer
echo "✅ Timer enabled for user systemd"

# Start the timer immediately
systemctl --user start josoor-memory-etl.timer
echo "✅ Timer started"

# Check status
echo ""
echo "📊 Status:"
systemctl --user status josoor-memory-etl.timer --no-pager
echo ""
systemctl --user list-timers josoor-memory-etl.timer --no-pager

echo ""
echo "📝 To check logs:"
echo "  journalctl --user -u josoor-memory-etl -f"
echo ""
echo "📝 To manually run the ETL now:"
echo "  systemctl --user start josoor-memory-etl.service"
echo ""
echo "📝 To disable the timer:"
echo "  systemctl --user disable josoor-memory-etl.timer"
echo "  systemctl --user stop josoor-memory-etl.timer"
