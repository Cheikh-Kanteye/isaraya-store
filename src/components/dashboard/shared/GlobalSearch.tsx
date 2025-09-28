import { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { meilisearchService } from "@/services/meilisearchService";
import { useNavigate } from "react-router-dom";
import { File, ShoppingCart, User } from "lucide-react";
import { useSearchStore } from "@/stores/useSearchStore";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useState } from "react";
import type { Product, Category } from "@/types";

export function GlobalSearch() {
  const { isOpen, onClose, onToggle } = useSearchStore();
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState<{
    products: Product[];
    categories: Category[];
  }>({ products: [], categories: [] });
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ products: [], categories: [] });
      return;
    }

    setIsSearching(true);
    try {
      const [productsResult, categoriesResult] = await Promise.all([
        meilisearchService.searchProducts(query, {}, 0, 5),
        meilisearchService.searchCategories(query, 0, 5),
      ]);

      setSearchResults({
        products: productsResult.hits,
        categories: categoriesResult.hits,
      });
    } catch (error) {
      console.error("Erreur de recherche:", error);
      setSearchResults({ products: [], categories: [] });
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onToggle();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onToggle]);

  const runCommand = (command: () => unknown) => {
    onClose();
    command();
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <DialogTitle className="sr-only">Recherche Globale</DialogTitle>
      {/* Ajout de la classe 'dark' et d'un titre pour l'accessibilité */}
      <div className="bg-background">
        <CommandInput
          className="text-muted-foreground"
          autoFocus
          placeholder="Rechercher des produits, catégories..."
          onValueChange={handleSearch}
        />
        <CommandList>
          {isSearching ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>

              {searchResults.products.length > 0 && (
                <CommandGroup heading="Produits">
                  {searchResults.products.map((product) => (
                    <CommandItem
                      key={product.id}
                      onSelect={() =>
                        runCommand(() => navigate(`/product/${product.id}`))
                      }
                    >
                      <File className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{product.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {product.price} FCFA
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
        </CommandList>
      </div>
    </CommandDialog>
  );
}

              {searchResults.categories.length > 0 && (
                <CommandGroup heading="Catégories">
                  {searchResults.categories.map((category) => (
                    <CommandItem
                      key={category.id}
                      onSelect={() =>
                        runCommand(() => navigate(`/catalog/${category.slug}`))
                      }
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      <span>{category.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}