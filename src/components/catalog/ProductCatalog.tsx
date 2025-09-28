import React, { useMemo, useCallback } from "react";
import { Grid, List, Search } from "lucide-react";
import { useCartStore } from "@/stores";
import { meilisearchService } from "@/services/meilisearchService";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Skeleton } from "../ui/skeleton";
import { type Product } from "@/types";
import ProductCard from "../shared/ProductCard";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

const SORT_OPTIONS = [
  { value: "newest", label: "Plus récents" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "name_asc", label: "Nom A-Z" },
  { value: "name_desc", label: "Nom Z-A" },
  { value: "rating_desc", label: "Mieux notés" },
] as const;

interface FilterState {
  search?: string;
  categories?: string[];
  brands?: string[];
  priceRange?: [number, number];
  rating?: number;
  sortBy?: string;
}
interface ProductCatalogProps {
  showSearch?: boolean;
  showFilters?: boolean;
  showViewToggle?: boolean;
  itemsPerPage?: number;
  className?: string;
  filters?: FilterState;
  onFiltersChange?: (filters: Partial<FilterState>) => void;
}

export function ProductCatalog({
  showSearch = true,
  showFilters = true,
  showViewToggle = true,
  itemsPerPage = 12, // TODO: Implement pagination
  className = "",
  filters = {},
  onFiltersChange,
}: ProductCatalogProps) {
  const {
  const { categoryId } = useParams<{ categoryId?: string }>();
  const { addToCart } = useCartStore();

  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = React.useState(0);

  // Utiliser Meilisearch pour la recherche de produits
  const { data: searchResult, isLoading } = useQuery({
    queryKey: ["meilisearch-products", filters, currentPage, categoryId],
    queryFn: async () => {
      const searchFilters: any = {};
      
      if (categoryId) {
        searchFilters.categoryId = categoryId;
      }
      if (filters.categories?.length) {
        searchFilters.categoryId = filters.categories[0];
      }
      if (filters.brands?.length) {
        searchFilters.brandId = filters.brands[0];
      }
      if (filters.priceRange) {
        searchFilters.priceRange = filters.priceRange;
      }
      if (filters.rating) {
        searchFilters.rating = filters.rating;
      }

      return meilisearchService.searchProducts(
        filters.search || "",
        searchFilters,
        currentPage,
        itemsPerPage
      );
    },
    enabled: true,
  });

  const filteredProducts = searchResult?.hits || [];
  const totalProducts = searchResult?.nbHits || 0;

  // Memoized callbacks to prevent unnecessary re-renders
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFiltersChange?.({ search: e.target.value });
    },
    [onFiltersChange]
  );

  const handleSortChange = useCallback(
    (value: string) => {
      onFiltersChange?.({ sortBy: value });
    },
    [onFiltersChange]
  );

  const handleViewModeChange = useCallback((mode: "grid" | "list") => {
    setViewMode(mode);
  }, []);

  const handleAddToCart = useCallback(
    (product: Product) => {
      addToCart(product, 1);
    },
    [addToCart]
  );

  const handleAddToFavorites = useCallback((product: Product) => {
    console.log("Ajout aux favoris:", product);
  }, []);

  // Memoized grid class to avoid recalculation
  const gridClassName = useMemo(() => {
    return `grid gap-6 ${
      viewMode === "grid"
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1"
    }`;
  }, [viewMode]);

  // Memoized skeleton array to avoid recreation
  const skeletonArray = useMemo(() => Array.from({ length: 6 }), []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Toolbar: Search, Filters, View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {showSearch && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher des produits..."
              value={filters.search || ""}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          {/* Sort By Filter */}
          <Select
            value={filters.sortBy || "newest"}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-auto min-w-[180px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {showViewToggle && (
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => handleViewModeChange("grid")}
              >
                <Grid className="h-5 w-5" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => handleViewModeChange("list")}
              >
                <List className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      {!isLoading && (
        <div className="text-sm text-muted-foreground">
          {totalProducts} produit{totalProducts > 1 ? "s" : ""} trouvé{totalProducts > 1 ? "s" : ""}
          {categoryId && <span className="ml-2">dans cette catégorie</span>}
          {searchResult?.processingTimeMS && (
            <span className="ml-2 text-xs">({searchResult.processingTimeMS}ms)</span>
          )}
        </div>
      )}

      {/* Product Grid / List */}
      <div>
        {isLoading ? (
          <div className={gridClassName}>
            {skeletonArray.map((_, index) => (
              <Skeleton key={index} className="h-80 w-full" />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className={gridClassName}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onToggleLike={handleAddToFavorites}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-2xl font-semibold">Aucun produit trouvé</h3>
            <p className="text-muted-foreground mt-2">
              {categoryId
                ? "Aucun produit disponible dans cette catégorie. Essayez d'ajuster vos filtres."
                : "Essayez d'ajuster vos filtres ou de rechercher autre chose."}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {searchResult && searchResult.nbPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            Précédent
          </Button>
          <span className="flex items-center px-4 text-sm">
            Page {currentPage + 1} sur {searchResult.nbPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.min(searchResult.nbPages - 1, currentPage + 1))}
            disabled={currentPage >= searchResult.nbPages - 1}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
