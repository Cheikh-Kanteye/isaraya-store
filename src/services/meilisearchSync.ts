import config from "@/config";
import { apiService } from "@/services/api";
import type { Product, Category, Brand } from "@/types";

export interface MeilisearchDocument {
  id: string;
  name: string;
  title?: string;
  sku?: string;
  description: string;
  price: number;
  stock: number;
  rating: number;
  categoryId: string;
  brandId: string;
  createdAt: string | number;
  updatedAt: string | number;
  originalPrice?: number;
  vendorId?: string;
  reports?: number;
  tags?: string[];
  condition?: string;
  attributes?: Record<string, string>;
  status?: string;
  specifications?: { name: string; value: string }[];
  imageUrls: string[];
  categoryName?: string;
  brandName?: string;
}

class MeilisearchSyncService {
  private baseUrl: string;
  private apiKey: string;
  private isEnabled: boolean;

  constructor() {
    this.baseUrl = config.meilisearch.host;
    this.apiKey = config.meilisearch.apiKey;
    this.isEnabled = !!(this.baseUrl && this.apiKey);
  }

  /**
   * Vérifie si Meilisearch est configuré et disponible
   */
  private async checkAvailability(): Promise<boolean> {
    if (!this.isEnabled) {
      console.warn("Meilisearch not configured. Skipping sync.");
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.warn("Meilisearch not available:", error);
      return false;
    }
  }

  /**
   * Fait une requête vers Meilisearch
   */
  private async meilisearchRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultOptions: RequestInit = {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    return fetch(url, defaultOptions);
  }

  /**
   * Attend qu'une tâche Meilisearch soit terminée
   */
  private async waitForTask(taskUid: number): Promise<void> {
    let status = "enqueued";
    while (status === "enqueued" || status === "processing") {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Attendre moins longtemps

      const response = await this.meilisearchRequest(`/tasks/${taskUid}`);
      const task = await response.json();
      status = task.status;

      if (status === "failed") {
        console.error("Meilisearch task failed:", task.error);
        throw new Error(
          `Meilisearch task failed: ${JSON.stringify(task.error)}`
        );
      }
    }
  }

  /**
   * Convertit un produit en document Meilisearch
   */
  private async productToDocument(
    product: Product
  ): Promise<MeilisearchDocument> {
    // Récupérer les données de catégorie et marque pour enrichir le document
    let categoryName: string | undefined;
    let brandName: string | undefined;

    try {
      if (product.categoryId) {
        const categories = await apiService.categories.getAll();
        const category = categories.find((c) => c.id === product.categoryId);
        categoryName = category?.name;
      }

      if (product.brandId) {
        const brands = await apiService.brands.getAll();
        const brand = brands.find((b) => b.id === product.brandId);
        brandName = brand?.name;
      }
    } catch (error) {
      console.warn(
        "Error fetching category/brand data for Meilisearch document:",
        error
      );
    }

    return {
      id: product.id,
      name: product.name,
      title: product.title,
      sku: product.sku,
      description: product.description,
      price: product.price,
      stock: product.stock,
      rating: product.rating,
      categoryId: product.categoryId,
      brandId: product.brandId,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      originalPrice: product.originalPrice,
      vendorId: product.vendorId,
      reports: product.reports,
      tags: product.tags,
      condition: product.condition,
      attributes: product.attributes,
      status: product.status,
      specifications: product.specifications,
      imageUrls: product.images?.map((img) => img.url) || [],
      categoryName,
      brandName,
    };
  }

  /**
   * Synchronise un produit créé
   */
  async syncProductCreate(product: Product): Promise<void> {
    if (!(await this.checkAvailability())) return;

    try {
      const document = await this.productToDocument(product);
      const response = await this.meilisearchRequest(
        "/indexes/products/documents",
        {
          method: "POST",
          body: JSON.stringify([document]),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to sync product create: ${response.statusText}`
        );
      }

      const task = await response.json();
      if (task.taskUid) {
        // Ne pas attendre la tâche pour ne pas bloquer l'interface utilisateur
        this.waitForTask(task.taskUid).catch((error) => {
          console.error("Error waiting for Meilisearch task:", error);
        });
      }

      console.log(
        `Product ${product.id} synchronized with Meilisearch (create)`
      );
    } catch (error) {
      console.error("Error syncing product create to Meilisearch:", error);
      // Ne pas faire échouer l'opération principale
    }
  }

  /**
   * Synchronise un produit mis à jour
   */
  async syncProductUpdate(product: Product): Promise<void> {
    if (!(await this.checkAvailability())) return;

    try {
      const document = await this.productToDocument(product);
      const response = await this.meilisearchRequest(
        "/indexes/products/documents",
        {
          method: "PUT",
          body: JSON.stringify([document]),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to sync product update: ${response.statusText}`
        );
      }

      const task = await response.json();
      if (task.taskUid) {
        this.waitForTask(task.taskUid).catch((error) => {
          console.error("Error waiting for Meilisearch task:", error);
        });
      }

      console.log(
        `Product ${product.id} synchronized with Meilisearch (update)`
      );
    } catch (error) {
      console.error("Error syncing product update to Meilisearch:", error);
    }
  }

  /**
   * Synchronise la suppression d'un produit
   */
  async syncProductDelete(productId: string): Promise<void> {
    if (!(await this.checkAvailability())) return;

    try {
      const response = await this.meilisearchRequest(
        `/indexes/products/documents/${productId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to sync product delete: ${response.statusText}`
        );
      }

      const task = await response.json();
      if (task.taskUid) {
        this.waitForTask(task.taskUid).catch((error) => {
          console.error("Error waiting for Meilisearch task:", error);
        });
      }

      console.log(`Product ${productId} removed from Meilisearch`);
    } catch (error) {
      console.error("Error syncing product delete to Meilisearch:", error);
    }
  }

  /**
   * Synchronise une catégorie créée ou mise à jour
   */
  async syncCategory(category: Category): Promise<void> {
    if (!(await this.checkAvailability())) return;

    try {
      const document = {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        imageUrl: category.imageUrl || "",
        parentId: category.parentId || null,
      };

      const response = await this.meilisearchRequest(
        "/indexes/categories/documents",
        {
          method: "PUT",
          body: JSON.stringify([document]),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to sync category: ${response.statusText}`);
      }

      const task = await response.json();
      if (task.taskUid) {
        this.waitForTask(task.taskUid).catch((error) => {
          console.error("Error waiting for Meilisearch task:", error);
        });
      }

      console.log(`Category ${category.id} synchronized with Meilisearch`);
    } catch (error) {
      console.error("Error syncing category to Meilisearch:", error);
    }
  }

  /**
   * Synchronise la suppression d'une catégorie
   */
  async syncCategoryDelete(categoryId: string): Promise<void> {
    if (!(await this.checkAvailability())) return;

    try {
      const response = await this.meilisearchRequest(
        `/indexes/categories/documents/${categoryId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to sync category delete: ${response.statusText}`
        );
      }

      const task = await response.json();
      if (task.taskUid) {
        this.waitForTask(task.taskUid).catch((error) => {
          console.error("Error waiting for Meilisearch task:", error);
        });
      }

      console.log(`Category ${categoryId} removed from Meilisearch`);
    } catch (error) {
      console.error("Error syncing category delete to Meilisearch:", error);
    }
  }

  /**
   * Resynchronise tous les produits
   */
  async fullResyncProducts(): Promise<void> {
    if (!(await this.checkAvailability())) return;

    try {
      console.log("Starting full product resync with Meilisearch...");

      const products = await apiService.products.getAll();
      const categories = await apiService.categories.getAll();
      const brands = await apiService.brands.getAll();

      const documents = products.map((product) => ({
        id: product.id,
        name: product.name,
        title: product.title,
        sku: product.sku,
        description: product.description,
        price: product.price,
        stock: product.stock,
        rating: product.rating,
        categoryId: product.categoryId,
        brandId: product.brandId,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        originalPrice: product.originalPrice,
        vendorId: product.vendorId,
        reports: product.reports,
        tags: product.tags,
        condition: product.condition,
        attributes: product.attributes,
        status: product.status,
        specifications: product.specifications,
        imageUrls: product.images?.map((img) => img.url) || [],
        categoryName: categories.find((c) => c.id === product.categoryId)?.name,
        brandName: brands.find((b) => b.id === product.brandId)?.name,
      }));

      // Supprimer tous les documents existants
      const deleteResponse = await this.meilisearchRequest(
        "/indexes/products/documents",
        {
          method: "DELETE",
        }
      );

      if (!deleteResponse.ok) {
        throw new Error(
          `Failed to clear products index: ${deleteResponse.statusText}`
        );
      }

      const deleteTask = await deleteResponse.json();
      if (deleteTask.taskUid) {
        await this.waitForTask(deleteTask.taskUid);
      }

      // Ajouter tous les nouveaux documents
      const addResponse = await this.meilisearchRequest(
        "/indexes/products/documents",
        {
          method: "POST",
          body: JSON.stringify(documents),
        }
      );

      if (!addResponse.ok) {
        throw new Error(
          `Failed to add products to index: ${addResponse.statusText}`
        );
      }

      const addTask = await addResponse.json();
      if (addTask.taskUid) {
        await this.waitForTask(addTask.taskUid);
      }

      console.log(
        `Full resync completed: ${documents.length} products synchronized`
      );
    } catch (error) {
      console.error("Error during full product resync:", error);
      throw error;
    }
  }

  /**
   * Resynchronise toutes les catégories
   */
  async fullResyncCategories(): Promise<void> {
    if (!(await this.checkAvailability())) return;

    try {
      console.log("Starting full category resync with Meilisearch...");

      const categories = await apiService.categories.getAll();
      const documents = categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        imageUrl: category.imageUrl || "",
        parentId: category.parentId || null,
      }));

      // Supprimer tous les documents existants
      const deleteResponse = await this.meilisearchRequest(
        "/indexes/categories/documents",
        {
          method: "DELETE",
        }
      );

      if (!deleteResponse.ok) {
        throw new Error(
          `Failed to clear categories index: ${deleteResponse.statusText}`
        );
      }

      const deleteTask = await deleteResponse.json();
      if (deleteTask.taskUid) {
        await this.waitForTask(deleteTask.taskUid);
      }

      // Ajouter tous les nouveaux documents
      const addResponse = await this.meilisearchRequest(
        "/indexes/categories/documents",
        {
          method: "POST",
          body: JSON.stringify(documents),
        }
      );

      if (!addResponse.ok) {
        throw new Error(
          `Failed to add categories to index: ${addResponse.statusText}`
        );
      }

      const addTask = await addResponse.json();
      if (addTask.taskUid) {
        await this.waitForTask(addTask.taskUid);
      }

      console.log(
        `Full category resync completed: ${documents.length} categories synchronized`
      );
    } catch (error) {
      console.error("Error during full category resync:", error);
      throw error;
    }
  }
}

// Créer une instance singleton du service
export const meilisearchSync = new MeilisearchSyncService();

// Interface publique simplifiée
export const syncService = {
  // Produits
  onProductCreate: (product: Product) =>
    meilisearchSync.syncProductCreate(product),
  onProductUpdate: (product: Product) =>
    meilisearchSync.syncProductUpdate(product),
  onProductDelete: (productId: string) =>
    meilisearchSync.syncProductDelete(productId),

  // Catégories
  onCategoryCreate: (category: Category) =>
    meilisearchSync.syncCategory(category),
  onCategoryUpdate: (category: Category) =>
    meilisearchSync.syncCategory(category),
  onCategoryDelete: (categoryId: string) =>
    meilisearchSync.syncCategoryDelete(categoryId),

  // Resynchronisation complète
  fullResyncProducts: () => meilisearchSync.fullResyncProducts(),
  fullResyncCategories: () => meilisearchSync.fullResyncCategories(),
  fullResync: async () => {
    await meilisearchSync.fullResyncProducts();
    await meilisearchSync.fullResyncCategories();
  },
};
