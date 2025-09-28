import { Order, Product, User, OrderItem } from "@/types";

/**
 * Parse les items d'une commande qui peuvent être un array ou une string JSON
 */
export function parseOrderItems(items: OrderItem[] | string): OrderItem[] {
  if (Array.isArray(items)) {
    return items;
  }

  if (typeof items === "string") {
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("Erreur parsing items JSON:", error, items);
      return [];
    }
  }

  return [];
}

export interface TopProduct {
  id: string;
  name: string;
  totalSold: number;
  revenue: number;
  merchantName: string;
}

interface ProductSalesData {
  product: Product;
  totalSold: number;
  revenue: number;
  merchantName: string;
}

// Cache pour la mémoïsation
interface CacheEntry {
  key: string;
  result: TopProduct[];
  timestamp: number;
}

class TopProductsCalculator {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes en millisecondes

  /**
   * Génère une clé de cache basée sur les données d'entrée
   */
  private generateCacheKey(
    orders: Order[],
    products: Product[],
    users: User[]
  ): string {
    // Utilise les longueurs et quelques propriétés pour générer une clé unique
    const orderKey =
      orders.length > 0
        ? `${orders.length}-${orders[0]?.id}-${orders[orders.length - 1]?.id}`
        : "0";
    const productKey =
      products.length > 0 ? `${products.length}-${products[0]?.id}` : "0";
    const userKey = users.length > 0 ? `${users.length}-${users[0]?.id}` : "0";

    return `${orderKey}|${productKey}|${userKey}`;
  }

  /**
   * Vérifie si une entrée de cache est encore valide
   */
  private isCacheValid(entry: CacheEntry): boolean {
    const now = Date.now();
    return now - entry.timestamp < this.CACHE_TTL;
  }

  /**
   * Nettoie les entrées de cache expirées
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Calcule les top produits avec jointure optimisée et mémoïsation
   */
  public calculateTopProducts(
    orders: Order[] = [],
    products: Product[] = [],
    users: User[] = [],
    limit: number = 5
  ): TopProduct[] {
    // Validation des entrées
    const safeOrders = Array.isArray(orders) ? orders : [];
    const safeProducts = Array.isArray(products) ? products : [];
    const safeUsers = Array.isArray(users) ? users : [];

    if (safeOrders.length === 0 || safeProducts.length === 0) {
      return [];
    }

    // Génération de la clé de cache
    const cacheKey = this.generateCacheKey(safeOrders, safeProducts, safeUsers);

    // Vérification du cache
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      return cached.result.slice(0, limit);
    }

    const startTime = performance.now();

    // Nettoyage du cache expiré
    this.cleanExpiredCache();

    // Création des index pour optimiser les recherches
    const productIndex = new Map<string, Product>();
    const userIndex = new Map<string, User>();

    // Index des produits pour accès O(1)
    safeProducts.forEach((product) => {
      productIndex.set(product.id, product);
    });

    // Index des utilisateurs pour accès O(1)
    safeUsers.forEach((user) => {
      userIndex.set(user.id, user);
    });

    // Map pour aggréger les ventes par produit
    const productSales = new Map<string, ProductSalesData>();

    // Jointure optimisée : Orders -> OrderItems -> Products -> Users
    safeOrders.forEach((order) => {
      // Utiliser la fonction utilitaire pour parser les items
      const items = parseOrderItems(order.items);

      items.forEach((item) => {
        if (!item?.produitId) return;

        const product = productIndex.get(item.produitId);
        if (!product) return;

        // Calculs des quantités et revenus
        const quantity = item.quantity || 0;
        const itemPrice = item.price || product.price || 0;
        const itemRevenue = itemPrice * quantity;

        // Récupération des informations du marchand
        const merchant = product.vendorId
          ? userIndex.get(product.vendorId)
          : null;
        const merchantName =
          merchant?.merchantProfile?.businessName ||
          `Marchand ${product.vendorId?.slice(-4) || "Inconnu"}`;

        // Agrégation des données
        const existing = productSales.get(product.id);
        if (existing) {
          existing.totalSold += quantity;
          existing.revenue += itemRevenue;
        } else {
          productSales.set(product.id, {
            product,
            totalSold: quantity,
            revenue: itemRevenue,
            merchantName,
          });
        }
      });
    });

    // Tri et sélection des top produits
    const topProducts = Array.from(productSales.values())
      .sort((a, b) => {
        // Tri principal par quantité vendue, secondaire par revenus
        if (b.totalSold !== a.totalSold) {
          return b.totalSold - a.totalSold;
        }
        return b.revenue - a.revenue;
      })
      .slice(0, limit)
      .map((item) => ({
        id: item.product.id,
        name: item.product.name,
        totalSold: item.totalSold,
        revenue: Math.round(item.revenue * 100) / 100, // Arrondi à 2 décimales
        merchantName: item.merchantName,
      }));

    const endTime = performance.now();

    // Mise en cache du résultat
    this.cache.set(cacheKey, {
      key: cacheKey,
      result: topProducts,
      timestamp: Date.now(),
    });

    return topProducts;
  }

  /**
   * Vide le cache manuellement (utile pour les tests ou actualisations forcées)
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Obtient les statistiques du cache
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Instance singleton pour réutiliser le cache entre les appels
export const topProductsCalculator = new TopProductsCalculator();

/**
 * Fonction helper pour un usage simple
 * @param orders Liste des commandes
 * @param products Liste des produits
 * @param users Liste des utilisateurs
 * @param limit Nombre de produits à retourner (défaut: 5)
 * @returns Top produits avec mémoïsation
 */
export function calculateTopProducts(
  orders: Order[],
  products: Product[],
  users: User[],
  limit: number = 5
): TopProduct[] {
  return topProductsCalculator.calculateTopProducts(
    orders,
    products,
    users,
    limit
  );
}
