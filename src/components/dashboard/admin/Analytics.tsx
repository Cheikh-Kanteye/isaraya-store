import React, { useMemo } from "react";
import Loader from "@/components/ui/loader";
import { useCalculatedAdminStats } from "@/hooks/useCalculatedAdminStats";
import { RefreshButton } from "@/components/dashboard/shared/RefreshButton";
import {
  DollarSign,
  ShoppingCart,
  Users as UsersIcon,
  Package,
  Store,
  WifiOff,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { formatPrice } from "@/lib/utils";
import CountUp from "react-countup";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  prefix = "",
  suffix = "",
  decimals = 0,
}) => (
  <Card className="relative overflow-hidden border-l-4 border-l-primary/20 hover:border-l-primary transition-all duration-300 hover:shadow-lg group">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium transition-colors group-hover:text-primary">
        {title}
      </CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:text-primary group-hover:scale-110" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-foreground mb-1 transition-transform group-hover:scale-105">
        <CountUp
          end={value}
          duration={2.5}
          separator=","
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
        />
      </div>
    </CardContent>
  </Card>
);

const Analytics: React.FC = () => {
  const { data: adminStats, isLoading, error } = useCalculatedAdminStats();

  const handleRefresh = () => {
    window.location.reload();
  };

  // Plus besoin de recalculer, on utilise directement adminStats

  const { salesData, categoryData, topProducts } = useMemo(() => {
    if (!adminStats) {
      return {
        salesData: [],
        categoryData: [],
        topProducts: [],
      };
    }


    // Utiliser les données de revenu par mois d'AdminStats
    const salesChartData = adminStats.revenue.byMonth.map((item) => ({
      date: item.month,
      revenue: item.amount,
    }));

    // Utiliser les données de produits par catégorie d'AdminStats
    const categoryChartData = adminStats.products.byCategory.map((cat) => ({
      name: cat.categoryName,
      value: cat.count,
    }));

    // Utiliser les top produits d'AdminStats
    const topProductsChartData = adminStats.topProducts.slice(0, 5).map((product) => ({
      name: product.name,
      sales: product.totalSold,
    }));

    return {
      salesData: salesChartData,
      categoryData: categoryChartData,
      topProducts: topProductsChartData,
    };
  }, [adminStats]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="relative">
          <Loader size={48} text="Chargement..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <WifiOff className="h-8 w-8" />
          <div className="text-center">
            <p className="text-lg font-medium">
              Erreur lors du chargement des analytiques
            </p>
            <p className="text-sm">
              Impossible de récupérer les données
            </p>
          </div>
        </div>
        <RefreshButton onRefresh={handleRefresh} />
      </div>
    );
  }

  if (!adminStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-700">
      {/* Header avec bouton refresh */}
      <div className="flex justify-between items-center animate-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Analyses détaillées et statistiques de la plateforme
          </p>
        </div>
        <RefreshButton onRefresh={handleRefresh} />
      </div>
      {/* Grille de statistiques avec animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-700 delay-200">
        <StatCard
          title="Utilisateurs"
          value={adminStats?.users.total || 0}
          icon={UsersIcon}
        />
        <StatCard
          title="Merchants"
          value={adminStats?.merchants.total || 0}
          icon={Store}
        />
        <StatCard
          title="Commandes"
          value={adminStats?.orders.total || 0}
          icon={ShoppingCart}
        />
        <StatCard
          title="Chiffre d'affaires"
          value={adminStats?.revenue.total || 0}
          icon={DollarSign}
          suffix=" FCFA"
          decimals={0}
        />
      </div>

      {/* Section des graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-700 delay-400">
        <Card className="animate-in slide-in-from-left-4 duration-500 delay-500">
          <CardHeader>
            <CardTitle>Ventes dans le temps</CardTitle>
            <CardDescription>Evolution des revenus par mois</CardDescription>
          </CardHeader>
          <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value} FCFA`, "Revenus"]}
                labelFormatter={(label) => `Mois: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="animate-in slide-in-from-right-4 duration-500 delay-600">
          <CardHeader>
            <CardTitle>Distribution par catégorie</CardTitle>
            <CardDescription>Répartition des produits par catégorie</CardDescription>
          </CardHeader>
          <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {categoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"][index % 4]
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Section top produits */}
      <Card className="animate-in slide-in-from-bottom-4 duration-700 delay-700">
        <CardHeader>
          <CardTitle>Top 5 des produits les plus vendus</CardTitle>
          <CardDescription>Classement des produits par nombre de ventes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value}`, "Vendus"]}
                labelFormatter={(label) => `Produit: ${label}`}
              />
              <Legend />
              <Bar dataKey="sales" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
