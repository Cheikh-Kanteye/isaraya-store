import { Suspense, lazy, useEffect, useState } from "react";
import Loader from "@/components/ui/loader";
import { initPushNotifications } from "@/utils/push";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/providers/QueryProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Header from "./components/shared/Header";
import Footer from "./components/shared/Footer";
import { CartProvider } from "./contexts/CartContext";
import "./css/instant-search.css";
import { OrderSuccessToast } from "./components/shared/OrderSuccessToast";
import { useAuthStore } from "./stores/authStore";

const Index = lazy(() => import("@/pages/Index"));
const CatalogPage = lazy(() => import("@/pages/CatalogPage"));
const ProductDetailPage = lazy(() => import("@/pages/ProductDetailPage"));
const ClientDashboard = lazy(() => import("@/pages/dashboard/ClientDashboard"));
const SearchPage = lazy(() =>
  import("@/pages/SearchPage").then((m) => ({ default: m.SearchPage }))
);
const NotFound = lazy(() => import("@/pages/NotFound"));
const AuthForm = lazy(() => import("@/components/auth/AuthForm"));
const MerchantDashboardLayout = lazy(
  () => import("@/components/dashboard/merchant/MerchantDashboardLayout")
);
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const AdminDashboardLayout = lazy(
  () => import("./components/dashboard/admin/AdminDashboardLayout")
);
const MerchantOnboardingPage = lazy(
  () => import("./pages/MerchantOnboardingPage")
);
const PaymentStatusPage = lazy(() => import("./pages/PaymentStatusPage"));

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const { getCurrentUser, user, isAuthLoading } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    getCurrentUser();
  }, [getCurrentUser]);

  useEffect(() => {
    if (!isHydrated || isAuthLoading) return;
    if (user?.id) initPushNotifications(user.id);
  }, [isHydrated, isAuthLoading, user?.id]);

  useEffect(() => {
    if (!isHydrated || isAuthLoading || !user) return;

    const redirect = localStorage.getItem("postLoginRedirect");
    if (redirect) {
      localStorage.removeItem("postLoginRedirect");
      navigate(redirect, { replace: true });
      return;
    }

    const isMerchant = user.roles?.some((r) => r.name === "MERCHANT");
    const onOnboarding = location.pathname.startsWith("/onboarding/merchant");
    const isAuthRoute = location.pathname.startsWith("/auth");
    const wantsMerchant = location.pathname.startsWith("/dashboard/merchant");

    if (isMerchant && (onOnboarding || isAuthRoute)) {
      navigate("/dashboard/merchant");
    } else if (!isMerchant && wantsMerchant) {
      navigate("/onboarding/merchant");
    }
  }, [user, isHydrated, isAuthLoading, location.pathname, navigate]);

  const dashboardRoutes = [
    "/dashboard/client",
    "/dashboard/merchant",
    "/dashboard/admin",
  ];
  const isDashboardRoute = dashboardRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  return (
    <div className="min-h-screen bg-background">
      {!isDashboardRoute && <Header />}
      <Suspense fallback={<div className="p-6"><Loader /></div>}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/catalog/:category" element={<CatalogPage />} />
          <Route
            path="/catalog/:category/:subcategory"
            element={<CatalogPage />}
          />
          <Route path="/product/:productId" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route
            path="/payment/status/:status"
            element={<PaymentStatusPage />}
          />
          <Route
            path="/auth"
            element={<AuthForm onClose={() => navigate("/")} />}
          />
          <Route
            path="/onboarding/merchant"
            element={
              <ProtectedRoute>
                <MerchantOnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/client"
            element={
              <ProtectedRoute requiredRole="CLIENT">
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/merchant/*"
            element={
              <ProtectedRoute requiredRole="MERCHANT">
                <MerchantDashboardLayout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin/*"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboardLayout />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {!isDashboardRoute && <Footer />}
      <Toaster />
      <OrderSuccessToast />
    </div>
  );
}

function App() {
  return (
    <QueryProvider>
      <Router>
        <TooltipProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </TooltipProvider>
      </Router>
    </QueryProvider>
  );
}

export default App;
