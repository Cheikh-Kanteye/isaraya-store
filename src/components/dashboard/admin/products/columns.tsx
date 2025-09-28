"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Product } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { CategoryName } from "./CategoryName";
import { ProductActions } from "./ProductActions";
import { MerchantName } from "./MerchantName";
import { InlineStatusToggle } from "./InlineStatusToggle";
import FallbackImage from "@/components/shared/FallbackImage"; // Importation du composant FallbackImage
import { getvendorId } from "@/utils/merchantUtils";

export const columns: ColumnDef<Product>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Produit",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex items-center">
          <FallbackImage // Remplacement de <img> par <FallbackImage>
            src={product.images[0]?.url || "/placeholder.svg"}
            alt={product.name}
            className="w-10 h-10 rounded-md mr-4 object-cover"
          />
          <div>
            <div className="font-medium text-muted-foreground">
              {product.name}
            </div>
            <div className="text-sm text-foreground">
              <CategoryName categoryId={product.categoryId} />
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "price",
    header: "Prix",
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"));
      const formatted = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "XOF",
      }).format(price);
      return <div className="font-medium text-right">{formatted}</div>;
    },
  },
  {
    accessorKey: "stock",
    header: "Stock",
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => {
      const product = row.original;

      // Si le produit a des signalements, afficher le badge d'alerte
      if ((product.reports || 0) > 0) {
        return (
          <Badge variant="destructive">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Signalé ({product.reports})
          </Badge>
        );
      }

      // Sinon, utiliser le composant interactif pour changer le statut
      return (
        <InlineStatusToggle product={product} variant="select" size="sm" />
      );
    },
  },
  {
    accessorKey: "vendorId", // Backend utilise vendorId
    header: "Vendeur",
    cell: ({ row }) => {
      const product = row.original;
      // Utiliser l'utilitaire pour récupérer l'ID du marchand
      const vendorId = getvendorId(product);
      return <MerchantName vendorId={vendorId} />;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Créé le",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return <span>{date.toLocaleDateString("fr-FR")}</span>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return <ProductActions product={row.original} />;
    },
  },
];
