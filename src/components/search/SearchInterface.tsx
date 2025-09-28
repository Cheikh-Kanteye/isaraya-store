import { useEffect, useState } from "react";
import { useMeilisearchStore } from "@/stores/meilisearchStore";
import { Button } from "@/components/ui/button";
import { AutocompleteSearch } from "./AutocompleteSearch";
import {
  InstantSearch,
  Hits,
  Pagination,
  RefinementList,
  ClearRefinements,
  SearchBox,
  Configure,
  RangeInput,
  Stats,
  SortBy,
} from "react-instantsearch";
import { initializeMeilisearchIndex, searchClient } from "@/lib/meilisearch";
import "instantsearch.css/themes/satellite.css";
import { Product, Category, Brand } from "@/types";
import ProductCard from "../shared/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Filter,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
  ChevronDown,
} from "lucide-react";
import type { RefinementListItem } from "instantsearch.js/es/connectors/refinement-list/connectRefinementList";

const Hit = ({ hit }: { hit: Product }) => {
  return <ProductCard key={hit.id} product={hit} />;
};

export function SearchInterface() {
  const { isIndexReady, initialize, error } = useMeilisearchStore();

  useEffect(() => {
    if (!isIndexReady && !error) {
      initialize();
    }
  }, [initialize, isIndexReady, error]);

  // Utiliser Meilisearch pour les catégories et marques aussi
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["meilisearch-categories"],
    queryFn: async () => {
      try {
        const result = await fetch(`${config.meilisearch.host}/indexes/categories/documents?limit=1000`, {
          headers: { Authorization: `Bearer ${config.meilisearch.apiKey}` },
        });
        if (result.ok) {
          const data = await result.json();
          return Array.isArray(data) ? data : data.results || [];
        }
      } catch (error) {
        console.warn("Fallback to API for categories");
      }
      return apiService.categories.getAll();
    },
    enabled: isIndexReady,
  });

  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ["meilisearch-brands"],
    queryFn: async () => {
      try {
        const result = await fetch(`${config.meilisearch.host}/indexes/brands/documents?limit=1000`, {
          headers: { Authorization: `Bearer ${config.meilisearch.apiKey}` },
        });
        if (result.ok) {
          const data = await result.json();
          return Array.isArray(data) ? data : data.results || [];
        }
      } catch (error) {
        console.warn("Fallback to API for brands");
      }
      return apiService.brands.getAll();
    },
    enabled: isIndexReady,
  });

  const transformCategoryItems = (items: RefinementListItem[]) => {
    if (!items || items.length === 0) return [];
    return items.map((item) => {
      const category = categories.find(
        (c) => c.id === item.label || c.id.toString() === item.label
      );
      return {
        ...item,
        label: category?.name || item.label,
      };
    });
  };

  const transformBrandItems = (items: RefinementListItem[]) => {
    if (!items || items.length === 0) return [];
    return items.map((item) => {
      const brand = brands.find(
        (b) => b.id === item.label || b.id.toString() === item.label
      );
      return {
        ...item,
        label: brand?.name || item.label,
      };
    });
  };

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-96 bg-white">
        <p className="text-xl font-bold text-red-600">{error}</p>
        <Button
          onClick={() => {
            initialize();
          }}
          className="mt-4 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-bold"
        >
          Réessayer
        </Button>
      </div>
    );
  }

  if (!isIndexReady) {
    return (
      <div className="flex flex-col justify-center items-center h-96 bg-white">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <Sparkles className="absolute inset-0 w-6 h-6 m-auto text-primary animate-pulse" />
        </div>
        <p className="text-xl font-bold text-gray-800 mt-6 animate-pulse">
          ✨ Préparation de votre shopping...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <InstantSearch searchClient={searchClient as never} indexName="products">
        <Configure hitsPerPage={15} />
        {/* Reste du code JSX inchangé */}
        <div className="relative overflow-hidden">
          <div className="relative container mx-auto px-4 py-12 lg:py-16">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex justify-center mb-4">
                <Badge className="bg-primary/20 text-primary border-white/30 px-4 py-2 text-sm font-semibold">
                  <Star className="w-4 h-4 mr-1 fill-current" />
                  Plus de 10,000 produits
                </Badge>
              </div>
              <h1 className="text-4xl lg:text-6xl font-black text-black mb-4 leading-tight">
                Trouvez tout ce que
                <span className="block bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
                  vous cherchez !
                </span>
              </h1>
              <p className="text-xl text-white/90 mb-8 font-medium">
                Des prix imbattables, une qualité exceptionnelle ✨
              </p>
              <div className="relative group max-w-2xl mx-auto">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative rounded-2xl">
                  <AutocompleteSearch
                    placeholder="Recherchez parmi des milliers de produits..."
                    className="w-full"
                  />
                  <kbd className="px-3 h-full absolute top-1/3 right-2 text-xs font-semibold text-white bg-primary border border-gray-200 rounded-lg grid place-items-center">
                    Enter
                  </kbd>
                </div>
              </div>
              <div className="flex justify-center items-center gap-6 mt-8 text-white/80">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-300" />
                  <span className="font-medium">Livraison express</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-300 fill-current" />
                  <span className="font-medium">Produits premium</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-300" />
                  <span className="font-medium">Meilleurs prix</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="hidden lg:block lg:w-80 flex-shrink-0">
              <div className="space-y-6">
                <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-br from-white to-primary/5">
                  <div className="bg-gradient-to-r from-primary to-orange-600 p-6 text-white">
                    <h2 className="text-xl font-bold flex items-center">
                      <Filter className="w-6 h-6 mr-3" />
                      Affinez votre recherche
                    </h2>
                    <p className="text-white/80 text-sm mt-1">
                      Trouvez exactement ce qu'il vous faut
                    </p>
                  </div>
                  <CardContent className="p-6 space-y-8">
                    <FilterSection title="🏪 Catégories" color="bg-blue-500">
                      <RefinementList
                        attribute="categoryName"
                        transformItems={transformCategoryItems}
                        classNames={{
                          list: "space-y-2",
                          item: "group",
                          label:
                            "flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-gradient-to-r hover:from-primary/10 hover:to-purple-50 transition-all duration-200 border border-transparent hover:border-primary/20",
                          labelText:
                            "text-sm font-semibold text-gray-700 group-hover:text-primary",
                          checkbox: "sr-only",
                          count:
                            "text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-primary to-purple-500 text-white min-w-[28px] text-center shadow-sm",
                        }}
                      />
                    </FilterSection>
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                    <FilterSection title="🏷️ Marques" color="bg-purple-500">
                      <RefinementList
                        attribute="brandId"
                        transformItems={transformBrandItems}
                        classNames={{
                          list: "space-y-2",
                          item: "group",
                          label:
                            "flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-200 border border-transparent hover:border-purple-200",
                          labelText:
                            "text-sm font-semibold text-gray-700 group-hover:text-purple-600",
                          checkbox: "sr-only",
                          count:
                            "text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white min-w-[28px] text-center shadow-sm",
                        }}
                      />
                    </FilterSection>
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                    <FilterSection title="⭐ État" color="bg-green-500">
                      <RefinementList
                        attribute="condition"
                        classNames={{
                          list: "space-y-2",
                          item: "group",
                          label:
                            "flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 border border-transparent hover:border-green-200",
                          labelText:
                            "text-sm font-semibold text-gray-700 group-hover:text-green-600",
                          checkbox: "sr-only",
                          count:
                            "text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white min-w-[28px] text-center shadow-sm",
                        }}
                      />
                    </FilterSection>
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                    <FilterSection
                      title="💰 Fourchette de prix"
                      color="bg-orange-500"
                    >
                      <div className="pt-2">
                        <RangeInput
                          attribute="price"
                          classNames={{
                            root: "space-y-4",
                            form: "flex items-center gap-3",
                            input:
                              "flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none bg-white",
                            separator: "text-gray-500 font-bold text-lg",
                            submit:
                              "px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl text-sm font-bold hover:from-primary/90 hover:to-purple-600/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
                          }}
                        />
                      </div>
                    </FilterSection>
                    <div className="pt-4">
                      <ClearRefinements
                        classNames={{
                          button:
                            "w-full px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2",
                          disabledButton:
                            "opacity-50 cursor-not-allowed transform-none",
                        }}
                        translations={{
                          resetButtonText: "🗑️ Tout effacer",
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </aside>
            <main className="flex-1 min-w-0">
              <div className="lg:hidden mb-6">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                      <Filter className="mr-3 h-6 w-6" />
                      🎯 Filtres & Options
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[340px] bg-white p-0">
                    <SheetHeader className="p-6 bg-gradient-to-r from-primary to-purple-600 text-white">
                      <SheetTitle className="text-xl font-bold text-white">
                        🎯 Vos Filtres
                      </SheetTitle>
                    </SheetHeader>
                    <div className="p-6 space-y-6 overflow-y-auto h-full">
                      <FilterSection title="🏪 Catégories" color="bg-blue-500">
                        <RefinementList
                          attribute="categoryId"
                          transformItems={transformCategoryItems}
                          classNames={{
                            list: "space-y-2",
                            item: "group",
                            label:
                              "flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-primary/10 transition-colors",
                            labelText:
                              "text-sm font-semibold text-gray-700 group-hover:text-primary",
                            checkbox: "sr-only",
                            count:
                              "text-xs font-bold px-2.5 py-1 rounded-full bg-primary text-white min-w-[28px] text-center",
                          }}
                        />
                      </FilterSection>
                      <FilterSection title="🏷️ Marques" color="bg-purple-500">
                        <RefinementList
                          attribute="brandId"
                          transformItems={transformBrandItems}
                          classNames={{
                            list: "space-y-2",
                            item: "group",
                            label:
                              "flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-purple-50 transition-colors",
                            labelText:
                              "text-sm font-semibold text-gray-700 group-hover:text-purple-600",
                            checkbox: "sr-only",
                            count:
                              "text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500 text-white min-w-[28px] text-center",
                          }}
                        />
                      </FilterSection>
                      <FilterSection title="⭐ État" color="bg-green-500">
                        <RefinementList
                          attribute="condition"
                          classNames={{
                            list: "space-y-2",
                            item: "group",
                            label:
                              "flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-green-50 transition-colors",
                            labelText:
                              "text-sm font-semibold text-gray-700 group-hover:text-green-600",
                            checkbox: "sr-only",
                            count:
                              "text-xs font-bold px-2.5 py-1 rounded-full bg-green-500 text-white min-w-[28px] text-center",
                          }}
                        />
                      </FilterSection>
                      <FilterSection title="💰 Prix" color="bg-orange-500">
                        <RangeInput attribute="price" />
                      </FilterSection>
                      <ClearRefinements
                        classNames={{
                          button:
                            "w-full px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all",
                          disabledButton: "opacity-50 cursor-not-allowed",
                        }}
                        translations={{
                          resetButtonText: "🗑️ Tout effacer",
                        }}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-r from-white to-primary/5 mb-6">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-primary" />
                        <Stats
                          classNames={{
                            root: "text-xl font-bold text-gray-900",
                          }}
                          translations={{
                            rootElementText: ({ nbHits, processingTimeMS }) =>
                              `${nbHits.toLocaleString()} produits trouvés ⚡ ${processingTimeMS}ms`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 font-bold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Trier par :
                      </span>
                      <div className="relative">
                        <SortBy
                          items={[
                            { label: "🎯 Pertinence", value: "products" },
                            { label: "💰 Prix ↗", value: "products:price:asc" },
                            {
                              label: "💎 Prix ↘",
                              value: "products:price:desc",
                            },
                            { label: "📝 Nom A-Z", value: "products:name:asc" },
                            {
                              label: "📝 Nom Z-A",
                              value: "products:name:desc",
                            },
                          ]}
                          classNames={{
                            select:
                              "appearance-none bg-gradient-to-r from-primary to-purple-600 text-white font-bold border-0 rounded-xl px-6 py-3 pr-12 text-sm focus:ring-4 focus:ring-primary/30 focus:outline-none cursor-pointer shadow-lg hover:shadow-xl",
                          }}
                        />
                        <ChevronDown className="w-5 h-5 text-white absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-2 border-primary/20 shadow-2xl bg-gradient-to-br from-white to-blue-50/30 mb-8">
                <CardContent className="p-6">
                  <Hits
                    hitComponent={Hit}
                    classNames={{
                      list: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
                      item: "transform hover:scale-105 transition-all duration-300 hover:z-10 relative",
                    }}
                  />
                </CardContent>
              </Card>
              <Card className="border-2 border-primary/20 w-full shadow-xl bg-gradient-to-r from-white to-primary/5">
                <CardContent className="w-full h-full flex items-center justify-center">
                  <Pagination
                    classNames={{
                      root: "flex justify-center items-center flex-1",
                      list: "flex items-center",
                      item: "w-[48px] h-10 aspect-square grid place-items-center p-0 mx-2",
                      disabledItem:
                        "opacity-40 cursor-not-allowed hover:transform-none",
                    }}
                  />
                </CardContent>
              </Card>
            </main>
          </div>
        </div>
      </InstantSearch>
    </div>
  );
}

interface FilterSectionProps {
  title: string;
  color: string;
  children: React.ReactNode;
}

function FilterSection({ title, color, children }: FilterSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-gray-900 flex items-center gap-3">
        {title}
      </h3>
      {children}
    </div>
  );
}
