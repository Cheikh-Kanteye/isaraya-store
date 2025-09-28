import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import config from "@/config";
import { apiService } from "@/services/api";
import type { Order } from "@/types"; // Import Order from global types file

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
}

// Interface pour la réponse de création de commande
export interface CreateOrderResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    message: string;
    data: {
      id: string;
      status: string;
      total: number;
      clientId: string;
      vendorId?: string;
      paymentUrl?: string;
    };
  };
}

interface OrderState {
  orders: Order[];
  merchantOrders: import("@/types").MerchantOrder[]; // Renamed from vendorOrders
  isLoading: boolean;
  error: string | null;
  successMessage: string | null; // Nouveau champ pour les messages de succès
  lastCreatedOrder: unknown | null; // Stocker la dernière commande créée
  lastFetchTime: number | null;
  cachedvendorId: string | null; // Renamed from cachedVendorId
  cachedStats: Record<string, OrderStats>;

  // Actions
  fetchOrders: () => Promise<void>;
  fetchMerchantOrders: (vendorId: string) => Promise<void>; // Nouvelle méthode
  setMerchantOrders: (orders: import("@/types").MerchantOrder[]) => void; // Renamed from setVendorOrders
  updateOrderStatus: (
    orderId: string,
    status: Order["status"]
  ) => Promise<void>;
  updateOrderStatusOptimistic: (
    orderId: string,
    status: Order["status"]
  ) => void;
  createOrder: (
    orderData: Omit<Order, "id" | "createdAt" | "updatedAt">
  ) => Promise<import("@/services/api").OrderCreationResult>; // Retourner le payload normalisé
  getOrderStats: (vendorId?: string) => OrderStats;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void; // Nouvelle action
  clearMessages: () => void; // Nouvelle action pour nettoyer les messages
  redirectToPayment: (paymentUrl: string) => void; // Nouvelle action pour redirection
  clearCache: () => void;
}

const API_BASE_URL = config.api.url; // Utilisation de l'URL de l'API depuis la configuration

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      merchantOrders: [], // Renamed from vendorOrders
      isLoading: false,
      error: null,
      successMessage: null, // Nouveau champ
      lastCreatedOrder: null, // Nouveau champ
      lastFetchTime: null,
      cachedvendorId: null, // Renamed from cachedVendorId
      cachedStats: {},

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setSuccessMessage: (successMessage) => set({ successMessage }), // Nouvelle action
      clearMessages: () => set({ error: null, successMessage: null }), // Nouvelle action
      clearCache: () => set({ cachedStats: {}, cachedvendorId: null }), // Renamed cachedVendorId

      fetchOrders: async () => {
        set({ isLoading: true, error: null });

        try {
          // Anciennement: const response = await fetch(`${API_BASE_URL}/orders`);
          // Remplacé par:
          const orders = await apiService.orders.getAll();

          set({ orders, isLoading: false });
        } catch (error) {
          set({
            error: "Erreur lors du chargement des commandes",
            isLoading: false,
          });
        }
      },

      fetchMerchantOrders: async (vendorId: string) => {
        set({ isLoading: true, error: null });

        try {
          const orders = await apiService.orders.getMerchantOrders(vendorId);

          set({ merchantOrders: orders, isLoading: false });
        } catch (error) {
          set({
            error: "Erreur lors du chargement des commandes du marchand",
            isLoading: false,
          });
        }
      },

      setMerchantOrders: (orders: import("@/types").MerchantOrder[]) => {
        set({ merchantOrders: orders, isLoading: false }); // Renamed from vendorOrders
      },

      updateOrderStatus: async (orderId: string, status: Order["status"]) => {
        try {
          await apiService.orders.updateStatus(orderId, status);

          const { orders, merchantOrders } = get(); // Renamed vendorOrders

          const updatedOrders = orders.map((order) =>
            order.id === orderId ? { ...order, status } : order
          );
          const updatedMerchantOrders = merchantOrders.map(
            (
              order // Renamed updatedVendorOrders and vendorOrders
            ) => (order.id === orderId ? { ...order, status } : order)
          );

          set({
            orders: updatedOrders,
            merchantOrders: updatedMerchantOrders, // Renamed vendorOrders
            cachedStats: {}, // Clear stats cache
          });
        } catch (error) {
          set({ error: "Erreur lors de la mise à jour de la commande" });
        }
      },

      updateOrderStatusOptimistic: (
        orderId: string,
        status: Order["status"]
      ) => {
        const { orders, merchantOrders } = get(); // Renamed vendorOrders
        set({
          orders: orders.map((order) =>
            order.id === orderId ? { ...order, status } : order
          ),
          merchantOrders: merchantOrders.map(
            (
              order // Renamed vendorOrders
            ) => (order.id === orderId ? { ...order, status } : order)
          ),
          cachedStats: {}, // Clear stats cache
        });
      },

      createOrder: async (
        orderData: Omit<Order, "id" | "createdAt" | "updatedAt">
      ) => {
        set({ isLoading: true, error: null, successMessage: null });

        try {
          // Validation des données, ensure orderData matches CreateOrderDto
          if (
            !orderData.clientId ||
            !orderData.items ||
            orderData.total === undefined
          ) {
            throw new Error("Données de commande incomplètes");
          }

          if (orderData.total <= 0) {
            throw new Error("Le total doit être positif");
          }

          const creation = await apiService.orders.createOrder(orderData);

          const id =
            creation.id ?? creation.data?.data?.id ?? `temp-${Date.now()}`;
          const total =
            creation.total ?? creation.data?.data?.total ?? orderData.total;
          const status =
            (creation.status as Order["status"]) ??
            (creation.data?.data?.status as Order["status"]) ??
            "PENDING_PAYMENT";

          const newOrder: Order = {
            ...orderData,
            id,
            total,
            status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Mise à jour optimiste
          const { orders, merchantOrders } = get();
          set({
            orders: [...orders, newOrder],
            merchantOrders: merchantOrders,
            cachedStats: {}, // Invalider le cache des stats
            isLoading: false,
            successMessage: "Commande créée avec succès",
            lastCreatedOrder: creation,
          });

          // Si une URL de paiement est fournie, rediriger automatiquement
          const redir = (creation as any)?.redirectUrl || (creation as any)?.paymentUrl || (creation as any)?.data?.data?.paymentUrl;
          if (redir) {
            setTimeout(() => {
              get().redirectToPayment(redir);
            }, 800);
          }

          return creation;
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Erreur lors de la création de la commande",
            isLoading: false,
            successMessage: null,
            lastCreatedOrder: null,
          });
          throw error;
        }
      },

      getOrderStats: (vendorId?: string) => {
        const { orders, merchantOrders, cachedStats } = get(); // Renamed vendorOrders
        // Filter orders by vendorId if provided
        const relevantOrders = vendorId ? merchantOrders : orders; // Renamed vendorOrders
        const cacheKey = vendorId || "all";

        if (cachedStats[cacheKey]) {
          return cachedStats[cacheKey];
        }

        const totalOrders = relevantOrders.length;
        const totalRevenue = relevantOrders.reduce(
          (sum, order) =>
            sum +
            ("total" in order
              ? (order as Order).total
              : (order as import("@/types").MerchantOrder).merchantTotal),
          0
        );
        const pendingOrders = relevantOrders.filter(
          (order) => order.status === "PENDING"
        ).length;
        const completedOrders = relevantOrders.filter(
          (order) => order.status === "DELIVERED"
        ).length;

        const stats = {
          totalOrders,
          totalRevenue,
          pendingOrders,
          completedOrders,
        };

        set((state) => ({
          cachedStats: { ...state.cachedStats, [cacheKey]: stats },
        }));

        return stats;
      },

      redirectToPayment: (paymentUrl: string) => {
        // Rediriger vers l'URL de paiement
        window.location.href = paymentUrl;
      },
    }),
    {
      name: "order-storage",
      storage: createJSONStorage(() => sessionStorage), // Utilisation de sessionStorage
      partialize: (state) => ({
        lastCreatedOrder: state.lastCreatedOrder,
        cachedvendorId: state.cachedvendorId,
        cachedStats: state.cachedStats,
      }),
    }
  )
);
