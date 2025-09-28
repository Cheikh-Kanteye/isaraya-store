"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Category } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Eye, Plus } from "lucide-react";
import FallbackImage from "@/components/shared/FallbackImage";

interface CategoryActionsProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onView: (category: Category) => void;
  onAddSubcategory: (parentId: string) => void;
}

const CategoryActions = ({ 
  category, 
  onEdit, 
  onDelete, 
  onView, 
  onAddSubcategory 
}: CategoryActionsProps) => {
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
        <DropdownMenuItem onClick={() => onView(category)}>
          <Eye className="mr-2 h-4 w-4" />
          Voir les détails
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(category)}>
          <Edit className="mr-2 h-4 w-4" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAddSubcategory(category.id)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter sous-catégorie
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => onDelete(category.id)}
          className="text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const createCategoryColumns = (
  onEdit: (category: Category) => void,
  onDelete: (id: string) => void,
  onView: (category: Category) => void,
  onAddSubcategory: (parentId: string) => void,
  allCategories: Category[] = [],
  products: any[] = []
): ColumnDef<Category>[] => [
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
    header: "Catégorie",
    cell: ({ row }) => {
      const category = row.original;
      const parentCategory = category.parentId 
        ? allCategories.find(cat => cat.id === category.parentId)
        : null;
      
      return (
        <div className="flex items-center space-x-3">
          {category.imageUrl && (
            <FallbackImage
              src={category.imageUrl}
              alt={category.name}
              className="w-10 h-10 rounded-md object-cover"
            />
          )}
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{category.name}</span>
              {parentCategory && (
                <Badge variant="outline" className="text-xs">
                  Sous-catégorie
                </Badge>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {category.slug}
            </div>
            {parentCategory && (
              <div className="text-xs text-gray-400">
                Parent: {parentCategory.name}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue("description") as string;
      return (
        <div className="max-w-[200px]">
          {description ? (
            <span className="text-sm text-gray-600 line-clamp-2">
              {description}
            </span>
          ) : (
            <span className="text-sm text-gray-400 italic">
              Aucune description
            </span>
          )}
        </div>
      );
    },
  },
  {
    id: "subcategories",
    header: "Sous-catégories",
    cell: ({ row }) => {
      const category = row.original;
      const subcategories = allCategories.filter(cat => cat.parentId === category.id);
      
      return (
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {subcategories.length}
          </Badge>
          {subcategories.length > 0 && (
            <div className="text-xs text-gray-500">
              {subcategories.slice(0, 2).map(sub => sub.name).join(", ")}
              {subcategories.length > 2 && "..."}
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "products",
    header: "Produits",
    cell: ({ row }) => {
      const category = row.original;
      const productCount = products.filter(product => product.categoryId === category.id).length;
      
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
      const date = new Date(row.getValue("createdAt"));
      return (
        <span className="text-sm text-gray-600">
          {date.toLocaleDateString("fr-FR")}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const category = row.original;
      return (
        <CategoryActions
          category={category}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          onAddSubcategory={onAddSubcategory}
        />
      );
    },
  },
];