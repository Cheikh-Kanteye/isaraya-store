import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Package,
  CreditCard,
  Tag,
  AlertCircle,
  CheckCircle,
  Trash2,
  BellDot,
  Gift,
  Settings,
  Filter,
  AlertTriangle,
  Star,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores";
import { apiService } from "@/services/api";
import NotificationSettings from "../shared/NotificationSettings";
import type { Notification as ApiNotification, NotificationFilters } from "@/types";

const Notifications = () => {
  // Log component mount for debugging
  useEffect(() => {
    console.log('Notifications component mounted');
    return () => {
      console.log('Notifications component unmounted');
    };
  }, []);

  // Error boundary-like effect to catch and log any unhandled errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Unhandled error in Notifications component:', event.error);
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection in Notifications component:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showSettings, setShowSettings] = useState(false);

  const { data: notificationsData, isLoading, error } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => apiService.notifications.getByUser(user!.id),
    enabled: !!user?.id,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Normaliser les données - gérer les deux formats possibles
  const notifications: ApiNotification[] = useMemo(() => {
    if (!notificationsData) {
      return [];
    }

    // Si c'est un tableau, retourner directement
    if (Array.isArray(notificationsData)) {
      return notificationsData;
    }

    // Si c'est un objet paginé, extraire le tableau de notifications
    if (
      typeof notificationsData === "object" &&
      "notifications" in notificationsData
    ) {
      return (notificationsData as any).notifications || [];
    }

    return [];
  }, [notificationsData]);

  const markAsReadMutation = useMutation({
    mutationFn: ({ userId, notificationId }: { userId: string; notificationId: string }) =>
      apiService.notifications.markAsRead(userId, notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
    onError: (error) => {
      console.error('Failed to mark notification as read:', error);
    },
  });

  const filteredNotifications = useMemo(() => {
    if (!Array.isArray(notifications)) return [];
    
    try {
      let filtered = [...notifications]; // Créer une copie pour éviter les mutations
      
      // Filtre par statut lu/non lu
      if (filter === "unread") {
        filtered = filtered.filter((n) => n && typeof n.read === 'boolean' && !n.read);
      }
      if (filter === "read") {
        filtered = filtered.filter((n) => n && typeof n.read === 'boolean' && n.read);
      }
      
      // Filtre par type
      if (typeFilter !== "all") {
        filtered = filtered.filter((n) => n && n.type === typeFilter);
      }
      
      // Filtre par priorité avec vérification sécurisée
      if (priorityFilter !== "all") {
        filtered = filtered.filter((n) => {
          if (!n) return false;
          const priority = (n as any).priority;
          return priority === priorityFilter;
        });
      }
      
      return filtered;
    } catch (error) {
      console.error('Error filtering notifications:', error);
      return [];
    }
  }, [notifications, filter, typeFilter, priorityFilter]);

  const unreadCount = useMemo(() => {
    if (!Array.isArray(notifications)) return 0;
    try {
      return notifications.filter((n) => n && typeof n.read === 'boolean' && !n.read).length;
    } catch (error) {
      console.error('Error calculating unread count:', error);
      return 0;
    }
  }, [notifications]);

  const formatDate = (dateInput: string | number) => {
    try {
      if (!dateInput) return "Date inconnue";
      
      const date = new Date(dateInput);
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return "Date invalide";
      }
      
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

      if (diffInHours < 1) return "À l'instant";
      if (diffInHours < 24) return `Il y a ${diffInHours}h`;
      if (diffInHours < 48) return "Hier";
      
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateInput);
      return "Date invalide";
    }
  };

  const getNotificationIcon = (type: string, priority?: string) => {
    const getPriorityColor = (p?: string) => {
      switch (p) {
        case "urgent": return "text-red-500";
        case "high": return "text-orange-500";
        case "medium": return "text-yellow-500";
        case "low": return "text-gray-500";
        default: return "text-primary";
      }
    };
    
    const colorClass = getPriorityColor(priority);
    
    switch (type) {
      case "order":
        return <Package className={`h-5 w-5 ${colorClass}`} />;
      case "review":
        return <Star className={`h-5 w-5 ${colorClass}`} />;
      case "system":
        return <AlertTriangle className={`h-5 w-5 ${colorClass}`} />;
      case "stock":
        return <AlertCircle className={`h-5 w-5 ${colorClass}`} />;
      case "payment":
        return <CreditCard className={`h-5 w-5 ${colorClass}`} />;
      case "promotion":
        return <Gift className={`h-5 w-5 ${colorClass}`} />;
      default:
        return <Bell className={`h-5 w-5 ${colorClass}`} />;
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    if (!user?.id || !notificationId) {
      console.warn('Cannot mark notification as read: missing user ID or notification ID');
      return;
    }
    try {
      markAsReadMutation.mutate({ userId: user.id, notificationId });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAsUnreadMutation = useMutation({
    mutationFn: ({ userId, notificationId }: { userId: string; notificationId: string }) =>
      apiService.notifications.markAsUnread(userId, notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
    onError: (error) => {
      console.error('Failed to mark notification as unread:', error);
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: ({ userId, notificationId }: { userId: string; notificationId: string }) =>
      apiService.notifications.deleteNotification(userId, notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
    onError: (error) => {
      console.error('Failed to delete notification:', error);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: (userId: string) => apiService.notifications.markAllAsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
    onError: (error) => {
      console.error('Failed to mark all notifications as read:', error);
    },
  });

  const deleteAllReadMutation = useMutation({
    mutationFn: (userId: string) => apiService.notifications.deleteAllRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
    onError: (error) => {
      console.error('Failed to delete all read notifications:', error);
    },
  });

  const handleMarkAsUnread = (notificationId: string) => {
    if (!user?.id || !notificationId) {
      console.warn('Cannot mark notification as unread: missing user ID or notification ID');
      return;
    }
    try {
      markAsUnreadMutation.mutate({ userId: user.id, notificationId });
    } catch (error) {
      console.error('Error marking notification as unread:', error);
    }
  };

  const handleDelete = (notificationId: string) => {
    if (!user?.id || !notificationId) {
      console.warn('Cannot delete notification: missing user ID or notification ID');
      return;
    }
    try {
      deleteNotificationMutation.mutate({ userId: user.id, notificationId });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAllAsRead = () => {
    if (!user?.id) {
      console.warn('Cannot mark all as read: missing user ID');
      return;
    }
    try {
      markAllAsReadMutation.mutate(user.id);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleClearAll = () => {
    if (!user?.id) {
      console.warn('Cannot clear all: missing user ID');
      return;
    }
    try {
      deleteAllReadMutation.mutate(user.id);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Restez informé de l'activité de votre compte
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleMarkAllAsRead} 
                  disabled={isLoading || markAllAsReadMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Tout marquer comme lu
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearAll} 
                disabled={isLoading || deleteAllReadMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer lues
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtres avancés */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filtres:</span>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="order">Commandes</SelectItem>
                <SelectItem value="payment">Paiements</SelectItem>
                <SelectItem value="promotion">Promotions</SelectItem>
                <SelectItem value="system">Système</SelectItem>
                <SelectItem value="review">Avis</SelectItem>
                <SelectItem value="stock">Stock</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="urgent">🔴 Urgent</SelectItem>
                <SelectItem value="high">🟠 Élevée</SelectItem>
                <SelectItem value="medium">🟡 Moyenne</SelectItem>
                <SelectItem value="low">⚪ Faible</SelectItem>
              </SelectContent>
            </Select>
            {(typeFilter !== "all" || priorityFilter !== "all") && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setTypeFilter("all");
                  setPriorityFilter("all");
                }}
              >
                Réinitialiser
              </Button>
            )}
          </div>

          <Tabs value={filter} onValueChange={(value) => setFilter(value as "all" | "unread" | "read")}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Toutes ({notifications.length})</TabsTrigger>
              <TabsTrigger value="unread">Non lues ({unreadCount})</TabsTrigger>
              <TabsTrigger value="read">Lues ({notifications.length - unreadCount})</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-6">
              {error ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                  <h3 className="text-lg font-medium mb-2 text-red-700">Erreur de chargement</h3>
                  <p className="text-muted-foreground mb-4">
                    Impossible de charger les notifications. Vérifiez votre connexion.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                  >
                    Actualiser la page
                  </Button>
                </div>
              ) : isLoading ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                  <h3 className="text-lg font-medium mb-2">Chargement...</h3>
                  <p className="text-muted-foreground">Récupération de vos notifications</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Aucune notification</h3>
                  <p className="text-muted-foreground">
                    {filter === "unread"
                      ? "Vous n'avez aucune notification non lue."
                      : filter === "read"
                      ? "Vous n'avez aucune notification lue."
                      : "Vous n'avez aucune notification."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => {
                    // Vérification de sécurité avant le rendu
                    if (!notification || !notification.id) {
                      console.warn('Invalid notification found:', notification);
                      return null;
                    }
                    
                    return (
                    <Card
                      key={notification.id}
                      className={`border transition-colors ${notification.read === false ? "bg-primary/5 border-primary/20" : ""}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type || 'system', (notification as any).priority)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {(notification as any).title && (
                                    <h4 className="font-medium text-foreground">
                                      {String((notification as any).title)}
                                    </h4>
                                  )}
                                  {(notification as any).priority && (notification as any).priority !== "low" && (
                                    <Badge variant={
                                      (notification as any).priority === "urgent" ? "destructive" :
                                      (notification as any).priority === "high" ? "default" : "secondary"
                                    } className="text-xs px-1 py-0">
                                      {(notification as any).priority === "urgent" ? "URGENT" :
                                       (notification as any).priority === "high" ? "IMPORTANT" : "MOYEN"}
                                    </Badge>
                                  )}
                                  {notification.read === false && (
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                  )}
                                </div>
                                <p className="text-sm text-foreground mb-1">
                                  {notification.message || 'Notification sans message'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(notification.createdAt)}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 ml-4">
                                {notification.read === false ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    disabled={markAsReadMutation.isPending}
                                    title="Marquer comme lu"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsUnread(notification.id)}
                                    disabled={markAsUnreadMutation.isPending}
                                    title="Marquer comme non lu"
                                  >
                                    <BellDot className="h-4 w-4" />
                                  </Button>
                                )}

                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDelete(notification.id)}
                                  disabled={deleteNotificationMutation.isPending}
                                  title="Supprimer cette notification"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  }).filter(Boolean)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Paramètres de notifications - affichage conditionnel */}
      {showSettings && user?.id && (
        <NotificationSettings 
          userId={user.id}
          onSettingsUpdate={() => {
            try {
              // Optionnel: rafraîchir les notifications après mise à jour des paramètres
              queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
            } catch (error) {
              console.error('Error invalidating queries:', error);
            }
          }}
        />
      )}
    </div>
  );
};

export default Notifications;
