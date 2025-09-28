import { formatPrice } from "@/lib/utils";
import {
  DashboardStats,
  SidebarItem,
  Stats,
  StatsCardData,
  TopProduct,
} from "@/types";

export const mockStats: Stats = {
  totalSales: 1247,
  totalOrders: 89,
  totalRevenue: 45678.9,
  totalProducts: 156,
  recentOrders: [
    {
      id: "1",
      userId: "Jean Dupont",
      product: "T-shirt en coton bio",
      total: 2500,
      status: "DELIVERED",
      date: "2023-05-15",
    },
    {
      id: "2",
      userId: "Marie Martin",
      product: "Jean slim noir",
      total: 6500,
      status: "EN_PREPARATION",
      date: "2023-05-14",
    },
    {
      id: "3",
      userId: "Paul Bernard",
      product: "Chaussures en cuir",
      total: 12000,
      status: "DELIVERED",
      date: "2023-05-13",
    },
    {
      id: "4",
      userId: "Sophie Petit",
      product: "Sac à main en toile",
      total: 4500,
      status: "EN_PREPARATION",
      date: "2023-05-12",
    },
  ],
  topProducts: [
    {
      id: "1",
      name: "T-shirt Graphique 'Aventure'",
      title: "Titre du produit",
      sku: "SKU-123",
      description: "Description détaillée du produit.",
      price: 2500,
      stock: 50,
      images: [],
      rating: 4.5,
      categoryId: "cat-1",
      brandId: "brand-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      vendorId: "merchant-1",
      sold: 120,
      revenue: 300000,
    },
    {
      id: "2",
      name: "Baskets 'Urban Runner'",
      title: "Titre du produit",
      sku: "SKU-123",
      description: "Description détaillée du produit.",
      price: 8500,
      stock: 30,
      images: [],
      rating: 4.5,
      categoryId: "cat-1",
      brandId: "brand-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      vendorId: "merchant-1",
      sold: 75,
      revenue: 637500,
    },
    {
      id: "3",
      name: "Montre 'Classic Time'",
      title: "Titre du produit",
      sku: "SKU-123",
      description: "Description détaillée du produit.",
      price: 15000,
      stock: 20,
      images: [],
      rating: 4.5,
      categoryId: "cat-1",
      brandId: "brand-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      vendorId: "merchant-1",
      sold: 40,
      revenue: 600000,
    },
    {
      id: "4",
      name: "Casque Audio 'SoundWave'",
      title: "Titre du produit",
      sku: "SKU-123",
      description: "Description détaillée du produit.",
      price: 12000,
      stock: 25,
      images: [],
      rating: 4.5,
      categoryId: "cat-1",
      brandId: "brand-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      vendorId: "merchant-1",
      sold: 60,
      revenue: 720000,
    },
  ],
};

export const sidebarItems: SidebarItem[] = [
  { icon: "Home", label: "Tableau de bord", active: true },
  { icon: "Package2", label: "Produits", count: mockStats.totalProducts },
  { icon: "ShoppingBag", label: "Commandes", count: mockStats.totalOrders },
  { icon: "BarChart3", label: "Analytiques" },
  { icon: "Users", label: "Clients" },
  { icon: "Settings", label: "Paramètres" },
];

export const statsCards: StatsCardData[] = [
  {
    title: "Ventes totales",
    value: mockStats.totalSales.toLocaleString(),
    trend: { icon: "TrendingUp", text: "+12% ce mois" },
    icon: "ShoppingCart",
  },
  {
    title: "Commandes",
    value: mockStats.totalOrders,
    trend: { icon: "TrendingUp", text: "+8% ce mois" },
    icon: "Package",
  },
  {
    title: "Revenu total",
    value: `${mockStats.totalRevenue.toLocaleString("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    })}`,
    trend: { icon: "TrendingUp", text: "+15% ce mois" },
    icon: "DollarSign",
  },
  {
    title: "Produits",
    value: mockStats.totalProducts,
    trend: { icon: "Eye", text: "23 vues/jour" },
    icon: "Package2",
  },
];

// Données pour les cartes de statistiques
export const MerchantStats = ({
  totalRevenue,
  totalProducts,
  totalOrders,
  pendingOrders,
}: DashboardStats) => [
  {
    title: "Chiffre d'Affaires",
    value: `${formatPrice(totalRevenue)}`,
    trend: { icon: "TrendingUp" as const, text: "+15% ce mois" },
    icon: "DollarSign" as const,
  },
  {
    title: "Commandes",
    value: totalOrders,
    trend: { icon: "TrendingUp" as const, text: "+8% ce mois" },
    icon: "Package" as const,
  },
  {
    title: "Produits",
    value: totalProducts,
    trend: { icon: "Eye" as const, text: "23 vues/jour" },
    icon: "Package2" as const,
  },
  {
    title: "Commandes en attente",
    value: pendingOrders,
    trend: { icon: "TrendingUp" as const, text: "À traiter" },
    icon: "ShoppingCart" as const,
  },
];

interface PromoItem {
  id: string;
  title: string;
  subtitle: string;
  discount: string;
  originalPrice: string;
  salePrice: string;
  image: string;
  cta: string;
  categoryId: string;
  isLimitedTime: boolean;
  rating: number;
  soldCount: string;
}

export const promoItems: PromoItem[] = [
  {
    id: "1",
    title: "Électronique",
    subtitle: "Smartphones, Laptops & Plus",
    discount: "70%",
    originalPrice: "450 000 CFA",
    salePrice: "135 000 CFA",
    image:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=400&fit=crop",
    cta: "Voir les offres",
    categoryId: "cat1",
    isLimitedTime: true,
    rating: 4.8,
    soldCount: "2.5k+",
  },
  {
    id: "2",
    title: "Mode",
    subtitle: "Collection Automne/Hiver 2024",
    discount: "30%",
    originalPrice: "120 000 CFA",
    salePrice: "84 000 CFA",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop",
    cta: "Découvrir",
    categoryId: "cat2",
    isLimitedTime: false,
    rating: 4.6,
    soldCount: "1.2k+",
  },
  {
    id: "3",
    title: "High-Tech",
    subtitle: "Gadgets & Innovations 2024",
    discount: "25%",
    originalPrice: "300 000 CFA",
    salePrice: "225 000 CFA",
    image:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=400&fit=crop",
    cta: "Explorer",
    categoryId: "cat1",
    isLimitedTime: true,
    rating: 4.9,
    soldCount: "890+",
  },
];
