import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/routing/ProtectedRoute";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { FluidBackground } from "@/components/ui/FluidBackground";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Overview from "./pages/dashboard/Overview";
import Wardrobe from "./pages/dashboard/Wardrobe";
import WardrobeUpload from "./pages/dashboard/WardrobeUpload";
import Recommend from "./pages/dashboard/Recommend";
import Outfits from "./pages/dashboard/Outfits";
import Analytics from "./pages/dashboard/Analytics";
import Settings from "./pages/dashboard/Settings";
import Admin from "./pages/dashboard/Admin";
import Demo from "./pages/Demo";
import Architecture from "./pages/Architecture";
import Documentation from "./pages/Documentation";
import Research from "./pages/Research";
import Product from "./pages/Product";
import FeaturesPage from "./pages/Features";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";
import Company from "./pages/Company";
import About from "./pages/About";
import Blog from "./pages/Blog";
import Careers from "./pages/Careers";
import Legal from "./pages/Legal";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Security from "./pages/Security";
import NotFound from "./pages/NotFound";

import { GoogleOAuthProvider } from "@react-oauth/google";

const queryClient = new QueryClient();

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "479427621264-tu6qq3tqf3qgapoqsnuum2139i7930i2.apps.googleusercontent.com";

const App = () => (
  <ErrorBoundary>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <CustomCursor />
          <BrowserRouter>
            <FluidBackground />
            <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/documentation" element={<Documentation />} />
            <Route path="/research" element={<Research />} />
            <Route path="/product" element={<Product />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/company" element={<Company />} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/security" element={<Security />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="wardrobe" element={<Wardrobe />} />
              <Route path="wardrobe/upload" element={<WardrobeUpload />} />
              <Route path="recommend" element={<Recommend />} />
              <Route path="outfits" element={<Outfits />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
              <Route path="admin" element={<Admin />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
    </GoogleOAuthProvider>
  </ErrorBoundary>
);

export default App;
