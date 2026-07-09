#!/bin/sh
set -e
: "${VITE_API_URL:?VITE_API_URL not set}"
echo "{\"apiUrl\": \"${VITE_API_URL}\"}" > /usr/share/nginx/html/config.json
exec nginx -g "daemon off;"
