import axios from "axios";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { syncService } from "@/services/meilisearchSync";
import type {
  Product,
  CreateProduitDto,
  Category,
  Brand,
  Order,
  User,
  ProductsParams,
  MerchantProfile,
  CreateMerchantProfileDto,
  MerchantOrder,
  MerchantStats,
} from "@/types";

import config from "@/config";

const apiClient = axios.create({
  baseURL: config.api.url,
});

// Intercepteur pour ajouter le token JWT à chaque requête
apiClient.interceptors.request.use(
  (config) => {
    let token = null;

    // Récupérer le token depuis le store Zustand persisté dans localStorage
    try {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        const parsedAuth = JSON.parse(authStorage);
        token = parsedAuth?.state?.accessToken;
      }
    } catch (error) {
      console.warn(
        "Erreur lors de la récupération du token depuis auth-storage:",
        error
      );
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur de réponse pour déballer l'enveloppe API Gateway
apiClient.interceptors.response.use(
  (response) => {
    const d = response?.data as unknown;
    if (d && typeof d === "object") {
      const obj = d as Record<string, unknown>;
      if (
        (obj as { status?: string }).status === "success" &&
        "payload" in obj
      ) {
        return { ...response, data: (obj as { payload: unknown }).payload };
      }
      if ("data" in obj) {
        return { ...response, data: (obj as { data: unknown }).data };
      }
      if ("items" in obj) {
        return { ...response, data: (obj as { items: unknown }).items };
      }
      if ("orders" in obj) {
        return { ...response, data: (obj as { orders: unknown }).orders };
      }
    }
    return response;
  },
  (error) => {
    const res = error?.response;
    const status = res?.status ?? 0;
    const d: unknown = res?.data ?? {};
    const dd = d as Record<string, unknown>;
    const message =
      (typeof dd?.message === "string" ? (dd.message as string) : undefined) ||
      (typeof dd?.error === "string" ? (dd.error as string) : undefined) ||
      (error?.message as string) ||
      "Une erreur est survenue";

    try {
      if (status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        try {
          useAuthStore.getState().logout();
        } catch (err) {
          console.error("Erreur lors de la déconnexion de l'utilisateur:", err);
        }
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/auth")
        ) {
          setTimeout(() => {
            window.location.href = "/auth?method=login";
          }, 300);
        }
      } else if (status === 403) {
        toast.error(message || "Accès non autorisé");
      } else if (status >= 500) {
        toast.error("Erreur serveur. Veuillez réessayer.");
      } else if (status !== 0) {
        toast.error(message);
      }
    } catch (err) {
      console.error("Erreur dans l'intercepteur de réponse:", err);
    }

    interface NormalizedError extends Error {
      statusCode?: number;
      details?: unknown;
    }
    const normalized: NormalizedError = new Error(message);
    normalized.statusCode = status;
    normalized.details =
      (dd?.details as unknown) || (dd?.errors as unknown) || null;
    return Promise.reject(normalized);
  }
);

// New function for image upload
async function uploadImage(
  file: File
): Promise<{ url: string; publicId: string }> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await apiClient.post<{ publicId: string; url: string }>(
      "/upload/image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Failed to upload image");
  }
}

export async function deleteImage(publicId: string): Promise<void> {
  try {
    await apiClient.delete(`/upload/image/${publicId}`);
  } catch (error) {
    console.error("Error deleting image:", error);
    throw new Error("Failed to delete image");
  }
}

class ApiResourceService<T, C = Omit<T, "id" | "createdAt" | "updatedAt">> {
  protected endpoint: string; // Changé de private à protected

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  async getAll(params?: ProductsParams): Promise<T[]> {
    try {
      const response = await apiClient.get<T[]>(`/${this.endpoint}`, {
        params,
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (e) {
      console.warn(`[API Service] getAll failed for ${this.endpoint}:`, e);
      return [];
    }
  }

  async get(id: string): Promise<T> {
    const response = await apiClient.get<T>(`/${this.endpoint}/${id}`);
    return response.data;
  }

  async create(data: C): Promise<T> {
    const response = await apiClient.post<T>(`/${this.endpoint}`, data);
    const result = response.data;

    // Synchroniser avec Meilisearch si c'est un produit ou une catégorie
    if (
      this.endpoint.includes("produit") &&
      !this.endpoint.includes("categories") &&
      !this.endpoint.includes("brands")
    ) {
      // C'est un produit
      syncService.onProductCreate(result as any).catch((error) => {
        console.warn("Failed to sync product to Meilisearch:", error);
      });
    } else if (this.endpoint.includes("categories")) {
      // C'est une catégorie
      syncService.onCategoryCreate(result as any).catch((error) => {
        console.warn("Failed to sync category to Meilisearch:", error);
      });
    }

    return result;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const response = await apiClient.put<T>(`/${this.endpoint}/${id}`, data);
    const result = response.data;

    // Synchroniser avec Meilisearch si c'est un produit ou une catégorie
    if (
      this.endpoint.includes("produit") &&
      !this.endpoint.includes("categories") &&
      !this.endpoint.includes("brands")
    ) {
      // C'est un produit
      syncService.onProductUpdate(result as any).catch((error) => {
        console.warn("Failed to sync product update to Meilisearch:", error);
      });
    } else if (this.endpoint.includes("categories")) {
      // C'est une catégorie
      syncService.onCategoryUpdate(result as any).catch((error) => {
        console.warn("Failed to sync category update to Meilisearch:", error);
      });
    }

    return result;
  }

  async delete(id: string): Promise<void> {
    const response = await apiClient.delete(`/${this.endpoint}/${id}`);

    // Handle different response structures
    if (response.data && typeof response.data === "object") {
      const responseData = response.data as unknown as Record<string, unknown>;
      if ((responseData.success as boolean) === false) {
        const msg =
          typeof responseData.message === "string"
            ? (responseData.message as string)
            : "Delete operation failed";
        throw new Error(msg);
      }
    }

    // Synchroniser avec Meilisearch si c'est un produit ou une catégorie
    if (
      this.endpoint.includes("produit") &&
      !this.endpoint.includes("categories") &&
      !this.endpoint.includes("brands")
    ) {
      // C'est un produit
      syncService.onProductDelete(id).catch((error) => {
        console.warn("Failed to sync product deletion to Meilisearch:", error);
      });
    } else if (this.endpoint.includes("categories")) {
      // C'est une catégorie
      syncService.onCategoryDelete(id).catch((error) => {
        console.warn("Failed to sync category deletion to Meilisearch:", error);
      });
    }

    // Return void for successful deletion
    return;
  }
}

export type OrderCreationResult = {
  id?: string;
  total?: number;
  status?: import("@/types").Order["status"] | string;
  paymentUrl?: string;
  redirectUrl?: string;
  data?: {
    data?: {
      id?: string;
      total?: number;
      status?: string;
      paymentUrl?: string;
      redirectUrl?: string;
    };
  };
};

export const apiService = {
  // Image upload services
  images: {
    validateFile(file: File): { isValid: boolean; error?: string } {
      // Allowed file types based on backend validation
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/svg+xml",
      ];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        return {
          isValid: false,
          error: `Type de fichier non supporté. Types acceptés: JPG, JPEG, PNG, GIF, SVG`,
        };
      }

      if (file.size > maxSize) {
        return {
          isValid: false,
          error: `Fichier trop volumineux. Taille maximale: 5MB`,
        };
      }

      return { isValid: true };
    },

    async upload(
      file: File,
      folder:
        | "products"
        | "categories"
        | "brands"
        | "profiles"
        | "misc" = "misc"
    ): Promise<{ publicId: string; url: string }> {
      const validation = this.validateFile(file);
      if (!validation.isValid) throw new Error(validation.error);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const response = await apiClient.post<{
        status: string;
        message: string;
        payload: { publicId: string; url: string };
      }>("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Extraire les données du payload
      if (response.data?.payload) {
        return response.data.payload;
      }

      throw new Error("Réponse d'upload invalide");
    },

    async uploadMultiple(
      files: File[]
    ): Promise<{ url: string; altText?: string }[]> {
      const formData = new FormData();
      files.forEach((f) => formData.append("images", f));
      const response = await apiClient.post<
        { url: string; altText?: string }[]
      >("/api/produit/upload-images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data || [];
    },

    async delete(idOrUrl: string): Promise<void> {
      const encoded = encodeURIComponent(idOrUrl);
      await apiClient.delete(`/upload/image/${encoded}`);
    },
  },

  products: new (class extends ApiResourceService<Product> {
    constructor() {
      super("produit"); // Changé de "products" à "produit"
    }

    async createProduct(
      product: Omit<Product, "id" | "createdAt" | "updatedAt">
    ): Promise<Product> {
      // Map Product to CreateProduitDto format, excluding invalid properties
      const createDto: CreateProduitDto = {
        name: product.name,
        title: product.title,
        sku: product.sku,
        description: product.description,
        price: Number(product.price),
        stock: Number(product.stock),
        images: (product.images || []).map((img) => ({
          url: String(img.url || ""),
          altText: String(img.altText || ""),
        })),
        rating: Number(product.rating || 0),
        categoryId: product.categoryId,
        brandId: product.brandId,
        originalPrice: Number(product.originalPrice || 0),
        vendorId: product.vendorId || "", // Map vendorId to vendorId
        reports: Number(product.reports || 0),
        tags: product.tags || [],
        condition: product.condition || "neuf",
        reviews: product.reviews || [],
        attributes: product.attributes || {},
        status: product.status || "disponible",
        specifications: product.specifications || [],
      };

      // Remove any undefined or null values
      const cleanDto = Object.fromEntries(
        Object.entries(createDto).filter(
          ([_, value]) => value !== undefined && value !== null
        )
      );

      console.log("Sending product data:", cleanDto);
      const response = await apiClient.post<Product>(
        `/${this.endpoint}`,
        cleanDto
      );
      const result = response.data;

      // Synchroniser avec Meilisearch
      syncService.onProductCreate(result).catch((error) => {
        console.warn("Failed to sync product creation to Meilisearch:", error);
      });

      return result;
    }

    async getByCategory(categoryId: string): Promise<Product[]> {
      const response = await apiClient.get<Product[]>(`/produit`, {
        params: { categoryId },
      });
      if (response.status !== 200) {
        throw new Error(`Products for category ${categoryId} not found`);
      }
      return response.data;
    }

    async updateStatus(
      id: string,
      status: "disponible" | "indisponible" | "bientôt disponible"
    ): Promise<Product> {
      const response = await apiClient.patch<Product>(`/produit/${id}/status`, {
        status,
      });
      const result = response.data;

      // Synchroniser avec Meilisearch
      syncService.onProductUpdate(result).catch((error) => {
        console.warn(
          "Failed to sync product status update to Meilisearch:",
          error
        );
      });

      return result;
    }
  })(),

  categories: new (class extends ApiResourceService<Category> {
    constructor() {
      super("produit/categories");
    }

    async getSubCategories(categoryId: string): Promise<Category[]> {
      const allCategories = await this.getAll();
      return allCategories.filter(
        (category) => category.parentId === categoryId
      );
    }
  })(),

  brands: new ApiResourceService<Brand>("produit/brands"), // Changé de "brands" à "produit/brands"

  orders: new (class extends ApiResourceService<Order> {
    constructor() {
      super("orders");
    }

    async get(id: string): Promise<Order> {
      const response = await apiClient.get<Order>(`/orders/${id}`);
      return response.data;
    }

    async getAll(params?: Record<string, unknown>): Promise<Order[]> {
      try {
        const response = await apiClient.get<Order[]>(`/orders`, { params });
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
      }
    }

    async getByClient(userId: string): Promise<Order[]> {
      try {
        // Try dedicated client endpoint first
        const resp1 = await apiClient.get<Order[]>(`/orders/client/${userId}`);
        if (Array.isArray(resp1.data)) return resp1.data;
      } catch (error) {
        console.warn(
          "Erreur lors de la tentative de récupération des commandes client:",
          error
        );
      }
      try {
        // Fallback to query param with expected field name
        const resp2 = await apiClient.get<Order[]>(`/orders`, {
          params: { clientId: userId },
        });
        return Array.isArray(resp2.data) ? resp2.data : [];
      } catch (error) {
        console.error("Error fetching orders by client:", error);
        return [];
      }
    }

    async createOrder(
      order: Omit<Order, "id" | "createdAt" | "updatedAt">
    ): Promise<OrderCreationResult> {
      const response = await apiClient.post<OrderCreationResult>(
        `/${this.endpoint}`,
        order
      );
      return response.data;
    }

    async getMerchantOrders(
      vendorId: string
    ): Promise<import("@/types").MerchantOrderWithClient[]> {
      const response = await apiClient.get<
        import("@/types").MerchantOrderWithClient[]
      >(`/orders/merchant`);
      return Array.isArray(response.data) ? response.data : [];
    }

    async updateStatus(
      orderId: string,
      status: Order["status"]
    ): Promise<Order> {
      const response = await apiClient.put<Order>(`/orders/status`, {
        orderId,
        status,
      });
      return response.data;
    }

    async initiatePayment(dto: {
      item_name: string;
      item_price: number;
      ref_command: string;
      command_name: string;
      currency?: string;
      target_payment?: string;
      user?: { phone_number: string; first_name: string; last_name: string };
    }): Promise<{ redirectUrl: string }> {
      const response = await apiClient.post(`/orders/initiate-payment`, dto);
      return response.data as { redirectUrl: string };
    }
  })(),

  notifications: new (class {
    async registerDevice(userId: string, token: string, platform: "web" | "ios" | "android" = "web"): Promise<boolean> {
      try {
        const resp = await apiClient.post("/notifications/register-device", { userId, token, platform });
        return !!resp?.data;
      } catch (e) {
        console.error("Error registering device token:", e);
        return false;
      }
    }

    async getByUser(
      userId: string,
      page = 1,
      limit = 20,
      filters?: import("@/types").NotificationFilters
    ): Promise<
      | import("@/types").NotificationsPagination
      | import("@/types").Notification[]
    > {
      try {
        const params: any = { page, limit };
        if (filters) {
          if (filters.type?.length) params.type = filters.type.join(",");
          if (filters.read !== undefined) params.read = filters.read;
          if (filters.priority?.length)
            params.priority = filters.priority.join(",");
          if (filters.dateFrom) params.dateFrom = filters.dateFrom;
          if (filters.dateTo) params.dateTo = filters.dateTo;
        }

        const response = await apiClient.get(`/notifications/user/${userId}`, {
          params,
        });
        const data = response.data as unknown;

        // Check for paginated response
        if (data && typeof data === "object") {
          const dataObj = data as Record<string, unknown>;
          if (dataObj.notifications && Array.isArray(dataObj.notifications)) {
            return {
              notifications:
                dataObj.notifications as import("@/types").Notification[],
              total: Number(dataObj.total) || 0,
              page: Number(dataObj.page) || page,
              limit: Number(dataObj.limit) || limit,
              totalPages: Number(dataObj.totalPages) || 0,
            };
          }
        }

        // Fallback to array response
        if (Array.isArray(data))
          return data as import("@/types").Notification[];
        if (data && typeof data === "object") {
          const dataObj = data as Record<string, unknown>;
          if (Array.isArray(dataObj.items)) {
            return dataObj.items as import("@/types").Notification[];
          }
          if (Array.isArray(dataObj.data)) {
            return dataObj.data as import("@/types").Notification[];
          }
        }
        return [];
      } catch (e) {
        const error = e as { statusCode?: number };
        if (error?.statusCode === 404) return [];
        console.error("Error fetching notifications:", e);
        return [];
      }
    }

    async getAllForAdmin(
      page = 1,
      limit = 50,
      filters?: import("@/types").NotificationFilters & { userId?: string }
    ): Promise<import("@/types").NotificationsPagination> {
      try {
        const params: any = { page, limit };
        if (filters) {
          if (filters.userId) params.userId = filters.userId;
          if (filters.type?.length) params.type = filters.type.join(",");
          if (filters.read !== undefined) params.read = filters.read;
          if (filters.priority?.length)
            params.priority = filters.priority.join(",");
          if (filters.dateFrom) params.dateFrom = filters.dateFrom;
          if (filters.dateTo) params.dateTo = filters.dateTo;
        }

        const response = await apiClient.get("/notifications", { params });
        const data = response.data as any;

        return {
          notifications: data.notifications || data.items || data.data || [],
          total: Number(data.total) || 0,
          page: Number(data.page) || page,
          limit: Number(data.limit) || limit,
          totalPages:
            Number(data.totalPages) || Math.ceil((data.total || 0) / limit),
        };
      } catch (e) {
        console.error("Error fetching all notifications:", e);
        return {
          notifications: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }
    }

    async markAsRead(userId: string, notificationId: string): Promise<boolean> {
      try {
        const response = await apiClient.put(
          `/notifications/user/${userId}/read/${notificationId}`
        );
        return !!response?.data;
      } catch (e) {
        console.error("Error marking notification as read:", e);
        return false;
      }
    }

    async markAsUnread(
      userId: string,
      notificationId: string
    ): Promise<boolean> {
      try {
        const response = await apiClient.put(
          `/notifications/user/${userId}/unread/${notificationId}`
        );
        return !!response?.data;
      } catch (e) {
        console.error("Error marking notification as unread:", e);
        return false;
      }
    }

    async markAllAsRead(userId: string): Promise<boolean> {
      try {
        const response = await apiClient.put(
          `/notifications/user/${userId}/read-all`
        );
        return !!response?.data;
      } catch (e) {
        console.error("Error marking all notifications as read:", e);
        return false;
      }
    }

    async deleteNotification(
      userId: string,
      notificationId: string
    ): Promise<boolean> {
      try {
        const response = await apiClient.delete(
          `/notifications/user/${userId}/${notificationId}`
        );
        return response.status === 200 || response.status === 204;
      } catch (e) {
        console.error("Error deleting notification:", e);
        return false;
      }
    }

    async deleteAllRead(userId: string): Promise<boolean> {
      try {
        const response = await apiClient.delete(
          `/notifications/user/${userId}/read`
        );
        return response.status === 200 || response.status === 204;
      } catch (e) {
        console.error("Error deleting all read notifications:", e);
        return false;
      }
    }

    async getSettings(
      userId: string
    ): Promise<import("@/types").NotificationSettings | null> {
      try {
        const response = await apiClient.get(
          `/notifications/settings/${userId}`
        );
        return response.data as import("@/types").NotificationSettings;
      } catch (e) {
        console.error("Error fetching notification settings:", e);
        return null;
      }
    }

    async updateSettings(
      userId: string,
      settings: import("@/types").UpdateNotificationSettingsDto
    ): Promise<import("@/types").NotificationSettings | null> {
      try {
        const response = await apiClient.put("/notifications/settings", {
          userId,
          ...settings,
        });
        return response.data as import("@/types").NotificationSettings;
      } catch (e) {
        console.error("Error updating notification settings:", e);
        return null;
      }
    }

    async createNotification(
      notification: import("@/types").CreateNotificationDto
    ): Promise<import("@/types").Notification | null> {
      try {
        const response = await apiClient.post("/notifications", notification);
        return response.data as import("@/types").Notification;
      } catch (e) {
        console.error("Error creating notification:", e);
        return null;
      }
    }

    async createBulkNotification(
      userIds: string[],
      notification: Omit<import("@/types").CreateNotificationDto, "userId">
    ): Promise<boolean> {
      try {
        const response = await apiClient.post("/notifications/bulk", {
          userIds,
          ...notification,
        });
        return !!response?.data;
      } catch (e) {
        console.error("Error creating bulk notifications:", e);
        return false;
      }
    }

    async getUnreadCount(userId: string): Promise<number> {
      try {
        const response = await apiClient.get(
          `/notifications/user/${userId}/unread-count`
        );
        return Number(response.data?.count) || 0;
      } catch (e) {
        console.error("Error fetching unread count:", e);
        return 0;
      }
    }

    async getNotificationStats(userId?: string): Promise<{
      total: number;
      unread: number;
      byType: Record<string, number>;
      byPriority: Record<string, number>;
    }> {
      try {
        const endpoint = userId
          ? `/notifications/stats/${userId}`
          : "/notifications/stats";
        const response = await apiClient.get(endpoint);
        return (
          response.data || {
            total: 0,
            unread: 0,
            byType: {},
            byPriority: {},
          }
        );
      } catch (e) {
        console.error("Error fetching notification stats:", e);
        return {
          total: 0,
          unread: 0,
          byType: {},
          byPriority: {},
        };
      }
    }

    // Méthodes spécifiques aux marchands
    async getMerchantNotifications(
      vendorId: string,
      page = 1,
      limit = 50,
      filters?: import("@/types").MerchantNotificationFilters
    ): Promise<import("@/types").MerchantNotification[]> {
      try {
        const params: any = { page, limit };
        if (filters) {
          if (filters.type?.length) params.type = filters.type.join(",");
          if (filters.category?.length)
            params.category = filters.category.join(",");
          if (filters.read !== undefined) params.read = filters.read;
          if (filters.priority?.length)
            params.priority = filters.priority.join(",");
          if (filters.relatedEntityType?.length)
            params.relatedEntityType = filters.relatedEntityType.join(",");
          if (filters.dateFrom) params.dateFrom = filters.dateFrom;
          if (filters.dateTo) params.dateTo = filters.dateTo;
        }

        const response = await apiClient.get(
          `/notifications/merchant/${vendorId}`,
          { params }
        );
        const data = response.data as unknown;

        // Support des réponses paginaées et directes
        if (Array.isArray(data))
          return data as import("@/types").MerchantNotification[];
        if (data && typeof data === "object") {
          const dataObj = data as Record<string, unknown>;
          if (Array.isArray(dataObj.notifications)) {
            return dataObj.notifications as import("@/types").MerchantNotification[];
          }
          if (Array.isArray(dataObj.items)) {
            return dataObj.items as import("@/types").MerchantNotification[];
          }
          if (Array.isArray(dataObj.data)) {
            return dataObj.data as import("@/types").MerchantNotification[];
          }
        }
        return [];
      } catch (e) {
        const error = e as { statusCode?: number };
        if (error?.statusCode === 404) return [];
        console.error("Error fetching merchant notifications:", e);
        return [];
      }
    }

    async getMerchantSettings(
      vendorId: string
    ): Promise<import("@/types").MerchantNotificationSettings | null> {
      try {
        const response = await apiClient.get(
          `/notifications/merchant/${vendorId}/settings`
        );
        return response.data as import("@/types").MerchantNotificationSettings;
      } catch (e) {
        console.error("Error fetching merchant notification settings:", e);
        return null;
      }
    }

    async updateMerchantSettings(
      vendorId: string,
      settings: Partial<import("@/types").MerchantNotificationSettings>
    ): Promise<import("@/types").MerchantNotificationSettings | null> {
      try {
        const response = await apiClient.put(
          `/notifications/merchant/${vendorId}/settings`,
          settings
        );
        return response.data as import("@/types").MerchantNotificationSettings;
      } catch (e) {
        console.error("Error updating merchant notification settings:", e);
        return null;
      }
    }

    async getMerchantStats(
      vendorId: string
    ): Promise<import("@/types").MerchantNotificationStats | null> {
      try {
        const response = await apiClient.get(
          `/notifications/merchant/${vendorId}/stats`
        );
        return response.data as import("@/types").MerchantNotificationStats;
      } catch (e) {
        console.error("Error fetching merchant notification stats:", e);
        return null;
      }
    }

    async createMerchantNotification(
      notification: import("@/types").CreateMerchantNotificationDto
    ): Promise<import("@/types").MerchantNotification | null> {
      try {
        const response = await apiClient.post(
          "/notifications/merchant",
          notification
        );
        return response.data as import("@/types").MerchantNotification;
      } catch (e) {
        console.error("Error creating merchant notification:", e);
        return null;
      }
    }

    async markAllMerchantAsRead(vendorId: string): Promise<boolean> {
      try {
        const response = await apiClient.put(
          `/notifications/merchant/${vendorId}/read-all`
        );
        return !!response?.data;
      } catch (e) {
        console.error("Error marking all merchant notifications as read:", e);
        return false;
      }
    }

    async getMerchantUnreadCount(vendorId: string): Promise<number> {
      try {
        const response = await apiClient.get(
          `/notifications/merchant/${vendorId}/unread-count`
        );
        return Number(response.data?.count) || 0;
      } catch (e) {
        console.error("Error fetching merchant unread count:", e);
        return 0;
      }
    }

    // Méthodes pour créer automatiquement des notifications métier
    async createOrderNotification(
      vendorId: string,
      orderId: string,
      orderData: { customerName: string; total: number; items: number }
    ): Promise<boolean> {
      try {
        const notification: Omit<
          import("@/types").CreateMerchantNotificationDto,
          "userId"
        > = {
          vendorId,
          type: "merchant_order",
          category: "business",
          priority: "high",
          title: "Nouvelle commande reçue",
          message: `Nouvelle commande de ${orderData.customerName} pour ${
            orderData.total
          }€ (${orderData.items} article${orderData.items > 1 ? "s" : ""})`,
          actionUrl: `/dashboard/merchant/orders/${orderId}`,
          relatedEntityId: orderId,
          relatedEntityType: "order",
          data: orderData,
        };

        const result = await this.createMerchantNotification({
          ...notification,
          userId: vendorId, // Temporaire, sera remplacé par l'ID utilisateur approprié
        });
        return !!result;
      } catch (e) {
        console.error("Error creating order notification:", e);
        return false;
      }
    }

    async createStockAlert(
      vendorId: string,
      productId: string,
      productData: { name: string; stock: number; threshold: number }
    ): Promise<boolean> {
      try {
        const isOutOfStock = productData.stock === 0;
        const notification: Omit<
          import("@/types").CreateMerchantNotificationDto,
          "userId"
        > = {
          vendorId,
          type: "merchant_stock",
          category: "business",
          priority: isOutOfStock ? "urgent" : "high",
          title: isOutOfStock ? "Produit en rupture" : "Stock faible",
          message: isOutOfStock
            ? `Le produit "${productData.name}" est en rupture de stock`
            : `Le stock du produit "${productData.name}" est faible (${
                productData.stock
              } restant${productData.stock > 1 ? "s" : ""})`,
          actionUrl: `/dashboard/merchant/products/${productId}`,
          relatedEntityId: productId,
          relatedEntityType: "product",
          data: productData,
        };

        const result = await this.createMerchantNotification({
          ...notification,
          userId: vendorId,
        });
        return !!result;
      } catch (e) {
        console.error("Error creating stock alert:", e);
        return false;
      }
    }

    async createPaymentNotification(
      vendorId: string,
      paymentId: string,
      paymentData: {
        amount: number;
        orderId: string;
        status: "success" | "failed";
      }
    ): Promise<boolean> {
      try {
        const isSuccess = paymentData.status === "success";
        const notification: Omit<
          import("@/types").CreateMerchantNotificationDto,
          "userId"
        > = {
          vendorId,
          type: "merchant_payment",
          category: "financial",
          priority: isSuccess ? "medium" : "high",
          title: isSuccess ? "Paiement reçu" : "Échec de paiement",
          message: isSuccess
            ? `Paiement de ${paymentData.amount}€ reçu pour la commande #${paymentData.orderId}`
            : `Échec du paiement de ${paymentData.amount}€ pour la commande #${paymentData.orderId}`,
          actionUrl: `/dashboard/merchant/orders/${paymentData.orderId}`,
          relatedEntityId: paymentId,
          relatedEntityType: "payment",
          data: paymentData,
        };

        const result = await this.createMerchantNotification({
          ...notification,
          userId: vendorId,
        });
        return !!result;
      } catch (e) {
        console.error("Error creating payment notification:", e);
        return false;
      }
    }

    async createReviewNotification(
      vendorId: string,
      reviewId: string,
      reviewData: { productName: string; rating: number; customerName: string }
    ): Promise<boolean> {
      try {
        const notification: Omit<
          import("@/types").CreateMerchantNotificationDto,
          "userId"
        > = {
          vendorId,
          type: "merchant_review",
          category: "customer",
          priority: "medium",
          title: "Nouvel avis client",
          message: `${reviewData.customerName} a laissé un avis ${reviewData.rating}/5 étoiles sur "${reviewData.productName}"`,
          actionUrl: `/dashboard/merchant/reviews/${reviewId}`,
          relatedEntityId: reviewId,
          relatedEntityType: "product",
          data: reviewData,
        };

        const result = await this.createMerchantNotification({
          ...notification,
          userId: vendorId,
        });
        return !!result;
      } catch (e) {
        console.error("Error creating review notification:", e);
        return false;
      }
    }
  })(),

  delivery: new (class {
    async getClientMissions(clientId?: string): Promise<unknown[]> {
      try {
        const response = await apiClient.get(`/delivery/client/missions`, {
          params: clientId ? { clientId } : {},
        });
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error("Error fetching client missions:", error);
        return [];
      }
    }

    async getLivreurMissions(livreurId?: string): Promise<unknown[]> {
      try {
        const response = await apiClient.get(`/delivery/livreur/missions`, {
          params: livreurId ? { livreurId } : {},
        });
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error("Error fetching livreur missions:", error);
        return [];
      }
    }
  })(),

  promotions: new (class {
    async getAll(params?: Record<string, unknown>): Promise<any[]> {
      try {
        const resp = await apiClient.get(`/promotions`, { params });
        return Array.isArray(resp.data) ? resp.data : (resp.data?.items || resp.data?.data || []);
      } catch (e) {
        console.warn('Error fetching promotions:', e);
        return [];
      }
    }
    async getFeatured(limit = 10): Promise<any[]> {
      const list = await this.getAll({ status: 'active', featured: true, limit });
      if (list.length) return list;
      return this.getAll({ status: 'active', limit });
    }
    async create(promo: any): Promise<any> {
      const resp = await apiClient.post(`/promotions`, promo);
      return resp.data;
    }
    async update(id: string, promo: Partial<any>): Promise<any> {
      const resp = await apiClient.put(`/promotions/${id}`, promo);
      return resp.data;
    }
    async remove(id: string): Promise<boolean> {
      try {
        const resp = await apiClient.delete(`/promotions/${id}`);
        return resp.status === 200 || resp.status === 204;
      } catch { return false; }
    }
    async validateCode(code: string, context: { total?: number; items?: any[]; userId?: string }): Promise<{code: string; amount?: number; percent?: number} | null> {
      try {
        const resp = await apiClient.post(`/promo-codes/validate`, { code, ...context });
        return resp.data || null;
      } catch (e) {
        return null;
      }
    }
  })(),

  promoCodes: new (class {
    async getAll(params?: Record<string, unknown>): Promise<any[]> {
      try {
        const resp = await apiClient.get(`/promo-codes`, { params });
        return Array.isArray(resp.data) ? resp.data : (resp.data?.items || resp.data?.data || []);
      } catch (e) {
        console.warn('Error fetching promo codes:', e);
        return [];
      }
    }
    async create(code: any): Promise<any> { const resp = await apiClient.post(`/promo-codes`, code); return resp.data; }
    async update(id: string, code: Partial<any>): Promise<any> { const resp = await apiClient.put(`/promo-codes/${id}`, code); return resp.data; }
    async remove(id: string): Promise<boolean> { try { const resp = await apiClient.delete(`/promo-codes/${id}`); return resp.status===200||resp.status===204; } catch { return false; } }
  })(),

  users: new (class {
    async getAll(params?: Record<string, unknown>): Promise<User[]> {
      try {
        const response = await apiClient.get<User[]>(`/auth/admin/users`, {
          params,
        });
        return Array.isArray(response.data) ? response.data : [];
      } catch (e) {
        return [];
      }
    }

    async get(id: string): Promise<User> {
      const response = await apiClient.get<User>(`/auth/admin/users`);
      return response.data;
    }

    async create(
      user: Omit<User, "id" | "createdAt" | "updatedAt">
    ): Promise<User> {
      const response = await apiClient.post<User>(`/auth/admin/users`, user);
      return response.data;
    }

    async update(id: string, data: Partial<User>): Promise<User> {
      const response = await apiClient.patch<User>(
        `/auth/admin/users/${id}`,
        data
      );
      return response.data;
    }

    async delete(id: string): Promise<void> {
      await apiClient.delete(`/auth/admin/users/${id}`);
    }

    async getMerchants(): Promise<MerchantProfile[]> {
      const response = await apiClient.get<MerchantProfile[]>(
        `/auth/merchant/profiles`
      );
      if (response.status !== 200) {
        throw new Error(`Failed to fetch merchant profiles`);
      }
      return response.data;
    }

    async getMerchant(id: string): Promise<MerchantProfile> {
      try {
        console.log(`Fetching merchant profile for ID: ${id}`);

        // D'abord, essayons l'endpoint pour lister tous les profils marchands (pour admin)
        try {
          const response = await apiClient.get<MerchantProfile[]>(
            `/auth/merchant/profiles`
          );

          if (response.status === 200) {
            // Filtrer pour trouver le marchand avec l'ID donné
            const merchants = Array.isArray(response.data) ? response.data : [];
            const merchant = merchants.find(
              (m: MerchantProfile) => m.id === id || m.userId === id
            );

            if (merchant) {
              console.log(
                `Found merchant via profiles endpoint:`,
                merchant.businessName
              );
              return merchant;
            }
          }
        } catch (profilesError) {
          console.warn(
            "Failed to fetch from profiles endpoint (probably no admin access):",
            profilesError.message
          );
        }

        // Si ça ne marche pas (pas d'accès admin), retourner un profil minimal mais informatif
        console.log(`Creating fallback profile for merchant ID: ${id}`);
        return {
          id: id,
          businessName: `Marchand ${id.substring(0, 8)}..`,
          businessType: "OTHER",
          businessAddress: "Adresse non disponible",
          businessPhone: "Information non disponible",
          businessEmail: "contact@marchand.com",
          status: "APPROVED", // On assume qu'il est approuvé si on a des produits
          userId: id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: {
            id: id,
            email: "contact@marchand.com",
            firstName: "Marchand",
            lastName: id.substring(0, 8),
            phone: null,
          },
        } as MerchantProfile;
      } catch (error) {
        console.error(`Error in getMerchant for ID ${id}:`, error);

        // En cas d'erreur, créer un profil de fallback
        return {
          id: id,
          businessName: `Erreur: ${id.substring(0, 8)}`,
          businessType: "OTHER",
          businessAddress: "Erreur de chargement",
          businessPhone: "N/A",
          businessEmail: "N/A",
          status: "PENDING",
          userId: id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as MerchantProfile;
      }
    }

    async getMerchantProfile(): Promise<MerchantProfile> {
      const response = await apiClient.get<MerchantProfile>(
        `/auth/merchant/profile`
      );
      if (response.status !== 200) {
        throw new Error(`Failed to fetch merchant profile`);
      }
      return response.data;
    }

    async getMerchantStats(id: string): Promise<MerchantStats> {
      const response = await apiClient.get<MerchantStats>(`/merchant/stats`);
      if (response.status !== 200) {
        throw new Error(`Failed to fetch merchant stats for id ${id}`);
      }
      console.log("Merchant stats response:", response.data);
      return response.data;
    }

    async getAdminStats(): Promise<import("@/types").AdminStats> {
      const response = await apiClient.get<import("@/types").AdminStats>(
        `/auth/admin/stats`
      );
      if (response.status !== 200) {
        throw new Error(`Failed to fetch admin stats`);
      }
      return response.data;
    }

    async getAdminUsers(): Promise<import("@/types").AdminUser[]> {
      const response = await apiClient.get<import("@/types").AdminUser[]>(
        `/auth/admin/users`
      );
      if (response.status !== 200) {
        throw new Error(`Failed to fetch admin users`);
      }
      return Array.isArray(response.data) ? response.data : [];
    }

    async updateProfile(data: Partial<User>): Promise<User> {
      const response = await apiClient.put<User>(`/auth/profile`, data);
      return response.data;
    }

    async createMerchantProfile(
      data: CreateMerchantProfileDto
    ): Promise<unknown> {
      const response = await apiClient.post(`/auth/merchant/profile`, data);
      return response.data;
    }

    async validateMerchantProfile(
      vendorId: string,
      data: { status: "APPROVED" | "REJECTED"; reason?: string }
    ): Promise<MerchantProfile> {
      const response = await apiClient.patch<MerchantProfile>(
        `/auth/admin/merchant-profiles/${vendorId}/validate`,
        data
      );
      return response.data;
    }

    async suspendMerchantProfile(vendorId: string): Promise<MerchantProfile> {
      const response = await apiClient.patch<MerchantProfile>(
        `/auth/admin/merchant-profiles/${vendorId}/suspend`
      );
      return response.data;
    }

    async reactivateMerchantProfile(
      vendorId: string
    ): Promise<MerchantProfile> {
      const response = await apiClient.patch<MerchantProfile>(
        `/auth/admin/merchant-profiles/${vendorId}/reactivate`
      );
      return response.data;
    }
  })(),
};

export { uploadImage };
