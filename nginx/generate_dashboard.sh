#!/bin/bash
# Generate GoAccess HTML dashboard from nginx access logs
# Run via cron: */5 * * * * /var/www/moami/nginx/generate_dashboard.sh

ACCESS_LOG="/var/www/moami/nginx/logs/access.log"
OUTPUT_DIR="/var/www/moami/nginx/dashboard"
GEOIP_DB="/var/www/moami/nginx/GeoLite2-Country.mmdb"

mkdir -p "$OUTPUT_DIR"

[ ! -f "$ACCESS_LOG" ] && exit 0

goaccess "$ACCESS_LOG" \
    --log-format=COMBINED \
    --output="$OUTPUT_DIR/index.html" \
    --geoip-database="$GEOIP_DB" \
    --anonymize-ip \
    --ignore-crawlers \
    2>/dev/null
