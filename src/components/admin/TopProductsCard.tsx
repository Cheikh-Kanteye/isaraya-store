import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTopProducts } from "@/hooks/useTopProducts";
import { RefreshCw, Trash2, BarChart3 } from "lucide-react";

interface TopProductsCardProps {
  limit?: number;
  showCacheControls?: boolean;
  className?: string;
}

export function TopProductsCard({ 
  limit = 5, 
  showCacheControls = false, 
  className = "" 
}: TopProductsCardProps) {
  const { 
    topProducts, 
    isLoading, 
    error, 
    clearCache, 
    getCacheStats 
  } = useTopProducts({ limit });

  const cacheStats = getCacheStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <BarChart3 className="h-5 w-5" />
            Erreur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Une erreur est survenue lors du chargement des top produits.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top {limit} Produits
            </CardTitle>
            <CardDescription>
              Produits les plus vendus par quantité
            </CardDescription>
          </div>
          
          {showCacheControls && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Cache: {cacheStats.size} entrée(s)
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={clearCache}
                className="h-8 px-3"
                title="Vider le cache"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading ? (
          // Squelettes de chargement
          <div className="space-y-3">
            {Array.from({ length: limit }).map((_, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded bg-gray-100" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-2 bg-gray-100" />
                    <Skeleton className="h-3 w-24 bg-gray-100" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-16 mb-2 bg-gray-100" />
                  <Skeleton className="h-3 w-12 bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : topProducts.length === 0 ? (
          // Message si aucun produit
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun produit vendu trouvé</p>
            <p className="text-sm">Les ventes apparaîtront ici une fois les commandes traitées</p>
          </div>
        ) : (
          // Liste des top produits
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div 
                key={product.id} 
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Numéro de classement */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                  
                  <div>
                    <h4 className="font-medium line-clamp-1 mb-1">
                      {product.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {product.merchantName}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {product.totalSold} vendus
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-green-600">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Indicateur de performance (en développement) */}
        {showCacheControls && topProducts.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Performance optimisée avec mémoïsation</span>
              <RefreshCw className="h-3 w-3" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}