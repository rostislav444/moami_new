#!/bin/bash
# Auto-block suspicious IPs based on nginx access log patterns
# Run via cron: */5 * * * * /var/www/moami/nginx/auto_block.sh

BLOCKLIST="/var/www/moami/nginx/blocklist.conf"
ACCESS_LOG="/var/www/moami/nginx/logs/access.log"
WHITELIST="85.114.192.181"

is_valid_ip() {
    [[ "$1" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]
}

is_whitelisted() {
    echo "$WHITELIST" | grep -qw "$1"
}

is_blocked() {
    grep -q "deny $1;" "$BLOCKLIST" 2>/dev/null
}

block_ip() {
    local ip="$1"
    local reason="$2"
    if is_valid_ip "$ip" && ! is_whitelisted "$ip" && ! is_blocked "$ip"; then
        echo "deny $ip; # $reason - $(date '+%Y-%m-%d %H:%M')" >> "$BLOCKLIST"
        echo "Blocked $ip: $reason"
    fi
}

[ ! -f "$ACCESS_LOG" ] && exit 0

# Detect PHP/WordPress scanners
grep -E '\.(php|asp|aspx|jsp|cgi)' "$ACCESS_LOG" 2>/dev/null | \
    grep -oE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | sort | uniq -c | sort -rn | \
    while read count ip; do
        [ "$count" -ge 3 ] && block_ip "$ip" "PHP/CMS scanner ($count requests)"
    done

# Detect WordPress probing
grep -E '(wp-content|wp-includes|wp-json|wp-login|wp-admin)' "$ACCESS_LOG" 2>/dev/null | \
    grep -oE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | sort | uniq -c | sort -rn | \
    while read count ip; do
        [ "$count" -ge 2 ] && block_ip "$ip" "WP probing ($count requests)"
    done

# Detect brute force (many 4xx errors from same IP)
grep -E '" (400|403|404|405) ' "$ACCESS_LOG" 2>/dev/null | \
    grep -oE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | sort | uniq -c | sort -rn | \
    while read count ip; do
        [ "$count" -ge 50 ] && block_ip "$ip" "Brute force ($count 4xx errors)"
    done

# Detect path traversal / exploit attempts
grep -E '(\.\./|%2e%2e|<script|/etc/passwd|/proc/|\.env)' "$ACCESS_LOG" 2>/dev/null | \
    grep -oE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | sort -u | \
    while read ip; do
        block_ip "$ip" "Exploit attempt"
    done

# Reload nginx if blocklist changed
if [ -n "$(find "$BLOCKLIST" -mmin -1 2>/dev/null)" ]; then
    docker exec moami-nginx-1 nginx -s reload 2>/dev/null || true
    echo "Nginx reloaded with updated blocklist"
fi
