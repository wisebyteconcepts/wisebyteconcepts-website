/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAppStore } from '@/store';
import { useAuthStore } from '@/store/authStore';
import { ProtectedRoute, ToastContainer, Skeleton, SystemInitializer } from '@/components';
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
const NotFoundPage = lazy(() => import('./pages').then(m => ({ default: m.NotFoundPage })));

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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (!isAppLoaded) {
    return <SystemInitializer />;
  }

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer />
      <Suspense fallback={null}>
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
              <Route path="*" element={<NotFoundPage />} />
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

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </div>
  );
}
