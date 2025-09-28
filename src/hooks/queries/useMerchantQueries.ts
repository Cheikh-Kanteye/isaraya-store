import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { queryKeys } from "@/services/queryClient";
import { useAuthStore } from "@/stores";
import type { MerchantStats, MerchantProfile } from "@/types";

// Hook pour récupérer les statistiques d'un marchand
export function useMerchantStats() {
  const { user } = useAuthStore();

  return useQuery<MerchantStats>({
    queryKey: ["merchants", "stats", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User ID is required");
      }
      const data = await apiService.users.getMerchantStats(user.id);
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch toutes les 10 minutes
  });
}

// Hook pour récupérer le profil marchand
export function useMerchantProfile() {
  const { user } = useAuthStore();

  return useQuery<MerchantProfile>({
    queryKey: ["merchants", "profile", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User ID is required");
      }
      const profile = await apiService.users.getMerchantProfile();
      return profile;
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
