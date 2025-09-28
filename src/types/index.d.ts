// Removed circular import - Stats is defined in this file
// import { Sidebar } from "@/components/dashboard/sidebar"; // Also removing unused import

// Trend type for stats cards
export interface StatsCardTrend {
  icon: "TrendingUp" | "Eye";
  text: string;
}

export interface Image {
  url: string;
  altText?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  subCategories?: Category[];
}

export interface CreateCategoryDto {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface CreateBrandDto {
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface UpdateBrandDto {
  name?: string;
  slug?: string;
  logoUrl?: string;
}

export interface Merchant {
  id: string;
  name?: string;
  email?: string;
  description?: string;
}

export interface MobileMoneyDetails {
  orangeMoneyNumber?: string;
  waveMoneyNumber?: string;
}

// Type pour les données du profil marchand (contenu réel)
export interface MerchantProfileData {
  id: string;
  businessName: string;
  businessType:
    | "RESTAURANT"
    | "GROCERY"
    | "PHARMACY"
    | "ELECTRONICS"
    | "CLOTHING"
    | "OTHER";
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  orangeMoneyNumber?: string | null;
  waveMoneyNumber?: string | null;
  description?: string;
  website?: string;
  logoUrl?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  rejectionReason?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  userId: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

// Align MerchantProfile with unwrapped API responses
export type MerchantProfile = MerchantProfileData;

// Full API response wrapper (if needed)
export interface MerchantProfileResponse {
  success: boolean;
  data: MerchantProfileData;
  message?: string;
}

export interface OrderItem {
  produitId: string;
  quantity: number;
  price: number;
  name: string;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  postcode: string;
  country: string;
}

export interface Order {
  id: string;
  status:
    | "DRAFT"
    | "PENDING_PAYMENT"
    | "PAYMENT_SUCCESSFUL"
    | "PAYMENT_FAILED"
    | "PENDING"
    | "CONFIRMED"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "RETURN_REQUESTED"
    | "RETURN_IN_PROGRESS"
    | "RETURNED";
  total: number;
  clientId: string;
  vendorId?: string;
  items: OrderItem[] | string; // Peut être un array ou une string JSON
  deliveryAddress: DeliveryAddress;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface OrderWithTimestamp extends Order {
  createdAt: string | number;
}

export interface CreateOrderDto {
  clientId: string;
  produitIds: string[];
  total: number;
}

export interface UpdateOrderStatusDto {
  orderId: string;
  status: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
}

export interface CreateMissionDto {
  orderId?: string;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  destinationAddress: string;
  destinationLatitude: number;
  destinationLongitude: number;
}

export interface AcceptMissionDto {
  missionId: string;
  livreurId: string;
}

export interface UpdateStatusDto {
  missionId: string;
  status:
    | "PENDING"
    | "ASSIGNED"
    | "ACCEPTED"
    | "IN_PROGRESS"
    | "DELIVERED"
    | "CANCELLED";
}

export interface PositionDto {
  latitude: number;
  longitude: number;
}

export interface Attribute {
  id: string;
  name: string;
  type: string;
  values: string[];
}

export interface Review {
  userId: string;
  rating: number;
  comment?: string;
}

export interface Specification {
  name: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  title: string;
  sku: string;
  description: string;
  price: number;
  stock: number;
  images: Image[];
  rating: number;
  categoryId: string;
  brandId: string;
  category?: Category;
  brand?: Brand;
  createdAt: string | number;
  updatedAt: string | number;
  originalPrice?: number | null;
  vendorId?: string;
  reports?: number;
  tags?: string[];
  condition?: "neuf" | "occasion" | "reconditionne";
  reviews?: Review[];
  attributes?: Record<string, string>;
  status?: "disponible" | "indisponible" | "bientôt disponible";
  specifications?: Specification[];
  isOnSale?: boolean;
  reviewCount?: number;
}

export interface CreateProduitDto {
  name: string;
  title: string;
  sku: string;
  description: string;
  price: number;
  stock: number;
  images: Image[];
  rating?: number;
  categoryId: string;
  brandId: string;
  originalPrice?: number;
  vendorId: string;
  reports?: number;
  tags?: string[];
  condition?: "neuf" | "occasion" | "reconditionne";
  reviews?: Review[];
  attributes?: Record<string, string>;
  status?: "disponible" | "indisponible" | "bientôt disponible";
  specifications?: Specification[];
}

export interface UpdateProduitDto {
  name?: string;
  title?: string;
  sku?: string;
  description?: string;
  price?: number;
  stock?: number;
  images?: Image[];
  rating?: number;
  categoryId?: string;
  brandId?: string;
  originalPrice?: number;
  vendorId?: string;
  reports?: number;
  tags?: string[];
  condition?: "neuf" | "occasion" | "reconditionne";
  reviews?: Review[];
  attributes?: Record<string, string>;
  status?: "disponible" | "indisponible" | "bientôt disponible";
  specifications?: Specification[];
}

export interface TopProductExtended extends Product {
  sold: number;
  revenue: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  address?: string;
  roles: Array<{
    id: string;
    name: "ADMIN" | "MERCHANT" | "CLIENT" | string;
    createdAt: string | number;
    updatedAt: string | number;
  }>;
  merchantProfile?: MerchantProfile;
  emailNotifications?: {
    orders?: boolean;
    promotions?: boolean;
  };
  smsNotifications?: {
    orders?: boolean;
  };
  pushNotifications?: boolean;
  isActive: boolean;
  createdAt: string | number;
  updatedAt: string | number;
  role?: "ADMIN" | "MERCHANT" | "CLIENT";
  userId?: string;
}

export interface CreateMerchantProfileDto {
  businessName: string;
  businessType:
    | "RESTAURANT"
    | "GROCERY"
    | "PHARMACY"
    | "ELECTRONICS"
    | "CLOTHING"
    | "OTHER";
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  siretNumber?: string;
  vatNumber?: string;
  bankAccountNumber?: string;
  bankName?: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  mobileMoneyDetails?: MobileMoneyDetails;
}

export interface UpdateMerchantProfileDto {
  businessName?: string;
  businessType?:
    | "RESTAURANT"
    | "GROCERY"
    | "PHARMACY"
    | "ELECTRONICS"
    | "CLOTHING"
    | "OTHER";
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  siretNumber?: string;
  vatNumber?: string;
  bankAccountNumber?: string;
  bankName?: string;
  description?: string;
  website?: string;
  logoUrl?: string;
}

export interface ValidateMerchantDto {
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  reason?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RequestPasswordResetDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "CLIENT" | "MERCHANT";
}

export type RegisterDto = RegisterData;

export interface Notification {
  id: string;
  type:
    | "order"
    | "review"
    | "system"
    | "stock"
    | "payment"
    | "promotion"
    | "merchant_order"
    | "merchant_payment"
    | "merchant_review"
    | "merchant_stock"
    | "merchant_system"
    | "merchant_delivery";
  message: string;
  title?: string;
  data?: Record<string, never>;
  userId: string;
  vendorId?: string;
  createdAt: string | number;
  updatedAt?: string | number;
  read: boolean;
  priority?: "low" | "medium" | "high" | "urgent";
  category?: "business" | "customer" | "system" | "financial";
  actionUrl?: string;
  relatedEntityId?: string;
  relatedEntityType?: "order" | "product" | "customer" | "payment";
}

export interface NotificationSettings {
  id: string;
  userId: string;
  emailNotifications: {
    orders: boolean;
    payments: boolean;
    promotions: boolean;
    system: boolean;
    reviews: boolean;
    stock: boolean;
  };
  pushNotifications: {
    orders: boolean;
    payments: boolean;
    promotions: boolean;
    system: boolean;
    reviews: boolean;
    stock: boolean;
  };
  smsNotifications: {
    orders: boolean;
    payments: boolean;
  };
  createdAt: string | number;
  updatedAt: string | number;
}

export interface CreateNotificationDto {
  type: Notification["type"];
  message: string;
  title?: string;
  data?: Record<string, never>;
  userId: string;
  priority?: Notification["priority"];
}

export interface UpdateNotificationSettingsDto {
  emailNotifications?: Partial<NotificationSettings["emailNotifications"]>;
  pushNotifications?: Partial<NotificationSettings["pushNotifications"]>;
  smsNotifications?: Partial<NotificationSettings["smsNotifications"]>;
}

export interface NotificationFilters {
  type?: Notification["type"][];
  read?: boolean;
  priority?: Notification["priority"][];
  dateFrom?: string;
  dateTo?: string;
}

export interface NotificationsPagination {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Types spécifiques aux notifications marchands
export interface MerchantNotification extends Notification {
  vendorId: string;
  category: "business" | "customer" | "system" | "financial";
  type:
    | "merchant_order"
    | "merchant_payment"
    | "merchant_review"
    | "merchant_stock"
    | "merchant_system"
    | "merchant_delivery";
}

export interface MerchantNotificationSettings extends NotificationSettings {
  businessNotifications: {
    newOrders: boolean;
    orderStatusChanges: boolean;
    paymentReceived: boolean;
    paymentFailed: boolean;
    lowStock: boolean;
    outOfStock: boolean;
    newReviews: boolean;
    customerMessages: boolean;
    deliveryUpdates: boolean;
    accountUpdates: boolean;
  };
  urgencyLevels: {
    criticalAlerts: boolean; // Stock critique, paiements échoués
    businessAlerts: boolean; // Nouvelles commandes, avis
    informationalAlerts: boolean; // Mises à jour système
  };
}

export interface CreateMerchantNotificationDto extends CreateNotificationDto {
  vendorId: string;
  category: "business" | "customer" | "system" | "financial";
  type:
    | "merchant_order"
    | "merchant_payment"
    | "merchant_review"
    | "merchant_stock"
    | "merchant_system"
    | "merchant_delivery";
  actionUrl?: string;
  relatedEntityId?: string;
  relatedEntityType?: "order" | "product" | "customer" | "payment";
}

export interface MerchantNotificationFilters extends NotificationFilters {
  vendorId?: string;
  category?: ("business" | "customer" | "system" | "financial")[];
  relatedEntityType?: ("order" | "product" | "customer" | "payment")[];
}

export interface MerchantNotificationStats {
  total: number;
  unread: number;
  byCategory: {
    business: number;
    customer: number;
    system: number;
    financial: number;
  };
  byPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  todayCount: number;
  weekCount: number;
  monthCount: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
}

export interface StatsCardData {
  title: string;
  value: string | number;
  trend: StatsCardTrend;
  icon: "ShoppingCart" | "Package" | "DollarSign" | "Package2";
}

export interface SidebarItem {
  icon: string;
  label: string;
  count?: number;
  active?: boolean;
}

export interface RecentOrderStats {
  id: string;
  userId: string;
  product: string;
  total: number;
  status: "EN_PREPARATION" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  date: string;
}

export interface Stats {
  totalSales: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  topProducts: TopProductExtended[];
  recentOrders: RecentOrderStats[];
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  getCurrentUser: () => Promise<User | null>;
  isLoading: boolean;
  error: string | null;
}

export interface ProductsParams {
  categoryId?: string;
  brandId?: string;
  vendorId?: string;
  userId?: string;
  search?: string;
  _limit?: number;
  _page?: number;
  _sort?: string;
  _order?: "asc" | "desc";
  price_gte?: number;
  price_lte?: number;
  brands_like?: string;
  rating_gte?: number;
  inStock?: boolean;
  attributes?: { [key: string]: string[] };
}

export interface MerchantProduct {
  produitId: string;
  quantity: number;
  price: number;
  amount: number;
  product: {
    id: string;
    name: string;
    price: number;
    vendorId: string;
    stock: number;
    description: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface MerchantOrder {
  id: string;
  clientId: string;
  status:
    | "DRAFT"
    | "PENDING_PAYMENT"
    | "PAYMENT_SUCCESSFUL"
    | "PAYMENT_FAILED"
    | "PENDING"
    | "CONFIRMED"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "RETURN_REQUESTED"
    | "RETURN_IN_PROGRESS"
    | "RETURNED";
  createdAt: string;
  updatedAt: string;
  merchantProducts: MerchantProduct[];
  merchantTotal: number;
  deliveryDetails: string; // JSON stringifié
  paymentMethod: "orange_money" | "wave" | "free_money" | "cash_on_delivery";
}

// Type étendu pour les commandes avec informations client (endpoint standardisé)
export interface MerchantOrderWithClient extends MerchantOrder {
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface MerchantOrdersResponse {
  success: boolean;
  data: MerchantOrder[];
  message?: string;
  count?: number;
}

export interface MerchantRevenue {
  total: number;
  thisMonth: number;
  lastMonth: number;
  growth: number;
}

export interface MerchantOrdersByStatus {
  DRAFT: number;
  PENDING_PAYMENT: number;
  PAYMENT_SUCCESSFUL: number;
  CONFIRMED: number;
  PREPARING: number;
  READY_FOR_PICKUP: number;
  IN_DELIVERY: number;
  DELIVERED: number;
  CANCELLED: number;
  PAYMENT_FAILED: number;
}

export interface MerchantOrders {
  total: number;
  thisMonth: number;
  lastMonth: number;
  growth: number;
  byStatus: MerchantOrdersByStatus;
}

export interface MerchantCustomers {
  total: number;
  thisMonth: number;
  returning: number;
  newCustomers: number;
}

export interface MerchantProducts {
  total: number;
  active: number;
  lowStock: number;
}

export interface TopProduct {
  id: string;
  name: string;
  quantity: number;
}

export interface RecentOrder {
  id: string;
  date: string;
}

export interface MerchantDeliveries {
  total: number;
  pending: number;
  completed: number;
  failed: number;
}

export interface MerchantNotifications {
  total: number;
  unread: number;
  thisMonth: number;
}

export interface MerchantStats {
  revenue: MerchantRevenue;
  orders: MerchantOrders;
  customers: MerchantCustomers;
  products: MerchantProducts;
  topProducts: TopProduct[];
  recentOrders: RecentOrder[];
  deliveries: MerchantDeliveries;
  notifications: MerchantNotifications;
}

export interface MerchantStatsResponse {
  status: string;
  payload: MerchantStats;
}

export interface SalesChartDataPoint {
  date: string;
  sales: number;
  orders: number;
}

export interface WeeklyChartDataPoint {
  week: string;
  sales: number;
  orders: number;
}

export interface MonthlyChartDataPoint {
  month: string;
  sales: number;
  orders: number;
}

export interface SalesChart {
  daily: SalesChartDataPoint[];
  weekly: WeeklyChartDataPoint[];
  monthly: MonthlyChartDataPoint[];
}

export interface OrdersByStatus {
  DELIVERED: number;
  CONFIRMED: number;
  PREPARING: number;
  IN_DELIVERY: number;
  READY_FOR_PICKUP: number;
  PENDING_PAYMENT: number;
  CANCELLED: number;
}

export interface TopProduct {
  produitId: string;
  nom: string;
  totalSold: number;
  revenue: number;
  averagePrice: number;
}

export interface AdminStats {
  users: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
    byRole: {
      CLIENT: number;
      MERCHANT: number;
      ADMIN: number;
    };
    activeUsers: number;
    inactiveUsers: number;
  };
  merchants: {
    total: number;
    thisMonth: number;
    pending: number;
    approved: number;
    rejected: number;
    growth: number;
  };
  orders: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
    byStatus: {
      DRAFT: number;
      PENDING_PAYMENT: number;
      PAYMENT_SUCCESSFUL: number;
      PAYMENT_FAILED: number;
      PENDING: number;
      CONFIRMED: number;
      SHIPPED: number;
      DELIVERED: number;
      CANCELLED: number;
      RETURN_REQUESTED: number;
      RETURN_IN_PROGRESS: number;
      RETURNED: number;
    };
  };
  products: {
    total: number;
    thisMonth: number;
    reported: number;
    lowStock: number;
    outOfStock: number;
    byCategory: Array<{
      categoryId: string;
      categoryName: string;
      count: number;
    }>;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
    byMonth: Array<{
      month: string;
      amount: number;
    }>;
  };
  topMerchants: Array<{
    id: string;
    businessName: string;
    revenue: number;
    orders: number;
    products: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    totalSold: number;
    revenue: number;
    merchantName: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: "order" | "merchant" | "product" | "user";
    description: string;
    timestamp: string;
  }>;
  systemHealth: {
    apiStatus: "operational" | "degraded" | "down";
    databaseStatus: "operational" | "degraded" | "down";
    paymentStatus: "operational" | "degraded" | "down";
    uptime: number;
  };
}

export interface AdminStatsResponse {
  success: boolean;
  data: AdminStats;
  message: string;
  statusCode: number;
}

// Admin Users Interfaces
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roles: Array<{
    id: string;
    name: string;
  }>;
  merchantProfile?: {
    id: string;
    businessName: string;
    status: string;
  } | null;
}

export interface AdminUsersResponse {
  success: boolean;
  data: AdminUser[];
  message: string;
  count: number;
  statusCode: number;
}
