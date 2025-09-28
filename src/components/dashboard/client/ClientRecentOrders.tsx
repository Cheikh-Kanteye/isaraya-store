import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useOrdersByUser } from "@/hooks/queries";
import { useAuthStore } from "@/stores";
import type { Order } from "@/types";

const RecentOrders = () => {
  const { user } = useAuthStore();
  const userId = user?.id || "";
  const { data: orders = [], isLoading } = useOrdersByUser(userId);

  if (isLoading) {
    return <div className="text-gray-700 font-medium">Chargement...</div>;
  }

  return (
    <Card className="bg-white border-2 border-gray-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-gray-900 text-xl font-bold">
          Commandes récentes
        </CardTitle>
        <CardDescription className="text-gray-700 font-medium">
          Vos dernières commandes et leur statut
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders
            .slice()
            .sort(
              (a: Order, b: Order) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .slice(0, 5)
            .map((order) => (
              <OrderItem key={order.id} order={order as unknown as Order} />
            ))}
        </div>
        <div className="mt-4">
          <Button
            variant="outline"
            className="w-full border-2 border-orange-500 text-orange-600 font-medium hover:bg-orange-50 hover:border-orange-600 transition-colors"
          >
            Voir toutes les commandes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface OrderItemProps {
  order: Order;
}

const OrderItem = ({ order }: OrderItemProps) => {
  const raw = (order as Order)?.items;
  let itemsArr: Array<{ name?: string }> = [];

  if (Array.isArray(raw)) {
    itemsArr = raw as Array<{ name?: string }>;
  } else if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) itemsArr = parsed as Array<{ name?: string }>;
    } catch (err) {
      console.debug(err);
    }
  } else if (raw && typeof raw === "object") {
    const values = Object.values(raw as Record<string, unknown>);
    if (Array.isArray(values)) itemsArr = values as Array<{ name?: string }>;
  }

  const productNames = itemsArr.map((i) => i?.name).filter(Boolean) as string[];
  const itemsCount = Array.isArray(itemsArr) ? itemsArr.length : 0;
  const display = productNames.length
    ? productNames.join(", ")
    : `${itemsCount} article${itemsCount > 1 ? "s" : ""}`;
  return (
    <div className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-200 border border-gray-300 rounded-lg"></div>
        <div>
          <p className="font-semibold text-gray-900">{display}</p>
          <p className="text-sm font-medium text-gray-600">
            Commande #{order.id}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-gray-900">{formatPrice(order.total)}</p>
        <Badge className="bg-orange-500 text-white font-medium border-orange-500 hover:bg-orange-600">
          {order.status}
        </Badge>
      </div>
    </div>
  );
};

export default RecentOrders;
