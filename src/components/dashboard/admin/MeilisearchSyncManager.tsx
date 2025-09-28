import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMeilisearchStore } from "@/stores/meilisearchStore";
import { toast } from "sonner";
import { 
  RefreshCw, 
  Database, 
  Search, 
  CheckCircle, 
  AlertCircle,
  Package,
  Tag
} from "lucide-react";

export const MeilisearchSyncManager: React.FC = () => {
  const { 
    isIndexReady, 
    isResyncing, 
    error, 
    fullResync, 
    resyncProducts, 
    resyncCategories 
  } = useMeilisearchStore();

  const handleFullResync = async () => {
    try {
      toast.info("Démarrage de la resynchronisation complète...");
      await fullResync();
      toast.success("Resynchronisation complète terminée !");
    } catch (error) {
      toast.error("Erreur lors de la resynchronisation complète");
      console.error("Full resync error:", error);
    }
  };

  const handleResyncProducts = async () => {
    try {
      toast.info("Démarrage de la resynchronisation des produits...");
      await resyncProducts();
      toast.success("Resynchronisation des produits terminée !");
    } catch (error) {
      toast.error("Erreur lors de la resynchronisation des produits");
      console.error("Products resync error:", error);
    }
  };

  const handleResyncCategories = async () => {
    try {
      toast.info("Démarrage de la resynchronisation des catégories...");
      await resyncCategories();
      toast.success("Resynchronisation des catégories terminée !");
    } catch (error) {
      toast.error("Erreur lors de la resynchronisation des catégories");
      console.error("Categories resync error:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Gestion de Meilisearch
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Statut</h4>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isIndexReady ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-600" />
              )}
              <Badge variant={isIndexReady ? "default" : "secondary"}>
                {isIndexReady ? "Index prêt" : "Index non initialisé"}
              </Badge>
            </div>
            
            {isResyncing && (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                <Badge variant="outline" className="text-blue-600">
                  Synchronisation en cours...
                </Badge>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Actions Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Actions de synchronisation</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Full Resync */}
            <Button
              onClick={handleFullResync}
              disabled={isResyncing}
              variant="default"
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Resync complète
            </Button>

            {/* Products Resync */}
            <Button
              onClick={handleResyncProducts}
              disabled={isResyncing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Resync produits
            </Button>

            {/* Categories Resync */}
            <Button
              onClick={handleResyncCategories}
              disabled={isResyncing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Tag className="h-4 w-4" />
              Resync catégories
            </Button>
          </div>
        </div>

        <Separator />

        {/* Information Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Information</h4>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              • La <strong>resynchronisation complète</strong> recrée entièrement les index Meilisearch.
            </p>
            <p>
              • Les <strong>resynchronisations partielles</strong> mettent à jour seulement le type de données sélectionné.
            </p>
            <p>
              • La synchronisation automatique se fait maintenant à chaque création, modification ou suppression.
            </p>
            <p className="text-green-600 font-medium">
              ✓ Vous n'avez normalement plus besoin de resynchroniser manuellement.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MeilisearchSyncManager;