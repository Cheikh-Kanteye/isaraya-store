import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores";
import { apiService } from "@/services/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, Trash2, CircleCheck as CheckCircle, Package, CreditCard, Star, TriangleAlert as AlertTriangle, Gift, Settings, AreaChart as MarkAsUnread } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Notification, NotificationsPagination } from "@/types";
import { cn } from "@/lib/utils";

interface NotificationDrawerProps {
  children: React.ReactNode;
}

const notificationConfig = {
  order: {
    icon: Package,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    label: "Commande",
  },
  payment: {
    icon: CreditCard,
    color: "text-green-600",
    bgColor: "bg-green-50",
    label: "Paiement",
  },
  review: {
    icon: Star,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    label: "Avis",
  },
  system: {
    icon: AlertTriangle,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    label: "Système",
  },
  promotion: {
    icon: Gift,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    label: "Promotion",
  },
  default: {
    icon: Bell,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    label: "Notification",
  },
};

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  children,
}) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isOpen, setIsOpen] = useState(false);

  const { data: notificationsData, isLoading } = useQuery<
    NotificationsPagination | Notification[]
  >({
    queryKey: ["notifications", user?.id],
    queryFn: () => apiService.notifications.getByUser(user!.id),
    enabled: !!user?.id,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  // Normaliser les données
  const notifications: Notification[] = useMemo(() => {
    if (!notificationsData) return [];
    
    if (Array.isArray(notificationsData)) {
      return notificationsData;
    }
    
    if (typeof notificationsData === "object" && "notifications" in notificationsData) {
      return notificationsData.notifications || [];
    }
    
    return [];
  }, [notificationsData]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Mutations optimistes
  const markAsReadMutation = useMutation({
    mutationFn: ({ userId, notificationId }: { userId: string; notificationId: string }) =>
      apiService.notifications.markAsRead(userId, notificationId),
    onMutate: async ({ notificationId }) => {
      // Mise à jour optimiste
      queryClient.setQueryData(
        ["notifications", user?.id],
        (oldData: Notification[] | NotificationsPagination | undefined) => {
          if (!oldData) return oldData;
          
          if (Array.isArray(oldData)) {
            return oldData.map((n) =>
              n.id === notificationId ? { ...n, read: true } : n
            );
          }
          
          if ("notifications" in oldData) {
            return {
              ...oldData,
              notifications: oldData.notifications.map((n) =>
                n.id === notificationId ? { ...n, read: true } : n
              ),
            };
          }
          
          return oldData;
        }
      );
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
      toast.error("Erreur lors du marquage comme lu");
    },
  });

  const markAsUnreadMutation = useMutation({
    mutationFn: ({ userId, notificationId }: { userId: string; notificationId: string }) =>
      apiService.notifications.markAsUnread(userId, notificationId),
    onMutate: async ({ notificationId }) => {
      queryClient.setQueryData(
        ["notifications", user?.id],
        (oldData: Notification[] | NotificationsPagination | undefined) => {
          if (!oldData) return oldData;
          
          if (Array.isArray(oldData)) {
            return oldData.map((n) =>
              n.id === notificationId ? { ...n, read: false } : n
            );
          }
          
          if ("notifications" in oldData) {
            return {
              ...oldData,
              notifications: oldData.notifications.map((n) =>
                n.id === notificationId ? { ...n, read: false } : n
              ),
            };
          }
          
          return oldData;
        }
      );
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
      toast.error("Erreur lors du marquage comme non lu");
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: ({ userId, notificationId }: { userId: string; notificationId: string }) =>
      apiService.notifications.deleteNotification(userId, notificationId),
    onMutate: async ({ notificationId }) => {
      queryClient.setQueryData(
        ["notifications", user?.id],
        (oldData: Notification[] | NotificationsPagination | undefined) => {
          if (!oldData) return oldData;
          
          if (Array.isArray(oldData)) {
            return oldData.filter((n) => n.id !== notificationId);
          }
          
          if ("notifications" in oldData) {
            return {
              ...oldData,
              notifications: oldData.notifications.filter((n) => n.id !== notificationId),
            };
          }
          
          return oldData;
        }
      );
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
      toast.error("Erreur lors de la suppression");
    },
    onSuccess: () => {
      toast.success("Notification supprimée");
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: (userId: string) => apiService.notifications.markAllAsRead(userId),
    onMutate: async () => {
      queryClient.setQueryData(
        ["notifications", user?.id],
        (oldData: Notification[] | NotificationsPagination | undefined) => {
          if (!oldData) return oldData;
          
          if (Array.isArray(oldData)) {
            return oldData.map((n) => ({ ...n, read: true }));
          }
          
          if ("notifications" in oldData) {
            return {
              ...oldData,
              notifications: oldData.notifications.map((n) => ({ ...n, read: true })),
            };
          }
          
          return oldData;
        }
      );
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
      toast.error("Erreur lors du marquage");
    },
    onSuccess: () => {
      toast.success("Toutes les notifications marquées comme lues");
    },
  });

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((n) => !n.read);
    }
    return notifications;
  }, [notifications, filter]);

  const getNotificationIcon = (type: string) => {
    const config = notificationConfig[type as keyof typeof notificationConfig] || notificationConfig.default;
    return config.icon;
  };

  const formatTime = (date: string | number) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    
    return formatDistanceToNow(notificationDate, {
      addSuffix: true,
      locale: fr,
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <div className="relative">
          {children}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white font-medium">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </SheetTrigger>
      
      <SheetContent className="w-full max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 border-b bg-gradient-to-r from-background to-accent/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-lg font-semibold">
                  Notifications
                </SheetTitle>
                {unreadCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Actions et filtres */}
          <div className="p-4 border-b bg-accent/5">
            <div className="flex items-center justify-between mb-3">
              <Tabs
                value={filter}
                onValueChange={(value) => setFilter(value as "all" | "unread")}
                className="flex-1"
              >
                <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                  <TabsTrigger value="all" className="text-xs">
                    Toutes ({notifications.length})
                  </TabsTrigger>
                  <TabsTrigger value="unread" className="text-xs">
                    Non lues ({unreadCount})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => user?.id && markAllAsReadMutation.mutate(user.id)}
                disabled={markAllAsReadMutation.isPending}
                className="w-full text-xs h-8"
              >
                <Check className="w-3 h-3 mr-2" />
                Marquer toutes comme lues
              </Button>
            )}
          </div>

          {/* Liste des notifications */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="divide-y divide-border/50">
                {filteredNotifications.map((notification) => {
                  const config = notificationConfig[notification.type as keyof typeof notificationConfig] || notificationConfig.default;
                  const IconComponent = config.icon;

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 hover:bg-accent/30 transition-colors",
                        !notification.read && "bg-blue-50/50 border-l-4 border-l-blue-400"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg", config.bgColor)}>
                          <IconComponent className={cn("w-4 h-4", config.color)} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {config.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                          
                          {(notification as any).title && (
                            <h4 className="font-medium text-sm mb-1">
                              {(notification as any).title}
                            </h4>
                          )}
                          
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            {!notification.read ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => user?.id && markAsReadMutation.mutate({
                                  userId: user.id,
                                  notificationId: notification.id
                                })}
                                disabled={markAsReadMutation.isPending}
                                className="h-7 px-2 text-xs"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Marquer lu
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => user?.id && markAsUnreadMutation.mutate({
                                  userId: user.id,
                                  notificationId: notification.id
                                })}
                                disabled={markAsUnreadMutation.isPending}
                                className="h-7 px-2 text-xs"
                              >
                                <MarkAsUnread className="w-3 h-3 mr-1" />
                                Non lu
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => user?.id && deleteNotificationMutation.mutate({
                                userId: user.id,
                                notificationId: notification.id
                              })}
                              disabled={deleteNotificationMutation.isPending}
                              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground mb-2">
                  {filter === "unread" ? "Tout est lu !" : "Aucune notification"}
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  {filter === "unread"
                    ? "Vous êtes à jour avec toutes vos notifications."
                    : "Les nouvelles notifications apparaîtront ici."}
                </p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};