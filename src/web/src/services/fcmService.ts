import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getApiUrl, getFirebaseConfig } from "../config";

let messagingInstance: ReturnType<typeof getMessaging> | null = null;

function getMessagingInstance() {
  if (messagingInstance) {
    return messagingInstance;
  }

  const firebaseConfig = getFirebaseConfig();
  const app =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

  messagingInstance = getMessaging(app);
  return messagingInstance;
}

export async function registerForPushN(): Promise<void> {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return;
  }

  let registration = await navigator.serviceWorker.getRegistration(
    "/firebase-messaging-sw.js",
  );

  // change back to cons when the pwa gets here
  registration ??= await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
    );
  if (!registration) {
    return;
  }

  const { vapidKey } = getFirebaseConfig();

  const token = await getToken(getMessagingInstance(), {
    vapidKey,
  });

  if (!token) {
    return;
  }

  await fetch(`${getApiUrl()}/device-tokens`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, platform: "web" }),
  });
}

export function onForegroundMessage(
  callback: (title: string, body: string) => void,
) {
  return onMessage(getMessagingInstance(), (payload) => {
    const title = payload.notification?.title ?? "UT";
    const body = payload.notification?.body ?? "";
    callback(title, body);
  });
}
