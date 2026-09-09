import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AppShell from './components/AppShell.jsx'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import CreateCertificateStudioPage from './pages/CreateCertificateStudioPage.jsx'
import CertificatesPage from './pages/CertificatesPage.jsx'
import VerifyPage from './pages/VerifyPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'
import ProtectedPdfViewerPage from './pages/ProtectedPdfViewerPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/verify/:id" element={<VerifyPage />} />
      <Route path="/verify/:id/pdf" element={<ProtectedPdfViewerPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppShell>
              <DashboardPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-certificate"
        element={
          <ProtectedRoute>
            <CreateCertificateStudioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-certificate/editor"
        element={
          <ProtectedRoute>
            <CreateCertificateStudioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/certificates"
        element={
          <ProtectedRoute>
            <AppShell>
              <CertificatesPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AppShell>
              <AnalyticsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
