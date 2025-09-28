import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bell,
  Package,
  CreditCard,
  ShoppingCart,
  Star,
  AlertCircle,
  CheckCircle,
  Trash2,
  Settings,
  Filter,
  TrendingUp,
  Users,
  Euro,
  Clock,
  Search,
  RefreshCw,
  BarChart3,
  AlertTriangle,
  Gift,
  Truck,
  ExternalLink,
} from "lucide-react";
import { useMerchantNotifications, useMerchantNotificationStats } from "@/hooks/useMerchantNotifications";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { 
  MerchantNotification, 
  MerchantNotificationFilters 
} from "@/types";
import { cn } from "@/lib/utils";

const NotificationsMarchand = () => {
  const {
    notifications,
    unreadCount,
    stats,
    isLoading,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    getFilteredNotifications,
    refreshNotifications
  } = useMerchantNotifications();

  const quickStats = useMerchantNotificationStats();

  // États locaux pour les filtres
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "business" | "urgent">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all"); // all, today, week, month

  // Configuration des types de notification avec icônes et couleurs
  const notificationConfig = {
    merchant_order: {
      icon: ShoppingCart,
      color: "bg-blue-100 text-blue-700 border-blue-200",
      bgColor: "hover:bg-blue-50",
      label: "Commande",
      description: "Nouvelles commandes et mises à jour"
    },
    merchant_payment: {
      icon: CreditCard,
      color: "bg-green-100 text-green-700 border-green-200",
      bgColor: "hover:bg-green-50",
      label: "Paiement",
      description: "Paiements reçus et problèmes"
    },
    merchant_review: {
      icon: Star,
      color: "bg-yellow-100 text-yellow-700 border-yellow-200",
      bgColor: "hover:bg-yellow-50",
      label: "Avis",
      description: "Avis clients et évaluations"
    },
    merchant_stock: {
      icon: Package,
      color: "bg-red-100 text-red-700 border-red-200",
      bgColor: "hover:bg-red-50",
      label: "Stock",
      description: "Alertes de stock et ruptures"
    },
    merchant_system: {
      icon: Settings,
      color: "bg-purple-100 text-purple-700 border-purple-200",
      bgColor: "hover:bg-purple-50",
      label: "Système",
      description: "Mises à jour et maintenance"
    },
    merchant_delivery: {
      icon: Truck,
      color: "bg-orange-100 text-orange-700 border-orange-200",
      bgColor: "hover:bg-orange-50",
      label: "Livraison",
      description: "Statuts de livraison"
    },
    default: {
      icon: Bell,
      color: "bg-gray-100 text-gray-700 border-gray-200",
      bgColor: "hover:bg-gray-50",
      label: "Notification",
      description: "Notification générale"
    }
  };

  // Construire les filtres dynamiquement
  const filters = useMemo((): MerchantNotificationFilters => {
    const baseFilters: MerchantNotificationFilters = {};

    if (categoryFilter !== "all") {
      baseFilters.category = [categoryFilter as any];
    }

    if (typeFilter !== "all") {
      baseFilters.type = [typeFilter as any];
    }

    if (priorityFilter !== "all") {
      baseFilters.priority = [priorityFilter as any];
    }

    // Filtres de date
    if (dateFilter !== "all") {
      const now = new Date();
      switch (dateFilter) {
        case "today":
          baseFilters.dateFrom = format(now, 'yyyy-MM-dd');
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          baseFilters.dateFrom = format(weekAgo, 'yyyy-MM-dd');
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          baseFilters.dateFrom = format(monthAgo, 'yyyy-MM-dd');
          break;
      }
    }

    return baseFilters;
  }, [categoryFilter, typeFilter, priorityFilter, dateFilter]);

  // Appliquer tous les filtres
  const filteredNotifications = useMemo(() => {
    let filtered = getFilteredNotifications(filters);

    // Filtres par onglet actif
    switch (activeTab) {
      case "unread":
        filtered = filtered.filter(n => !n.read);
        break;
      case "business":
        filtered = filtered.filter(n => ["business", "financial"].includes(n.category));
        break;
      case "urgent":
        filtered = filtered.filter(n => ["urgent", "high"].includes(n.priority || "low"));
        break;
    }

    // Filtre par recherche
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(n => 
        n.message.toLowerCase().includes(search) ||
        n.title?.toLowerCase().includes(search)
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [getFilteredNotifications, filters, activeTab, searchTerm]);

  // Formatage de date intelligent
  const formatNotificationDate = (date: string | number) => {
    const notificationDate = new Date(date);
    
    if (isToday(notificationDate)) {
      return format(notificationDate, 'HH:mm', { locale: fr });
    }
    
    if (isYesterday(notificationDate)) {
      return `Hier ${format(notificationDate, 'HH:mm', { locale: fr })}`;
    }
    
    const daysAgo = Math.floor((Date.now() - notificationDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysAgo < 7) {
      return formatDistanceToNow(notificationDate, { addSuffix: true, locale: fr });
    }
    
    return format(notificationDate, 'dd MMM', { locale: fr });
  };

  // Rendu d'un élément de notification
  const renderNotification = (notification: MerchantNotification) => {
    const config = notificationConfig[notification.type as keyof typeof notificationConfig] || notificationConfig.default;
    const IconComponent = config.icon;

    const priorityColors = {
      urgent: "border-l-red-500 bg-red-50/50",
      high: "border-l-orange-500 bg-orange-50/50",
      medium: "border-l-yellow-500 bg-yellow-50/50",
      low: "border-l-gray-500 bg-gray-50/50"
    };

    const priorityColor = priorityColors[notification.priority || "low"];

    return (
      <Card 
        key={notification.id} 
        className={cn(
          "transition-all duration-200 cursor-pointer border-l-4",
          priorityColor,
          !notification.read && "ring-2 ring-blue-200/50",
          config.bgColor
        )}
        onClick={() => !notification.read && markAsRead(notification.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Icône */}
            <div className={cn("flex-shrink-0 p-2 rounded-lg border", config.color)}>
              <IconComponent className="w-4 h-4" />
            </div>

            {/* Contenu principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {/* En-tête */}
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {config.label}
                    </Badge>
                    {notification.priority && notification.priority !== "low" && (
                      <Badge 
                        variant={notification.priority === "urgent" ? "destructive" : "default"}
                        className="text-xs"
                      >
                        {notification.priority === "urgent" ? "URGENT" : 
                         notification.priority === "high" ? "IMPORTANT" : "MOYEN"}
                      </Badge>
                    )}
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>

                  {/* Titre */}
                  {notification.title && (
                    <h4 className="font-semibold text-sm text-foreground mb-1">
                      {notification.title}
                    </h4>
                  )}

                  {/* Message */}
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {notification.message}
                  </p>

                  {/* Date */}
                  <p className="text-xs text-muted-foreground">
                    {formatNotificationDate(notification.createdAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1">
                  {notification.actionUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(notification.actionUrl, '_blank');
                      }}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                  
                  {!notification.read ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                    >
                      <CheckCircle className="w-3 h-3" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsUnread(notification.id);
                      }}
                    >
                      <Bell className="w-3 h-3" />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{quickStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Non lues</p>
                <p className="text-xl font-bold">{quickStats.unread}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Urgentes</p>
                <p className="text-xl font-bold">{quickStats.urgent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                <p className="text-xl font-bold">{quickStats.todayCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Notifications Business
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Gérez vos alertes et notifications business
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshNotifications()}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Actualiser
              </Button>
              
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsRead()}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Tout marquer comme lu
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Barre de recherche */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher dans les notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filtres avancés */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
            <div>
              <Label className="text-sm font-medium">Catégorie</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="customer">Client</SelectItem>
                  <SelectItem value="system">Système</SelectItem>
                  <SelectItem value="financial">Financier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="merchant_order">Commandes</SelectItem>
                  <SelectItem value="merchant_payment">Paiements</SelectItem>
                  <SelectItem value="merchant_stock">Stock</SelectItem>
                  <SelectItem value="merchant_review">Avis</SelectItem>
                  <SelectItem value="merchant_delivery">Livraisons</SelectItem>
                  <SelectItem value="merchant_system">Système</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Priorité</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="urgent">🔴 Urgent</SelectItem>
                  <SelectItem value="high">🟠 Élevée</SelectItem>
                  <SelectItem value="medium">🟡 Moyenne</SelectItem>
                  <SelectItem value="low">⚪ Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Période</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Onglets de filtrage */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                Toutes ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                Non lues ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="business">
                Business ({quickStats.byCategory.business + quickStats.byCategory.financial})
              </TabsTrigger>
              <TabsTrigger value="urgent">
                Urgentes ({quickStats.urgent})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 mx-auto mb-4 text-muted-foreground animate-spin" />
                  <h3 className="text-lg font-medium mb-2">Chargement...</h3>
                  <p className="text-muted-foreground">Récupération de vos notifications</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">
                    {activeTab === "unread" && unreadCount === 0 ? "Tout est lu !" :
                     searchTerm ? "Aucun résultat" : "Aucune notification"}
                  </h3>
                  <p className="text-muted-foreground">
                    {activeTab === "unread" && unreadCount === 0 
                      ? "Vous êtes à jour avec toutes vos notifications business."
                      : searchTerm 
                      ? "Essayez avec d'autres termes de recherche."
                      : "Les nouvelles notifications apparaîtront ici."}
                  </p>
                  {searchTerm && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setSearchTerm("")}
                    >
                      Effacer la recherche
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map(renderNotification)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsMarchand;