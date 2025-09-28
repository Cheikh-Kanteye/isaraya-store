# ISaraya Store — Note d’intégration (Frontend)

## Variables d’environnement (frontend)
- VITE_API_URL: URL du gateway API (ex: https://api.isaraya.com/api)
- VITE_MEILISEARCH_HOST: URL de Meilisearch (ex: https://search.isaraya.com)
- VITE_MEILISEARCH_API_KEY: Clé API Meilisearch
- VITE_FIREBASE_VAPID_KEY: Clé VAPID Web Push (Firebase Cloud Messaging)

Notes
- Le service worker de push est à public/firebase-messaging-sw.js. Adapter la config Firebase si vous utilisez un autre projet.
- En production seulement, le SW est enregistré et les push fonctionnent (HTTPS requis).

## Contrats d’API attendus (principaux)
Toutes les routes passent par le gateway défini dans VITE_API_URL. Le frontend accepte aussi des enveloppes standard { status: 'success', payload: ... } ou { data: ... } (déballées par l’intercepteur Axios).

### Auth
- POST /auth/login
- POST /auth/register
- POST /auth/resend-verification
- GET /auth/profile
- GET /auth/merchant/profile

### Produits / Catégories / Marques
- GET /produit (filtres supportés: categoryId, vendorId, search, _limit)
- GET /produit/:id
- PATCH /produit/:id/status
- GET /produit/categories
- GET /produit/brands
- POST /upload/image, DELETE /upload/image/:publicId
- POST /produit/upload-images (upload multiple)

### Commandes / Paiement
- GET /orders, GET /orders/:id
- GET /orders/client/:userId (préféré) ou GET /orders?clientId=...
- GET /orders/merchant (liste marchand)
- PUT /orders/status { orderId, status }
- POST /orders (création)
- POST /orders/initiate-payment -> { redirectUrl } (ou paymentUrl)
- Optionnel reprise paiement:
  - GET /orders/payment/status/:ref
  - POST /orders/payment/resume -> { redirectUrl }

### Notifications
- GET /notifications/user/:userId
- PUT /notifications/user/:userId/read/:notificationId
- PUT /notifications/user/:userId/unread/:notificationId
- PUT /notifications/user/:userId/read-all
- DELETE /notifications/user/:userId/:notificationId
- DELETE /notifications/user/:userId/read
- GET /notifications (admin)
- POST /notifications, POST /notifications/bulk
- GET /notifications/stats[/ :userId]
- FCM device registration: POST /notifications/register-device { userId, token, platform: 'web' }

### Notifications marchands
- GET /notifications/merchant/:vendorId
- GET /notifications/merchant/:vendorId/settings
- PUT /notifications/merchant/:vendorId/settings
- GET /notifications/merchant/:vendorId/stats
- POST /notifications/merchant
- PUT /notifications/merchant/:vendorId/read-all
- GET /notifications/merchant/:vendorId/unread-count

### Admin / Utilisateurs
- GET /auth/admin/stats
- GET /auth/admin/users
- PATCH /auth/admin/merchant-profiles/:vendorId/validate
- PATCH /auth/admin/merchant-profiles/:vendorId/suspend
- PATCH /auth/admin/merchant-profiles/:vendorId/reactivate

### Promotions / Codes promo (nouveau)
- Promotions
  - GET /promotions
  - POST /promotions
  - PUT /promotions/:id
  - DELETE /promotions/:id
- Codes promo
  - GET /promo-codes
  - POST /promo-codes
  - PUT /promo-codes/:id
  - DELETE /promo-codes/:id
  - POST /promo-codes/validate { code, total, items, userId } -> { code, amount? | percent? }

## Points UX front ajoutés
- Loader unifié pour états de chargement (Skeletons conservés pour les placeholders).
- Section promotions de la Home dynamique via /promotions (fallback si vide).
- Checkout prend en compte un code promo (validation + recalcul du total).
- Enregistrement du token FCM (notifications.registerDevice) après authentification.

## Checklist d’intégration rapide
1) Définir VITE_API_URL, VITE_MEILISEARCH_HOST, VITE_MEILISEARCH_API_KEY, VITE_FIREBASE_VAPID_KEY.
2) Vérifier l’existence des endpoints ci-dessus côté gateway/backend.
3) Pour les push web: cert HTTPS valide + config Firebase (apiKey, projectId...) dans public/firebase-messaging-sw.js.
4) Alimenter des promotions et codes promo pour vérifier Home et Checkout.
