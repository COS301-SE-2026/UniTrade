#!/bin/sh
set -e
: "${VITE_API_URL:?VITE_API_URL not set}"
: "${FIREBASE_API_KEY:?FIREBASE_API_KEY not set}"
: "${FIREBASE_AUTH_DOMAIN:?FIREBASE_AUTH_DOMAIN not set}"
: "${FIREBASE_PROJECT_ID:?FIREBASE_PROJECT_ID not set}"
: "${FIREBASE_SENDER_ID:?FIREBASE_SENDER_ID not set}"
: "${FIREBASE_APP_ID:?FIREBASE_APP_ID not set}"
: "${FIREBASE_VAPID_KEY:?FIREBASE_VAPID_KEY not set}"


cat > /usr/share/nginx/html/config.json << EOF  
{
    "apiUrl": "${VITE_API_URL}",
    "firebase":{
    "apiKey": "${FIREBASE_API_KEY}",
    "authDomain": "${FIREBASE_AUTH_DOMAIN}",
    "projectId": "${FIREBASE_PROJECT_ID}",
    "messagingSenderId": "${FIREBASE_SENDER_ID}",
    "appId": "${FIREBASE_APP_ID}",
    "vapidKey": "${FIREBASE_VAPID_KEY}"
    }
}
EOF

exec nginx -g "daemon off;"
