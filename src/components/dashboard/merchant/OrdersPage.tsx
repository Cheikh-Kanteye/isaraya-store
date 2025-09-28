/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useCallback } from "react";
import { useAuthStore } from "@/stores";
import { useOrdersByMerchant, useUpdateOrder } from "@/hooks/queries";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import {
  FilterBar,
  FilterState,
} from "@/components/dashboard/shared/FilterBar";
import { Pagination } from "@/components/dashboard/shared/Pagination";
import { columns, OrderColumn } from "./columns";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { RefreshButton } from "@/components/dashboard/shared/RefreshButton";
import type { MerchantOrder } from "@/types";

// Type étendu pour les commandes avec informations client
interface MerchantOrderWithClient extends MerchantOrder {
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}
import { ORDER_STATUS_OPTIONS } from "@/constants/orderStatus";
import { queryClient, queryKeys } from "@/hooks/queries";

const OrdersPage: React.FC = () => {
  const { user } = useAuthStore();
  const vendorId = user?.id || ""; // Corrected from userId to id
  const {
    data: ordersData = [],
    isLoading: isLoadingOrders,
    refetch: refetchOrders,
  } = useOrdersByMerchant(vendorId);
  const orders = ordersData as MerchantOrderWithClient[];
  const updateOrderMutation = useUpdateOrder();

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: [],
    category: "",
  });

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const handleStatusUpdate = useCallback(
    async (orderId: string, newStatus: MerchantOrderWithClient["status"]) => {
      try {
        await updateOrderMutation.mutateAsync(
          {
            id: orderId,
            data: { status: newStatus },
          },
          {
            onSuccess: () => {
              // Rafraîchir les données après la mise à jour
              queryClient.invalidateQueries({
                queryKey: queryKeys.orders.lists(),
              });
              queryClient.invalidateQueries({
                queryKey: queryKeys.orders.byMerchant(user?.id || ""),
              });
            },
          }
        );
        toast.success("Statut de la commande mis à jour avec succès");
      } catch (err: any) {
        console.error("Erreur lors de la mise à jour du statut:", err);
        toast.error(
          err.response?.data?.message ||
            "Erreur lors de la mise à jour du statut"
        );
      }
    },
    [updateOrderMutation, user?.id]
  );

  const formattedOrders: OrderColumn[] = useMemo(() => {
    return orders.map((order) => {
      // Le backend standardisé retourne déjà toutes les infos nécessaires
      // Plus besoin de parser ou de faire des requêtes séparées
      return {
        id: order.id,
        productTitle: `Commande #${order.id.substring(0, 8)}`,
        total: order.merchantTotal,
        status: order.status,
        date: new Date(order.createdAt).toLocaleDateString("fr-FR"),
        user: order.client
          ? {
              id: order.client.id,
              firstname: order.client.firstName,
              lastname: order.client.lastName,
              email: order.client.email,
            }
          : null,
        onStatusChange: handleStatusUpdate,
      };
    });
  }, [orders, handleStatusUpdate]);

  const filteredOrders = useMemo(() => {
    return formattedOrders.filter((order: OrderColumn) => {
      const searchMatch =
        filters.search === "" ||
        order.productTitle
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        (order.user &&
          `${order.user.firstname} ${order.user.lastname}`
            .toLowerCase()
            .includes(filters.search.toLowerCase()));

      const statusMatch =
        filters.status.length === 0 || filters.status.includes(order.status);

      return searchMatch && statusMatch;
    });
  }, [formattedOrders, filters]);

  const paginatedOrders = useMemo(() => {
    const startIndex = pagination.pageIndex * pagination.pageSize;
    return filteredOrders.slice(startIndex, startIndex + pagination.pageSize);
  }, [filteredOrders, pagination]);

  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      await refetchOrders();
      toast.success("Données actualisées");
    } catch (error) {
      toast.error("Erreur lors de l'actualisation");
    }
  }, [refetchOrders]);

  const isLoading = isLoadingOrders;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestion des Commandes</h1>
        <RefreshButton onRefresh={handleRefresh} isLoading={isLoadingOrders} />
      </div>

      <FilterBar
        filters={filters}
        onFiltersChange={handleFilterChange}
        statusOptions={ORDER_STATUS_OPTIONS}
      />

      <Card>
        <CardContent>
          <DataTable columns={columns} data={paginatedOrders} />
        </CardContent>
      </Card>

      <Pagination
        currentPage={pagination.pageIndex + 1}
        totalPages={Math.ceil(filteredOrders.length / pagination.pageSize)}
        onPageChange={(page) =>
          setPagination((prev) => ({ ...prev, pageIndex: page - 1 }))
        }
        itemsPerPage={pagination.pageSize}
        onItemsPerPageChange={(size) =>
          setPagination({ pageIndex: 0, pageSize: size })
        }
        totalItems={filteredOrders.length}
      />
    </div>
  );
};

export default OrdersPage;
