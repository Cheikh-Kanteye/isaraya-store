import { useMemo, useEffect, useState } from "react";
import { useAuthStore, useProductStore, useOrderStore } from "@/stores";
import { apiService } from "@/services/api";
import { calculateAdminStats, CalculatedAdminStats } from "@/utils/adminStatsCalculator";
import type { User } from "@/types";

/**
 * Hook qui calcule les statistiques admin côté client
 * Utilise les stores existants au lieu de créer de nouveaux hooks
 * @returns Les statistiques calculées et l'état de chargement
 */
export function useCalculatedAdminStats() {
  const { orders, isLoading: isLoadingOrders, fetchOrders } = useOrderStore();
  const { products, categories, isLoading: isLoadingProducts, fetchCategories, fetchProducts } = useProductStore();
  const { user } = useAuthStore();
  
  // State local pour les users seulement
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Charger les données au montage
  useEffect(() => {
    const loadData = async () => {
      // Lancer tous les chargements en parallèle
      const promises = [];
      
      // Charger les commandes si pas déjà chargées
      if (orders.length === 0 && !isLoadingOrders) {
        promises.push(fetchOrders());
      }

      // Charger les produits via le productStore si pas déjà chargés
      if (products.length === 0 && !isLoadingProducts) {
        promises.push(fetchProducts());
      }

      // Charger les catégories via le productStore si pas déjà chargées
      if (categories.length === 0 && !isLoadingProducts) {
        promises.push(fetchCategories());
      }

      // Charger les users
      if (users.length === 0 && !isLoadingUsers) {
        setIsLoadingUsers(true);
        const userPromise = apiService.users.getAll()
          .then(fetchedUsers => {
            setUsers(fetchedUsers);
          })
          .catch(error => {
            console.error('Erreur lors du chargement des utilisateurs:', error);
          })
          .finally(() => {
            setIsLoadingUsers(false);
          });
        promises.push(userPromise);
      }

      // Attendre que toutes les promesses se résolvent
      if (promises.length > 0) {
        try {
          await Promise.all(promises);
        } catch (error) {
          console.error('Erreur lors du chargement des données:', error);
        }
      }
    };

    loadData();
  }, [orders.length, products.length, users.length, categories.length, isLoadingOrders, isLoadingProducts, isLoadingUsers, fetchOrders, fetchProducts, fetchCategories]);

  const isLoading = isLoadingOrders || isLoadingProducts || isLoadingUsers;

  const calculatedStats: CalculatedAdminStats | null = useMemo(() => {
    // Condition assouplie : on peut calculer avec juste les commandes et les utilisateurs
    if (isLoading || !orders.length || !users.length) {
      return null;
    }

    return calculateAdminStats(orders, products, users, categories);
  }, [orders, products, users, categories, isLoading]);

  return {
    data: calculatedStats,
    isLoading,
    error: null
  };
}
