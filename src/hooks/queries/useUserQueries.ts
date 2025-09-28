import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { queryKeys } from "@/services/queryClient";
import type { User, MerchantProfile, CreateMerchantProfileDto } from "@/types";

// Interface pour les paramètres de filtrage des utilisateurs
interface UsersParams extends Record<string, unknown> {
  role?: "CLIENT" | "MERCHANT" | "ADMIN"; // Specific roles
  status?: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED"; // For merchant profiles
  _limit?: number;
  _page?: number;
  _sort?: string;
  _order?: "asc" | "desc";
}

// Hook pour récupérer tous les utilisateurs (could be a mix of User and MerchantProfile in practice)
export function useUsers(params: UsersParams = {}) {
  return useQuery<User[]>({
    // Explicitly type as User[] for now, will refine if necessary
    queryKey: queryKeys.users.list(params),
    queryFn: () => apiService.users.getAll(params) as Promise<User[]>, // Cast as User[]
  });
}

// Hook pour récupérer un utilisateur par ID
export function useUser(id: string) {
  return useQuery<User>({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => apiService.users.get(id),
    enabled: !!id,
  });
}

// Hook pour récupérer tous les merchants (MerchantProfiles)
export function useMerchants() {
  return useQuery<MerchantProfile[]>({
    // Returns MerchantProfile[]
    queryKey: queryKeys.users.merchants(),
    queryFn: () => apiService.users.getMerchants(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook pour récupérer un merchant par ID (MerchantProfile)
export function useMerchant(id: string) {
  return useQuery<MerchantProfile>({
    // Returns MerchantProfile
    queryKey: queryKeys.users.merchant(id),
    queryFn: async () => {
      if (!id) {
        throw new Error("vendorId is required");
      }

      console.log(`Fetching merchant data for ID: ${id}`);

      try {
        const merchant = await apiService.users.getMerchant(id);
        console.log(
          `Merchant data fetched successfully for ID ${id}:`,
          merchant
        );
        return merchant;
      } catch (error) {
        console.error(`Error fetching merchant with ID ${id}:`, error);
        throw error;
      }
    },
    enabled: !!id && id.length > 0,
    retry: (failureCount, error) => {
      // Ne pas retry pour les erreurs 404 (merchant not found)
      if (
        error &&
        typeof error === "object" &&
        "statusCode" in error &&
        error.statusCode === 404
      ) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook pour récupérer l'utilisateur actuel (si authentifié)
export function useCurrentUser() {
  return useQuery<User | null>({
    queryKey: queryKeys.users.current(),
    queryFn: async () => {
      // This should ideally call apiService.auth.getProfile() or similar
      // For now, it might rely on authStore's getCurrentUser
      return null; // Keep as null for now, or integrate with authStore
    },
    enabled: false, // Disabled for now
  });
}

// Hook pour créer un utilisateur
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation<
    User,
    Error,
    Omit<User, "id" | "createdAt" | "updatedAt">,
    unknown
  >({
    mutationFn: (user: Omit<User, "id" | "createdAt" | "updatedAt">) =>
      apiService.users.create(user),
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      queryClient.setQueryData(queryKeys.users.detail(newUser.id), newUser);
      if (newUser.roles.some((role) => role.name === "MERCHANT")) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.users.merchants(),
        });
      }
    },
  });
}

// Hook pour mettre à jour un utilisateur
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation<
    User,
    Error,
    { id: string; data: Record<string, unknown> },
    unknown
  >({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiService.users.update(id, data as Partial<User>),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(
        queryKeys.users.detail(updatedUser.id),
        updatedUser
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      if (updatedUser.roles.some((role) => role.name === "MERCHANT")) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.users.merchants(),
        });
        queryClient.setQueryData(
          queryKeys.users.merchant(updatedUser.id),
          updatedUser
        );
      }
    },
  });
}

// Hook pour supprimer un utilisateur
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, unknown>({
    mutationFn: (userId: string) => apiService.users.delete(userId),
    onSuccess: (_, deletedUserId) => {
      queryClient.removeQueries({
        queryKey: queryKeys.users.detail(deletedUserId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.users.merchant(deletedUserId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.merchants() });
    },
  });
}

// Hook pour précharger un utilisateur
export function usePrefetchUser() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.users.detail(id),
      queryFn: () => apiService.users.get(id),
      staleTime: 5 * 60 * 1000,
    });
  };
}

// Hook pour précharger un merchant
export function usePrefetchMerchant() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.users.merchant(id),
      queryFn: () => apiService.users.getMerchant(id),
      staleTime: 5 * 60 * 1000,
    });
  };
}

export function useUpdateCurrentUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User>) => apiService.users.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.current() });
    },
  });
}

export function useCreateMerchantProfile() {
  return useMutation({
    mutationFn: (data: CreateMerchantProfileDto) =>
      apiService.users.createMerchantProfile(data),
  });
}
