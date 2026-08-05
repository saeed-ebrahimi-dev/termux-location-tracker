#!/data/data/com.termux/files/usr/bin/bash
# Location Tracker - Termux Script
# Send location and battery data to server

SERVER_URL="${1:-http://YOUR_SERVER_IP:9000}"
INTERVAL="${2:-5}"

# Never exit the loop on any error
set +e

log() { echo "[$(date '+%H:%M:%S')] $1"; }

# Keep device awake (prevents Android from killing the script) 
if command -v termux-wake-lock &>/dev/null; then
    termux-wake-lock
    log "🔒 Wake lock acquired (device stays awake)"
fi

# Validate INTERVAL is a positive number 
if ! [[ "$INTERVAL" =~ ^[0-9]+$ ]] || [ "$INTERVAL" -lt 1 ]; then
    INTERVAL=5
fi

# Prerequisite check
check_prereqs() {
    for cmd in termux-location termux-battery-status jq curl; do
        if ! command -v "$cmd" &>/dev/null; then
            log "❌ $cmd is not installed. Run: pkg install termux-api jq curl"
            return 1
        fi
    done
    return 0
}

until check_prereqs; do
    log "⏳ Waiting for prerequisites... retrying in $INTERVAL seconds"
    sleep "$INTERVAL"
done

log "🚀 Sending data to $SERVER_URL every $INTERVAL seconds (never-stop mode)"
log "Press Ctrl+C to stop"

send_once() {
    # Get location
    local location_json=""
    if command -v termux-location &>/dev/null; then
        location_json=$(termux-location -p gps -r once 2>/dev/null)
    fi

    if [ -z "$location_json" ]; then
        log "⚠️ Location not available, skipping this cycle..."
        return 1
    fi

    # Get battery status
    local battery_json=""
    if command -v termux-battery-status &>/dev/null; then
        battery_json=$(termux-battery-status 2>/dev/null)
    fi

    # Build combined JSON - safely handle empty battery
    local payload=""
    if [ -n "$battery_json" ]; then
        payload=$(jq -n --argjson loc "$location_json" --argjson bat "$battery_json" '{location: $loc, battry: $bat}' 2>/dev/null)
    else
        payload=$(jq -n --argjson loc "$location_json" '{location: $loc}' 2>/dev/null)
    fi

    if [ -z "$payload" ]; then
        log "⚠️ Failed to build JSON payload (invalid location/battery data)"
        return 1
    fi

    # Send with timeout
    local response=""
    response=$(curl -s --max-time 60 -X POST "$SERVER_URL/location" \
        -H "Content-Type: application/json" \
        -d "$payload" 2>/dev/null)

    if [ -n "$response" ]; then
        local batt
        batt=$(echo "$response" | jq -r '.battery // "?"' 2>/dev/null)
        log "✅ Sent | Battery: ${batt}%"
    else
        log "❌ Send failed (server unreachable?) - will retry next cycle"
    fi
    return 0
}

while true; do
    send_once
    # Even if sleep is interrupted/fails, loop continues
    sleep "$INTERVAL" 2>/dev/null || true
done