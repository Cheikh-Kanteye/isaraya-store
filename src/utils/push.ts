import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "@/config/firebase";
import { apiService } from "@/services/api";

export async function initPushNotifications(userId?: string) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;
    const token = await getToken(messaging, vapidKey ? { vapidKey } : undefined);
    if (!token) return;

    if (userId) {
      try {
        await apiService.notifications.registerDevice(userId, token, "web");
      } catch (e) {
        console.warn("Failed to register device token:", e);
      }
    }

    onMessage(messaging, (payload) => {
      try {
        const title = (payload.notification?.title as string) || "Nouvelle notification";
        const body = (payload.notification?.body as string) || "Vous avez reçu une notification";
        // Optional: you can integrate with your toast system here
        console.debug("Push message received:", title, body);
      } catch (e) {
        console.warn("Error handling push message:", e);
      }
    });
  } catch (e) {
    console.warn("Push notifications init error:", e);
  }
}
