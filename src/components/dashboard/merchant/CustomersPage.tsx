import React, { useState, useMemo, useCallback } from "react";
import { useAuthStore } from "@/stores";
import { useOrdersByMerchant } from "@/hooks/queries";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import {
  FilterBar,
  FilterState,
} from "@/components/dashboard/shared/FilterBar";
import { Pagination } from "@/components/dashboard/shared/Pagination";
import { columns, Customer } from "./customers/columns";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshButton } from "@/components/dashboard/shared/RefreshButton";
import { toast } from "sonner";
import type { MerchantOrder } from "@/types";

// Type simplifié pour les données client (local)
type ClientUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

// Type étendu pour les commandes avec informations client
interface MerchantOrderWithClient extends MerchantOrder {
  client?: ClientUser;
}

const CustomersPage: React.FC = () => {
  const { user } = useAuthStore();
  const vendorId = user?.id || ""; // Renamed from vendorId
  const {
    data: ordersData = [],
    isLoading: isLoadingOrders,
    refetch: refetchOrders,
  } = useOrdersByMerchant(vendorId);
  const orders = ordersData as MerchantOrderWithClient[];

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: [],
    category: "",
  });

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const customers = useMemo<Customer[]>(() => {
    if (isLoadingOrders) return [];

    const customerData: {
      [key: string]: { client: ClientUser; orders: MerchantOrderWithClient[] };
    } = {};

    // Grouper les commandes par client en utilisant les données client déjà incluses
    orders.forEach((order) => {
      if (order.client) {
        const clientId = order.client.id;
        if (!customerData[clientId]) {
          customerData[clientId] = { client: order.client, orders: [] };
        }
        customerData[clientId].orders.push(order);
      }
    });

    return Object.values(customerData).map(({ client, orders }) => {
      const totalSpent = orders.reduce(
        (acc, o) => acc + (o.merchantTotal || 0),
        0
      );
      const lastOrderDate = orders.reduce(
        (latest, o) =>
          new Date(o.createdAt) > new Date(latest) ? o.createdAt : latest,
        orders[0].createdAt
      ) as string;

      return {
        id: client.id,
        user: {
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
        },
        orderCount: orders.length,
        totalSpent,
        lastOrderDate,
      };
    });
  }, [orders, isLoadingOrders]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const searchMatch =
        filters.search === "" ||
        `${customer.user.firstName || ""} ${customer.user.lastName || ""}`
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        customer.user.email
          .toLowerCase()
          .includes(filters.search.toLowerCase());

      return searchMatch;
    });
  }, [customers, filters.search]);

  const paginatedCustomers = useMemo(() => {
    const startIndex = pagination.pageIndex * pagination.pageSize;
    return filteredCustomers.slice(
      startIndex,
      startIndex + pagination.pageSize
    );
  }, [filteredCustomers, pagination]);

  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      await refetchOrders();
      toast.success("Données clients actualisées");
    } catch (error) {
      toast.error("Erreur lors de l'actualisation");
    }
  }, [refetchOrders]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Clients</h2>
        <RefreshButton onRefresh={handleRefresh} isLoading={isLoadingOrders} />
      </div>

      <FilterBar filters={filters} onFiltersChange={handleFilterChange} />

      <Card>
        <CardContent>
          <DataTable columns={columns} data={paginatedCustomers} />
        </CardContent>
      </Card>

      <Pagination
        currentPage={pagination.pageIndex + 1}
        totalPages={Math.ceil(filteredCustomers.length / pagination.pageSize)}
        onPageChange={(page) =>
          setPagination((prev) => ({ ...prev, pageIndex: page - 1 }))
        }
        itemsPerPage={pagination.pageSize}
        onItemsPerPageChange={(size) =>
          setPagination({ pageIndex: 0, pageSize: size })
        }
        totalItems={filteredCustomers.length}
      />
    </div>
  );
};

export default CustomersPage;
