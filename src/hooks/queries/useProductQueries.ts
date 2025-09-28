import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { queryKeys } from "@/services/queryClient";
import type { Product, ProductsParams } from "@/types";

// Hook pour récupérer tous les produits avec filtres
export function useProducts(params: ProductsParams = {}) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => apiService.products.getAll(params),
    enabled: true,
  });
}

// Hook pour récupérer un produit par ID
export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => apiService.products.get(id),
    enabled: !!id,
  });
}

// Hook pour récupérer les produits par catégorie
export function useProductsByCategory(categoryId: string) {
  return useQuery({
    queryKey: queryKeys.products.byCategory(categoryId),
    queryFn: () => apiService.products.getByCategory(categoryId),
    enabled: !!categoryId,
  });
}

// Hook pour récupérer les produits par vendeur
export function useProductsByMerchant(vendorId: string) {
  return useQuery({
    queryKey: queryKeys.products.byMerchant(vendorId),
    queryFn: () => apiService.products.getAll({ vendorId }),
    enabled: !!vendorId,
  });
}

// Hook pour la recherche de produits
export function useProductSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.products.search(query),
    queryFn: () => apiService.products.getAll({ search: query }),
    enabled: !!query && query.length > 2,
    staleTime: 30 * 1000, // 30 secondes pour la recherche
  });
}

// Hook pour créer un produit
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) =>
      apiService.products.createProduct(product),
    onMutate: async (newProduct) => {
      // Créer un produit temporaire avec statut "creating"
      const tempProduct: Product & { isCreating?: boolean } = {
        ...newProduct,
        id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isCreating: true,
      };

      // Ajouter immédiatement à l'interface
      queryClient.setQueriesData(
        { queryKey: queryKeys.products.all },
        (oldData: Product[] | undefined) => {
          if (!oldData) return [tempProduct];
          return [tempProduct, ...oldData];
        }
      );

      return { tempProduct };
    },
    onSuccess: (realProduct, _, context) => {
      // Remplacer le produit temporaire par le vrai
      queryClient.setQueriesData(
        { queryKey: queryKeys.products.all },
        (oldData: Product[] | undefined) => {
          if (!oldData) return [realProduct];
          return oldData.map((p) =>
            p.id === context?.tempProduct.id ? realProduct : p
          );
        }
      );
      
      queryClient.setQueryData(
        queryKeys.products.detail(realProduct.id),
        realProduct
      );
    },
    onError: (_, __, context) => {
      // Supprimer le produit temporaire en cas d'erreur
      queryClient.setQueriesData(
        { queryKey: queryKeys.products.all },
        (oldData: Product[] | undefined) => {
          if (!oldData) return [];
          return oldData.filter((p) => p.id !== context?.tempProduct.id);
        }
      );
    },
  });
}

// Hook pour mettre à jour un produit
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      apiService.products.update(id, data),
    // Mise à jour optimiste - applique les changements immédiatement
    onMutate: async ({ id, data }) => {
      // Annuler toutes les requêtes de produits
      await queryClient.cancelQueries({ queryKey: queryKeys.products.all });

      // Sauvegarder l'état précédent
      const previousData = queryClient.getQueriesData({
        queryKey: queryKeys.products.all,
      });

      // Mettre à jour TOUTES les requêtes de produits
      queryClient.setQueriesData(
        { queryKey: queryKeys.products.all },
        (oldData: Product[] | { data: Product[] } | undefined) => {
          if (!oldData) return oldData;

          if (Array.isArray(oldData)) {
            return oldData.map((product: Product) =>
              product.id === id ? { ...product, ...data } : product
            );
          }

          if (oldData.data && Array.isArray(oldData.data)) {
            return {
              ...oldData,
              data: oldData.data.map((product: Product) =>
                product.id === id ? { ...product, ...data } : product
              ),
            };
          }

          return oldData;
        }
      );

      // Mettre à jour le cache de détail du produit
      queryClient.setQueryData(
        queryKeys.products.detail(id),
        (oldProduct: Product | undefined) => {
          if (!oldProduct) return oldProduct;
          return { ...oldProduct, ...data };
        }
      );

      return { previousData };
    },
    // En cas d'erreur, restaurer les données précédentes
    onError: (err, { id, data }, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    // Remplacer par les vraies données du serveur
    onSuccess: (updatedProduct) => {
      // Mettre à jour le cache de détail avec les données réelles
      queryClient.setQueryData(
        queryKeys.products.detail(updatedProduct.id),
        updatedProduct
      );
    },
    // Synchroniser avec le serveur
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

// Hook pour supprimer un produit
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.products.delete(id),
    // Mise à jour optimiste - retire le produit immédiatement
    onMutate: async (deletedId) => {
      // Annuler toutes les requêtes de produits en cours
      await queryClient.cancelQueries({ queryKey: queryKeys.products.all });

      // Sauvegarder l'état précédent pour le rollback
      const previousData = queryClient.getQueriesData({
        queryKey: queryKeys.products.all,
      });

      // Mettre à jour TOUTES les requêtes de produits
      queryClient.setQueriesData(
        { queryKey: queryKeys.products.all },
        (oldData: Product[] | { data: Product[] } | undefined) => {
          if (!oldData) return oldData;

          if (Array.isArray(oldData)) {
            return oldData.filter(
              (product: Product) => product.id !== deletedId
            );
          }

          if (oldData.data && Array.isArray(oldData.data)) {
            return {
              ...oldData,
              data: oldData.data.filter(
                (product: Product) => product.id !== deletedId
              ),
            };
          }

          return oldData;
        }
      );

      return { previousData };
    },
    // En cas d'erreur, restaurer les données précédentes
    onError: (err, deletedId, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    // Synchroniser avec le serveur après la mutation
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}

// Hook pour précharger un produit
export function usePrefetchProduct() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.products.detail(id),
      queryFn: () => apiService.products.get(id),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
}
