import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Package,
  CreditCard,
  ShoppingCart,
  Clock,
  X,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Zap,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
} from "lucide-react";
import { useMerchantNotifications, useMerchantNotificationStats } from "@/hooks/useMerchantNotifications";
import { useAuthStore } from "@/stores";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// Types pour les alertes contextuelles
interface ContextualAlert {
  id: string;
  type: 'urgent' | 'warning' | 'info' | 'success';
  category: 'stock' | 'payment' | 'order' | 'system' | 'performance';
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  dismissible: boolean;
  autoHide?: boolean;
  duration?: number;
  data?: Record<string, any>;
  createdAt: Date;
}

// Configuration des alertes
const alertConfig = {
  urgent: {
    icon: AlertTriangle,
    className: "border-red-500 bg-red-50 text-red-900",
    iconColor: "text-red-600",
    badgeVariant: "destructive" as const,
  },
  warning: {
    icon: AlertCircle,
    className: "border-orange-500 bg-orange-50 text-orange-900",
    iconColor: "text-orange-600",
    badgeVariant: "default" as const,
  },
  info: {
    icon: AlertCircle,
    className: "border-blue-500 bg-blue-50 text-blue-900",
    iconColor: "text-blue-600",
    badgeVariant: "secondary" as const,
  },
  success: {
    icon: CheckCircle,
    className: "border-green-500 bg-green-50 text-green-900",
    iconColor: "text-green-600",
    badgeVariant: "secondary" as const,
  },
};

const MerchantAlerts = () => {
  const { user } = useAuthStore();
  const { notifications, unreadCount, getUnreadNotifications, markAsRead } = useMerchantNotifications();
  const stats = useMerchantNotificationStats();
  
  const [contextualAlerts, setContextualAlerts] = useState<ContextualAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showAlertCenter, setShowAlertCenter] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<ContextualAlert | null>(null);

  // Générer des alertes contextuelles basées sur les données business
  useEffect(() => {
    const alerts: ContextualAlert[] = [];
    const now = new Date();

    // Alerte de stock critique
    if (user?.merchantProfile) {
      // Simuler des alertes basées sur les données
      
      // Stock critique
      const lowStockProducts = 3; // À remplacer par les vraies données
      if (lowStockProducts > 0) {
        alerts.push({
          id: `stock-critical-${Date.now()}`,
          type: 'urgent',
          category: 'stock',
          title: `${lowStockProducts} produits en stock critique`,
          message: `Vous avez ${lowStockProducts} produits avec un stock très faible. Réapprovisionnez rapidement pour éviter les ruptures.`,
          actionText: "Voir les produits",
          actionUrl: "/dashboard/merchant/products?filter=low-stock",
          dismissible: true,
          createdAt: now,
        });
      }

      // Commandes en attente
      const pendingOrders = notifications.filter(n => 
        n.type === 'merchant_order' && !n.read && 
        new Date(n.createdAt) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
      ).length;
      
      if (pendingOrders > 5) {
        alerts.push({
          id: `orders-backlog-${Date.now()}`,
          type: 'warning',
          category: 'order',
          title: `${pendingOrders} nouvelles commandes en attente`,
          message: `Vous avez accumulé ${pendingOrders} commandes depuis hier. Traitez-les rapidement pour maintenir votre service client.`,
          actionText: "Traiter les commandes",
          actionUrl: "/dashboard/merchant/orders?status=pending",
          dismissible: true,
          createdAt: now,
        });
      }

      // Paiements échoués
      const failedPayments = notifications.filter(n => 
        n.type === 'merchant_payment' && 
        n.data?.status === 'failed' && !n.read
      ).length;
      
      if (failedPayments > 0) {
        alerts.push({
          id: `payments-failed-${Date.now()}`,
          type: 'urgent',
          category: 'payment',
          title: `${failedPayments} paiements échoués`,
          message: `${failedPayments} tentatives de paiement ont échoué. Contactez vos clients pour résoudre ces problèmes.`,
          actionText: "Voir les paiements",
          actionUrl: "/dashboard/merchant/payments?status=failed",
          dismissible: true,
          createdAt: now,
        });
      }

      // Performance d'avis
      const recentReviews = notifications.filter(n => 
        n.type === 'merchant_review' && 
        new Date(n.createdAt) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      );

      const lowRatingReviews = recentReviews.filter(n => 
        n.data?.rating && n.data.rating < 3
      ).length;

      if (lowRatingReviews > 2) {
        alerts.push({
          id: `reviews-low-rating-${Date.now()}`,
          type: 'warning',
          category: 'performance',
          title: `${lowRatingReviews} avis négatifs cette semaine`,
          message: `Vous avez reçu ${lowRatingReviews} avis de moins de 3 étoiles. Analysez les retours pour améliorer votre service.`,
          actionText: "Voir les avis",
          actionUrl: "/dashboard/merchant/reviews?filter=low-rating",
          dismissible: true,
          createdAt: now,
        });
      }

      // Alerte de performance positive
      if (stats.todayCount > 10 && stats.unread < 5) {
        alerts.push({
          id: `performance-good-${Date.now()}`,
          type: 'success',
          category: 'performance',
          title: "Excellente journée !",
          message: `Vous avez eu ${stats.todayCount} notifications aujourd'hui et vous êtes bien à jour. Continuez ce bon rythme !`,
          dismissible: true,
          autoHide: true,
          duration: 8000,
          createdAt: now,
        });
      }
    }

    // Filtrer les alertes déjà supprimées
    const newAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));
    setContextualAlerts(newAlerts);

    // Auto-hide pour les alertes temporaires
    newAlerts.forEach(alert => {
      if (alert.autoHide && alert.duration) {
        setTimeout(() => {
          dismissAlert(alert.id);
        }, alert.duration);
      }
    });

  }, [notifications, stats, user, dismissedAlerts]);

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    setContextualAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleAlertAction = (alert: ContextualAlert) => {
    if (alert.actionUrl) {
      window.location.href = alert.actionUrl;
    }
  };

  const urgentAlerts = contextualAlerts.filter(alert => alert.type === 'urgent');
  const otherAlerts = contextualAlerts.filter(alert => alert.type !== 'urgent');

  return (
    <>
      {/* Alertes urgentes en haut */}
      {urgentAlerts.length > 0 && (
        <div className="space-y-2 mb-6">
          {urgentAlerts.map(alert => {
            const config = alertConfig[alert.type];
            const IconComponent = config.icon;

            return (
              <Alert key={alert.id} className={cn(config.className, "relative")}>
                <div className="flex items-start gap-3">
                  <IconComponent className={cn("h-5 w-5 mt-0.5", config.iconColor)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{alert.title}</span>
                          <Badge variant={config.badgeVariant} className="text-xs">
                            URGENT
                          </Badge>
                        </div>
                        <AlertDescription className="text-sm">
                          {alert.message}
                        </AlertDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        {alert.actionText && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => handleAlertAction(alert)}
                          >
                            {alert.actionText}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                        {alert.dismissible && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => dismissAlert(alert.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Alert>
            );
          })}
        </div>
      )}

      {/* Centre d'alertes */}
      {(otherAlerts.length > 0 || unreadCount > 0) && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-500" />
                <CardTitle className="text-base">Centre d'alertes</CardTitle>
                {(unreadCount > 0 || contextualAlerts.length > 0) && (
                  <Badge variant="secondary">
                    {unreadCount + contextualAlerts.length}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAlertCenter(!showAlertCenter)}
              >
                {showAlertCenter ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          
          {showAlertCenter && (
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Alertes contextuelles */}
                {otherAlerts.map(alert => {
                  const config = alertConfig[alert.type];
                  const IconComponent = config.icon;

                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        "p-3 rounded-lg border transition-colors cursor-pointer",
                        config.className.replace('bg-', 'hover:bg-').replace('50', '100'),
                        "hover:shadow-sm"
                      )}
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <div className="flex items-start gap-3">
                        <IconComponent className={cn("h-4 w-4 mt-0.5", config.iconColor)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{alert.title}</span>
                              <Badge variant={config.badgeVariant} className="text-xs">
                                {alert.type.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(alert.createdAt, { addSuffix: true, locale: fr })}
                              </span>
                              {alert.dismissible && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismissAlert(alert.id);
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {alert.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Notifications non lues importantes */}
                {getUnreadNotifications().slice(0, 3).map(notification => (
                  <div
                    key={notification.id}
                    className="p-3 rounded-lg border border-blue-200 bg-blue-50/30 hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <ShoppingCart className="h-4 w-4 mt-0.5 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-blue-900">
                            {notification.title || 'Notification'}
                          </span>
                          <span className="text-xs text-blue-700">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: fr })}
                          </span>
                        </div>
                        <p className="text-sm text-blue-800 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Lien vers toutes les notifications */}
                {unreadCount > 3 && (
                  <div className="text-center pt-2 border-t">
                    <Button variant="link" size="sm">
                      Voir toutes les notifications ({unreadCount})
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Modal de détail d'alerte */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        {selectedAlert && (
          <DialogContent>
            <DialogHeader>
              <div className="flex items-center gap-2">
                {(() => {
                  const config = alertConfig[selectedAlert.type];
                  const IconComponent = config.icon;
                  return <IconComponent className={cn("h-5 w-5", config.iconColor)} />;
                })()}
                <DialogTitle>{selectedAlert.title}</DialogTitle>
                <Badge variant={alertConfig[selectedAlert.type].badgeVariant}>
                  {selectedAlert.type.toUpperCase()}
                </Badge>
              </div>
              <DialogDescription>
                {selectedAlert.message}
              </DialogDescription>
            </DialogHeader>
            
            {selectedAlert.data && (
              <div className="py-4">
                <h4 className="font-medium mb-2">Détails :</h4>
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <pre>{JSON.stringify(selectedAlert.data, null, 2)}</pre>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                Fermer
              </Button>
              {selectedAlert.actionText && (
                <Button onClick={() => {
                  handleAlertAction(selectedAlert);
                  setSelectedAlert(null);
                }}>
                  {selectedAlert.actionText}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
};

export default MerchantAlerts;