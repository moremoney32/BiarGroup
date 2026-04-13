import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAppSelector } from './store/index'
import { selectIsAuthenticated, selectCurrentUser } from './store/slices/authSlice'
import { useRestoreSession } from './hooks/useRestoreSession'
import PageWrapper from './components/layout/PageWrapper'
import ToastContainer from './components/common/ToastContainer'
import { BiarToaster } from './components/common/Toast'

// Lazy-loaded pages — optimisation bundle RDC (connexions lentes)
const HomePage = lazy(() => import('./features/home/pages/HomePage'))
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('./features/auth/pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./features/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./features/auth/pages/ResetPasswordPage'))
const VerifyEmailPage = lazy(() => import('./features/auth/pages/VerifyEmailPage'))
const DashboardPage = lazy(() => import('./features/dashboard/pages/DashboardPage'))
const CallCenterPage = lazy(() => import('./features/call-center/pages/CallCenterPage'))
const SmsPage = lazy(() => import('./features/sms/pages/SmsPage'))
const EmailPage = lazy(() => import('./features/email/pages/EmailPage'))
const CampagnesEmailPage = lazy(() => import('./features/email/pages/CampagnesEmailPage'))
const EditeurEmailPage = lazy(() => import('./features/email/pages/EditeurEmailPage'))
const ModelesEmailPage = lazy(() => import('./features/email/pages/ModelesEmailPage'))
const ConstructeurFluxPage = lazy(() => import('./features/email/pages/ConstructeurFluxPage'))
const AnalyticsEmailPage = lazy(() => import('./features/email/pages/AnalyticsEmailPage'))
const SegmentationEmailPage = lazy(() => import('./features/email/pages/SegmentationEmailPage'))
const ConfigSmtpPage = lazy(() => import('./features/email/pages/ConfigSmtpPage'))
const AuthentifDnsPage = lazy(() => import('./features/email/pages/AuthentifDnsPage'))
const DelivrabilityPage = lazy(() => import('./features/email/pages/DelivrabilityPage'))
const WhatsappPage = lazy(() => import('./features/whatsapp/pages/WhatsappPage'))
const ContactsPage = lazy(() => import('./features/contacts/pages/ContactsPage'))
const ReportingPage = lazy(() => import('./features/reporting/pages/ReportingPage'))
const BillingPage = lazy(() => import('./features/billing/pages/BillingPage'))
const SettingsPage = lazy(() => import('./features/settings/pages/SettingsPage'))
const AdminPage = lazy(() => import('./features/admin/pages/AdminPage'))

const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center bg-[#0F0F1A]">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E91E8C] border-t-transparent" />
  </div>
)

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const user = useAppSelector(selectCurrentUser)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  // Email non vérifié → retour sur la page de vérification
  if (user && !user.isEmailVerified) return <Navigate to="/verify-email" replace />
  return <>{children}</>
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const user = useAppSelector(selectCurrentUser)
  // Authentifié mais email non vérifié → page de vérification
  if (isAuthenticated && user && !user.isEmailVerified) return <Navigate to="/verify-email" replace />
  if (isAuthenticated) return <Navigate to="/app/email/campagnes" replace />
  return <>{children}</>
}

export default function App() {
  const { isRestoring } = useRestoreSession()

  // Pendant la restauration de session (F5 / rechargement), on bloque le rendu
  // pour éviter que ProtectedRoute redirige vers /login avant d'avoir vérifié le cookie
  if (isRestoring) return <LoadingFallback />

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ToastContainer />
      <BiarToaster />
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public landing page */}
          <Route path="/" element={<HomePage />} />

          {/* Guest routes */}
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
          <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Protected routes — dans le layout principal */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <PageWrapper />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="call-center/*" element={<CallCenterPage />} />
            <Route path="sms/*" element={<SmsPage />} />
            <Route path="email" element={<EmailPage />}>
              <Route index element={<Navigate to="/app/email/campagnes" replace />} />
              <Route path="campagnes" element={<CampagnesEmailPage />} />
              <Route path="editeur" element={<EditeurEmailPage />} />
              <Route path="modeles" element={<ModelesEmailPage />} />
              <Route path="flux" element={<ConstructeurFluxPage />} />
              <Route path="analytics" element={<AnalyticsEmailPage />} />
              <Route path="segmentation" element={<SegmentationEmailPage />} />
              <Route path="smtp" element={<ConfigSmtpPage />} />
              <Route path="dns" element={<AuthentifDnsPage />} />
              <Route path="delivrabilite" element={<DelivrabilityPage />} />
            </Route>
            <Route path="whatsapp/*" element={<WhatsappPage />} />
            <Route path="contacts/*" element={<ContactsPage />} />
            <Route path="reporting/*" element={<ReportingPage />} />
            <Route path="billing/*" element={<BillingPage />} />
            <Route path="settings/*" element={<SettingsPage />} />
            <Route path="admin/*" element={<AdminPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}
