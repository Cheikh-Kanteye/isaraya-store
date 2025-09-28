import { useState, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check } from "lucide-react";
import NotificationItem from "@/components/dashboard/shared/NotificationItem";
import type { Notification, NotificationsPagination } from "@/types";

// Récupération des notifications depuis le backend

interface NotificationsDrawerProps {
  children: React.ReactNode; // Le trigger pour ouvrir le drawer
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  children,
}) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: notificationsData } = useQuery<
    NotificationsPagination | Notification[]
  >({
    queryKey: ["notifications", user?.id],
    queryFn: () => apiService.notifications.getByUser(user!.id),
    enabled: !!user?.id,
  });

  // Normaliser les données - gérer les deux formats possibles
  const notifications: Notification[] = useMemo(() => {
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
      return notificationsData.notifications || [];
    }

    return [];
  }, [notificationsData]);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const markAsReadMutation = useMutation({
    mutationFn: ({
      userId,
      notificationId,
    }: {
      userId: string;
      notificationId: string;
    }) => apiService.notifications.markAsRead(userId, notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  const handleMarkAsRead = (id: string) => {
    if (!user?.id) return;
    markAsReadMutation.mutate({ userId: user.id, notificationId: id });
  };

  const handleMarkAllAsRead = () => {
    if (!Array.isArray(notifications)) return;
    notifications.forEach((n) => !n.read && handleMarkAsRead(n.id));
  };

  const filteredNotifications = useMemo(() => {
    if (!Array.isArray(notifications)) return [];
    if (filter === "unread") {
      return notifications.filter((n) => !n.read);
    }
    return notifications;
  }, [notifications, filter]);

  const unreadCount = useMemo(() => {
    if (!Array.isArray(notifications)) return 0;
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="relative">
          {children}
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </div>
      </SheetTrigger>
      <SheetContent className="w-full max-w-md p-0 flex flex-col bg-background">
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
          {/* Filtres et Actions */}
          <div className="p-4 border-b bg-accent/5">
            <div className="flex items-center justify-between mb-3">
              <Tabs
                defaultValue="all"
                onValueChange={(value) => setFilter(value as "all" | "unread")}
                className="flex-1"
              >
                <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                  <TabsTrigger value="all" className="text-xs">
                    Tout ({notifications.length})
                  </TabsTrigger>
                  <TabsTrigger value="unread" className="text-xs">
                    Non lues ({unreadCount})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {/* Actions rapides */}
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="w-full text-xs h-8"
              >
                <Check className="w-3 h-3 mr-2" />
                Marquer toutes comme lues
              </Button>
            )}
          </div>
          {/* Liste des notifications */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length > 0 ? (
              <div className="divide-y divide-border/50">
                {filteredNotifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
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
