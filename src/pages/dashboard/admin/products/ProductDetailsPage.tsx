import { useParams } from "react-router-dom";
import { useProduct, useUser, useCategory } from "@/hooks/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FallbackImage from "@/components/shared/FallbackImage";
import { formatPrice } from "@/lib/utils";
import {
  Loader2,
  Star,
  Package,
  Calendar,
  TrendingUp,
  User,
  Tag,
  Settings,
} from "lucide-react";
import { Product } from "@/types";
import { StatusSelector } from "@/components/dashboard/admin/products/StatusSelector";
import { useAuthStore } from "@/stores/authStore";
import { format } from "date-fns";

const ProductContent = ({ product }: { product: Product }) => {
  const { data: merchant } = useUser(product.vendorId!);
  const { data: category } = useCategory(product.categoryId!);
  const { isAdmin } = useAuthStore();

  if (!product.vendorId || !product.categoryId) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header simplifié */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-4">
          {product.name}
        </h1>
        <div className="flex items-center gap-4 flex-wrap mb-4">
          <Badge variant="outline">{category?.name || "Catégorie"}</Badge>
          <Badge variant="secondary">{product.condition}</Badge>
          {product.brand && (
            <Badge variant="outline">{product.brand.name}</Badge>
          )}
          <span className="text-muted-foreground">Stock: {product.stock}</span>
          <span className="text-muted-foreground">SKU: {product.sku}</span>
          {product.rating > 0 && (
            <span className="text-muted-foreground flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {product.rating}/5
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Images du produit */}
          <Card className="glass-card-2">
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.images?.length > 0 ? (
                  product.images.map((image, index) => (
                    <FallbackImage
                      key={image.url + index}
                      src={image.url}
                      alt={image.altText || product.name}
                      className="w-full h-64 rounded-lg object-cover"
                    />
                  ))
                ) : (
                  <FallbackImage
                    src="/placeholder.svg"
                    alt={product.name}
                    className="w-full h-64 rounded-lg object-cover"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="glass-card-2">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{product.description}</p>
            </CardContent>
          </Card>

          {/* Spécifications */}
          {product.specifications && product.specifications.length > 0 && (
            <Card className="glass-card-2">
              <CardHeader>
                <CardTitle>Spécifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {product.specifications.map((spec, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-muted-foreground">{spec.name}</span>
                      <span>{spec.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <Card className="glass-card-2">
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attributs */}
          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <Card className="glass-card-2">
              <CardHeader>
                <CardTitle>Attributs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(product.attributes).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {key}
                      </span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Prix et Statut */}
          <Card className="glass-card-2">
            <CardHeader>
              <CardTitle>Prix et Statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-3xl font-bold">
                  {formatPrice(product.price)}
                </p>
                {product.originalPrice && product.originalPrice > 0 && (
                  <p className="text-sm text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <Badge className="">{product.status}</Badge>
                {isAdmin() && <StatusSelector product={product} />}
              </div>
            </CardContent>
          </Card>

          {/* Vendeur */}
          <Card className="glass-card-2">
            <CardHeader>
              <CardTitle>Vendeur</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={merchant?.avatarUrl} />
                <AvatarFallback>
                  {merchant?.firstName?.[0]}
                  {merchant?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">
                  {merchant?.firstName} {merchant?.lastName}
                </p>
                <p className="text-sm text-foreground">{merchant?.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Métadonnées */}
          <Card className="glass-card-2">
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Créé le</span>
                <span>{format(new Date(product.createdAt), "dd/MM/yyyy")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mis à jour</span>
                <span>{format(new Date(product.updatedAt), "dd/MM/yyyy")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rapports</span>
                <span>{product.reports}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avis</span>
                <span>{product.reviews?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const ProductDetailsPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const { data: product, isLoading, isError } = useProduct(productId!);

  console.log(product);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="text-red-500">
        Impossible de charger les détails du produit.
      </div>
    );
  }

  return <ProductContent product={product} />;
};

export default ProductDetailsPage;
