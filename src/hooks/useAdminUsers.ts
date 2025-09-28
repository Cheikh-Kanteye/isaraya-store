import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiService } from "@/services/api";
import type { User, MerchantProfile, ValidateMerchantDto } from "@/types";

export interface AdminUser extends User {
  merchantProfile?: MerchantProfile | null;
  _count?: {
    orders?: number;
    products?: number;
  };
}

export interface AdminUsersFilters {
  role?: "CLIENT" | "MERCHANT" | "ADMIN";
  status?: "active" | "inactive";
  merchantStatus?: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  search?: string;
  page?: number;
  limit?: number;
}

// Hook pour récupérer tous les utilisateurs avec filtres
export const useAdminUsers = (filters?: AdminUsersFilters) => {
  return useQuery({
    queryKey: ["admin-users", filters],
    queryFn: async (): Promise<AdminUser[]> => {
      try {
        const params: Record<string, any> = {};

        if (filters?.role) params.role = filters.role;
        if (filters?.status) params.status = filters.status;
        if (filters?.merchantStatus)
          params.merchantStatus = filters.merchantStatus;
        if (filters?.search) params.search = filters.search;
        if (filters?.page) params.page = filters.page;
        if (filters?.limit) params.limit = filters.limit;

        const users = await apiService.users.getAdminUsers();

        // Si on filtre par des critères spécifiques
        let filteredUsers = users;

        if (filters?.role) {
          filteredUsers = filteredUsers.filter((user) =>
            user.roles.some((role) => role.name === filters.role)
          );
        }

        if (filters?.status) {
          filteredUsers = filteredUsers.filter((user) =>
            filters.status === "active" ? user.isActive : !user.isActive
          );
        }

        if (filters?.merchantStatus && filters?.role === "MERCHANT") {
          filteredUsers = filteredUsers.filter(
            (user) => user.merchantProfile?.status === filters.merchantStatus
          );
        }

        if (filters?.search) {
          const searchTerm = filters.search.toLowerCase();
          filteredUsers = filteredUsers.filter(
            (user) =>
              user.firstName.toLowerCase().includes(searchTerm) ||
              user.lastName.toLowerCase().includes(searchTerm) ||
              user.email.toLowerCase().includes(searchTerm) ||
              user.merchantProfile?.businessName
                ?.toLowerCase()
                .includes(searchTerm)
          );
        }

        return filteredUsers;
      } catch (error) {
        console.error("Error fetching admin users:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook pour récupérer les profils marchands
export const useMerchantProfiles = () => {
  return useQuery({
    queryKey: ["merchant-profiles"],
    queryFn: async (): Promise<MerchantProfile[]> => {
      try {
        return await apiService.users.getMerchants();
      } catch (error) {
        console.error("Error fetching merchant profiles:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook pour récupérer un profil marchand spécifique
export const useMerchantProfile = (vendorId: string) => {
  return useQuery({
    queryKey: ["merchant-profile", vendorId],
    queryFn: () => apiService.users.getMerchant(vendorId),
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook pour valider/rejeter un profil marchand
export const useValidateMerchantProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vendorId,
      status,
      reason,
    }: {
      vendorId: string;
      status: "APPROVED" | "REJECTED";
      reason?: string;
    }) => {
      return await apiService.users.validateMerchantProfile(vendorId, {
        status,
        reason,
      });
    },
    onSuccess: (_, variables) => {
      // Invalider les requêtes pour forcer le rechargement des données
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["merchant-profiles"] });
      queryClient.invalidateQueries({
        queryKey: ["merchant-profile", variables.vendorId],
      });

      const statusText =
        variables.status === "APPROVED" ? "approuvé" : "rejeté";
      toast.success(`Profil marchand ${statusText} avec succès`);
    },
    onError: (error) => {
      console.error("Error validating merchant profile:", error);
      toast.error("Erreur lors de la validation du profil marchand");
    },
  });
};

// Hook pour suspendre/réactiver un utilisateur
export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      isActive,
    }: {
      userId: string;
      isActive: boolean;
    }) => {
      return await apiService.users.update(userId, { isActive });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });

      const statusText = variables.isActive ? "réactivé" : "suspendu";
      toast.success(`Utilisateur ${statusText} avec succès`);
    },
    onError: (error) => {
      console.error("Error toggling user status:", error);
      toast.error("Erreur lors de la modification du statut utilisateur");
    },
  });
};

// Hook pour supprimer un utilisateur
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await apiService.users.delete(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Utilisateur supprimé avec succès");
    },
    onError: (error) => {
      console.error("Error deleting user:", error);
      toast.error("Erreur lors de la suppression de l'utilisateur");
    },
  });
};

// Hook pour les statistiques des utilisateurs
export const useUsersStats = () => {
  return useQuery({
    queryKey: ["admin-users-stats"],
    queryFn: async () => {
      try {
        const users = await apiService.users.getAdminUsers();

        const stats = {
          total: users.length,
          active: users.filter((u) => u.isActive).length,
          inactive: users.filter((u) => !u.isActive).length,
          clients: users.filter((u) => u.roles.some((r) => r.name === "CLIENT"))
            .length,
          merchants: users.filter((u) =>
            u.roles.some((r) => r.name === "MERCHANT")
          ).length,
          admins: users.filter((u) => u.roles.some((r) => r.name === "ADMIN"))
            .length,
          merchantProfiles: {
            total: users.filter((u) => u.merchantProfile).length,
            pending: users.filter(
              (u) => u.merchantProfile?.status === "PENDING"
            ).length,
            approved: users.filter(
              (u) => u.merchantProfile?.status === "APPROVED"
            ).length,
            rejected: users.filter(
              (u) => u.merchantProfile?.status === "REJECTED"
            ).length,
            suspended: users.filter(
              (u) => u.merchantProfile?.status === "SUSPENDED"
            ).length,
          },
        };

        return stats;
      } catch (error) {
        console.error("Error fetching users stats:", error);
        return {
          total: 0,
          active: 0,
          inactive: 0,
          clients: 0,
          merchants: 0,
          admins: 0,
          merchantProfiles: {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            suspended: 0,
          },
        };
      }
    },
    staleTime: 30 * 1000, // 30 secondes
  });
};
