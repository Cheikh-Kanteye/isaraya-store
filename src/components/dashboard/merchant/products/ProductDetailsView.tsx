import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import FallbackImage from "@/components/shared/FallbackImage";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/types";
import {
  Calendar,
  Package,
  Tag,
  DollarSign,
  Eye,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon
} from "lucide-react";

interface ProductDetailsViewProps {
  product: Product;
}

const ProductDetailsView: React.FC<ProductDetailsViewProps> = ({ product }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = product.images || [];

  const nextImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const previousImage = () => {
    if (images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
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

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "disponible":
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            Disponible
          </Badge>
        );
      case "indisponible":
        return (
          <Badge variant="destructive">
            Indisponible
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status || "Non défini"}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Images Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Images du produit
        </h3>
        
        {images.length > 0 ? (
          <div className="space-y-3">
            {/* Main Image */}
            <div className="relative aspect-square w-full max-w-md mx-auto bg-secondary rounded-lg overflow-hidden">
              <FallbackImage
                src={images[currentImageIndex]?.url || "/placeholder.svg"}
                alt={`${product.name} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={previousImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md text-sm">
                  {currentImageIndex + 1} / {images.length}
                </div>
              )}
            </div>
            
            {/* Image Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 justify-center flex-wrap">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? "border-primary shadow-md"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <FallbackImage
                      src={image.url}
                      alt={`${product.name} - Aperçu ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-square w-full max-w-md mx-auto bg-secondary rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucune image disponible</p>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Product Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Informations de base</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nom du produit</label>
              <p className="text-base font-semibold">{product.name}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-sm text-muted-foreground">
                {product.description || "Aucune description disponible"}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Catégorie</label>
              <p className="text-sm">
                {product.category?.name || "Non catégorisé"}
              </p>
            </div>
            
            {product.brand && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Marque</label>
                <p className="text-sm">{product.brand.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats & Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Statut et statistiques</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium text-muted-foreground">Prix</label>
              <div className="ml-auto text-right">
                <p className="text-lg font-bold">{formatPrice(product.price)}</p>
                {product.oldPrice && product.oldPrice > product.price && (
                  <p className="text-sm text-muted-foreground line-through">
                    {formatPrice(product.oldPrice)}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium text-muted-foreground">Stock</label>
              <div className="ml-auto">
                <Badge variant={getStockBadgeVariant(product.stock)}>
                  {getStockText(product.stock)}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {product.stock} unité{product.stock !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium text-muted-foreground">Statut</label>
              <div className="ml-auto">
                {getStatusBadge(product.status)}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium text-muted-foreground">Vues</label>
              <div className="ml-auto">
                <span className="text-sm font-medium">
                  {product.views || 0} vue{(product.views || 0) !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium text-muted-foreground">Créé le</label>
              <div className="ml-auto text-right">
                <p className="text-sm font-medium">
                  {new Date(product.createdAt).toLocaleDateString("fr-FR")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(product.createdAt).toLocaleTimeString("fr-FR")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Attributes if any */}
      {product.attributes && Object.keys(product.attributes).length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-3">Attributs du produit</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(product.attributes).map(([key, value], index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-secondary rounded-md">
                  <span className="text-sm font-medium">{key}</span>
                  <span className="text-sm text-muted-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductDetailsView;
