import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
} from "lucide-react";
import type { Product } from "@/types";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { queryKeys } from "@/services/queryClient";

type ProductStatus = "disponible" | "indisponible" | "bientôt disponible";

interface InlineStatusToggleProps {
  product: Product;
  disabled?: boolean;
  variant?: "badge" | "select";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const statusConfig = {
  disponible: {
    label: "Disponible",
    shortLabel: "Dispo.",
    icon: CheckCircle,
    variant: "default" as const,
    className:
      "text-green-600 border-2 border-green-200 hover:border-green-300",
    selectClassName:
      "text-green-600 border-2 border-green-200 hover:border-green-300",
    dotColor: "bg-green-400",
  },
  indisponible: {
    label: "Indisponible",
    shortLabel: "Indispo.",
    icon: XCircle,
    variant: "destructive" as const,
    className: "text-rose-600 border-2 border-rose-200 hover:border-rose-300",
    selectClassName:
      "text-rose-600 border-2 border-rose-200 hover:border-rose-300",
    dotColor: "bg-rose-400",
  },
  "bientôt disponible": {
    label: "Bientôt disponible",
    shortLabel: "Bientôt",
    icon: Clock,
    variant: "secondary" as const,
    className:
      "text-amber-600 border-2 border-amber-200 hover:border-amber-300",
    selectClassName:
      "text-amber-600 border-2 border-amber-200 hover:border-amber-300",
    dotColor: "bg-amber-400",
  },
};

export const InlineStatusToggle: React.FC<InlineStatusToggleProps> = ({
  product,
  disabled = false,
  variant = "select",
  showLabel = true,
  size = "sm",
}) => {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: ({
      productId,
      status,
    }: {
      productId: string;
      status: ProductStatus;
    }) => apiService.products.updateStatus(productId, status),
    onMutate: async ({ productId, status }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.products.detail(productId),
      });

      const previousProduct = queryClient.getQueryData<Product>(
        queryKeys.products.detail(productId)
      );

      // ⚡ Optimistic update immédiat
      queryClient.setQueryData<Product>(
        queryKeys.products.detail(productId),
        (old) => (old ? { ...old, status } : old)
      );

      queryClient.setQueriesData(
        { queryKey: queryKeys.products.all },
        (oldData: Product[] | undefined) =>
          oldData?.map((p) => (p.id === productId ? { ...p, status } : p))
      );

      return { previousProduct };
    },
    onError: (error, variables, context) => {
      if (context?.previousProduct) {
        queryClient.setQueryData(
          queryKeys.products.detail(variables.productId),
          context.previousProduct
        );
      }
      toast.error("Erreur lors de la mise à jour du statut");
    },
    onSuccess: (updatedProduct, variables) => {
      queryClient.setQueryData(
        queryKeys.products.detail(variables.productId),
        updatedProduct
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.all,
        refetchType: "none",
      });
      toast.success("Statut mis à jour avec succès");
    },
  });

  // 🔥 Lire toujours depuis le cache pour update immédiat
  const cachedProduct =
    queryClient.getQueryData<Product>(queryKeys.products.detail(product.id)) ||
    product;

  const currentStatus = cachedProduct.status || "disponible";
  const config = statusConfig[currentStatus];
  const StatusIcon = config.icon;

  const handleStatusChange = (newStatus: ProductStatus) => {
    if (newStatus === currentStatus || updateStatusMutation.isPending) return;
    updateStatusMutation.mutate({ productId: product.id, status: newStatus });
  };

  if (variant === "badge") {
    return (
      <div className="flex items-center gap-3 group">
        <Badge
          variant={config.variant}
          className={`${config.className} ${
            size === "sm"
              ? "text-xs px-3 py-1.5 h-6"
              : size === "lg"
              ? "text-sm px-4 py-2 h-8"
              : "text-xs px-3 py-1.5 h-7"
          } ${
            updateStatusMutation.isPending
              ? "opacity-75"
              : "transition-all duration-200"
          } font-medium rounded-full`}
        >
          <div className="flex items-center gap-1.5">
            {updateStatusMutation.isPending ? (
              <span className="w-3 h-3 rounded-full bg-gray-300 animate-pulse" />
            ) : (
              <StatusIcon className="h-3 w-3" />
            )}
            {showLabel && (
              <span>{size === "sm" ? config.shortLabel : config.label}</span>
            )}
          </div>
        </Badge>

        {!disabled && (
          <Select
            value={currentStatus}
            onValueChange={handleStatusChange}
            disabled={updateStatusMutation.isPending}
          >
            <SelectTrigger className="h-7 w-7 p-0 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 rounded-lg transition-colors duration-200">
              <div className="flex items-center justify-center">
                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
              </div>
              <div className="sr-only">Modifier le statut</div>
            </SelectTrigger>
            <SelectContent className="min-w-[160px]">
              {Object.entries(statusConfig).map(([status, cfg]) => (
                <SelectItem
                  key={status}
                  value={status}
                  disabled={updateStatusMutation.isPending}
                  className="py-2"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 ${cfg.dotColor} rounded-full`} />
                    {cfg.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    );
  }

  // Variante "select" améliorée
  return (
    <Select
      value={currentStatus}
      onValueChange={handleStatusChange}
      disabled={disabled || updateStatusMutation.isPending}
    >
      <SelectTrigger
        className={`${
          size === "sm"
            ? "h-9 text-xs px-3"
            : size === "lg"
            ? "h-12 text-sm px-4"
            : "h-10 text-sm px-3"
        } min-w-[140px] ${updateStatusMutation.isPending ? "opacity-75" : ""} ${
          config.selectClassName
        } transition-colors duration-200 font-medium rounded-lg`}
      >
        <div className="flex items-center gap-2">
          {updateStatusMutation.isPending ? (
            <span className="w-4 h-4 rounded-full bg-gray-300 animate-pulse" />
          ) : (
            <StatusIcon className="h-4 w-4" />
          )}
          <SelectValue placeholder="Statut" />
        </div>
      </SelectTrigger>

      <SelectContent className="min-w-[160px]">
        {Object.entries(statusConfig).map(([status, cfg]) => {
          const isSelected = status === currentStatus;

          return (
            <SelectItem
              key={status}
              value={status}
              disabled={updateStatusMutation.isPending}
              className="py-2"
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 ${cfg.dotColor} rounded-full`} />
                {cfg.label}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default InlineStatusToggle;
