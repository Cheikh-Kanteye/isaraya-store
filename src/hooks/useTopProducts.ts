import { useMemo, useEffect, useState } from "react";
import { useOrderStore, useProductStore } from "@/stores";
import { apiService } from "@/services/api";
import { calculateTopProducts, TopProduct, topProductsCalculator } from "@/utils/topProductsCalculator";
import type { User } from "@/types";

export interface UseTopProductsOptions {
  limit?: number;
  enableCache?: boolean;
  autoRefresh?: boolean;
}

export interface UseTopProductsReturn {
  topProducts: TopProduct[];
  isLoading: boolean;
  error: string | null;
  clearCache: () => void;
  getCacheStats: () => { size: number; keys: string[] };
}

/**
 * Hook pour récupérer les top produits avec optimisations
 * @param options Configuration du hook
 * @returns Top produits avec état de chargement
 */
export function useTopProducts(options: UseTopProductsOptions = {}): UseTopProductsReturn {
  const { limit = 5, enableCache = true, autoRefresh = false } = options;
  
  // Récupération des données depuis les stores
  const { orders, isLoading: isLoadingOrders } = useOrderStore();
  const { products, isLoading: isLoadingProducts } = useProductStore();
  
  // State local pour les users
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Charger les utilisateurs
  useEffect(() => {
    if (users.length === 0 && !isLoadingUsers) {
      setIsLoadingUsers(true);
      apiService.users.getAll()
        .then(fetchedUsers => {
          setUsers(fetchedUsers);
        })
        .catch(error => {
          console.error('Erreur lors du chargement des utilisateurs:', error);
        })
        .finally(() => {
          setIsLoadingUsers(false);
        });
    }
  }, [users.length, isLoadingUsers]);

  const isLoading = isLoadingOrders || isLoadingProducts || isLoadingUsers;
  
  // Calcul mémoïsé des top produits
  const topProducts = useMemo(() => {
    if (isLoading) return [];
    
    if (!enableCache) {
      // Si le cache est désactivé, vider le cache avant le calcul
      topProductsCalculator.clearCache();
    }
    
    return calculateTopProducts(orders, products, users, limit);
  }, [orders, products, users, limit, isLoading, enableCache]);

  // Fonctions utilitaires
  const clearCache = () => {
    topProductsCalculator.clearCache();
  };

  const getCacheStats = () => {
    return topProductsCalculator.getCacheStats();
  };

  return {
    topProducts,
    isLoading,
    error: null, // Pourrais être étendu pour gérer les erreurs
    clearCache,
    getCacheStats
  };
}

/**
 * Hook simple pour récupérer uniquement les top produits
 * @param limit Nombre de produits à retourner
 * @returns Tableau des top produits
 */
export function useTopProductsOnly(limit: number = 5): TopProduct[] {
  const { topProducts } = useTopProducts({ limit });
  return topProducts;
}