import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProductStore } from "@/stores";
import { apiService } from "@/services/api";
import { AlertCircle, RefreshCw, Eye, EyeOff } from "lucide-react";

export const ProductDiagnostic = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);

  const { products, fetchProducts } = useProductStore();

  const runDiagnostic = async () => {
    setIsRefreshing(true);
    try {
      // Fetch fresh data from API
      const freshProducts = await apiService.products.getAll();

      // Analyze product data
      const analysis = {
        totalProducts: freshProducts.length,
        productsWithvendorId: freshProducts.filter((p) => p.vendorId).length,
        productsWithoutvendorId: freshProducts.filter((p) => !p.vendorId)
          .length,
        uniquevendorIds: [
          ...new Set(freshProducts.map((p) => p.vendorId).filter(Boolean)),
        ],
        sampleProducts: freshProducts.slice(0, 3).map((p) => ({
          id: p.id,
          name: p.name,
          vendorId: p.vendorId,
          status: p.status,
          hasAllRequiredFields: !!(p.id && p.name && p.vendorId),
        })),
        vendorIdTypes: freshProducts
          .map((p) => ({
            id: p.id,
            vendorIdType: typeof p.vendorId,
            vendorIdValue: p.vendorId,
          }))
          .slice(0, 5),
      };

      setDiagnosticData(analysis);

      // Also refresh the store
      await fetchProducts();
    } catch (error) {
      console.error("Diagnostic failed:", error);
      setDiagnosticData({ error: String(error) });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          Debug Produits
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-blue-600" />
              Diagnostic Produits
            </CardTitle>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              onClick={runDiagnostic}
              disabled={isRefreshing}
              size="sm"
              variant="outline"
            >
              {isRefreshing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              Analyser
            </Button>
          </div>

          {diagnosticData && (
            <div className="space-y-2 text-xs">
              {diagnosticData.error ? (
                <div className="text-red-600 font-mono">
                  Erreur: {diagnosticData.error}
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>Total produits:</span>
                    <Badge variant="outline">
                      {diagnosticData.totalProducts}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span>Avec vendorId:</span>
                    <Badge
                      variant={
                        diagnosticData.productsWithvendorId > 0
                          ? "default"
                          : "destructive"
                      }
                    >
                      {diagnosticData.productsWithvendorId}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span>Sans vendorId:</span>
                    <Badge
                      variant={
                        diagnosticData.productsWithoutvendorId > 0
                          ? "destructive"
                          : "default"
                      }
                    >
                      {diagnosticData.productsWithoutvendorId}
                    </Badge>
                  </div>

                  <div className="border-t pt-2">
                    <div className="font-medium mb-1">Marchands uniques:</div>
                    <div className="max-h-20 overflow-y-auto">
                      {diagnosticData.uniquevendorIds.map(
                        (id: string, index: number) => (
                          <div
                            key={index}
                            className="font-mono text-xs bg-gray-50 p-1 mb-1 rounded"
                          >
                            {id}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-2">
                    <div className="font-medium mb-1">
                      Échantillon produits:
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {diagnosticData.sampleProducts.map(
                        (product: any, index: number) => (
                          <div
                            key={index}
                            className="bg-gray-50 p-2 rounded text-xs"
                          >
                            <div className="font-mono">{product.id}</div>
                            <div className="truncate">{product.name}</div>
                            <div className="flex justify-between mt-1">
                              <span>vendorId:</span>
                              <Badge
                                variant={
                                  product.vendorId ? "default" : "destructive"
                                }
                                className="text-xs"
                              >
                                {product.vendorId || "null"}
                              </Badge>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
