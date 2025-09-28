import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Package,
  MapPin,
  CreditCard,
  Calendar,
  User,
  Phone,
  Mail,
} from "lucide-react";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Order } from "@/types";

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  if (!order) return null;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: {
        variant: "outline" as const,
        label: "Brouillon",
        className: "bg-gray-100 text-gray-800 border-gray-300",
      },
      PENDING_PAYMENT: {
        variant: "secondary" as const,
        label: "En attente de paiement",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      PAYMENT_SUCCESSFUL: {
        variant: "default" as const,
        label: "Paiement réussi",
        className: "bg-green-100 text-green-800 border-green-200",
      },
      PAYMENT_FAILED: {
        variant: "destructive" as const,
        label: "Paiement échoué",
        className: "bg-red-100 text-red-800 border-red-200",
      },
      PENDING: {
        variant: "secondary" as const,
        label: "En attente",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      CONFIRMED: {
        variant: "default" as const,
        label: "Confirmée",
        className: "bg-blue-100 text-blue-800 border-blue-200",
      },
      SHIPPED: {
        variant: "default" as const,
        label: "Expédiée",
        className: "bg-purple-100 text-purple-800 border-purple-200",
      },
      DELIVERED: {
        variant: "default" as const,
        label: "Livrée",
        className: "bg-green-100 text-green-800 border-green-200",
      },
      CANCELLED: {
        variant: "destructive" as const,
        label: "Annulée",
        className: "bg-red-100 text-red-800 border-red-200",
      },
      RETURN_REQUESTED: {
        variant: "secondary" as const,
        label: "Retour demandé",
        className: "bg-orange-100 text-orange-800 border-orange-200",
      },
      RETURN_IN_PROGRESS: {
        variant: "secondary" as const,
        label: "Retour en cours",
        className: "bg-orange-200 text-orange-900 border-orange-300",
      },
      RETURNED: {
        variant: "outline" as const,
        label: "Retournée",
        className: "border-orange-500 text-orange-700",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "secondary" as const,
      label: status,
      className: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Fonction pour parser les items de différents formats
  type Parsed = { name?: string; quantity?: number; price?: number };
  const parseItems = (items: unknown): Parsed[] => {
    try {
      if (Array.isArray(items)) {
        return items;
      }
      if (typeof items === 'string') {
        const parsed = JSON.parse(items);
        return Array.isArray(parsed) ? parsed : [];
      }
      if (items && typeof items === 'object') {
        const values = Object.values(items);
        return Array.isArray(values) ? values : [];
      }
      return [];
    } catch (error) {
      console.error('Error parsing items:', error);
      return [];
    }
  };

  const orderItems = parseItems(order.items);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Commande #{order.id.substring(0, 8)}...
            </span>
            {getStatusBadge(order.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Date de commande</p>
                <p className="text-sm font-semibold">
                  {formatDate(order.createdAt as string)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Total</p>
                <p className="text-lg font-bold text-green-600">
                  {formatPrice(order.total)}
                </p>
              </div>
            </div>
          </div>

          {/* Articles commandés */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Articles commandés
            </h3>
            <div className="space-y-2">
              {orderItems.length > 0 ? (
                orderItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.name || `Article ${index + 1}`}</p>
                      <p className="text-sm text-gray-600">
                        Quantité: {item.quantity || 1}
                        {item.price && ` • Prix unitaire: ${formatPrice(item.price)}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatPrice((item.price || 0) * (item.quantity || 1))}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>Détails des articles non disponibles</p>
                </div>
              )}
            </div>
          </div>

          {/* Adresse de livraison */}
          {order.deliveryAddress && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Adresse de livraison
                </h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">{order.deliveryAddress.street}</p>
                  <p className="text-gray-600">
                    {order.deliveryAddress.city}, {order.deliveryAddress.postcode}
                  </p>
                  <p className="text-gray-600">{order.deliveryAddress.country}</p>
                </div>
              </div>
            </>
          )}

          {/* Informations de facturation */}
          <Separator />
          <div>
            <h3 className="font-semibold text-lg mb-3">Récapitulatif</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Sous-total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Frais de livraison</span>
                <span>Gratuit</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-green-600">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Informations techniques */}
          <Separator />
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p><strong>ID de commande:</strong> {order.id}</p>
            <p><strong>ID client:</strong> {order.clientId}</p>
            <p><strong>Dernière mise à jour:</strong> {formatDate(order.updatedAt as string)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};