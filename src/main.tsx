import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/Auth/ProtectedRoute'
import { AdminRoute } from './components/Auth/AdminRoute'
import './index.css'

// Lazy-loaded pages for code splitting
const HomePage = React.lazy(() => import('./pages/Home').then(m => ({ default: m.HomePage })))
const LoginPage = React.lazy(() => import('./pages/Login').then(m => ({ default: m.LoginPage })))
const RegisterPage = React.lazy(() => import('./pages/Register').then(m => ({ default: m.RegisterPage })))
const VerifyEmailPage = React.lazy(() => import('./pages/VerifyEmail').then(m => ({ default: m.VerifyEmailPage })))
const DashboardPage = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.DashboardPage })))
const EditorPage = React.lazy(() => import('./pages/Editor').then(m => ({ default: m.EditorPage })))
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })))
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })))
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })))
const AdminPlans = React.lazy(() => import('./pages/admin/AdminPlans').then(m => ({ default: m.AdminPlans })))
const AdminAudit = React.lazy(() => import('./pages/admin/AdminAudit').then(m => ({ default: m.AdminAudit })))

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 to-amber-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-stone-500 text-sm">Chargement...</p>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/editor"
              element={
                <ProtectedRoute>
                  <EditorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/editor/:id"
              element={
                <ProtectedRoute>
                  <EditorPage />
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="plans" element={<AdminPlans />} />
              <Route path="audit" element={<AdminAudit />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
