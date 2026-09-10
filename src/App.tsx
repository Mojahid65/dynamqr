import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { ThemeProvider } from './components/ThemeProvider';
import { AppRecommendation } from './components/AppRecommendation';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateQR from './pages/CreateQR';
import BulkCreate from './pages/BulkCreate';
import Admin from './pages/Admin';
import Redirect from './pages/Redirect';
import QRAuth from './pages/QRAuth';
import Landing from './pages/Landing';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import Terms from './pages/legal/Terms';
import DeleteAccount from './pages/legal/DeleteAccount';
import Support from './pages/legal/Support';
import About from './pages/legal/About';
import DeveloperPortal from './pages/DeveloperPortal';
import Demo from './components/demo';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  if (!session) {
    return <Navigate to="/landing" />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="dark" storageKey="dynamqr-theme">
        <Router>
        <div className="min-h-screen bg-background font-sans antialiased text-foreground">
          <Routes>
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Public legal & info pages — REQUIRED to remain public so
                Google Play Console, App Store, and email recipients can
                resolve them without auth. Do NOT wrap these in
                PrivateRoute. */}
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/terms-of-service" element={<Navigate to="/terms" replace />} />
            <Route path="/delete-account" element={<DeleteAccount />} />
            <Route path="/data-deletion" element={<DeleteAccount />} />
            <Route path="/account-deletion" element={<Navigate to="/delete-account" replace />} />
            <Route path="/support" element={<Support />} />
            <Route path="/help" element={<Navigate to="/support" replace />} />
            <Route path="/about" element={<About />} />

            {/* Developer Portal & API documentation */}
            <Route path="/developer" element={<DeveloperPortal />} />
            <Route path="/api-docs" element={<Navigate to="/developer" replace />} />
            <Route path="/api" element={<Navigate to="/developer" replace />} />

            {/* Efferd Dashboard 2 Demo / Analytics Hub */}
            <Route path="/demo" element={
              <PrivateRoute>
                <Demo />
              </PrivateRoute>
            } />
            <Route path="/analytics" element={
              <PrivateRoute>
                <Demo />
              </PrivateRoute>
            } />

            <Route path="/" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/create" element={
              <PrivateRoute>
                <CreateQR />
              </PrivateRoute>
            } />
            <Route path="/bulk-create" element={
              <PrivateRoute>
                <BulkCreate />
              </PrivateRoute>
            } />
            <Route path="/admin" element={
              <PrivateRoute>
                <Admin />
              </PrivateRoute>
            } />
            <Route path="/qr-auth/:shortCode" element={<QRAuth />} />
            <Route path="/:shortCode" element={<Redirect />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <AppRecommendation />
        </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
