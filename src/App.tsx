/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAppStore } from '@/store';
import { useAuthStore } from '@/store/authStore';
import { ProtectedRoute, ToastContainer, Skeleton } from '@/components';
import { PublicLayout, AdminLayout } from '@/layouts';

// Lazy load pages
const HomePage = lazy(() => import('./pages').then(m => ({ default: m.HomePage })));
const ServicesPage = lazy(() => import('./pages').then(m => ({ default: m.ServicesPage })));
const ProductsPage = lazy(() => import('./pages').then(m => ({ default: m.ProductsPage })));
const SkillsPage = lazy(() => import('./pages').then(m => ({ default: m.SkillsPage })));
const AdminLoginPage = lazy(() => import('./pages').then(m => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import('./pages').then(m => ({ default: m.AdminDashboardPage })));
const AdminServicesPage = lazy(() => import('./pages').then(m => ({ default: m.AdminServicesPage })));
const AdminProductsPage = lazy(() => import('./pages').then(m => ({ default: m.AdminProductsPage })));
const AdminSkillsPage = lazy(() => import('./pages').then(m => ({ default: m.AdminSkillsPage })));
const ServiceDetailPage = lazy(() => import('./pages').then(m => ({ default: m.ServiceDetailPage })));
const ProductDetailPage = lazy(() => import('./pages').then(m => ({ default: m.ProductDetailPage })));
const ContactPage = lazy(() => import('./pages').then(m => ({ default: m.ContactPage })));

const PageLoader = () => (
  <div className="p-8 space-y-6">
    <Skeleton className="h-10 w-1/3 mb-8" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-6 border border-border rounded-xl space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ))}
    </div>
  </div>
);

export default function App() {
  const initApp = useAppStore((state) => state.init);
  const isAppLoaded = useAppStore((state) => state.isLoaded);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const location = useLocation();

  useEffect(() => {
    initApp();
    const unsubscribe = checkAuth();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [initApp, checkAuth]);

  if (!isAppLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full"
          />
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Initializing System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer />
      <Suspense fallback={<PageLoader />}>
        <Routes location={location}>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="services/:id" element={<ServiceDetailPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/:id" element={<ProductDetailPage />} />
              <Route path="skills" element={<SkillsPage />} />
              <Route path="contact" element={<ContactPage />} />
            </Route>

            {/* Auth Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Protected Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="services" element={<AdminServicesPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="skills" element={<AdminSkillsPage />} />
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
  );
}
