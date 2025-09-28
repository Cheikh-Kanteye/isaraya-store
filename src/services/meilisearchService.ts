import config from "@/config";
import { searchClient } from "@/lib/meilisearch";
import type { Product, Category } from "@/types";

interface SearchFilters {
  categoryId?: string;
  brandId?: string;
  priceRange?: [number, number];
  condition?: string;
  rating?: number;
}

interface SearchResult<T> {
  hits: T[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  processingTimeMS: number;
}

class MeilisearchService {
  private isAvailable = false;

  constructor() {
    this.checkAvailability();
  }

  private async checkAvailability() {
    try {
      const response = await fetch(`${config.meilisearch.host}/health`);
      this.isAvailable = response.ok;
    } catch {
      this.isAvailable = false;
    }
  }

  async searchProducts(
    query: string = "",
    filters: SearchFilters = {},
    page: number = 0,
    hitsPerPage: number = 20
  ): Promise<SearchResult<Product>> {
    if (!this.isAvailable) {
      throw new Error("Meilisearch non disponible");
    }

    try {
      const searchParams: any = {
        q: query,
        offset: page * hitsPerPage,
        limit: hitsPerPage,
        filter: [],
      };

      // Construire les filtres
      if (filters.categoryId) {
        searchParams.filter.push(`categoryId = "${filters.categoryId}"`);
      }
      if (filters.brandId) {
        searchParams.filter.push(`brandId = "${filters.brandId}"`);
      }
      if (filters.condition) {
        searchParams.filter.push(`condition = "${filters.condition}"`);
      }
      if (filters.priceRange) {
        searchParams.filter.push(
          `price >= ${filters.priceRange[0]} AND price <= ${filters.priceRange[1]}`
        );
      }
      if (filters.rating) {
        searchParams.filter.push(`rating >= ${filters.rating}`);
      }

      const response = await fetch(`${config.meilisearch.host}/indexes/products/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.meilisearch.apiKey}`,
        },
        body: JSON.stringify(searchParams),
      });

      if (!response.ok) {
        throw new Error("Erreur de recherche");
      }

      const result = await response.json();
      
      return {
        hits: result.hits || [],
        nbHits: result.estimatedTotalHits || 0,
        page,
        nbPages: Math.ceil((result.estimatedTotalHits || 0) / hitsPerPage),
        hitsPerPage,
        processingTimeMS: result.processingTimeMS || 0,
      };
    } catch (error) {
      console.error("Erreur de recherche Meilisearch:", error);
      throw error;
    }
  }

  async searchCategories(
    query: string = "",
    page: number = 0,
    hitsPerPage: number = 20
  ): Promise<SearchResult<Category>> {
    if (!this.isAvailable) {
      throw new Error("Meilisearch non disponible");
    }

    try {
      const searchParams = {
        q: query,
        offset: page * hitsPerPage,
        limit: hitsPerPage,
      };

      const response = await fetch(`${config.meilisearch.host}/indexes/categories/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.meilisearch.apiKey}`,
        },
        body: JSON.stringify(searchParams),
      });

      if (!response.ok) {
        throw new Error("Erreur de recherche");
      }

      const result = await response.json();
      
      return {
        hits: result.hits || [],
        nbHits: result.estimatedTotalHits || 0,
        page,
        nbPages: Math.ceil((result.estimatedTotalHits || 0) / hitsPerPage),
        hitsPerPage,
        processingTimeMS: result.processingTimeMS || 0,
      };
    } catch (error) {
      console.error("Erreur de recherche catégories:", error);
      throw error;
    }
  }

  async getAutocompleteSuggestions(query: string): Promise<string[]> {
    if (!this.isAvailable || !query.trim()) {
      return [];
    }

    try {
      const response = await fetch(`${config.meilisearch.host}/indexes/products/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.meilisearch.apiKey}`,
        },
        body: JSON.stringify({
          q: query,
          limit: 5,
          attributesToRetrieve: ["name"],
        }),
      });

      if (!response.ok) return [];

      const result = await response.json();
      return result.hits?.map((hit: any) => hit.name) || [];
    } catch {
      return [];
    }
  }
}

export const meilisearchService = new MeilisearchService();