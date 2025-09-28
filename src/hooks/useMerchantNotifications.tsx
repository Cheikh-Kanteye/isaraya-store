import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/stores";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import type {
  MerchantNotification,
  MerchantNotificationSettings,
  MerchantNotificationFilters,
  MerchantNotificationStats,
  CreateMerchantNotificationDto,
} from "@/types";

interface MerchantNotificationContextType {
  // États
  notifications: MerchantNotification[];
  unreadCount: number;
  stats: MerchantNotificationStats | null;
  isLoading: boolean;
  settings: MerchantNotificationSettings | null;

  // Actions
  markAsRead: (notificationId: string) => Promise<void>;
  markAsUnread: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  createNotification: (
    notification: Omit<CreateMerchantNotificationDto, "userId" | "vendorId">
  ) => Promise<void>;
  refreshNotifications: () => Promise<void>;

  // Filtrage et recherche
  getFilteredNotifications: (
    filters?: MerchantNotificationFilters
  ) => MerchantNotification[];
  getNotificationsByCategory: (category: string) => MerchantNotification[];
  getNotificationsByPriority: (priority: string) => MerchantNotification[];
  getUnreadNotifications: () => MerchantNotification[];
  getTodayNotifications: () => MerchantNotification[];

  // Paramètres
  updateSettings: (
    settings: Partial<MerchantNotificationSettings>
  ) => Promise<void>;

  // Statistiques
  getStatsByTimeframe: (days: number) => {
    total: number;
    unread: number;
    categories: Record<string, number>;
  };
}

const MerchantNotificationContext = createContext<
  MerchantNotificationContextType | undefined
>(undefined);

interface MerchantNotificationProviderProps {
  children: ReactNode;
  enableRealTime?: boolean;
  refreshInterval?: number;
}

export const MerchantNotificationProvider: React.FC<
  MerchantNotificationProviderProps
> = ({
  children,
  enableRealTime = true,
  refreshInterval = 15000, // 15 secondes pour les marchands (plus fréquent)
}) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Obtenir l'ID du marchand depuis le profil utilisateur
  const vendorId = user?.merchantProfile?.id;

  // Récupération des notifications marchands
  const {
    data: notifications = [],
    isLoading,
    refetch: refreshNotifications,
  } = useQuery<MerchantNotification[]>({
    queryKey: ["merchantNotifications", vendorId],
    queryFn: () =>
      vendorId
        ? apiService.notifications.getMerchantNotifications(vendorId)
        : Promise.resolve([]),
    enabled: !!vendorId,
    refetchInterval: enableRealTime ? refreshInterval : false,
    refetchIntervalInBackground: true,
  });

  // Récupération des paramètres spécifiques marchands
  const { data: settings } = useQuery<MerchantNotificationSettings | null>({
    queryKey: ["merchantNotificationSettings", vendorId],
    queryFn: () =>
      vendorId
        ? apiService.notifications.getMerchantSettings(vendorId)
        : Promise.resolve(null),
    enabled: !!vendorId,
  });

  // Récupération des statistiques
  const { data: stats } = useQuery<MerchantNotificationStats | null>({
    queryKey: ["merchantNotificationStats", vendorId],
    queryFn: () =>
      vendorId
        ? apiService.notifications.getMerchantStats(vendorId)
        : Promise.resolve(null),
    enabled: !!vendorId,
    refetchInterval: 60000, // Mettre à jour toutes les minutes
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Surveiller les nouvelles notifications critiques et afficher des toasts
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0);

  useEffect(() => {
    if (unreadCount > previousUnreadCount && previousUnreadCount > 0) {
      const newNotifications = notifications
        .filter((n) => !n.read)
        .slice(0, unreadCount - previousUnreadCount);

      newNotifications.forEach((notification) => {
        // Afficher uniquement les notifications récentes (moins de 5 minutes pour les marchands)
        const notificationAge =
          Date.now() - new Date(notification.createdAt).getTime();
        if (notificationAge < 5 * 60 * 1000) {
          // Toast spéciaux pour les notifications critiques
          const isUrgent =
            notification.priority === "urgent" ||
            notification.priority === "high";

          toast(notification.title || getNotificationTitle(notification.type), {
            description: notification.message,
            duration: isUrgent ? 10000 : 5000, // Plus long pour les notifications urgentes
            action: notification.actionUrl
              ? {
                  label: "Voir",
                  onClick: () => {
                    markAsRead(notification.id);
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl;
                    }
                  },
                }
              : {
                  label: "Marquer comme lu",
                  onClick: () => markAsRead(notification.id),
                },
            className: isUrgent ? "border-red-500 bg-red-50" : undefined,
          });
        }
      });
    }
    setPreviousUnreadCount(unreadCount);
  }, [unreadCount, notifications, previousUnreadCount]);

  // Fonction helper pour les titres
  const getNotificationTitle = (type: string): string => {
    const titles: Record<string, string> = {
      merchant_order: "🛍️ Nouvelle commande",
      merchant_payment: "💰 Paiement reçu",
      merchant_review: "⭐ Nouvel avis",
      merchant_stock: "📦 Alerte stock",
      merchant_system: "🔧 Mise à jour système",
      merchant_delivery: "🚚 Livraison",
    };
    return titles[type] || "Notification";
  };

  // Actions
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!vendorId || !user?.id) return;

      try {
        await apiService.notifications.markAsRead(user.id, notificationId);
        queryClient.invalidateQueries({
          queryKey: ["merchantNotifications", vendorId],
        });
        queryClient.invalidateQueries({
          queryKey: ["merchantNotificationStats", vendorId],
        });
      } catch (error) {
        console.error("Erreur lors du marquage comme lu:", error);
        toast.error("Impossible de marquer la notification comme lue");
      }
    },
    [vendorId, user?.id, queryClient]
  );

  const markAsUnread = useCallback(
    async (notificationId: string) => {
      if (!vendorId || !user?.id) return;

      try {
        await apiService.notifications.markAsUnread(user.id, notificationId);
        queryClient.invalidateQueries({
          queryKey: ["merchantNotifications", vendorId],
        });
        queryClient.invalidateQueries({
          queryKey: ["merchantNotificationStats", vendorId],
        });
      } catch (error) {
        console.error("Erreur lors du marquage comme non lu:", error);
        toast.error("Impossible de marquer la notification comme non lue");
      }
    },
    [vendorId, user?.id, queryClient]
  );

  const markAllAsRead = useCallback(async () => {
    if (!vendorId || !user?.id) return;

    try {
      await apiService.notifications.markAllMerchantAsRead(vendorId);
      queryClient.invalidateQueries({
        queryKey: ["merchantNotifications", vendorId],
      });
      queryClient.invalidateQueries({
        queryKey: ["merchantNotificationStats", vendorId],
      });
      toast.success("Toutes les notifications ont été marquées comme lues");
    } catch (error) {
      console.error("Erreur lors du marquage de toutes comme lues:", error);
      toast.error("Impossible de marquer toutes les notifications comme lues");
    }
  }, [vendorId, user?.id, queryClient]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!vendorId || !user?.id) return;

      try {
        await apiService.notifications.deleteNotification(
          user.id,
          notificationId
        );
        queryClient.invalidateQueries({
          queryKey: ["merchantNotifications", vendorId],
        });
        queryClient.invalidateQueries({
          queryKey: ["merchantNotificationStats", vendorId],
        });
        toast.success("Notification supprimée");
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        toast.error("Impossible de supprimer la notification");
      }
    },
    [vendorId, user?.id, queryClient]
  );

  const createNotification = useCallback(
    async (
      notificationData: Omit<
        CreateMerchantNotificationDto,
        "userId" | "vendorId"
      >
    ) => {
      if (!vendorId || !user?.id) return;

      try {
        const fullNotificationData: CreateMerchantNotificationDto = {
          ...notificationData,
          userId: user.id,
          vendorId: vendorId,
        };

        await apiService.notifications.createMerchantNotification(
          fullNotificationData
        );
        queryClient.invalidateQueries({
          queryKey: ["merchantNotifications", vendorId],
        });
        queryClient.invalidateQueries({
          queryKey: ["merchantNotificationStats", vendorId],
        });
        toast.success("Notification créée");
      } catch (error) {
        console.error("Erreur lors de la création:", error);
        toast.error("Impossible de créer la notification");
      }
    },
    [vendorId, user?.id, queryClient]
  );

  const updateSettings = useCallback(
    async (newSettings: Partial<MerchantNotificationSettings>) => {
      if (!vendorId || !user?.id) return;

      try {
        await apiService.notifications.updateMerchantSettings(
          vendorId,
          newSettings
        );
        queryClient.invalidateQueries({
          queryKey: ["merchantNotificationSettings", vendorId],
        });
        toast.success("Paramètres mis à jour");
      } catch (error) {
        console.error("Erreur lors de la mise à jour des paramètres:", error);
        toast.error("Impossible de mettre à jour les paramètres");
      }
    },
    [vendorId, user?.id, queryClient]
  );

  // Filtrage et recherche
  const getFilteredNotifications = useCallback(
    (filters?: MerchantNotificationFilters): MerchantNotification[] => {
      if (!filters) return notifications;

      return notifications.filter((notification) => {
        // Filtre par type
        if (filters.type?.length && !filters.type.includes(notification.type)) {
          return false;
        }

        // Filtre par catégorie
        if (
          filters.category?.length &&
          !filters.category.includes(notification.category)
        ) {
          return false;
        }

        // Filtre par statut lu/non lu
        if (filters.read !== undefined && notification.read !== filters.read) {
          return false;
        }

        // Filtre par priorité
        if (
          filters.priority?.length &&
          !filters.priority.includes(notification.priority || "low")
        ) {
          return false;
        }

        // Filtre par type d'entité liée
        if (
          filters.relatedEntityType?.length &&
          !filters.relatedEntityType.includes(notification.relatedEntityType!)
        ) {
          return false;
        }

        // Filtre par date
        const notificationDate = new Date(notification.createdAt);
        if (filters.dateFrom && notificationDate < new Date(filters.dateFrom)) {
          return false;
        }
        if (filters.dateTo && notificationDate > new Date(filters.dateTo)) {
          return false;
        }

        return true;
      });
    },
    [notifications]
  );

  const getNotificationsByCategory = useCallback(
    (category: string) => {
      return notifications.filter((n) => n.category === category);
    },
    [notifications]
  );

  const getNotificationsByPriority = useCallback(
    (priority: string) => {
      return notifications.filter((n) => (n.priority || "low") === priority);
    },
    [notifications]
  );

  const getUnreadNotifications = useCallback(() => {
    return notifications.filter((n) => !n.read);
  }, [notifications]);

  const getTodayNotifications = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return notifications.filter((n) => {
      const notificationDate = new Date(n.createdAt);
      return notificationDate >= today;
    });
  }, [notifications]);

  const getStatsByTimeframe = useCallback(
    (days: number) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const filteredNotifications = notifications.filter(
        (n) => new Date(n.createdAt) >= cutoffDate
      );

      return {
        total: filteredNotifications.length,
        unread: filteredNotifications.filter((n) => !n.read).length,
        categories: filteredNotifications.reduce((acc, n) => {
          acc[n.category] = (acc[n.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };
    },
    [notifications]
  );

  const contextValue: MerchantNotificationContextType = {
    notifications,
    unreadCount,
    stats,
    isLoading,
    settings,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refreshNotifications: async () => {
      await refreshNotifications();
    },
    getFilteredNotifications,
    getNotificationsByCategory,
    getNotificationsByPriority,
    getUnreadNotifications,
    getTodayNotifications,
    getStatsByTimeframe,
    updateSettings,
  };

  return (
    <MerchantNotificationContext.Provider value={contextValue}>
      {children}
    </MerchantNotificationContext.Provider>
  );
};

export const useMerchantNotifications = (): MerchantNotificationContextType => {
  const context = useContext(MerchantNotificationContext);
  if (!context) {
    throw new Error(
      "useMerchantNotifications must be used within a MerchantNotificationProvider"
    );
  }
  return context;
};

// Hook simplifié pour juste le nombre de notifications non lues des marchands
export const useMerchantUnreadCount = (): number => {
  const { unreadCount } = useMerchantNotifications();
  return unreadCount;
};

// Hook pour les statistiques rapides
export const useMerchantNotificationStats = () => {
  const { notifications, stats } = useMerchantNotifications();

  return {
    total: notifications.length,
    unread: notifications.filter((n) => !n.read).length,
    urgent: notifications.filter((n) => n.priority === "urgent").length,
    byCategory: notifications.reduce((acc, n) => {
      acc[n.category] = (acc[n.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    todayCount: notifications.filter((n) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(n.createdAt) >= today;
    }).length,
    fullStats: stats,
  };
};

export default useMerchantNotifications;
