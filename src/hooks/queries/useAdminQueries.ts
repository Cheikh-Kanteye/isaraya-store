import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { useAuthStore } from "@/stores";
import type { AdminStats, AdminUser, Order } from "@/types";

// Hook pour récupérer les statistiques admin
export function useAdminStats() {
  const { user } = useAuthStore();

  // Vérifier que l'utilisateur a le rôle ADMIN
  const isAdmin = user?.roles?.some((role) => role.name === "ADMIN");

  return useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: async () => apiService.users.getAdminStats(),
    enabled: !!user && isAdmin,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });
}

// Hook pour récupérer les utilisateurs admin
export function useAdminUsers() {
  const { user } = useAuthStore();

  // Vérifier que l'utilisateur a le rôle ADMIN
  const isAdmin = user?.roles?.some((role) => role.name === "ADMIN");

  return useQuery<AdminUser[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => apiService.users.getAdminUsers(),
    enabled: !!user && isAdmin,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });
}

// Hook pour récupérer toutes les commandes (admin)
export function useOrders() {
  const { user } = useAuthStore();

  // Vérifier que l'utilisateur a le rôle ADMIN
  const isAdmin = user?.roles?.some((role) => role.name === "ADMIN");

  return useQuery<Order[]>({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      return await apiService.orders.getAll();
    },
    enabled: !!user && isAdmin,
    staleTime: 2 * 60 * 1000, // 2 minutes (plus court car les commandes changent plus souvent)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });
}
