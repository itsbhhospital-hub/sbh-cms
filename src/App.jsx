import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingProvider, useLoading } from './context/LoadingContext';

import { IntelligenceProvider, useIntelligence } from './context/IntelligenceContext';
import { LayoutProvider } from './context/LayoutContext';
import GlobalLoader from './components/GlobalLoader';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import MainDashboard from './pages/MainDashboard';
import PageLoader from './components/PageLoader';
import MobileWelcome from './components/MobileWelcome';

// Lazy Load Heavy Pages
const UserManagement = lazy(() => import('./pages/UserManagement'));
const NewComplaint = lazy(() => import('./pages/NewComplaint'));
const MyComplaints = lazy(() => import('./pages/MyComplaints'));
const WorkReport = lazy(() => import('./pages/WorkReport'));
const SolvedByMe = lazy(() => import('./pages/SolvedByMe'));
const CaseTransfer = lazy(() => import('./pages/CaseTransfer'));
const ExtendedCases = lazy(() => import('./pages/ExtendedCases'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const AICommandCenter = lazy(() => import('./pages/AICommandCenter'));
const AssetsPanel = lazy(() => import('./pages/AssetsPanel'));
const AddAsset = lazy(() => import('./pages/AddAsset'));
const AssetDetails = lazy(() => import('./pages/AssetDetails'));
const PublicAssetView = lazy(() => import('./pages/PublicAssetView'));
const DirectorDashboard = lazy(() => import('./pages/DirectorDashboard'));
const ServiceTeamPanel = lazy(() => import('./pages/ServiceTeamPanel'));

const ProtectedRoute = ({ children }) => {
  const auth = useAuth();
  if (!auth) return <div className="h-screen w-full flex items-center justify-center">Loading authentication...</div>;

  const { user, loading } = auth;

  if (loading) return <GlobalLoader />;
  if (!user) return <Navigate to="/login" />;
  return children;
};

// Layout component with Sidebar
const Layout = ({ children }) => {
  const { isLoading, isSystemLoading, hideLoader } = useLoading();
  const { loading: intelLoading } = useIntelligence();
  const location = useLocation();

  // Handle hiding the manual loader after navigation + data is ready
  // Handle hiding the manual loader after navigation + data is ready
  React.useEffect(() => {
    // FORCE HIDE: If intelligence is ready, we must dismiss the system loader
    // This fixes the infinite "Syncing System" issue from Login
    if (!intelLoading && (isLoading || isSystemLoading)) {
      // Small graceful fade out
      const timer = setTimeout(() => {
        hideLoader();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, intelLoading, isLoading, isSystemLoading]);

  return (
    <LayoutProvider>
      <div className="min-h-screen flex relative">
        <Sidebar />
        <main className="flex-1 ml-0 flex flex-col min-h-screen w-full relative">
          <Navbar />
          <div className="flex-grow p-4 md:p-8 w-full max-w-full overflow-x-hidden pb-10">
            {/* Show local loader for page transitions or background data sync */}
            {(isLoading && !isSystemLoading) || (intelLoading && !isSystemLoading) ? (
              <PageLoader />
            ) : (
              <Suspense fallback={<PageLoader />}>
                {children}
              </Suspense>
            )}
          </div>
          <Footer />
        </main>
      </div>
    </LayoutProvider>
  );
};

function App() {
  return (
    <Router>
      <LoadingProvider>
        <AuthProvider>
          <IntelligenceProvider>
            <MobileWelcome />
            <GlobalLoader />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <MainDashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/cms-panel" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/new-complaint" element={
                <ProtectedRoute>
                  <Layout>
                    <NewComplaint />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/my-complaints" element={
                <ProtectedRoute>
                  <Layout>
                    <MyComplaints />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/solved-by-me" element={
                <ProtectedRoute>
                  <Layout>
                    <SolvedByMe />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/work-report" element={
                <ProtectedRoute>
                  <Layout>
                    <WorkReport />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/user-management" element={
                <ProtectedRoute>
                  <Layout>
                    <UserManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/case-transfer" element={
                <ProtectedRoute>
                  <Layout>
                    <CaseTransfer />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/extended-cases" element={
                <ProtectedRoute>
                  <Layout>
                    <ExtendedCases />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/change-password" element={
                <ProtectedRoute>
                  <Layout>
                    <ChangePassword />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/ai-command-center" element={
                <ProtectedRoute>
                  <Layout>
                    <AICommandCenter />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/assets" element={
                <ProtectedRoute>
                  <Layout>
                    <AssetsPanel />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/assets/add" element={
                <ProtectedRoute>
                  <Layout>
                    <AddAsset />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/assets/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <AssetDetails />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/director" element={
                <ProtectedRoute>
                  <Layout>
                    <DirectorDashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/service-team" element={
                <ProtectedRoute>
                  <Layout>
                    <ServiceTeamPanel />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/asset-view/:id" element={<PublicAssetView />} />
            </Routes>
          </IntelligenceProvider>
        </AuthProvider>
      </LoadingProvider>
    </Router>
  );
}

export default App;