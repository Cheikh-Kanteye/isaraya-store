import React, { useMemo, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  TrendingUp,
  Users,
  AlertCircle,
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  AlertTriangle,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCategories } from "@/hooks/queries/useCategoryQueries";
import { useBrands } from "@/hooks/queries/useBrandQueries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Product, Category, Brand } from "@/types";
import { DataTable } from "@/components/dashboard/shared/DataTable";
import { columns } from "./products/columns";
import { createCategoryColumns } from "./categories/columns";
import { createBrandColumns } from "./brands/columns";
import { CategoryForm } from "./categories/CategoryForm";
import { BrandForm } from "./brands/BrandForm";
import { Table as TanstackTable } from "@tanstack/react-table";
import {
  FilterBar,
  FilterState,
} from "@/components/dashboard/shared/FilterBar";
import { Pagination } from "@/components/dashboard/shared/Pagination";
import { useProductStore } from "@/stores";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import { ProductDiagnostic } from "@/components/debug/ProductDiagnostic";

// Types pour les formulaires avec gestion des fichiers
type CategoryFormData = Omit<Category, "id"> & {
  imageFile?: File;
};

type BrandFormData = Omit<Brand, "id"> & {
  logoFile?: File;
};

const StatsCards = ({ products = [] }: { products?: Product[] }) => {
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.status === "disponible").length;
    const reported = products.filter((p) => (p.reports || 0) > 0).length;
    const pending = products.filter(
      (p) => p.status === "bientôt disponible"
    ).length;

    return { total, active, reported, pending };
  }, [products]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Produits</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Produits Actifs</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.active}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Attente</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </p>
            </div>
            <Users className="h-8 w-8 text-yellow-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Signalés</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.reported}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ProductsManagement = () => {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: [],
    category: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // États pour les formulaires
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [isBrandFormOpen, setIsBrandFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories, refetch: refetchCategories } = useCategories();
  const { data: brands, refetch: refetchBrands } = useBrands();

  const { products, isLoading, error, fetchProducts } = useProductStore();

  // Charger les produits au montage du composant
  useEffect(() => {
    if (!products || products.length === 0) {
      fetchProducts();
    }
  }, [fetchProducts, products]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter((product) => {
      // Search filter
      if (
        filters.search &&
        !product.name.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      // Status filter
      if (
        filters.status.length > 0 &&
        !filters.status.includes(product.status || "disponible")
      ) {
        return false;
      }

      // Category filter
      if (filters.category && product.categoryId !== filters.category) {
        return false;
      }

      return true;
    });
  }, [products, filters]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  // Fonctions pour les catégories
  const openCategoryForm = (category?: Category) => {
    setSelectedCategory(category || null);
    setIsCategoryFormOpen(true);
  };

  const closeCategoryForm = () => {
    setIsCategoryFormOpen(false);
    setSelectedCategory(null);
  };

  const handleCategorySubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);
    try {
      // Créer une copie mutable pour les transformations
      const processedData: Omit<CategoryFormData, "imageFile"> & {
        imageUrl?: string;
      } = { ...data };

      // Gérer l'upload d'image si une nouvelle image est fournie
      if (data.imageFile && data.imageFile instanceof File) {
        try {
          // Si on modifie une catégorie existante avec une ancienne image, la supprimer
          if (selectedCategory?.imageUrl) {
            try {
              // Extraire le publicId de l'URL Cloudinary
              // URL format: https://res.cloudinary.com/demo/image/upload/v1234567890/categories/filename.jpg
              const urlParts = selectedCategory.imageUrl.split("/");
              const uploadIndex = urlParts.findIndex(
                (part) => part === "upload"
              );
              if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
                // Prendre tout après 'upload/v123456/'
                const publicIdWithExt = urlParts
                  .slice(uploadIndex + 2)
                  .join("/");
                const publicId = publicIdWithExt.split(".")[0]; // Enlever l'extension
                await apiService.images.delete(publicId);
              }
            } catch (deleteError) {
              console.warn(
                "Erreur lors de la suppression de l'ancienne image:",
                deleteError
              );
            }
          }

          // Uploader la nouvelle image
          const uploadResult = await apiService.images.upload(
            data.imageFile,
            "categories"
          );
          processedData.imageUrl = uploadResult.url;
        } catch (uploadError) {
          console.error("Erreur lors de l'upload d'image:", uploadError);
          toast.error("Erreur lors de l'upload de l'image");
          return;
        }
      }

      // Préparer les données finales sans le fichier
      const { imageFile, ...finalData } = processedData as CategoryFormData;

      if (selectedCategory) {
        await apiService.categories.update(selectedCategory.id, finalData);
        toast.success("Catégorie mise à jour avec succès");
      } else {
        await apiService.categories.create(finalData);
        toast.success("Catégorie créée avec succès");
      }
      refetchCategories();
      closeCategoryForm();
    } catch (error) {
      console.error("Erreur lors de la soumission de la catégorie:", error);
      toast.error("Erreur lors de la sauvegarde de la catégorie");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryDelete = async (id: string) => {
    // Vérifier s'il y a des produits associés
    const associatedProducts = products.filter(
      (product) => product.categoryId === id
    ).length;
    const subcategories =
      categories?.filter((cat) => cat.parentId === id) || [];

    if (associatedProducts > 0) {
      toast.error(
        `Impossible de supprimer cette catégorie. Elle contient ${associatedProducts} produit(s).`
      );
      return;
    }

    if (subcategories.length > 0) {
      toast.error(
        `Impossible de supprimer cette catégorie. Elle contient ${subcategories.length} sous-catégorie(s).`
      );
      return;
    }

    if (!confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) {
      return;
    }
    try {
      await apiService.categories.delete(id);
      toast.success("Catégorie supprimée avec succès");
      refetchCategories();
    } catch (error) {
      console.error("Erreur lors de la suppression de la catégorie:", error);
      toast.error("Erreur lors de la suppression de la catégorie");
    }
  };

  const handleCategoryView = (category: Category) => {
    // TODO: Implémenter la vue détaillée de la catégorie
    console.log("Voir catégorie:", category);
  };

  const handleAddSubcategory = (parentId: string) => {
    const parentCategory = { id: parentId } as Category;
    setSelectedCategory({ parentId } as Category);
    setIsCategoryFormOpen(true);
  };

  // Fonctions pour les marques
  const openBrandForm = (brand?: Brand) => {
    setSelectedBrand(brand || null);
    setIsBrandFormOpen(true);
  };

  const closeBrandForm = () => {
    setIsBrandFormOpen(false);
    setSelectedBrand(null);
  };

  const handleBrandSubmit = async (data: BrandFormData) => {
    setIsSubmitting(true);
    try {
      const processedData: Omit<BrandFormData, "logoFile"> & {
        logoUrl?: string;
      } = { ...data };

      // Gérer l'upload d'image si une nouvelle image est fournie
      if (data.logoFile && data.logoFile instanceof File) {
        try {
          // Si on modifie une marque existante avec un ancien logo, le supprimer
          if (selectedBrand?.logoUrl) {
            try {
              // Extraire le publicId de l'URL Cloudinary
              // URL format: https://res.cloudinary.com/demo/image/upload/v1234567890/brands/filename.jpg
              const urlParts = selectedBrand.logoUrl.split("/");
              const uploadIndex = urlParts.findIndex(
                (part) => part === "upload"
              );
              if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
                // Prendre tout après 'upload/v123456/'
                const publicIdWithExt = urlParts
                  .slice(uploadIndex + 2)
                  .join("/");
                const publicId = publicIdWithExt.split(".")[0]; // Enlever l'extension
                await apiService.images.delete(publicId);
              }
            } catch (deleteError) {
              console.warn(
                "Erreur lors de la suppression de l'ancien logo:",
                deleteError
              );
            }
          }

          // Uploader le nouveau logo
          const uploadResult = await apiService.images.upload(
            data.logoFile,
            "brands"
          );
          processedData.logoUrl = uploadResult.url;
        } catch (uploadError) {
          console.error("Erreur lors de l'upload du logo:", uploadError);
          toast.error("Erreur lors de l'upload du logo");
          return;
        }
      }

      // Préparer les données finales sans le fichier
      const { logoFile, ...finalData } = processedData as BrandFormData;

      if (selectedBrand) {
        await apiService.brands.update(selectedBrand.id, finalData);
        toast.success("Marque mise à jour avec succès");
      } else {
        await apiService.brands.create(finalData);
        toast.success("Marque créée avec succès");
      }
      refetchBrands();
      closeBrandForm();
    } catch (error) {
      console.error("Erreur lors de la soumission de la marque:", error);
      toast.error("Erreur lors de la sauvegarde de la marque");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBrandDelete = async (id: string) => {
    // Vérifier s'il y a des produits associés
    const associatedProducts = products.filter(
      (product) => product.brandId === id
    ).length;

    if (associatedProducts > 0) {
      toast.error(
        `Impossible de supprimer cette marque. Elle est associée à ${associatedProducts} produit(s).`
      );
      return;
    }

    if (!confirm("Êtes-vous sûr de vouloir supprimer cette marque ?")) {
      return;
    }
    try {
      await apiService.brands.delete(id);
      toast.success("Marque supprimée avec succès");
      refetchBrands();
    } catch (error) {
      console.error("Erreur lors de la suppression de la marque:", error);
      toast.error("Erreur lors de la suppression de la marque");
    }
  };

  const handleBrandView = (brand: Brand) => {
    // TODO: Implémenter la vue détaillée de la marque
    console.log("Voir marque:", brand);
  };

  const renderProductActions = (table: TanstackTable<Product>) => {
    const selectedRows = table
      .getSelectedRowModel()
      .rows.map((row) => row.original);

    const handleStatusChange = async (status: Product["status"]) => {
      if (selectedRows.length === 0 || !status) return;

      // S'assurer que le status n'est pas undefined
      const validStatus = status as
        | "disponible"
        | "indisponible"
        | "bientôt disponible";

      try {
        // Mettre à jour chaque produit sélectionné avec le nouvel endpoint simplifié
        const updatePromises = selectedRows.map((product) => {
          return apiService.products.updateStatus(product.id, validStatus);
        });

        await Promise.all(updatePromises);

        toast.success(
          `${selectedRows.length} produit(s) mis à jour avec le statut "${validStatus}"`
        );

        // Mettre à jour les données localement au lieu de refetch complet
        const updatedProducts = products.map((product) => {
          const isSelected = selectedRows.some(
            (selected) => selected.id === product.id
          );
          return isSelected ? { ...product, status: validStatus } : product;
        });

        // Mettre à jour le store avec les nouvelles données
        useProductStore.setState({ products: updatedProducts });
      } catch (error) {
        console.error("Erreur lors du changement de statut:", error);
        toast.error("Erreur lors de la mise à jour des produits");
      } finally {
        table.resetRowSelection();
      }
    };

    const handleDelete = async () => {
      if (selectedRows.length === 0) return;

      const isConfirmed = confirm(
        `Êtes-vous sûr de vouloir supprimer ${selectedRows.length} produit(s) ? Cette action est irréversible.`
      );

      if (!isConfirmed) return;

      try {
        // Supprimer chaque produit sélectionné
        const deletePromises = selectedRows.map((product) => {
          return apiService.products.delete(product.id);
        });

        await Promise.all(deletePromises);

        toast.success(
          `${selectedRows.length} produit(s) supprimé(s) avec succès`
        );

        // Retirer les produits supprimés des données localement
        const deletedIds = selectedRows.map((product) => product.id);
        const remainingProducts = products.filter(
          (product) => !deletedIds.includes(product.id)
        );

        // Mettre à jour le store avec les données restantes
        useProductStore.setState({ products: remainingProducts });
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        toast.error("Erreur lors de la suppression des produits");
      } finally {
        table.resetRowSelection();
      }
    };

    return (
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Changer le statut ({selectedRows.length})
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-card">
            <DropdownMenuItem onClick={() => handleStatusChange("disponible")}>
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              Disponible
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusChange("indisponible")}
            >
              <XCircle className="mr-2 h-4 w-4 text-red-500" />
              Indisponible
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusChange("bientôt disponible")}
            >
              <Clock className="mr-2 h-4 w-4 text-yellow-500" />
              Bientôt disponible
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={selectedRows.length === 0}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer ({selectedRows.length})
        </Button>
      </div>
    );
  };

  // Créer les colonnes pour les catégories et marques
  const categoryColumns = createCategoryColumns(
    openCategoryForm,
    handleCategoryDelete,
    handleCategoryView,
    handleAddSubcategory,
    categories || [],
    products || []
  );

  const brandColumns = createBrandColumns(
    openBrandForm,
    handleBrandDelete,
    handleBrandView,
    products || []
  );

  if (isLoading) return <ProductsManagementSkeleton />;

  if (error) {
    return (
      <Alert variant="destructive" className="bg-red-900/20 border-red-800">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="text-red-400">Erreur</AlertTitle>
        <AlertDescription className="text-red-300">
          Impossible de charger les produits. Veuillez réessayer plus tard.
          {error && <pre className="mt-2 text-xs">{error}</pre>}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestion des produits
          </h1>
          <p className="text-gray-600">
            Surveillez et modérez tous les produits de la plateforme
          </p>
        </div>

        <StatsCards products={filteredProducts} />

        <Tabs defaultValue="products" className="w-full">
          <TabsList>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="categories">Catégories</TabsTrigger>
            <TabsTrigger value="brands">Marques</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card className="bg-white border border-gray-200">
              <CardHeader className="border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-gray-900">Produits</CardTitle>
                    <CardDescription className="text-gray-600">
                      Liste de tous les produits publiés sur la plateforme
                    </CardDescription>
                  </div>
                </div>

                <FilterBar
                  filters={filters}
                  onFiltersChange={setFilters}
                  statusOptions={[
                    { value: "disponible", label: "Disponible" },
                    { value: "indisponible", label: "Indisponible" },
                    {
                      value: "bientôt disponible",
                      label: "Bientôt disponible",
                    },
                  ]}
                  categoryOptions={categories?.map((cat) => ({
                    value: cat.id,
                    label: cat.name,
                  }))}
                />
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <DataTable
                    columns={columns}
                    data={paginatedProducts}
                    renderRowSelectionActions={renderProductActions}
                  />
                </div>

                {filteredProducts.length > 0 && (
                  <div className="border-t border-gray-200 p-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredProducts.length}
                      itemsPerPage={itemsPerPage}
                      onPageChange={handlePageChange}
                      onItemsPerPageChange={handleItemsPerPageChange}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card className="bg-white border border-gray-200">
              <CardHeader className="border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-gray-900">Catégories</CardTitle>
                    <CardDescription className="text-gray-600">
                      Gérez les catégories de produits de la plateforme
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => openCategoryForm()}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nouvelle catégorie
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <DataTable
                    columns={categoryColumns}
                    data={categories || []}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="brands">
            <Card className="bg-white border border-gray-200">
              <CardHeader className="border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-gray-900">Marques</CardTitle>
                    <CardDescription className="text-gray-600">
                      Gérez les marques de produits de la plateforme
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => openBrandForm()}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nouvelle marque
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <DataTable columns={brandColumns} data={brands || []} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Formulaires */}
        <CategoryForm
          isOpen={isCategoryFormOpen}
          onClose={closeCategoryForm}
          onSubmit={handleCategorySubmit}
          category={selectedCategory}
          categories={categories || []}
          isLoading={isSubmitting}
        />

        <BrandForm
          isOpen={isBrandFormOpen}
          onClose={closeBrandForm}
          onSubmit={handleBrandSubmit}
          brand={selectedBrand}
          isLoading={isSubmitting}
        />

        {/* Composant de diagnostic en mode développement */}
        {process.env.NODE_ENV === 'development' && <ProductDiagnostic />}
      </div>
    </div>
  );
};

const ProductsManagementSkeleton = () => (
  <div className="min-h-screen bg-white p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <Skeleton className="h-9 w-1/3 bg-gray-100" />
        <Skeleton className="h-5 w-1/2 mt-2 bg-gray-100" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-white border border-gray-200">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2 bg-gray-100" />
              <Skeleton className="h-8 w-16 bg-gray-100" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <Skeleton className="h-7 w-48 bg-gray-100" />
          <Skeleton className="h-5 w-1/3 bg-gray-100" />
          <div className="flex items-center space-x-2 mt-4">
            <Skeleton className="h-10 w-64 bg-gray-100" />
            <Skeleton className="h-10 w-24 bg-gray-100" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center p-4">
                <Skeleton className="h-5 w-1/4 bg-gray-100" />
                <Skeleton className="h-5 w-1/6 bg-gray-100" />
                <Skeleton className="h-5 w-1/6 bg-gray-100" />
                <Skeleton className="h-5 w-1/6 bg-gray-100" />
                <Skeleton className="h-5 w-1/6 bg-gray-100" />
                <Skeleton className="h-8 w-8 rounded-full bg-gray-100" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default ProductsManagement;
