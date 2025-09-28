import { Order, Product, User, Category } from "@/types";
import { calculateTopProducts, TopProduct } from "./topProductsCalculator";

export interface CalculatedAdminStats {
  users: {
    total: number;
    clients: number;
    merchants: number;
    admins: number;
    growth: number;
  };
  merchants: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    growth: number;
  };
  orders: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
    byStatus: Record<string, number>;
  };
  products: {
    total: number;
    thisMonth: number;
    reported: number;
    lowStock: number;
    outOfStock: number;
    byCategory: Array<{
      categoryId: string;
      categoryName: string;
      count: number;
    }>;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
    byMonth: Array<{
      month: string;
      amount: number;
    }>;
  };
  topMerchants: Array<{
    id: string;
    businessName: string;
    revenue: number;
    orders: number;
    products: number;
  }>;
  topProducts: TopProduct[];
  recentActivity: Array<{
    id: string;
    type: "order" | "merchant" | "product" | "user";
    description: string;
    timestamp: string;
  }>;
  systemHealth: {
    apiStatus: "operational" | "degraded" | "down";
    databaseStatus: "operational" | "degraded" | "down";
    paymentStatus: "operational" | "degraded" | "down";
    uptime: number;
  };
}

/**
 * Calcule les statistiques admin à partir des données brutes
 * Remplace temporairement les données du backend qui ne sont pas fiables
 */
export function calculateAdminStats(
  orders: Order[] = [],
  products: Product[] = [],
  users: User[] = [],
  categories: Category[] = []
): CalculatedAdminStats {
  // Vérifications de sécurité pour éviter les erreurs de type
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const safeUsers = Array.isArray(users) ? users : [];
  const safeCategories = Array.isArray(categories) ? categories : [];
  // Calculs pour les utilisateurs
  const totalUsers = safeUsers.length;
  const clientUsers = safeUsers.filter(user => 
    user.roles?.some(role => role.name === "CLIENT")
  ).length;
  const merchantUsers = safeUsers.filter(user => 
    user.roles?.some(role => role.name === "MERCHANT")
  ).length;
  const adminUsers = safeUsers.filter(user => 
    user.roles?.some(role => role.name === "ADMIN")
  ).length;

  // Calculs pour les commandes
  const totalOrders = safeOrders.length;
  const totalRevenue = safeOrders.reduce((acc, order) => acc + (order.total || 0), 0);
  
  // Commandes par statut
  const ordersByStatus = safeOrders.reduce((acc, order) => {
    const status = order.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculs par période (mois actuel vs précédent)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const currentMonthOrders = safeOrders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
  });

  const lastMonthOrders = safeOrders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate.getMonth() === lastMonth && orderDate.getFullYear() === lastMonthYear;
  });

  const currentMonthRevenue = currentMonthOrders.reduce((acc, order) => acc + (order.total || 0), 0);
  const lastMonthRevenue = lastMonthOrders.reduce((acc, order) => acc + (order.total || 0), 0);

  // Calcul de croissance
  const orderGrowth = lastMonthOrders.length > 0 
    ? ((currentMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100 
    : 0;
  
  const revenueGrowth = lastMonthRevenue > 0 
    ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
    : 0;

  // Calculs pour les produits
  const totalProducts = safeProducts.length;
  const lowStockProducts = safeProducts.filter(product => product.stock < 10).length;
  const outOfStockProducts = safeProducts.filter(product => product.stock === 0).length;
  const reportedProducts = safeProducts.reduce((acc, product) => acc + (product.reports || 0), 0);

  // Produits par catégorie
  const productsByCategory = safeProducts.reduce((acc, product) => {
    const category = safeCategories.find(cat => cat.id === product.categoryId);
    if (category) {
      const existing = acc.find(item => item.categoryId === category.id);
      if (existing) {
        existing.count++;
      } else {
        acc.push({
          categoryId: category.id,
          categoryName: category.name,
          count: 1
        });
      }
    }
    return acc;
  }, [] as Array<{ categoryId: string; categoryName: string; count: number }>);

  // Revenus par mois (derniers 6 mois)
  const revenueByMonth = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = date.toISOString().slice(0, 7); // YYYY-MM
    
    const monthOrders = safeOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.toISOString().slice(0, 7) === month;
    });
    
    const monthRevenue = monthOrders.reduce((acc, order) => acc + (order.total || 0), 0);
    revenueByMonth.push({
      month,
      amount: monthRevenue
    });
  }

  // Simuler les top merchants (à ajuster selon vos données)
  const topMerchants = safeUsers.filter(user => 
    user.roles?.some(role => role.name === "MERCHANT")
  ).slice(0, 5).map((user, index) => ({
    id: user.id,
    businessName: user.merchantProfile?.businessName || `Merchant ${index + 1}`,
    revenue: Math.floor(Math.random() * 100000) + 10000,
    orders: Math.floor(Math.random() * 50) + 5,
    products: Math.floor(Math.random() * 20) + 1
  }));

  // Top produits calculés avec optimisation et mémoïsation
  const topProducts = calculateTopProducts(safeOrders, safeProducts, safeUsers, 5);


  // Activité récente (simulée)
  const recentActivity = [
    {
      id: "1",
      type: "order" as const,
      description: "Nouvelle commande reçue",
      timestamp: new Date().toISOString()
    },
    {
      id: "2", 
      type: "merchant" as const,
      description: "Nouveau marchand inscrit",
      timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: "3",
      type: "product" as const,
      description: "Nouveau produit ajouté",
      timestamp: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  return {
    users: {
      total: totalUsers,
      clients: clientUsers,
      merchants: merchantUsers,
      admins: adminUsers,
      growth: 0 // À calculer si on a des données historiques
    },
    merchants: {
      total: merchantUsers,
      pending: 0, // À ajuster selon le statut des profils marchands
      approved: merchantUsers,
      rejected: 0,
      growth: 0
    },
    orders: {
      total: totalOrders,
      thisMonth: currentMonthOrders.length,
      lastMonth: lastMonthOrders.length,
      growth: orderGrowth,
      byStatus: ordersByStatus
    },
    products: {
      total: totalProducts,
      thisMonth: 0, // À calculer avec createdAt des produits
      reported: reportedProducts,
      lowStock: lowStockProducts,
      outOfStock: outOfStockProducts,
      byCategory: productsByCategory
    },
    revenue: {
      total: totalRevenue,
      thisMonth: currentMonthRevenue,
      lastMonth: lastMonthRevenue,
      growth: revenueGrowth,
      byMonth: revenueByMonth
    },
    topMerchants,
    topProducts,
    recentActivity,
    systemHealth: {
      apiStatus: "operational",
      databaseStatus: "operational",
      paymentStatus: "operational",
      uptime: 99.9
    }
  };
}
