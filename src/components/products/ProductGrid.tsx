import { useProducts } from "@/hooks/queries";
import { ProductCard } from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ProductGridProps {
  categoryId?: string;
  vendorId?: string;
  search?: string;
  limit?: number;
  className?: string;
}

export function ProductGrid({
  categoryId,
  vendorId,
  search,
  limit,
  className = "",
}: ProductGridProps) {
  const {
    data: products,
    isLoading,
    error,
  } = useProducts({
    categoryId,
    vendorId,
    search,
    _limit: limit,
  });

  if (isLoading) {
    return (
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}
      >
        {Array.from({ length: limit || 8 }).map((_, index) => (
          <div
            key={index}
            className="space-y-4 bg-white p-4 border border-gray-200 rounded-lg"
          >
            <Skeleton className="h-48 w-full bg-gray-100" />
            <Skeleton className="h-4 w-3/4 bg-gray-100" />
            <Skeleton className="h-4 w-1/2 bg-gray-100" />
            <Skeleton className="h-6 w-1/4 bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des produits : {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-muted-foreground text-lg">
          Aucun produit trouvé pour les critères sélectionnés.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
