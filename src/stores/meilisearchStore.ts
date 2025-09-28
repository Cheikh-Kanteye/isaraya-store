import { create } from "zustand";
import {
  ensureProductsIndex,
  ensureCategoriesIndex,
  initializeMeilisearchIndex,
  initializeCategoriesIndex,
} from "@/lib/meilisearch";
import { syncService } from "@/services/meilisearchSync";
import config from "@/config";

interface MeilisearchState {
  isIndexReady: boolean;
  error: string | null;
  isResyncing: boolean;
  initialize: () => Promise<void>;
  resyncProducts: () => Promise<void>;
  resyncCategories: () => Promise<void>;
  fullResync: () => Promise<void>;
}

let initializationStarted = false;

export const useMeilisearchStore = create<MeilisearchState>((set, get) => ({
  isIndexReady: false,
  error: null,
  isResyncing: false,
  initialize: async () => {
    if (get().isIndexReady || initializationStarted) return;
    initializationStarted = true;
    try {
      console.log("Starting Meilisearch index initialization...");
      await ensureProductsIndex();
      await ensureCategoriesIndex();

      // Vérifier les paramètres de l'index produits
      const settingsResponse = await fetch(
        `${config.meilisearch.host}/indexes/products/settings`,
        {
          headers: { Authorization: `Bearer ${config.meilisearch.apiKey}` },
        }
      );

      if (!settingsResponse.ok) {
        console.warn("Products index settings not found, reinitializing...");
        await initializeMeilisearchIndex();
      } else {
        const settings = await settingsResponse.json();
        if (
          !settings.filterableAttributes?.includes("brandId") ||
          !settings.filterableAttributes?.includes("categoryId") ||
          !settings.filterableAttributes?.includes("condition") ||
          !settings.filterableAttributes?.includes("price")
        ) {
          console.warn("Products filterable attributes missing, reinitializing...");
          await initializeMeilisearchIndex();
        }
      }

      // Vérifier la présence de l'index catégories
      const catRes = await fetch(`${config.meilisearch.host}/indexes/categories`, {
        headers: { Authorization: `Bearer ${config.meilisearch.apiKey}` },
      });
      if (catRes.status === 404) {
        await initializeCategoriesIndex();
      }

      set({ isIndexReady: true, error: null });
      console.log("Meilisearch index is ready.");
    } catch (error) {
      console.error("Meilisearch initialization failed:", error);
      set({
        error:
          "Erreur lors de l'initialisation de la recherche. Veuillez réessayer.",
      });
      initializationStarted = false;
    }
  },

  resyncProducts: async () => {
    if (get().isResyncing) return;
    
    set({ isResyncing: true, error: null });
    try {
      console.log("Starting products resynchronization...");
      await syncService.fullResyncProducts();
      console.log("Products resynchronization completed.");
    } catch (error) {
      console.error("Products resynchronization failed:", error);
      set({
        error: "Erreur lors de la resynchronisation des produits. Veuillez réessayer."
      });
      throw error;
    } finally {
      set({ isResyncing: false });
    }
  },

  resyncCategories: async () => {
    if (get().isResyncing) return;
    
    set({ isResyncing: true, error: null });
    try {
      console.log("Starting categories resynchronization...");
      await syncService.fullResyncCategories();
      console.log("Categories resynchronization completed.");
    } catch (error) {
      console.error("Categories resynchronization failed:", error);
      set({
        error: "Erreur lors de la resynchronisation des catégories. Veuillez réessayer."
      });
      throw error;
    } finally {
      set({ isResyncing: false });
    }
  },

  fullResync: async () => {
    if (get().isResyncing) return;
    
    set({ isResyncing: true, error: null });
    try {
      console.log("Starting full Meilisearch resynchronization...");
      await syncService.fullResync();
      console.log("Full resynchronization completed.");
    } catch (error) {
      console.error("Full resynchronization failed:", error);
      set({
        error: "Erreur lors de la resynchronisation complète. Veuillez réessayer."
      });
      throw error;
    } finally {
      set({ isResyncing: false });
    }
  },
}));
