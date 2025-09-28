import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { meilisearchService } from "@/services/meilisearchService";
import { ProductFilters } from "@/components/catalog/ProductFilters";
import { ProductCatalog } from "@/components/catalog/ProductCatalog";
import { CatalogStats } from "@/components/catalog/CatalogStats";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { CircleAlert as AlertCircle, RefreshCw, Filter, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Category } from "@/types";

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface FilterState {
  search?: string;
  categories?: string[];
  brands?: string[];
  priceRange?: [number, number];
  rating?: number;
  sortBy?: string;
}
export default function CatalogPage() {
  const { category: categoryId, subcategory: subcategoryId } = useParams<{
    category?: string;
    subcategory?: string;
  }>();

  const [dynamicBreadcrumbs, setDynamicBreadcrumbs] = useState<
    BreadcrumbItem[]
  >([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    categories: categoryId ? [categoryId] : [],
    search: "",
    brands: [],
    priceRange: [0, 1000000],
    rating: 0,
    sortBy: "newest",
  });

  // Charger la catégorie actuelle via Meilisearch
  const { data: currentCategory } = useQuery({
    queryKey: ["category", categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      const result = await meilisearchService.searchCategories("", 0, 1000);
      return result.hits.find((cat: Category) => cat.id === categoryId) || null;
    },
    enabled: !!categoryId,
  });

  // Charger les catégories et marques disponibles
  const { data: availableCategories = [] } = useQuery({
    queryKey: ["available-categories"],
    queryFn: async () => {
      const result = await meilisearchService.searchCategories("", 0, 1000);
      return result.hits;
    },
  });

  const { data: availableBrands = [] } = useQuery({
    queryKey: ["available-brands"],
    queryFn: async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_MEILISEARCH_HOST || "http://localhost:7700"}/indexes/brands/documents?limit=1000`, {
          headers: { Authorization: `Bearer ${import.meta.env.VITE_MEILISEARCH_API_KEY || "masterkey"}` },
        });
        if (response.ok) {
          const data = await response.json();
          return Array.isArray(data) ? data : data.results || [];
        }
      } catch (error) {
        console.warn("Fallback to API for brands");
      }
      return [];
    },
  });

  const handleFiltersChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters({
      categories: categoryId ? [categoryId] : [],
      search: "",
      brands: [],
      priceRange: [0, 1000000],
      rating: 0,
      sortBy: "newest",
    });
  };

  const pageTitle = currentCategory?.name || "Tous les produits";
  const pageDescription = currentCategory?.description || "Découvrez notre sélection de produits de qualité.";

  useEffect(() => {
    const fetchBreadcrumbs = async () => {
      const baseItems: BreadcrumbItem[] = [
        { label: "Accueil", path: "/" },
        { label: "Catalogue", path: "/catalog" },
      ];

      if (categoryId) {
        if (currentCategory) {
          baseItems.push({
            label: currentCategory.name,
            path: `/catalog/${currentCategory.slug}`,
          });
        }
      }
      
      setDynamicBreadcrumbs(baseItems);
    };

    fetchBreadcrumbs();
  }, [categoryId, subcategoryId, currentCategory]);

  const handleRefresh = async () => {
    try {
      window.location.reload();
    } catch (error) {
      console.error("Error refreshing catalog:", error);
    }
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  // Close drawer on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isDrawerOpen]);

  return (
    <div className="container mx-auto px-4 py-8 bg-white">

      {/* Breadcrumbs */}
      <Breadcrumbs items={dynamicBreadcrumbs} />

      {/* Page Header */}
      <header className="my-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-gray-900">
          {pageTitle}
        </h1>
        <p className="text-lg text-gray-600 mb-4">{pageDescription}</p>

        <div className="flex justify-center space-x-2">
          {subcategoryId && (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-900 text-sm">
              <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
              Sous-catégorie spécialisée
            </div>
          )}

          {categoryId && !subcategoryId && (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/5 text-primary text-sm">
              <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
              Catégorie sélectionnée
            </div>
          )}

          {!categoryId && (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 text-gray-900 text-sm">
              <span className="w-2 h-2 bg-gray-600 rounded-full mr-2"></span>
              Catalogue complet
            </div>
          )}
        </div>
      </header>


      {/* Filter Button for MD screens */}
      <div className="md:block lg:hidden mb-6">
        <Button
          onClick={toggleDrawer}
          variant="outline"
          className="w-full sm:w-auto border-gray-300 text-gray-800 hover:bg-gray-100"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtres
        </Button>
      </div>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:block lg:hidden"
          onClick={closeDrawer}
        />
      )}

      {/* Slide Drawer for MD screens */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 z-50 md:block lg:hidden overflow-y-auto ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
            <Button
              onClick={closeDrawer}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-4">
          <ProductFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            availableCategories={availableCategories}
            availableBrands={availableBrands}
            currentCategoryId={categoryId}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Filters Sidebar - Hidden on MD, Visible on LG+ */}
        <aside className="hidden lg:block lg:col-span-1 sticky top-20 overflow-y-auto max-h-[80vh]">
          <div className="sticky top-20">
            <ProductFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              availableCategories={availableCategories}
              availableBrands={availableBrands}
              currentCategoryId={categoryId}
            />
          </div>
        </aside>

        {/* Product Catalog */}
        <main className="col-span-1 lg:col-span-3">
          <ProductCatalog 
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </main>
      </div>
    </div>
  );
}