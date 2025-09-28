import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores";
import {
  useCreateProduct,
  useUpdateProduct,
} from "@/hooks/queries/useProductQueries";
import { apiService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CategorySelect } from "@/components/ui/category-select";
import { BrandSelect } from "@/components/ui/brand-select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import type { Product, Image } from "@/types"; // Importation de Image
import MultiImageUpload from "@/components/ui/MultiImageUpload";
import FallbackImage from "@/components/shared/FallbackImage"; // Importation du composant FallbackImage
import ProductDetailsView from "./products/ProductDetailsView";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StepLoader from "@/components/ui/StepLoader";

const productSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  title: z.string().min(1, "Le titre est requis"), // Added title
  sku: z.string().min(1, "Le SKU est requis"),
  description: z.string().min(1, "La description est requise"),
  price: z.number().min(0, "Le prix doit être positif"),
  originalPrice: z.number().optional().nullable().default(0), // Ajout de originalPrice comme optionnel
  stock: z.number().min(0, "Le stock doit être positif"),
  categoryId: z.string().min(1, "La catégorie est requise"),
  brandId: z.string().min(1, "La marque est requise"),
  condition: z.enum(["neuf", "occasion", "reconditionne"]),
  image: z
    .union([z.instanceof(File), z.string()])
    .optional()
    .nullable(),
  imagesFiles: z
    .array(z.instanceof(File))
    .max(3, "Maximum 3 images")
    .optional()
    .default([]),
  images: z
    .array(z.object({ url: z.string(), altText: z.string().optional() }))
    .optional(),
  tags: z.array(z.string()).optional(),
  reviews: z
    .array(
      z.object({
        userId: z.string(),
        rating: z.number(),
        comment: z.string().optional(),
      })
    )
    .optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  status: z
    .enum(["disponible", "indisponible", "bientôt disponible"])
    .optional(),
  specifications: z
    .array(z.object({ name: z.string(), value: z.string() }))
    .optional(),
  id: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  rating: z.number().optional(),
  vendorId: z.string().optional(),
  reports: z.number().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  mode: "create" | "edit" | "view";
  product?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  mode,
  product,
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuthStore();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loaderOpen, setLoaderOpen] = useState(false);
  const [steps, setSteps] = useState<
    { label: string; status: "pending" | "active" | "done" }[]
  >([
    { label: "Traitement de l’image par l’IA...", status: "pending" },
    { label: "Enregistrement de l’image...", status: "pending" },
    { label: "Finalisation de l’enregistrement...", status: "pending" },
    { label: "Terminé ✅", status: "pending" },
  ]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      title: "", // Added title default value
      sku: "",
      description: "",
      price: 0,
      originalPrice: 0, // Ajout de la valeur par défaut pour originalPrice
      stock: 0,
      categoryId: "",
      brandId: "",
      condition: "neuf",
      image: null,
    },
  });

  useEffect(() => {
    if (product && (mode === "edit" || mode === "view")) {
      form.reset({
        name: product.name,
        title: product.title, // Added title
        sku: product.sku,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice || 0, // originalPrice est maintenant géré
        stock: product.stock,
        categoryId: product.categoryId,
        brandId: product.brandId,
        condition: product.condition,
        image: product.images?.[0]?.url || null,
        // S'assurer que les autres champs sont inclus pour la réinitialisation si le produit existe
        images: product.images,
        tags: product.tags,
        reviews: product.reviews,
        attributes: product.attributes,
        status: product.status,
        specifications: product.specifications,
        id: product.id,
        rating: product.rating,
        vendorId: product.vendorId,
        reports: product.reports,
      });
    }
  }, [product, mode, form]);

  const onSubmit = async (data: ProductFormData) => {
    if (mode === "view") return;

    if (!user) {
      toast.error("Vous devez être connecté pour effectuer cette action.");
      return;
    }

    setIsSubmitting(true);

    try {
      setLoaderOpen(true);
      setSteps((prev) =>
        prev.map((s, i) => ({ ...s, status: i === 0 ? "active" : "pending" }))
      );

      let imageUrls: string[] = [];
      const files = (data.imagesFiles || []) as File[];
      if (files.length > 0) {
        // Upload optimisé en arrière-plan
        setSteps((prev) =>
          prev.map((s, i) => ({ ...s, status: i === 1 ? "active" : i === 0 ? "done" : s.status }))
        );
        
        try {
          const uploaded = await apiService.images.uploadMultiple(files);
          imageUrls = uploaded.map((u) => u.url);
        } catch (uploadError) {
          console.error("Erreur upload images:", uploadError);
          // Continuer avec des images par défaut si l'upload échoue
          imageUrls = ["/placeholder.svg"];
          toast.warning("Erreur d'upload d'images, produit créé avec image par défaut");
        }
        
        setSteps((prev) =>
          prev.map((s, i) => ({ ...s, status: i <= 1 ? "done" : s.status }))
        );
      } else {
        const existing = product?.images?.map((img) => img.url) || [];
        imageUrls = existing;
        setSteps((prev) =>
          prev.map((s, i) => ({ ...s, status: i === 0 ? "done" : s.status }))
        );
      }

      const productData = {
        name: data.name,
        title: data.title,
        sku: data.sku,
        description: data.description,
        price: Number(data.price),
        stock: Number(data.stock),
        categoryId: data.categoryId,
        brandId: data.brandId,
        rating: data.rating || 0,
        images: imageUrls.map((url) => ({
          url: String(url),
          altText: data.name,
        })),
        tags: data.tags || [],
        condition: data.condition || "neuf",
        attributes: data.attributes || {},
        status: data.status || "disponible",
        specifications: data.specifications || [],
        originalPrice:
          data.originalPrice === null ? 0 : Number(data.originalPrice || 0),
        vendorId: user.id,
      };

      setSteps((prev) =>
        prev.map((s, i) => ({
          ...s,
          status: i === 2 ? "active" : i <= 1 ? "done" : s.status,
        }))
      );

      try {
        if (mode === "create") {
          await createProductMutation.mutateAsync(
            productData as Omit<Product, "id" | "createdAt" | "updatedAt">
          );
        } else if (mode === "edit" && product) {
          await updateProductMutation.mutateAsync({
            id: product.id,
            data: productData as Partial<Product>,
          });
        }

        setSteps((prev) =>
          prev.map((s, i) => ({ ...s, status: i <= 3 ? "done" : s.status }))
        );

        setTimeout(() => {
          setLoaderOpen(false);
          onSuccess();
        }, 600);
      } catch (productError) {
        // Ne pas supprimer les images en cas d'erreur produit
        // L'utilisateur peut réessayer sans re-upload
        throw productError;
      }
    } catch (error) {
      setSteps((prev) =>
        prev.map((s, i) => ({ ...s, status: i < 3 ? s.status : "pending" }))
      );
      toast.error(
        `Erreur lors de ${
          mode === "create" ? "la création" : "la mise à jour"
        } du produit`
      );
    } finally {
      setIsSubmitting(false);
      // Garder le loader ouvert pour montrer le succès
    }
  };

  if (mode === "view" && product) {
    return (
      <div className="space-y-4">
        <ProductDetailsView product={product} />
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onCancel} variant="outline">
            Fermer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du produit *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: iPhone 14 Pro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titre du produit *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Smartphone Apple" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: SKU-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prix (FCFA) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Removed originalPrice FormField */}

          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="condition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>État *</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner l'état" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neuf">Neuf</SelectItem>
                      <SelectItem value="occasion">Occasion</SelectItem>
                      <SelectItem value="reconditionne">
                        Reconditionné
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catégorie *</FormLabel>
                <FormControl>
                  <CategorySelect
                    onValueChange={field.onChange}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brandId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marque *</FormLabel>
                <FormControl>
                  <BrandSelect
                    onValueChange={field.onChange}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Description détaillée du produit..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imagesFiles"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Images du produit (max 3)</FormLabel>
              <FormControl>
                <MultiImageUpload
                  value={(field.value as File[]) || []}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  max={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "En cours..."
              : mode === "create"
              ? "Créer le produit"
              : "Mettre à jour"}
          </Button>
        </div>
      </form>
      <StepLoader
        open={loaderOpen}
        steps={steps}
        onOpenChange={setLoaderOpen}
      />
    </Form>
  );
};

export default ProductForm;
