import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";
import { useMerchantNotifications } from "@/hooks/useMerchantNotifications";
import { apiService } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  CreditCard,
  Package,
  Star,
  Truck,
  AlertTriangle,
  Bell,
  CheckCircle,
  ExternalLink,
  Eye,
} from "lucide-react";
import type { MerchantNotification } from "@/types";

// Configuration des notifications temps réel
const REALTIME_CONFIG = {
  POLL_INTERVAL: 15000, // 15 secondes - Plus fréquent pour les marchands
  NOTIFICATION_EXPIRY: 5 * 60 * 1000, // 5 minutes
  MAX_TOAST_DURATION: 8000, // 8 secondes pour les marchands
  CRITICAL_TOAST_DURATION: 12000, // 12 secondes pour les critiques
};

// Types de notifications avec configuration spécialisée marchands
const merchantNotificationTypes = {
  merchant_order: {
    icon: ShoppingCart,
    title: "🛒 Nouvelle commande !",
    color: "bg-blue-600",
    priority: "high",
    sound: "order",
  },
  merchant_payment: {
    icon: CreditCard,
    title: "💰 Paiement reçu",
    color: "bg-green-600",
    priority: "high",
    sound: "payment",
  },
  merchant_stock: {
    icon: Package,
    title: "📦 Alerte stock",
    color: "bg-red-600",
    priority: "urgent",
    sound: "alert",
  },
  merchant_review: {
    icon: Star,
    title: "⭐ Nouvel avis",
    color: "bg-yellow-600",
    priority: "medium",
    sound: "review",
  },
  merchant_delivery: {
    icon: Truck,
    title: "🚚 Mise à jour livraison",
    color: "bg-purple-600",
    priority: "medium",
    sound: "delivery",
  },
  merchant_system: {
    icon: AlertTriangle,
    title: "🔧 Système",
    color: "bg-orange-600",
    priority: "low",
    sound: "system",
  },
};

interface MerchantNotificationSystemProps {
  enableSound?: boolean;
  enableDesktop?: boolean;
  children?: React.ReactNode;
}

const MerchantNotificationSystem: React.FC<MerchantNotificationSystemProps> = ({
  enableSound = true,
  enableDesktop = true,
  children,
}) => {
  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    refreshNotifications,
    markAsRead,
    settings,
  } = useMerchantNotifications();

  const [lastNotificationCheck, setLastNotificationCheck] = useState<number>(
    Date.now()
  );
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const [soundEnabled, setSoundEnabled] = useState(enableSound);

  // Demander permission pour les notifications desktop
  useEffect(() => {
    if (enableDesktop && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission);
        });
      } else {
        setNotificationPermission(Notification.permission);
      }
    }
  }, [enableDesktop]);

  // Jouer des sons de notification
  const playNotificationSound = useCallback(
    (type: string) => {
      if (!soundEnabled) return;

      // Créer un contexte audio simple pour les notifications
      try {
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Différentes fréquences pour différents types
        const frequencies = {
          order: [800, 1000], // Commandes - ton montant
          payment: [600, 800], // Paiements - ton chaleureux
          alert: [400, 600, 800], // Alertes - ton d'urgence
          review: [900, 1200], // Avis - ton positif
          delivery: [700, 900], // Livraisons - ton neutre
          system: [500, 700], // Système - ton informatif
        };

        const freqs = frequencies[type as keyof typeof frequencies] || [
          600, 800,
        ];

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(freqs[0], audioContext.currentTime);
        if (freqs[1]) {
          oscillator.frequency.exponentialRampToValueAtTime(
            freqs[1],
            audioContext.currentTime + 0.1
          );
        }

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.3
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (error) {
        console.warn("Impossible de jouer le son de notification:", error);
      }
    },
    [soundEnabled]
  );

  // Afficher notification desktop
  const showDesktopNotification = useCallback(
    (notification: MerchantNotification) => {
      if (!enableDesktop || notificationPermission !== "granted") return;

      const config =
        merchantNotificationTypes[
          notification.type as keyof typeof merchantNotificationTypes
        ];

      try {
        const desktopNotification = new Notification(
          config?.title || "Notification Isaraya",
          {
            body: notification.message,
            icon: "/logo-isaraya.png", // À remplacer par votre logo
            badge: "/logo-badge.png",
            tag: notification.id,
            requireInteraction: notification.priority === "urgent",
            timestamp: new Date(notification.createdAt).getTime(),
          }
        );

        desktopNotification.onclick = () => {
          window.focus();
          if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
          }
          markAsRead(notification.id);
          desktopNotification.close();
        };

        // Auto-fermer après délai
        setTimeout(
          () => {
            desktopNotification.close();
          },
          notification.priority === "urgent"
            ? REALTIME_CONFIG.CRITICAL_TOAST_DURATION
            : REALTIME_CONFIG.MAX_TOAST_DURATION
        );
      } catch (error) {
        console.warn("Impossible d'afficher la notification desktop:", error);
      }
    },
    [enableDesktop, notificationPermission, markAsRead]
  );

  // Afficher toast personnalisé pour marchands
  const showMerchantToast = useCallback(
    (notification: MerchantNotification) => {
      const config =
        merchantNotificationTypes[
          notification.type as keyof typeof merchantNotificationTypes
        ];
      const IconComponent = config?.icon || Bell;
      const isUrgent =
        notification.priority === "urgent" || notification.priority === "high";

      const toastDuration = isUrgent
        ? REALTIME_CONFIG.CRITICAL_TOAST_DURATION
        : REALTIME_CONFIG.MAX_TOAST_DURATION;

      toast(
        <div className="flex items-start gap-3 w-full">
          <div
            className={`p-2 rounded-lg ${
              config?.color || "bg-gray-600"
            } text-white flex-shrink-0`}
          >
            <IconComponent className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">
                {config?.title || "Notification"}
              </span>
              {notification.priority && notification.priority !== "low" && (
                <Badge
                  variant={
                    notification.priority === "urgent"
                      ? "destructive"
                      : "default"
                  }
                  className="text-xs px-1 py-0"
                >
                  {notification.priority.toUpperCase()}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {notification.message}
            </p>
            {(notification.actionUrl || !notification.read) && (
              <div className="flex gap-2">
                {notification.actionUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      window.location.href = notification.actionUrl!;
                      markAsRead(notification.id);
                    }}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Voir
                  </Button>
                )}
                {!notification.read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => markAsRead(notification.id)}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Marquer lu
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>,
        {
          duration: toastDuration,
          position: "top-right",
          className: isUrgent ? "border-red-500 bg-red-50" : undefined,
          dismissible: true,
          onDismiss: () => {
            if (!notification.read) {
              markAsRead(notification.id);
            }
          },
        }
      );

      // Son de notification
      if (config?.sound) {
        playNotificationSound(config.sound);
      }

      // Notification desktop
      showDesktopNotification(notification);
    },
    [markAsRead, playNotificationSound, showDesktopNotification]
  );

  // Système de polling intelligent pour nouvelles notifications
  useEffect(() => {
    if (!realtimeEnabled || !user?.merchantProfile?.id) return;

    const vendorId = user.merchantProfile.id;
    let pollInterval: NodeJS.Timeout;
    let isPolling = false;

    const pollForNewNotifications = async () => {
      if (isPolling) return;
      isPolling = true;

      try {
        // Récupérer les notifications récentes
        const freshNotifications =
          await apiService.notifications.getMerchantNotifications(
            vendorId,
            1,
            20,
            {
              dateFrom: new Date(lastNotificationCheck).toISOString(),
            }
          );

        // Identifier les nouvelles notifications
        const currentNotificationIds = new Set(notifications.map((n) => n.id));
        const newNotifications = freshNotifications.filter(
          (n) =>
            !currentNotificationIds.has(n.id) &&
            new Date(n.createdAt).getTime() > lastNotificationCheck
        );

        // Traiter les nouvelles notifications
        for (const notification of newNotifications) {
          // Vérifier que la notification n'est pas trop ancienne
          const notificationAge =
            Date.now() - new Date(notification.createdAt).getTime();

          if (notificationAge < REALTIME_CONFIG.NOTIFICATION_EXPIRY) {
            // Vérifier les paramètres utilisateur
            const shouldShow = shouldShowNotification(notification);

            if (shouldShow) {
              showMerchantToast(notification);
            }
          }
        }

        // Mettre à jour le timestamp de dernière vérification
        if (newNotifications.length > 0) {
          setLastNotificationCheck(Date.now());
          // Rafraîchir les notifications dans le hook
          refreshNotifications();
        }
      } catch (error) {
        console.warn("Erreur lors du polling des notifications:", error);
      } finally {
        isPolling = false;
      }
    };

    // Fonction pour déterminer si une notification doit être affichée
    const shouldShowNotification = (
      notification: MerchantNotification
    ): boolean => {
      if (!settings) return true;

      // Vérifier les paramètres business
      if (settings.businessNotifications) {
        const typeMap = {
          merchant_order: "newOrders",
          merchant_payment:
            notification.data?.status === "failed"
              ? "paymentFailed"
              : "paymentReceived",
          merchant_stock:
            notification.data?.stock === 0 ? "outOfStock" : "lowStock",
          merchant_review: "newReviews",
          merchant_delivery: "deliveryUpdates",
          merchant_system: "accountUpdates",
        };

        const settingKey = typeMap[notification.type as keyof typeof typeMap];
        if (
          settingKey &&
          !settings.businessNotifications[
            settingKey as keyof typeof settings.businessNotifications
          ]
        ) {
          return false;
        }
      }

      // Vérifier les niveaux d'urgence
      if (settings.urgencyLevels) {
        const urgencyMap = {
          urgent: "criticalAlerts",
          high: "businessAlerts",
          medium: "businessAlerts",
          low: "informationalAlerts",
        };

        const urgencyKey =
          urgencyMap[
            notification.priority || ("low" as keyof typeof urgencyMap)
          ];
        if (
          !settings.urgencyLevels[
            urgencyKey as keyof typeof settings.urgencyLevels
          ]
        ) {
          return false;
        }
      }

      return true;
    };

    // Démarrer le polling
    const startPolling = () => {
      pollInterval = setInterval(
        pollForNewNotifications,
        REALTIME_CONFIG.POLL_INTERVAL
      );
    };

    // Arrêter le polling
    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };

    // Gérer la visibilité de la page
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Ralentir le polling quand la page n'est pas visible
        stopPolling();
        pollInterval = setInterval(
          pollForNewNotifications,
          REALTIME_CONFIG.POLL_INTERVAL * 2
        );
      } else {
        // Accélérer le polling quand la page redevient visible
        stopPolling();
        startPolling();
        // Vérification immédiate au retour de focus
        setTimeout(pollForNewNotifications, 1000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    startPolling();

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    realtimeEnabled,
    user,
    lastNotificationCheck,
    notifications,
    settings,
    refreshNotifications,
    showMerchantToast,
  ]);

  // Mettre à jour le timestamp quand de nouvelles notifications arrivent
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications.reduce((latest, current) =>
        new Date(current.createdAt) > new Date(latest.createdAt)
          ? current
          : latest
      );

      const latestTime = new Date(latestNotification.createdAt).getTime();
      if (latestTime > lastNotificationCheck) {
        setLastNotificationCheck(latestTime);
      }
    }
  }, [notifications, lastNotificationCheck]);

  // Indicateur d'activité du système temps réel
  const RealtimeIndicator = () => (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div
        className={`w-2 h-2 rounded-full ${
          realtimeEnabled ? "bg-green-500 animate-pulse" : "bg-gray-400"
        }`}
      />
      <span>
        {realtimeEnabled ? "Temps réel actif" : "Temps réel désactivé"}
      </span>
      {unreadCount > 0 && (
        <Badge variant="secondary" className="text-xs">
          {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
        </Badge>
      )}
    </div>
  );

  return (
    <>
      {/* Contrôles du système (optionnel) */}
      {children && (
        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg mb-4">
          <RealtimeIndicator />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-xs"
            >
              {soundEnabled ? "🔊" : "🔇"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRealtimeEnabled(!realtimeEnabled)}
              className="text-xs"
            >
              {realtimeEnabled ? "Désactiver" : "Activer"}
            </Button>
          </div>
        </div>
      )}

      {/* Contenu enfant */}
      {children}
    </>
  );
};

export default MerchantNotificationSystem;
