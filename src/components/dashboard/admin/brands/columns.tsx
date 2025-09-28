"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Brand } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Eye, ExternalLink } from "lucide-react";
import FallbackImage from "@/components/shared/FallbackImage";

interface BrandActionsProps {
  brand: Brand;
  onEdit: (brand: Brand) => void;
  onDelete: (id: string) => void;
  onView: (brand: Brand) => void;
}

const BrandActions = ({ 
  brand, 
  onEdit, 
  onDelete, 
  onView
}: BrandActionsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Ouvrir le menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white border-gray-200">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onView(brand)}>
          <Eye className="mr-2 h-4 w-4" />
          Voir les détails
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(brand)}>
          <Edit className="mr-2 h-4 w-4" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => onDelete(brand.id)}
          className="text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const createBrandColumns = (
  onEdit: (brand: Brand) => void,
  onDelete: (id: string) => void,
  onView: (brand: Brand) => void,
  products: any[] = []
): ColumnDef<Brand>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Sélectionner tout"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Sélectionner la ligne"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Marque",
    cell: ({ row }) => {
      const brand = row.original;
      
      return (
        <div className="flex items-center space-x-3">
          {brand.logoUrl && (
            <FallbackImage
              src={brand.logoUrl}
              alt={brand.name}
              className="w-10 h-10 rounded-md object-cover bg-gray-50 border"
            />
          )}
          <div>
            <div className="font-medium text-gray-900">{brand.name}</div>
            <div className="text-sm text-gray-500">
              {brand.slug}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    id: "products",
    header: "Produits",
    cell: ({ row }) => {
      const brand = row.original;
      const productCount = products.filter(product => product.brandId === brand.id).length;
      
      return (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900">{productCount}</span>
          <span className="text-xs text-gray-500">
            {productCount === 0 ? 'produit' : productCount === 1 ? 'produit' : 'produits'}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Créé le",
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt");
      if (!createdAt) return <span className="text-sm text-gray-400">-</span>;
      
      const date = new Date(createdAt as string);
      return (
        <span className="text-sm text-gray-600">
          {date.toLocaleDateString("fr-FR")}
        </span>
      );
    },
  },
  {
    id: "status",
    header: "Statut",
    cell: ({ row }) => {
      // Pour l'instant, on considère toutes les marques comme actives
      return (
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">Active</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const brand = row.original;
      return (
        <BrandActions
          brand={brand}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      );
    },
  },
];