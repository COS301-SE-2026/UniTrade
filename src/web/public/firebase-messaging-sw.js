importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js", 
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js",
);

self.__WB_MANIFEST;

firebase.initializeApp({
  apiKey: "AIzaSyDuFf0srxj0BURaw-GbbUuJr9a5cJLKCsA",
  authDomain: "unitrade-684e8.firebaseapp.com",
  projectId: "unitrade-684e8",
  messagingSenderId: "933114054015",
  appId: "1:933114054015:web:6ea5450ccab9843405464a",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification?.title ?? "UT", {
    body: payload.notification?.body,
    icon: "/favicon.svg",
  });
});
