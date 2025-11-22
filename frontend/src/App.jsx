import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Attendance } from './pages/Attendance';
import { Employees } from './pages/Employees';
import { Sites } from './pages/Sites';
import { Payroll } from './pages/Payroll';
import { Reports } from './pages/Reports';
import { Users } from './pages/Users';
import { Audit } from './pages/Audit';
import { Backup } from './pages/Backup';
import { Toast } from './components/ui/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function DefaultRedirect() {
  const { user } = useAuthStore();
  const defaultPath = user?.role === 'manager' ? '/app/dashboard' : '/app/attendance';
  return <Navigate to={defaultPath} replace />;
}

function App() {
  const { loadUser, isAuthenticated } = useAuthStore();
  const { toast, hideToast } = useUIStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/app/*"
            element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<DefaultRedirect />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="attendance" element={<Attendance />} />
                    <Route path="employees" element={<Employees />} />
                    <Route path="sites" element={<Sites />} />
                    <Route path="payroll" element={<Payroll />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="users" element={<Users />} />
                    <Route path="audit" element={<Audit />} />
                    <Route path="backup" element={<Backup />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </QueryClientProvider>
  );
}

export default App;
