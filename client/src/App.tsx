import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { LoadingIndicator, ToastProvider } from "@/components/ui";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LoginPage from "@/pages/LoginPage";
import OrdersPage from "@/pages/OrdersPage";
import ProfilePage from "@/pages/ProfilePage";
import ProductsPage from "@/pages/ProductsPage";
import DashboardPage from "@/pages/SetupStatusPage";

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

function AppRoutes() {
  const { authenticated, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate replace to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate replace to={authenticated ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

function ProtectedRoute() {
  const { authenticated } = useAuth();
  return authenticated ? <Outlet /> : <Navigate replace to="/login" />;
}

function PublicOnlyRoute() {
  const { authenticated } = useAuth();
  return authenticated ? <Navigate replace to="/dashboard" /> : <Outlet />;
}

function AuthLoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4">
      <LoadingIndicator label="Restoring your session" showLabel size="lg" />
    </main>
  );
}

export default App;
