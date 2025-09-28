// [firebase-messaging-sw.js]
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js"
);

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBnZkSH2oc5hVg6XbGLVbgfFPOgX31-XzY",
  authDomain: "isaraya-store.firebaseapp.com",
  projectId: "isaraya-store",
  storageBucket: "isaraya-store.firebasestorage.app",
  messagingSenderId: "712061028669",
  appId: "1:712061028669:web:a370e7041e477f607e1d54"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);

// Récupérer l'instance de messaging
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  
  try {
    const notificationTitle = payload.notification?.title || 'Nouvelle notification';
    const notificationOptions = {
      body: payload.notification?.body || 'Vous avez reçu une nouvelle notification',
      icon: "/logo.png",
      badge: "/logo.png",
      tag: 'isaraya-notification',
      requireInteraction: false,
      data: payload.data || {}
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Error showing notification:', error);
  }
});
