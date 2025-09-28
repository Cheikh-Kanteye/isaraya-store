import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  ShoppingCart, 
  Star, 
  AlertTriangle, 
  Package, 
  Gift, 
  CreditCard, 
  Check, 
  ExternalLink,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  normalizeNotification, 
  isNotificationRead, 
  getNotificationTitle, 
  getNotificationMessage, 
  getNotificationVariant,
  type NormalizedNotification 
} from "@/utils/notificationUtils";

interface ImprovedNotificationItemProps {
  notification: any; // Accepte des données brutes avec des champs null
  onMarkAsRead: (id: string) => void;
  onActionClick?: (notification: NormalizedNotification) => void;
}

// Configuration des types de notifications avec couleurs et icônes
const notificationConfig = {
  order: {
    icon: ShoppingCart,
    color: "bg-blue-100 text-blue-600 border-blue-200",
    bgColor: "bg-blue-50",
    label: "Commande",
    dotColor: "bg-blue-500"
  },
  order_status_update: {
    icon: ShoppingCart,
    color: "bg-blue-100 text-blue-600 border-blue-200",
    bgColor: "bg-blue-50",
    label: "Commande",
    dotColor: "bg-blue-500"
  },
  payment: {
    icon: CreditCard,
    color: "bg-green-100 text-green-600 border-green-200",
    bgColor: "bg-green-50",
    label: "Paiement",
    dotColor: "bg-green-500"
  },
  promotion: {
    icon: Gift,
    color: "bg-purple-100 text-purple-600 border-purple-200",
    bgColor: "bg-purple-50",
    label: "Promotion",
    dotColor: "bg-purple-500"
  },
  system: {
    icon: AlertTriangle,
    color: "bg-orange-100 text-orange-600 border-orange-200",
    bgColor: "bg-orange-50",
    label: "Système",
    dotColor: "bg-orange-500"
  },
  review: {
    icon: Star,
    color: "bg-yellow-100 text-yellow-600 border-yellow-200",
    bgColor: "bg-yellow-50",
    label: "Avis",
    dotColor: "bg-yellow-500"
  },
  stock: {
    icon: Package,
    color: "bg-red-100 text-red-600 border-red-200",
    bgColor: "bg-red-50",
    label: "Stock",
    dotColor: "bg-red-500"
  },
  PUSH: {
    icon: Bell,
    color: "bg-blue-100 text-blue-600 border-blue-200",
    bgColor: "bg-blue-50",
    label: "Notification",
    dotColor: "bg-blue-500"
  },
  default: {
    icon: Bell,
    color: "bg-gray-100 text-gray-600 border-gray-200",
    bgColor: "bg-gray-50",
    label: "Notification",
    dotColor: "bg-gray-500"
  }
};

const ImprovedNotificationItem: FC<ImprovedNotificationItemProps> = ({
  notification: rawNotification,
  onMarkAsRead,
  onActionClick,
}) => {
  // Normaliser la notification pour gérer les champs null
  const notification = normalizeNotification(rawNotification);
  const isRead = isNotificationRead(rawNotification);
  const title = getNotificationTitle(rawNotification);
  const message = getNotificationMessage(rawNotification);
  
  // Déterminer le type pour la configuration
  const notificationType = rawNotification.data?.type || rawNotification.type || 'default';
  const config = notificationConfig[notificationType as keyof typeof notificationConfig] || notificationConfig.default;
  const IconComponent = config.icon;
  
  // Formater la date de manière plus lisible
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

  const handleClick = () => {
    if (notification.actionUrl && onActionClick) {
      onActionClick(notification);
    } else if (!isRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div 
      className={cn(
        "group relative p-4 border-b border-border/50 hover:bg-accent/30 transition-all duration-200",
        !isRead && "bg-gradient-to-r from-blue-50/50 to-transparent border-l-4 border-l-blue-400",
        notification.actionUrl && "cursor-pointer"
      )}
      onClick={handleClick}
    >
      {/* Indicateur de statut non lu */}
      {!isRead && (
        <div className="absolute left-2 top-6">
          <div className={cn("w-2 h-2 rounded-full", config.dotColor)}></div>
        </div>
      )}
      
      <div className="flex items-start gap-4 ml-2">
        {/* Icône avec background coloré */}
        <div className={cn(
          "flex-shrink-0 p-2 rounded-lg border",
          config.color
        )}>
          <IconComponent className="w-4 h-4" />
        </div>
        
        {/* Contenu */}
        <div className="flex-1 min-w-0">
          {/* En-tête avec type et temps */}
          <div className="flex items-center justify-between mb-2">
            <Badge variant={getNotificationVariant(rawNotification)} className="text-xs font-medium">
              {config.label}
            </Badge>
            <div className="flex items-center gap-2">
              {/* Indicateur de livraison */}
              {notification.deliveredAt && (
                <Badge variant="outline" className="text-xs">
                  <Check className="w-3 h-3 mr-1" />
                  Livré
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatTime(notification.createdAt)}
              </span>
            </div>
          </div>
          
          {/* Titre */}
          {title && (
            <h4 className={cn(
              "font-semibold text-sm mb-1 line-clamp-1",
              !isRead ? "text-foreground" : "text-muted-foreground"
            )}>
              {title}
            </h4>
          )}
          
          {/* Message principal */}
          <p className={cn(
            "text-sm line-clamp-2 leading-relaxed",
            !isRead ? "text-foreground" : "text-muted-foreground"
          )}>
            {message}
          </p>

          {/* Données supplémentaires si disponibles */}
          {rawNotification.data?.email && (
            <p className="text-xs text-muted-foreground mt-1">
              Email: {rawNotification.data.email}
            </p>
          )}

          {/* Statut de lecture avec timestamp */}
          {isRead && notification.readAt && (
            <div className="flex items-center text-xs text-muted-foreground mt-2">
              <Clock className="w-3 h-3 mr-1" />
              <span>Lu le {formatTime(notification.readAt)}</span>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {/* Bouton d'action si URL disponible */}
          {notification.actionUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (onActionClick) {
                  onActionClick(notification);
                }
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-7 px-2"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Voir
            </Button>
          )}

          {/* Bouton marquer comme lu */}
          {!isRead ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-7 px-2"
            >
              <Check className="w-3 h-3 mr-1" />
              Lu
            </Button>
          ) : (
            <div className="flex items-center text-xs text-muted-foreground">
              <Check className="w-3 h-3 mr-1" />
              <span>Lu</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImprovedNotificationItem;