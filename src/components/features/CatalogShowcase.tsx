/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { meilisearchService } from "@/services/meilisearchService";
import FallbackImage from "@/components/shared/FallbackImage";
import config from "@/config";
import {
  ensureCategoriesIndex,
  initializeCategoriesIndex,
} from "@/lib/meilisearch";
import type { Category } from "@/types";

interface FormattedCategory {
  id: string;
  title: string;
  slug: string;
  description?: string;
  image: string;
  subcategories: Array<{
    id: string;
    name: string;
    slug: string;
    image: string;
  }>;
}
const CatalogShowcase = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<FormattedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        await ensureCategoriesIndex();
        
        // Utiliser le service Meilisearch optimisé
        try {
          const result = await meilisearchService.searchCategories("", 0, 50);
          const docs = result.hits;
          
          if (!docs.length) {
            throw new Error("Aucune catégorie trouvée");
          }

          // Regrouper: catégories principales + sous-catégories
          const mains = docs.filter((c: Category) => !c.parentId);
          const mapByParent: Record<string, Category[]> = {};
          docs.forEach((c: Category) => {
            if (c.parentId) {
              mapByParent[c.parentId] = mapByParent[c.parentId] || [];
              mapByParent[c.parentId].push(c);
            }
          });

          const formatted: FormattedCategory[] = mains.map((main: Category) => ({
            id: String(main.id),
            title: main.name,
            slug: main.slug,
            description: main.description,
            image: main.imageUrl || "/placeholder.svg",
            subcategories: (mapByParent[main.id] || [])
              .map((sub: Category) => ({
                id: String(sub.id),
                name: sub.name,
                slug: sub.slug,
                image: sub.imageUrl || "/placeholder.svg",
              })),
          }));

          setCategories(
            formatted.sort((a, b) => a.title.localeCompare(b.title)).slice(0, 12)
          );
        } catch (err) {
          console.warn("Erreur Meilisearch, fallback vers API:", err);
          // Fallback vers l'API directe
          const { categoryService } = await import("@/services/categoryService");
          const formatted = await categoryService.getFormattedCategories();
          setCategories(formatted);
        }
      } catch (err) {
        setError(
          "Impossible de charger les catégories. Veuillez réessayer plus tard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  if (loading) {
    return (
      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-[1500px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j}>
                      <div className="aspect-square bg-gray-300 rounded-lg mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center text-red-600">
          {error}
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 px-4 bg-gray-50">
      <div className="max-w-[1500px] mx-auto">
        <div
          className={`grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4`}
        >
          {categories.map((category) => {
            return (
              <Card
                key={category.id}
                className="bg-white border border-gray-200 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 rounded-lg"
              >
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-gray-900">
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.subcategories &&
                  category.subcategories.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {category.subcategories.map((subcat) => (
                        <div
                          key={subcat.id}
                          className="group cursor-pointer"
                          onClick={() =>
                            navigate(`/catalog/${category.id}/${subcat.slug}`)
                          }
                        >
                          <div className="aspect-square overflow-hidden rounded-lg mb-2 border border-gray-100">
                            <FallbackImage // Remplacement de <img> par <FallbackImage>
                              src={subcat.image}
                              alt={subcat.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                          <p className="text-sm text-gray-700 group-hover:text-orange-600 transition-colors font-medium">
                            {subcat.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Aucune sous-catégorie à afficher.
                    </p>
                  )}
                  <Button
                    variant="link"
                    className="text-orange-600 hover:text-orange-700 p-0 h-auto text-sm"
                    onClick={() => navigate(`/catalog/${category.slug}`)}
                  >
                    Voir tous les produits
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CatalogShowcase;
