"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";
import FallbackImage from "@/components/shared/FallbackImage"; // Importation du composant FallbackImage

export type ProductColumn = Product & {
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onView: (product: Product) => void;
};

const getStockBadgeVariant = (stock: number) => {
  if (stock === 0) return "destructive";
  if (stock < 10) return "secondary";
  return "default";
};

const getStockText = (stock: number) => {
  if (stock === 0) return "Rupture";
  if (stock < 10) return "Stock faible";
  return "En stock";
};

export const columns: ColumnDef<ProductColumn>[] = [
  {
    accessorKey: "name",
    header: "Produit",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="relative">
            <FallbackImage
              src={product.images?.[0]?.url || "/placeholder.svg"}
              alt={product.name}
              className="h-14 w-14 rounded-lg object-cover border border-border"
            />
            {product.images && product.images.length > 1 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {product.images.length}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span
              className="font-semibold text-foreground truncate"
              title={product.name}
            >
              {product.name}
            </span>
            <span
              className="text-sm text-muted-foreground truncate max-w-[30ch]"
              title={product.description || "Aucune description"}
            >
              {product.description || "Aucune description"}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Catégorie & Marque",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Catégorie:
            </span>
            <span className="text-sm text-foreground">
              {product.category?.name || "Non catégorisé"}
            </span>
          </div>
          {product.brand && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Marque:
              </span>
              <span className="text-sm text-foreground">
                {product.brand.name}
              </span>
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "price",
    header: () => <div className="text-right">Prix</div>,
    cell: ({ row }) => {
      const product = row.original;
      const price = parseFloat(row.getValue("price"));
      return (
        <div className="text-right">
          <div className="font-bold text-lg">{formatPrice(price)}</div>
          {product.originalPrice && product.originalPrice > price && (
            <div className="text-sm text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const stock = row.original.stock;
      return (
        <div className="flex flex-col items-start gap-1">
          <Badge variant={getStockBadgeVariant(stock)}>
            {getStockText(stock)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {stock} unité{stock !== 1 ? "s" : ""}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => {
      const product = row.original;
      const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
          case "disponible":
            return (
              <Badge
                variant="default"
                className="bg-green-500 hover:bg-green-600"
              >
                <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
                Disponible
              </Badge>
            );
          case "indisponible":
            return (
              <Badge variant="destructive">
                <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
                Indisponible
              </Badge>
            );
          default:
            return (
              <Badge variant="secondary">
                <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
                {status || "Non défini"}
              </Badge>
            );
        }
      };
      return getStatusBadge(product.status as never);
    },
  },
  {
    accessorKey: "createdAt",
    header: "Créé le",
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let timeAgo = "";
      if (diffDays === 1) {
        timeAgo = "Hier";
      } else if (diffDays < 7) {
        timeAgo = `Il y a ${diffDays} jours`;
      } else {
        timeAgo = date.toLocaleDateString("fr-FR");
      }

      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {date.toLocaleDateString("fr-FR")}
          </span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Ouvrir le menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => product.onView(product)}>
              <Eye className="mr-2 h-4 w-4" />
              Voir les détails
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => product.onEdit(product)}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => product.onDelete(product.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
