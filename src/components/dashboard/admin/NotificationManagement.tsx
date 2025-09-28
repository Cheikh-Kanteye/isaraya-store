import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores";
import { apiService } from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bell,
  Users,
  Send,
  Plus,
  Filter,
  Eye,
  Trash2,
  BarChart3,
  MessageSquare,
  AlertTriangle,
  Gift,
  Package,
  CreditCard,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { 
  Notification, 
  CreateNotificationDto, 
  NotificationFilters,
  NotificationsPagination,
  AdminUser
} from "@/types";

const NotificationManagement = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  // États locaux
  const [selectedTab, setSelectedTab] = useState("notifications");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [filters, setFilters] = useState<NotificationFilters & { userId?: string }>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Nouvelle notification
  const [newNotification, setNewNotification] = useState<Partial<CreateNotificationDto>>({
    type: "system",
    priority: "medium",
  });

  // Récupérer toutes les notifications (admin)
  const { 
    data: notificationsPaginated, 
    isLoading: isLoadingNotifications 
  } = useQuery<NotificationsPagination>({
    queryKey: ["admin-notifications", page, limit, filters],
    queryFn: () => apiService.notifications.getAllForAdmin(page, limit, filters),
    enabled: !!user?.id,
  });

  // Récupérer les utilisateurs pour la création de notifications
  const { data: users = [] } = useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: () => apiService.users.getAdminUsers(),
    enabled: !!user?.id,
  });

  // Récupérer les statistiques de notifications
  const { data: notificationStats } = useQuery({
    queryKey: ["admin-notification-stats"],
    queryFn: () => apiService.notifications.getNotificationStats(),
    enabled: !!user?.id,
  });

  // Mutations
  const createNotificationMutation = useMutation({
    mutationFn: (data: CreateNotificationDto) =>
      apiService.notifications.createNotification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notification-stats"] });
      toast.success("Notification créée avec succès");
      setShowCreateDialog(false);
      resetCreateForm();
    },
    onError: () => {
      toast.error("Erreur lors de la création de la notification");
    },
  });

  const createBulkNotificationMutation = useMutation({
    mutationFn: ({ userIds, notification }: { 
      userIds: string[]; 
      notification: Omit<CreateNotificationDto, 'userId'>; 
    }) =>
      apiService.notifications.createBulkNotification(userIds, notification),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notification-stats"] });
      toast.success("Notifications envoyées avec succès");
      setShowCreateDialog(false);
      resetCreateForm();
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi des notifications");
    },
  });

  const resetCreateForm = () => {
    setNewNotification({
      type: "system",
      priority: "medium",
    });
    setSelectedUsers([]);
  };

  const handleCreateNotification = () => {
    if (!newNotification.message || !newNotification.type) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error("Veuillez sélectionner au moins un utilisateur");
      return;
    }

    if (selectedUsers.length === 1) {
      // Notification individuelle
      createNotificationMutation.mutate({
        ...newNotification,
        userId: selectedUsers[0],
      } as CreateNotificationDto);
    } else {
      // Notification en masse
      const { userId, ...notificationData } = newNotification;
      createBulkNotificationMutation.mutate({
        userIds: selectedUsers,
        notification: notificationData as Omit<CreateNotificationDto, 'userId'>,
      });
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
        return <Package className={`h-4 w-4 ${colorClass}`} />;
      case "review":
        return <Star className={`h-4 w-4 ${colorClass}`} />;
      case "system":
        return <AlertTriangle className={`h-4 w-4 ${colorClass}`} />;
      case "payment":
        return <CreditCard className={`h-4 w-4 ${colorClass}`} />;
      case "promotion":
        return <Gift className={`h-4 w-4 ${colorClass}`} />;
      default:
        return <Bell className={`h-4 w-4 ${colorClass}`} />;
    }
  };

  const notifications = notificationsPaginated?.notifications || [];
  const totalNotifications = notificationsPaginated?.total || 0;
  const totalPages = notificationsPaginated?.totalPages || 0;

  // Filtrer les utilisateurs pour la sélection
  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.firstName.toLowerCase().includes(filters.userId?.toLowerCase() || "") ||
      user.lastName.toLowerCase().includes(filters.userId?.toLowerCase() || "") ||
      user.email.toLowerCase().includes(filters.userId?.toLowerCase() || "")
    );
  }, [users, filters.userId]);

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">
                {notificationStats?.total || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Non lues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-2xl font-bold">
                {notificationStats?.unread || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Utilisateurs actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">
                {users.filter(u => u.isActive).length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle notification
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle notification</DialogTitle>
                  <DialogDescription>
                    Envoyez une notification à un ou plusieurs utilisateurs
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Sélection des utilisateurs */}
                  <div>
                    <Label>Destinataires *</Label>
                    <div className="space-y-2">
                      <Input
                        placeholder="Rechercher des utilisateurs..."
                        value={filters.userId || ""}
                        onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                      />
                      <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                        {filteredUsers.slice(0, 20).map(user => (
                          <div key={user.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUsers(prev => [...prev, user.id]);
                                } else {
                                  setSelectedUsers(prev => prev.filter(id => id !== user.id));
                                }
                              }}
                            />
                            <span className="text-sm">
                              {user.firstName} {user.lastName} ({user.email})
                            </span>
                          </div>
                        ))}
                      </div>
                      {selectedUsers.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {selectedUsers.length} utilisateur(s) sélectionné(s)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Type et priorité */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Type *</Label>
                      <Select 
                        value={newNotification.type} 
                        onValueChange={(value) => setNewNotification(prev => ({ ...prev, type: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">Système</SelectItem>
                          <SelectItem value="order">Commande</SelectItem>
                          <SelectItem value="payment">Paiement</SelectItem>
                          <SelectItem value="promotion">Promotion</SelectItem>
                          <SelectItem value="review">Avis</SelectItem>
                          <SelectItem value="stock">Stock</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Priorité</Label>
                      <Select 
                        value={newNotification.priority} 
                        onValueChange={(value) => setNewNotification(prev => ({ ...prev, priority: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Faible</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="high">Élevée</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Titre et message */}
                  <div>
                    <Label>Titre</Label>
                    <Input
                      placeholder="Titre de la notification (optionnel)"
                      value={newNotification.title || ""}
                      onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label>Message *</Label>
                    <Textarea
                      placeholder="Contenu de la notification..."
                      value={newNotification.message || ""}
                      onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleCreateNotification}
                    disabled={createNotificationMutation.isPending || createBulkNotificationMutation.isPending}
                  >
                    {(createNotificationMutation.isPending || createBulkNotificationMutation.isPending) ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Envoyer
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Gestion des notifications
              </CardTitle>
              <CardDescription>
                Gérez toutes les notifications de la plateforme
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filtres:</span>
            </div>
            
            <Select 
              value={filters.type?.[0] || "all"} 
              onValueChange={(value) => 
                setFilters(prev => ({ 
                  ...prev, 
                  type: value === "all" ? undefined : [value as any] 
                }))
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="system">Système</SelectItem>
                <SelectItem value="order">Commandes</SelectItem>
                <SelectItem value="payment">Paiements</SelectItem>
                <SelectItem value="promotion">Promotions</SelectItem>
                <SelectItem value="review">Avis</SelectItem>
                <SelectItem value="stock">Stock</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.read === undefined ? "all" : (filters.read ? "read" : "unread")} 
              onValueChange={(value) => 
                setFilters(prev => ({ 
                  ...prev, 
                  read: value === "all" ? undefined : value === "read" 
                }))
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="unread">Non lues</SelectItem>
                <SelectItem value="read">Lues</SelectItem>
              </SelectContent>
            </Select>

            {Object.keys(filters).length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFilters({})}
              >
                Réinitialiser
              </Button>
            )}
          </div>

          {/* Table des notifications */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingNotifications ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </TableCell>
                  </TableRow>
                ) : notifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <Bell className="h-12 w-12 mx-auto mb-4" />
                        <p>Aucune notification trouvée</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  notifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getNotificationIcon(notification.type, (notification as any).priority)}
                          <span className="capitalize">{notification.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {users.find(u => u.id === notification.userId)?.email || 'Utilisateur supprimé'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {(notification as any).title && (
                            <div className="font-medium text-sm">{(notification as any).title}</div>
                          )}
                          <div className="text-sm text-muted-foreground truncate">
                            {notification.message}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(notification as any).priority && (
                          <Badge variant={
                            (notification as any).priority === "urgent" ? "destructive" :
                            (notification as any).priority === "high" ? "default" : "secondary"
                          }>
                            {(notification as any).priority}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={notification.read ? "secondary" : "default"}>
                          {notification.read ? "Lu" : "Non lu"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Optionnel: Ouvrir détails ou supprimer
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} sur {totalPages} ({totalNotifications} notifications)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationManagement;