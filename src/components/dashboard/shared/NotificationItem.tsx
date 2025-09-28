import { FC } from "react";
import { Notification } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, ShoppingCart, Star, AlertTriangle, Package, Gift, CreditCard, Check, Dot } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
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
  default: {
    icon: Bell,
    color: "bg-gray-100 text-gray-600 border-gray-200",
    bgColor: "bg-gray-50",
    label: "Notification",
    dotColor: "bg-gray-500"
  }
};

const NotificationItem: FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
}) => {
  const config = notificationConfig[notification.type as keyof typeof notificationConfig] || notificationConfig.default;
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

  return (
    <div 
      className={cn(
        "group relative p-4 border-b border-border/50 hover:bg-accent/30 transition-all duration-200 cursor-pointer",
        !notification.read && "bg-gradient-to-r from-blue-50/50 to-transparent border-l-4 border-l-blue-400"
      )}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
    >
      {/* Indicateur de statut non lu */}
      {!notification.read && (
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
            <Badge variant="secondary" className="text-xs font-medium">
              {config.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatTime(notification.createdAt)}
            </span>
          </div>
          
          {/* Titre si disponible */}
          {(notification as any).title && (
            <h4 className="font-semibold text-sm text-foreground mb-1 line-clamp-1">
              {(notification as any).title}
            </h4>
          )}
          
          {/* Message principal */}
          <p className={cn(
            "text-sm text-muted-foreground line-clamp-2 leading-relaxed",
            !notification.read && "text-foreground"
          )}>
            {notification.message || 'Aucun message disponible'}
          </p>
        </div>
        
        {/* Bouton d'action */}
        <div className="flex-shrink-0 flex items-center">
          {!notification.read ? (
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

export default NotificationItem;
