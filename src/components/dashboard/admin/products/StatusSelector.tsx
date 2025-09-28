import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  Edit3,
} from "lucide-react";
import Loader from "@/components/ui/loader";
import type { Product } from "@/types";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { queryKeys } from "@/services/queryClient";

type ProductStatus = "disponible" | "indisponible" | "bientôt disponible";

interface StatusSelectorProps {
  product: Product;
  disabled?: boolean;
}

const statusConfig = {
  disponible: {
    label: "Disponible",
    icon: CheckCircle,
    variant: "default" as const,
    className: "bg-green-500 hover:bg-green-600",
  },
  indisponible: {
    label: "Indisponible",
    icon: XCircle,
    variant: "destructive" as const,
    className: "",
  },
  "bientôt disponible": {
    label: "Bientôt disponible",
    icon: Clock,
    variant: "secondary" as const,
    className: "bg-yellow-500 hover:bg-yellow-600",
  },
};

export const StatusSelector: React.FC<StatusSelectorProps> = ({
  product,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus>(
    product.status || "disponible"
  );
  
  const queryClient = useQueryClient();
  
  // Utiliser React Query mutation au lieu du store global pour éviter les recharges
  const updateStatusMutation = useMutation({
    mutationFn: ({ productId, status }: { productId: string; status: ProductStatus }) => 
      apiService.products.updateStatus(productId, status),
    onMutate: async ({ productId, status }) => {
      // Mise à jour optimiste - pas de rechargement de page
      await queryClient.cancelQueries({ queryKey: queryKeys.products.detail(productId) });
      
      // Sauvegarder la valeur précédente pour le rollback
      const previousProduct = queryClient.getQueryData<Product>(queryKeys.products.detail(productId));
      
      // Mettre à jour optimistiquement le cache
      queryClient.setQueryData<Product>(
        queryKeys.products.detail(productId),
        (old) => {
          if (!old) return old;
          return { ...old, status };
        }
      );
      
      return { previousProduct };
    },
    onSuccess: (updatedProduct, variables) => {
      // Mettre à jour le cache avec les vraies données du serveur
      queryClient.setQueryData(queryKeys.products.detail(variables.productId), updatedProduct);
      
      // Invalider et re-fetch les listes de produits pour la cohérence
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      
      toast.success("Statut du produit mis à jour avec succès");
      setIsOpen(false);
    },
    onError: (error, variables, context) => {
      // Rollback en cas d'erreur
      if (context?.previousProduct) {
        queryClient.setQueryData(
          queryKeys.products.detail(variables.productId),
          context.previousProduct
        );
      }
      
      console.error("Error updating product status:", error);
      toast.error("Erreur lors de la mise à jour du statut");
      
      // Reset to current status if update failed
      setSelectedStatus(product.status || "disponible");
    },
  });

  const currentStatus = product.status || "disponible";
  const StatusIcon = statusConfig[currentStatus].icon;

  const handleStatusChange = () => {
    if (selectedStatus === currentStatus) {
      setIsOpen(false);
      return;
    }

    updateStatusMutation.mutate({ productId: product.id, status: selectedStatus });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled || updateStatusMutation.isPending}
          className="h-auto p-2 justify-start"
        >
          <Edit3 className="mr-2 h-4 w-4" />
          Modifier le statut
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le statut du produit</DialogTitle>
          <DialogDescription>
            Changez le statut de "{product.name}" pour refléter sa
            disponibilité.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Statut actuel :</span>
            <Badge
              variant={statusConfig[currentStatus].variant}
              className={statusConfig[currentStatus].className}
            >
              <StatusIcon className="mr-2 h-4 w-4" />
              {statusConfig[currentStatus].label}
            </Badge>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Nouveau statut :</span>
            <Select
              value={selectedStatus}
              onValueChange={(value: ProductStatus) => setSelectedStatus(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([status, config]) => {
                  const Icon = config.icon;
                  return (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedStatus(currentStatus);
              setIsOpen(false);
            }}
            disabled={updateStatusMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleStatusChange}
            disabled={updateStatusMutation.isPending || selectedStatus === currentStatus}
          >
            {updateStatusMutation.isPending ? (
              <>
                <Loader size={16} text="" className="mr-2" />
                Mise à jour...
              </>
            ) : (
              "Mettre à jour"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};