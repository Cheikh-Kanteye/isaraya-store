import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/services/queryClient";
import { apiService } from "@/services/api";
import type { DashboardStats } from "@/types";

// Hook pour récupérer les statistiques du dashboard vendeur
export function useMerchantStats(vendorId: string) {
  return useQuery({
    queryKey: queryKeys.stats.merchant(vendorId),
    queryFn: async (): Promise<DashboardStats> => {
      if (!vendorId) {
        return {
          totalRevenue: 0,
          totalProducts: 0,
          totalOrders: 0,
          pendingOrders: 0,
        };
      }

      // Fetch products and orders for the merchant
      const products = await apiService.products.getAll({ vendorId });
      const orders = await apiService.orders.getAll({ vendorId });

      // Calculer les statistiques
      const totalProducts = products.length;
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(
        (order) => order.status.toUpperCase() === "PENDING" // Updated status
      ).length;

      // Calculer le chiffre d'affaires total
      const totalRevenue = orders
        .filter((order) => order.status.toUpperCase() !== "CANCELLED")
        .reduce((sum, order) => sum + (order.total || 0), 0); // Updated to use order.total

      return {
        totalRevenue,
        totalProducts,
        totalOrders,
        pendingOrders,
      };
    },
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook pour récupérer les statistiques générales du dashboard
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.stats.dashboard(),
    queryFn: async (): Promise<DashboardStats> => {
      // Récupérer tous les produits
      const products = await apiService.products.getAll();

      // Récupérer toutes les commandes
      const orders = await apiService.orders.getAll();

      // Calculer les statistiques
      const totalProducts = products.length;
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(
        (order) => order.status.toUpperCase() === "PENDING" // Updated status
      ).length;

      // Calculer le chiffre d'affaires total
      const totalRevenue = orders
        .filter((order) => order.status.toUpperCase() !== "CANCELLED")
        .reduce((sum, order) => sum + (order.total || 0), 0); // Updated to use order.total

      return {
        totalRevenue,
        totalProducts,
        totalOrders,
        pendingOrders,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
