import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import NewComplaint from './pages/NewComplaint';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

import Sidebar from './components/Sidebar';
import Footer from './components/Footer';

// Layout component with Sidebar
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-slate-50 relative">
      <Sidebar />
      <main className="flex-1 p-4 md:p-10 ml-0 transition-all overflow-x-hidden flex flex-col min-h-screen">
        <div className="flex-grow pb-24 max-w-[100vw]">
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={
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
          <Route path="/admin-users" element={
            <ProtectedRoute>
              <Layout>
                <UserManagement />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
