import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useCallback, 
  ReactNode 
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import type { 
  Notification, 
  NotificationSettings, 
  NotificationFilters,
  NotificationsPagination 
} from '@/types';

interface NotificationContextType {
  // États
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  settings: NotificationSettings | null;
  
  // Actions
  markAsRead: (notificationId: string) => Promise<void>;
  markAsUnread: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  
  // Filtrage
  getFilteredNotifications: (filters?: NotificationFilters) => Notification[];
  
  // Paramètres
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  enableRealTime?: boolean;
  refreshInterval?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  enableRealTime = true,
  refreshInterval = 30000, // 30 secondes par défaut
}) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Récupération des notifications
  const { 
    data: notificationsData = [], 
    isLoading,
    refetch: refreshNotifications 
  } = useQuery<Notification[]>({
    queryKey: ['notifications', user?.id],
    queryFn: () => user?.id ? apiService.notifications.getByUser(user.id) : Promise.resolve([]),
    enabled: !!user?.id,
    refetchInterval: enableRealTime ? refreshInterval : false,
    refetchIntervalInBackground: true,
  });

  // Récupération des paramètres
  const { data: settings } = useQuery<NotificationSettings | null>({
    queryKey: ['notificationSettings', user?.id],
    queryFn: () => user?.id ? apiService.notifications.getSettings(user.id) : Promise.resolve(null),
    enabled: !!user?.id,
  });

  // Normaliser les données (gérer les réponses paginées ou array)
  const notifications = Array.isArray(notificationsData) 
    ? notificationsData 
    : (notificationsData as NotificationsPagination)?.notifications || [];

  const unreadCount = notifications.filter(n => !n.read).length;

  // Surveiller les nouvelles notifications et afficher des toasts
  const [previousUnreadCount, setPreviousUnreadCount] = useState(0);
  
  useEffect(() => {
    if (unreadCount > previousUnreadCount && previousUnreadCount > 0) {
      const newNotifications = notifications
        .filter(n => !n.read)
        .slice(0, unreadCount - previousUnreadCount);
        
      newNotifications.forEach(notification => {
        // Afficher uniquement les notifications récentes (moins de 2 minutes)
        const notificationAge = Date.now() - new Date(notification.createdAt).getTime();
        if (notificationAge < 2 * 60 * 1000) { // 2 minutes
          toast(notification.title || 'Nouvelle notification', {
            description: notification.message,
            duration: 5000,
            action: {
              label: 'Voir',
              onClick: () => markAsRead(notification.id),
            },
          });
        }
      });
    }
    setPreviousUnreadCount(unreadCount);
  }, [unreadCount, notifications, previousUnreadCount]);

  // Le refetchInterval de useQuery ci-dessus gère déjà le "temps réel" côté client.
  // On supprime le polling custom pour éviter les doublons qui provoquent des boucles de fetch.
  // Si vous souhaitez activer un vrai canal temps réel (SSE/WebSocket), on pourra l'ajouter ici plus tard.

  // Actions
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user?.id) return;
    
    try {
      await apiService.notifications.markAsRead(user.id, notificationId);
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      toast.error('Impossible de marquer la notification comme lue');
    }
  }, [user?.id, queryClient]);

  const markAsUnread = useCallback(async (notificationId: string) => {
    if (!user?.id) return;
    
    try {
      await apiService.notifications.markAsUnread(user.id, notificationId);
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
    } catch (error) {
      console.error('Erreur lors du marquage comme non lu:', error);
      toast.error('Impossible de marquer la notification comme non lue');
    }
  }, [user?.id, queryClient]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      await apiService.notifications.markAllAsRead(user.id);
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      toast.success('Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      console.error('Erreur lors du marquage de toutes comme lues:', error);
      toast.error('Impossible de marquer toutes les notifications comme lues');
    }
  }, [user?.id, queryClient]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user?.id) return;
    
    try {
      await apiService.notifications.deleteNotification(user.id, notificationId);
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      toast.success('Notification supprimée');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Impossible de supprimer la notification');
    }
  }, [user?.id, queryClient]);

  const deleteAllRead = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      await apiService.notifications.deleteAllRead(user.id);
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      toast.success('Toutes les notifications lues ont été supprimées');
    } catch (error) {
      console.error('Erreur lors de la suppression des notifications lues:', error);
      toast.error('Impossible de supprimer les notifications lues');
    }
  }, [user?.id, queryClient]);

  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    if (!user?.id) return;
    
    try {
      await apiService.notifications.updateSettings(user.id, newSettings);
      queryClient.invalidateQueries({ queryKey: ['notificationSettings', user.id] });
      toast.success('Paramètres mis à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      toast.error('Impossible de mettre à jour les paramètres');
    }
  }, [user?.id, queryClient]);

  const getFilteredNotifications = useCallback((filters?: NotificationFilters): Notification[] => {
    if (!filters) return notifications;
    
    return notifications.filter(notification => {
      // Filtre par type
      if (filters.type?.length && !filters.type.includes(notification.type)) {
        return false;
      }
      
      // Filtre par statut lu/non lu
      if (filters.read !== undefined && notification.read !== filters.read) {
        return false;
      }
      
      // Filtre par priorité
      if (filters.priority?.length) {
        const notificationPriority = (notification as any).priority || 'low';
        if (!filters.priority.includes(notificationPriority)) {
          return false;
        }
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
  }, [notifications]);

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    settings,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    refreshNotifications: async () => {
      await refreshNotifications();
    },
    getFilteredNotifications,
    updateSettings,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Hook simplifié pour juste le nombre de notifications non lues
export const useUnreadNotificationCount = (): number => {
  const { unreadCount } = useNotifications();
  return unreadCount;
};

// Hook pour les statistiques de notifications
export const useNotificationStats = () => {
  const { notifications } = useNotifications();
  
  return {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    byType: notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byPriority: notifications.reduce((acc, n) => {
      const priority = (n as any).priority || 'low';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
};

export default useNotifications;