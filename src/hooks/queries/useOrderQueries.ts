import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { queryKeys } from "@/services/queryClient";
import type { Order, MerchantOrder } from "@/types";

// Interface pour les paramètres de filtrage des commandes
interface OrdersParams extends Record<string, unknown> {
  userId?: string;
  vendorId?: string; // Renamed from vendorId
  status?: string;
  _limit?: number;
  _page?: number;
  _sort?: string;
  _order?: "asc" | "desc";
}

// Hook pour récupérer toutes les commandes avec filtres
export function useOrders(params: OrdersParams = {}) {
  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: () => apiService.orders.getAll(params),
  });
}

// Hook pour récupérer une commande par ID
export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => apiService.orders.get(id),
    enabled: !!id,
  });
}

// Hook pour récupérer les commandes d'un utilisateur
export function useOrdersByUser(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.orders.byUser(userId || ""),
    queryFn: async () => {
      if (!userId) return [] as Order[];
      return apiService.orders.getByClient(userId);
    },
    enabled: !!userId,
  });
}

// Hook pour récupérer les commandes d'un vendeur
export function useOrdersByMerchant(vendorId: string) {
  return useQuery<import("@/types").MerchantOrderWithClient[]>({
    queryKey: queryKeys.orders.byMerchant(vendorId),
    queryFn: async () => apiService.orders.getMerchantOrders(vendorId),
    enabled: !!vendorId,
  });
}

// Hook pour récupérer les commandes récentes
export function useRecentOrders(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.orders.recent(),
    queryFn: () =>
      apiService.orders.getAll({
        _limit: limit,
        _sort: "createdAt",
        _order: "desc",
      }),
    staleTime: 2 * 60 * 1000, // 2 minutes pour les commandes récentes
  });
}

// Hook pour créer une commande
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (order: Omit<Order, "id" | "createdAt">) =>
      apiService.orders.createOrder(order),
    onSuccess: (newOrderResponse) => {
      // Invalider les listes de commandes
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });

      // Extraire l'ID de la commande depuis la réponse (déballée par l'intercepteur)
      const orderId = (newOrderResponse as { id?: string }).id;

      // Ajouter la nouvelle commande au cache si nécessaire
      if (orderId) {
        queryClient.setQueryData(
          queryKeys.orders.detail(orderId),
          newOrderResponse
        );
      }

      // Invalider les commandes par utilisateur si applicable
      const clientId = (newOrderResponse as { clientId?: string }).clientId;
      if (clientId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.orders.byUser(clientId),
        });
      }

      // Invalider les commandes par vendeur si applicable
      const vendorId = (newOrderResponse as { vendorId?: string }).vendorId;
      if (vendorId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.orders.byMerchant(vendorId),
        });
      }

      // Invalider les commandes récentes
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.recent() });
    },
  });
}

// Hook pour mettre à jour une commande
export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Order> }) => {
      // Si on met à jour uniquement le statut, utiliser la méthode dédiée
      if (data.status && Object.keys(data).length === 1) {
        return apiService.orders.updateStatus(id, data.status);
      }
      // Sinon utiliser la méthode update standard
      return apiService.orders.update(id, data);
    },
    onSuccess: (updatedOrder) => {
      // Mettre à jour la commande dans le cache
      queryClient.setQueryData(
        queryKeys.orders.detail(updatedOrder.id),
        updatedOrder
      );

      // Invalider les listes de commandes
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });

      // Invalider les commandes par utilisateur si applicable
      if (updatedOrder.clientId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.orders.byUser(updatedOrder.clientId),
        });
      }

      // Invalider les commandes par vendeur si applicable
      if (updatedOrder.vendorId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.orders.byMerchant(updatedOrder.vendorId),
        });
      }

      // Invalider les commandes récentes
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.recent() });
    },
  });
}

// Hook pour supprimer une commande
export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.orders.delete(id),
    onSuccess: (_, deletedId) => {
      // Supprimer la commande du cache
      queryClient.removeQueries({
        queryKey: queryKeys.orders.detail(deletedId),
      });

      // Invalider toutes les listes de commandes
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

// Hook pour précharger une commande
export function usePrefetchOrder() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.orders.detail(id),
      queryFn: () => apiService.orders.get(id),
      staleTime: 5 * 60 * 1000,
    });
  };
}
