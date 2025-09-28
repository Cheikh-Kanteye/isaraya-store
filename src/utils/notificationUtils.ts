import type { Notification } from "@/types";

/**
 * Utilitaires pour gérer les notifications avec des champs null
 */

export interface NormalizedNotification extends Notification {
  read: boolean; // Force non-null
  title: string | null;
  imageUrl: string | null;
  actionUrl: string | null;
  deliveredAt: string | null;
  readAt: string | null;
}

/**
 * Normalise une notification pour gérer les champs null
 */
export function normalizeNotification(
  notification: any
): NormalizedNotification {
  return {
    id: notification.id,
    type: notification.type || "system",
    message: notification.message || notification.body || "Aucun message",
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt || notification.createdAt,
    userId: notification.userId || "",
    vendorId: notification.vendorId || null,
    data: notification.data || {},
    priority: notification.priority || "medium",
    category: notification.category || "system",
    relatedEntityId: notification.relatedEntityId || null,
    relatedEntityType: notification.relatedEntityType || null,

    // Champs avec gestion des null
    read: notification.readAt !== null, // Si readAt existe, c'est lu
    title: notification.title || null,
    imageUrl: notification.imageUrl || null,
    actionUrl: notification.actionUrl || null,
    deliveredAt: notification.deliveredAt || null,
    readAt: notification.readAt || null,
  };
}

/**
 * Détermine si une notification est considérée comme lue
 */
export function isNotificationRead(notification: any): boolean {
  // Vérifier plusieurs façons de déterminer si c'est lu
  if (notification.readAt !== null && notification.readAt !== undefined) {
    return true;
  }

  if (notification.read === true) {
    return true;
  }

  if (notification.status === "READ") {
    return true;
  }

  return false;
}

/**
 * Formate le titre d'une notification
 */
export function getNotificationTitle(notification: any): string {
  if (notification.title) {
    return notification.title;
  }

  // Générer un titre basé sur le type
  const typeMap: Record<string, string> = {
    order: "Commande",
    order_status_update: "Mise à jour de commande",
    payment: "Paiement",
    review: "Nouvel avis",
    system: "Notification système",
    stock: "Alerte stock",
    promotion: "Promotion",
    delivery: "Livraison",
    PUSH: "Notification",
  };

  const dataType = notification.data?.type || notification.type;
  return typeMap[dataType] || typeMap[notification.type] || "Notification";
}

/**
 * Formate le message d'une notification
 */
export function getNotificationMessage(notification: any): string {
  if (notification.message) {
    return notification.message;
  }

  if (notification.body) {
    return notification.body;
  }

  // Générer un message par défaut
  if (notification.data?.type === "order_status_update") {
    const status = notification.data.status;
    const statusMap: Record<string, string> = {
      PAYMENT_SUCCESSFUL: "Votre paiement a été confirmé",
      SHIPPED: "Votre commande a été expédiée",
      DELIVERED: "Votre commande a été livrée",
      CANCELLED: "Votre commande a été annulée",
    };
    return statusMap[status] || `Statut mis à jour: ${status}`;
  }

  return "Aucun message disponible";
}

/**
 * Détermine la couleur/priorité visuelle d'une notification
 */
export function getNotificationVariant(
  notification: any
): "default" | "secondary" | "destructive" {
  if (notification.priority === "urgent") {
    return "destructive";
  }

  if (notification.data?.type === "order_status_update") {
    const status = notification.data.status;
    if (status === "CANCELLED" || status === "PAYMENT_FAILED") {
      return "destructive";
    }
    if (status === "DELIVERED" || status === "PAYMENT_SUCCESSFUL") {
      return "default";
    }
  }

  return "secondary";
}

/**
 * Trie les notifications (non lues en premier, puis par date)
 */
export function sortNotifications(notifications: any[]): any[] {
  return notifications.sort((a, b) => {
    // D'abord par statut de lecture
    const aRead = isNotificationRead(a);
    const bRead = isNotificationRead(b);

    if (aRead !== bRead) {
      return aRead ? 1 : -1; // Non lues en premier
    }

    // Puis par date (plus récentes en premier)
    const aDate = new Date(a.createdAt).getTime();
    const bDate = new Date(b.createdAt).getTime();
    return bDate - aDate;
  });
}

/**
 * Filtre les notifications selon les critères
 */
export function filterNotifications(
  notifications: any[],
  filter: "all" | "unread" | "read"
): any[] {
  switch (filter) {
    case "unread":
      return notifications.filter((n) => !isNotificationRead(n));
    case "read":
      return notifications.filter((n) => isNotificationRead(n));
    default:
      return notifications;
  }
}

/**
 * Compte les notifications non lues
 */
export function countUnreadNotifications(notifications: any[]): number {
  return notifications.filter((n) => !isNotificationRead(n)).length;
}
